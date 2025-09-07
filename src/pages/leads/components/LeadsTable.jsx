// src/pages/admin/components/LeadsTable.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import ReactDOM from "react-dom";
import Badge from "@/components/ui/Badge";
import IconComponent from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";
import { getStatusColor, getSourceColor } from "@/utils/leadColors";
import countryList from "react-select-country-list";

const MENU_WIDTH = 260;
const BASE_MAX_HEIGHT = 288;
const MARGIN = 8;

const ROLE = {
  ADMIN: 1,
  MANAGER: 2,
  SALES_REP: 3,
};

const LeadsTable = ({
  leads,
  onEdit,
  onDelete,
  managers = [],
  onAssignOptionClick,
  mode = "manager",
  selfId = null,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [openLead, setOpenLead] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    placeAbove: false,
    alignRight: false,
    maxHeight: BASE_MAX_HEIGHT,
  });
  const [assigneeQuery, setAssigneeQuery] = useState("");

  // Country helpers
  const countries = useMemo(() => countryList(), []);
  const toCountryCode = useCallback(
    (raw) => {
      if (!raw) return "-";
      const t = String(raw).trim();
      if (!t) return "-";
      if (t.length === 2) return t.toUpperCase();
      const code = countries.getValue(t);
      return code || "-";
    },
    [countries]
  );

  const closeDropdown = useCallback(() => {
    setDropdownOpen(null);
    setOpenLead(null);
    setAssigneeQuery("");
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".assignee-trigger") && !e.target.closest(".assignee-portal-dropdown")) {
        closeDropdown();
      }
    };
    const handleEsc = (e) => e.key === "Escape" && closeDropdown();
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [closeDropdown]);

  // Close if page changes and lead disappears
  useEffect(() => {
    if (!dropdownOpen) return;
    if (!leads.some((l) => l.id === dropdownOpen)) closeDropdown();
  }, [leads, dropdownOpen, closeDropdown]);

  // Reposition while open
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
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceBelow = vh - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;
    const placeAbove = spaceBelow < 200 && spaceAbove > spaceBelow;

    let left = rect.left + window.scrollX;
    const overflowRight = left + MENU_WIDTH > window.scrollX + vw - MARGIN;
    if (overflowRight) {
      left = rect.right + window.scrollX - MENU_WIDTH;
      if (left < MARGIN) left = MARGIN;
    }

    let top, maxAvailable;
    if (placeAbove) {
      top = rect.top + window.scrollY;
      maxAvailable = Math.max(160, Math.min(BASE_MAX_HEIGHT, spaceAbove));
    } else {
      top = rect.bottom + window.scrollY + 4;
      maxAvailable = Math.max(160, Math.min(BASE_MAX_HEIGHT, spaceBelow));
    }

    setDropdownPos({ top, left, placeAbove, alignRight: overflowRight, maxHeight: maxAvailable });
  };

  // Latest assignment helpers
  const getLatestAssignment = (lead) => {
    const arr = lead?.LeadAssignments || [];
    if (!arr.length) return null;
    const latest = [...arr].sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at))[0];
    return latest || null;
  };
  const getCurrentAssignee = (lead) => getLatestAssignment(lead)?.assignee || null;
  const getCurrentAssigneeName = (lead) => getCurrentAssignee(lead)?.full_name || "-";

  const toggleDropdown = (lead, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (dropdownOpen === lead.id) {
      closeDropdown();
    } else {
      computeAndSetPosition(rect);
      setDropdownOpen(lead.id);
      setOpenLead(lead);
      setAssigneeQuery("");
    }
  };

  // =========================
  // Assignment targets
  // =========================
  const teamSet = useMemo(
    () => new Set((managers || []).filter((u) => Number(u.role_id) !== ROLE.ADMIN).map((u) => u.id)),
    [managers]
  );

  const dropdownTargets = useMemo(() => {
    const list = managers || [];
    return list;
  }, [managers, mode, teamSet]);

  // =========================
  // Permission to open dropdown
  // =========================
  const canReassign = (lead) => {
    if (mode === "admin") return true;
    const current = getCurrentAssignee(lead);
    if (!current) return false;
    if (mode === "manager") {
      return teamSet.has(current.id);
    }
    if (mode === "sales") {
      if (!selfId) return false;
      return Number(current.role_id) === ROLE.SALES_REP && Number(current.id) === Number(selfId);
    }

    return false;
  };

  // Filter dropdown options by search text
  const filteredTargets = useMemo(() => {
    const q = assigneeQuery.trim().toLowerCase();
    if (!q) return dropdownTargets;
    return dropdownTargets.filter(
      (m) => (m.full_name && m.full_name.toLowerCase().includes(q)) || (m.email && m.email.toLowerCase().includes(q))
    );
  }, [assigneeQuery, dropdownTargets]);

  // Fixed widths (px) for Lead, Company, Phone, Assignee
  const W_LEAD = "w-[175px]";
  const W_COMPANY = "w-[175px]";
  const W_PHONE = "w-[100px]";
  const W_ASSIGNEE = "w-[175px]";

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 relative">
      {/* table-auto lets the unfixed columns (Status, Source, Country, Actions) flex to fill remaining space */}
      <table className="w-full table-auto text-sm leading-[1.25rem]">
        <thead className="bg-accent/20 uppercase tracking-wider">
          <tr className="text-[11px] text-gray-800 font-semibold">
            <th className={`px-3 py-2 text-left font-semibold ${W_LEAD}`}>Lead</th>
            <th className={`px-3 py-2 text-left font-semibold ${W_COMPANY}`}>Company</th>
            <th className={`px-3 py-2 text-left font-semibold hidden md:table-cell ${W_PHONE}`}>Phone</th>
            {/* Country: no fixed width, will fit 2-letter code */}
            <th className="px-3 py-2 text-left font-semibold hidden sm:table-cell">Country</th>
            <th className="px-3 py-2 text-left font-semibold">Status</th>
            <th className="px-3 py-2 text-left font-semibold hidden md:table-cell">Source</th>
            <th className={`px-3 py-2 text-left font-semibold ${W_ASSIGNEE}`}>Assignee</th>
            <th className="px-3 py-2 text-left font-semibold">Actions</th>
          </tr>
        </thead>

        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
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
              const assigneeName = getCurrentAssigneeName(row);

              // Accept either row.country_code or row.country (name), and show a 2-letter code
              const countryRaw = row.country_code ?? row.country;
              const countryCode = toCountryCode(countryRaw);

              const reassignable = canReassign(row);

              return (
                <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50/70">
                  {/* Lead (Name + Email) */}
                  <td className="px-3 py-2 align-top">
                    <div className={`flex flex-col overflow-hidden ${W_LEAD}`}>
                      <span className="font-medium text-gray-900 truncate">{fullName}</span>
                      <span className="text-xs text-gray-500 truncate">{row.email || "-"}</span>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-3 py-2 align-top">
                    <div className={`overflow-hidden ${W_COMPANY}`}>
                      <span className="truncate block">{row.company || "-"}</span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className={`px-3 py-2 whitespace-nowrap hidden md:table-cell align-top ${W_PHONE}`}>
                    <div className="overflow-hidden">
                      <span className="truncate block">{phone}</span>
                    </div>
                  </td>

                  {/* Country (2-letter code, no fixed width) */}
                  <td className="px-3 py-2 hidden sm:table-cell align-top">
                    <span
                      className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-mono ${
                        countryCode === "-" ? "text-gray-500" : "bg-gray-100 text-gray-800 border border-gray-200"
                      }`}
                      title={countryCode}
                    >
                      {countryCode}
                    </span>
                  </td>

                  {/* Status (auto flex) */}
                  <td className="px-3 py-2 align-top">
                    <Badge text={statusLabel} color={getStatusColor(statusValue)} size="sm" rounded="rounded" />
                  </td>

                  {/* Source (auto flex) */}
                  <td className="px-3 py-2 hidden md:table-cell align-top">
                    <Badge text={sourceLabel} color={getSourceColor(sourceValue)} size="sm" rounded="rounded" />
                  </td>

                  {/* Assignee (fixed width + truncate) */}
                  <td className={`px-3 py-2 align-top ${W_ASSIGNEE}`}>
                    {reassignable ? (
                      <Tooltip content="Change assignee" placement="top" theme="light">
                        <button
                          data-assignee-trigger={row.id}
                          onClick={(e) => toggleDropdown(row, e)}
                          className="flex items-center gap-1 text-gray-800 assignee-trigger hover:text-black overflow-hidden"
                          aria-label="Change assignee"
                        >
                          <span className="truncate">{assigneeName}</span>
                          <IconComponent
                            icon="mdi:chevron-down"
                            width={18}
                            className={`shrink-0 transition-transform duration-200 ${
                              dropdownOpen === row.id ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </Tooltip>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-500 overflow-hidden">
                        <span className="truncate">{assigneeName}</span>
                      </div>
                    )}
                  </td>

                  {/* Actions (auto flex) */}
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-center gap-1.5">
                      <Tooltip content="Edit lead" placement="top" theme="light">
                        <button
                          onClick={() => onEdit(row)}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                          aria-label="Edit lead"
                        >
                          <IconComponent icon="mdi:pencil" width={18} className="text-gray-800" />
                        </button>
                      </Tooltip>

                      {onDelete && (
                        <Tooltip content="Delete lead" placement="top" theme="light">
                          <button
                            onClick={() => onDelete(row)}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                            aria-label="Delete lead"
                          >
                            <IconComponent icon="mdi:delete" width={18} className="text-gray-800" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Assignee Dropdown (Portal) */}
      {ReactDOM.createPortal(
        <div
          className={`assignee-portal-dropdown fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] transform transition-all duration-200 font-dm-sans ${
            dropdownOpen
              ? "opacity-100 scale-100 visible pointer-events-auto"
              : "opacity-0 scale-95 invisible pointer-events-none"
          } ${dropdownPos.placeAbove ? "origin-bottom -translate-y-full" : "origin-top"}`}
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: `${MENU_WIDTH}px` }}
          role="listbox"
          aria-hidden={!dropdownOpen}
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <input
                type="text"
                value={assigneeQuery}
                onChange={(e) => setAssigneeQuery(e.target.value)}
                placeholder="Search assignee…"
                className="w-full rounded-md border border-gray-300 px-8 py-1.5 text-xs text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              <IconComponent
                icon="mdi:magnify"
                width={16}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"
              />
              {assigneeQuery && (
                <button
                  onClick={() => setAssigneeQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label="Clear assignee search"
                >
                  <IconComponent icon="mdi:close-circle" width={16} />
                </button>
              )}
            </div>
          </div>

          <div className="app-scrollbar overflow-y-auto" style={{ maxHeight: `${dropdownPos.maxHeight - 44}px` }}>
            {filteredTargets.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-xs">No users found</div>
            ) : (
              filteredTargets.map((m) => {
                const currentAssigneeId = openLead ? getCurrentAssignee(openLead)?.id ?? null : null;
                const isCurrent = m.id === currentAssigneeId;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      const lead = openLead;
                      closeDropdown();
                      if (lead) onAssignOptionClick(lead, m);
                    }}
                    className={`px-3 py-2 text-xs cursor-pointer flex items-start justify-between hover:bg-indigo-50 ${
                      isCurrent ? "bg-indigo-50" : ""
                    }`}
                    role="option"
                    aria-selected={isCurrent}
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-black block truncate">{m.full_name}</span>
                      <div className="text-[11px] text-gray-500 truncate">{m.email}</div>
                    </div>
                    {isCurrent && (
                      <IconComponent icon="mdi:check-circle" width={16} className="text-indigo-600 mt-0.5 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LeadsTable;
