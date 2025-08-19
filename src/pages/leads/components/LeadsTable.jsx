// src/pages/admin/components/LeadsTable.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import ReactDOM from "react-dom";
import Badge from "@/components/ui/Badge";
import IconComponent from "@/components/ui/Icon";
import { getStatusColor, getSourceColor } from "@/utils/leadColors";
import countryList from "react-select-country-list";

const MENU_WIDTH = 260; // px
const BASE_MAX_HEIGHT = 288; // px (~18rem) - slightly taller than before
const MARGIN = 8;

const LeadsTable = ({ leads, onEdit, onDelete, managers, onAssignOptionClick }) => {
  const [dropdownOpen, setDropdownOpen] = useState(null); // lead.id
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    placeAbove: false,
    alignRight: false,
    maxHeight: BASE_MAX_HEIGHT,
  });

  // Country helper (react-select-country-list)
  const countries = useMemo(() => countryList(), []);

  const closeDropdown = useCallback(() => setDropdownOpen(null), []);

  // Close dropdown on outside click / Esc
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".assignee-trigger") && !e.target.closest(".assignee-portal-dropdown")) {
        closeDropdown();
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") closeDropdown();
    };
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [closeDropdown]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!dropdownOpen) return;
    const updatePos = () => {
      const trigger = document.querySelector(`[data-assignee-trigger="${dropdownOpen}"]`);
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      computeAndSetPosition(rect);
    };
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [dropdownOpen]);

  const computeAndSetPosition = (rect) => {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const spaceBelow = viewportH - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;

    // Decide whether to flip above
    const placeAbove = spaceBelow < 200 && spaceAbove > spaceBelow;

    // Horizontal alignment: keep inside viewport
    let left = rect.left + window.scrollX;
    const overflowRight = left + MENU_WIDTH > window.scrollX + viewportW - MARGIN;
    const alignRight = overflowRight;
    if (alignRight) {
      left = rect.right + window.scrollX - MENU_WIDTH;
      if (left < MARGIN) left = MARGIN;
    }

    // Compute top position and maxHeight to prevent bottom/ top overflow
    let top;
    let maxAvailable;
    if (placeAbove) {
      top = rect.top + window.scrollY; // we'll translateY(-100%) in CSS
      maxAvailable = Math.max(160, Math.min(BASE_MAX_HEIGHT, spaceAbove)); // don't shrink too tiny
    } else {
      top = rect.bottom + window.scrollY + 4;
      maxAvailable = Math.max(160, Math.min(BASE_MAX_HEIGHT, spaceBelow));
    }

    setDropdownPos({
      top,
      left,
      placeAbove,
      alignRight,
      maxHeight: maxAvailable,
    });
  };

  const getCurrentAssigneeName = (lead) => {
    const arr = lead?.LeadAssignments || [];
    if (!arr.length) return "-";
    const latest = [...arr].sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at))[0];
    return latest?.assignee?.full_name || "-";
  };

  // Country resolver
  const resolveCountry = (raw) => {
    if (!raw) return "-";
    const t = String(raw).trim();
    if (!t) return "-";
    if (t.length === 2) {
      const code = t.toUpperCase();
      const label = countries.getLabel(code);
      return label || code;
    }
    return t;
  };

  const toggleDropdown = (lead, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (dropdownOpen === lead.id) {
      setDropdownOpen(null); // close if same clicked again
    } else {
      computeAndSetPosition(rect);
      setDropdownOpen(lead.id);
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 relative">
      <table className="w-full table-auto text-sm">
        <thead className="bg-accent/20 uppercase tracking-wider">
          <tr className="text-xs text-gray-800 font-semibold">
            <th className="px-3 py-2 text-left font-semibold">Name</th>
            <th className="px-3 py-2 text-left font-semibold">Company</th>
            <th className="px-3 py-2 text-left font-semibold">Email</th>
            <th className="px-3 py-2 text-left font-semibold">Phone</th>
            <th className="px-3 py-2 text-left font-semibold hidden sm:table-cell">Country</th>
            <th className="px-3 py-2 text-left font-semibold">Status</th>
            <th className="px-3 py-2 text-left font-semibold hidden md:table-cell">Source</th>
            <th className="px-3 py-2 text-left font-semibold">Assignee</th>
            <th className="px-3 py-2 text-left font-semibold">Actions</th>
          </tr>
        </thead>

        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-6 text-center text-gray-500">
                No leads found.
              </td>
            </tr>
          ) : (
            leads.map((row) => {
              const fullName = `${row.first_name || ""} ${row.last_name || ""}`.trim() || "-";
              const statusLabel = row.LeadStatus?.label || "-";
              const statusValue = row.LeadStatus?.value || "";
              const sourceLabel = row.LeadSource?.label || "-";
              const sourceValue = row.LeadSource?.value || "";
              const phone = row.phone && row.phone.length > 4 ? row.phone : "N/A";
              const assignee = getCurrentAssigneeName(row);
              const countryRaw = row.country_code ?? row.country;
              const countryText = resolveCountry(countryRaw);

              return (
                <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50/70">
                  <td className="px-3 py-2">{fullName}</td>
                  <td className="px-3 py-2">{row.company || "-"}</td>
                  <td className="px-3 py-2">{row.email || "-"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{phone}</td>
                  <td className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">{countryText}</td>
                  <td className="px-3 py-2">
                    <Badge text={statusLabel} color={getStatusColor(statusValue)} size="sm" rounded="rounded" />
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    <Badge text={sourceLabel} color={getSourceColor(sourceValue)} size="sm" rounded="rounded" />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      data-assignee-trigger={row.id}
                      onClick={(e) => toggleDropdown(row, e)}
                      className="flex items-center gap-1 text-gray-800 assignee-trigger"
                    >
                      <span>{assignee}</span>
                      <IconComponent
                        icon="mdi:chevron-down"
                        width={18}
                        className={`transition-transform duration-200 ${dropdownOpen === row.id ? "rotate-180" : ""}`}
                      />
                    </button>
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(row)}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                        title="Edit"
                      >
                        <IconComponent icon="mdi:pencil" width={18} className="text-gray-800" />
                      </button>
                      <button
                        onClick={() => onDelete(row)}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                        title="Delete"
                      >
                        <IconComponent icon="mdi:delete" width={18} className="text-gray-800" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {ReactDOM.createPortal(
        <div
          className={`assignee-portal-dropdown fixed w-[${MENU_WIDTH}px] bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] transform transition-all duration-200 font-dm-sans ${
            dropdownOpen
              ? "opacity-100 scale-100 visible pointer-events-auto"
              : "opacity-0 scale-95 invisible pointer-events-none"
          } ${dropdownPos.placeAbove ? "origin-bottom -translate-y-full" : "origin-top"}`}
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: `${MENU_WIDTH}px`,
          }}
          role="listbox"
          aria-hidden={!dropdownOpen}
        >
          <div className="app-scrollbar overflow-y-auto" style={{ maxHeight: `${dropdownPos.maxHeight}px` }}>
            {managers.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-xs">No users found</div>
            ) : (
              managers.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    const openId = dropdownOpen;
                    setDropdownOpen(null);
                    const lead = leads.find((l) => l.id === openId);
                    if (lead) onAssignOptionClick(lead, m);
                  }}
                  className="px-3 py-2 text-xs hover:bg-indigo-50 cursor-pointer"
                >
                  <span className="font-medium text-black">{m.full_name}</span>
                  <div className="text-[11px] text-gray-500">{m.email}</div>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LeadsTable;
