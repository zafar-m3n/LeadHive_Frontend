import React, { useState, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import Badge from "@/components/ui/Badge";
import IconComponent from "@/components/ui/Icon";
import { getStatusColor, getSourceColor } from "@/utils/leadColors";
import countryList from "react-select-country-list";

const LeadsTable = ({ leads, onEdit, onDelete, managers, onAssignOptionClick }) => {
  const [dropdownOpen, setDropdownOpen] = useState(null); // lead.id
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  // Country helper (react-select-country-list)
  const countries = useMemo(() => countryList(), []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".assignee-trigger") && !e.target.closest(".assignee-portal-dropdown")) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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

    // If 2-letter code, try to resolve to full label
    if (t.length === 2) {
      const code = t.toUpperCase();
      const label = countries.getLabel(code);
      return label || code; // fallback to code if not found
    }

    // Otherwise, assume it's already a name
    return t;
  };

  const toggleDropdown = (lead, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (dropdownOpen === lead.id) {
      setDropdownOpen(null); // close if same clicked again
    } else {
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
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
          className={`assignee-portal-dropdown font-manrope absolute w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] transform transition-all duration-200 origin-top ${
            dropdownOpen
              ? "opacity-100 scale-100 visible pointer-events-auto"
              : "opacity-0 scale-95 invisible pointer-events-none"
          }`}
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          <div className="max-h-60 overflow-y-auto">
            {managers.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">No managers found</div>
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
                  className="px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer"
                >
                  <span className="font-medium text-black">{m.full_name}</span>
                  <div className="text-xs text-gray-500">{m.email}</div>
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
