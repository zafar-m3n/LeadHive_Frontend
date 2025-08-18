import React from "react";
import Badge from "@/components/ui/Badge";
import IconComponent from "@/components/ui/Icon";
import { getStatusColor, getSourceColor } from "@/utils/leadColors";

const LeadsTable = ({ leads, onEdit, onDelete }) => {
  const getCurrentAssigneeName = (lead) => {
    const arr = lead?.LeadAssignments || [];
    if (!arr.length) return "-";
    const latest = [...arr].sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at))[0];
    return latest?.assignee?.full_name || "-";
  };

  const formatValue = (v) => {
    const num = Number(v);
    if (Number.isNaN(num)) return "-";
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full table-auto text-sm">
        <thead className="bg-gray-50">
          <tr className="text-xs text-gray-600">
            <th className="px-3 py-2 text-left font-semibold">Name</th>
            <th className="px-3 py-2 text-left font-semibold">Company</th>
            <th className="px-3 py-2 text-left font-semibold">Email</th>
            <th className="px-3 py-2 text-left font-semibold">Phone</th>
            <th className="px-3 py-2 text-left font-semibold">Status</th>
            <th className="px-3 py-2 text-left font-semibold hidden md:table-cell">Source</th>
            <th className="px-3 py-2 text-left font-semibold hidden sm:table-cell">Value</th>
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

              return (
                <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50/70">
                  <td className="px-3 py-2">
                    <div className="truncate">{fullName}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="truncate">{row.company || "-"}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="truncate">{row.email || "-"}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="truncate">{phone}</div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge text={statusLabel} color={getStatusColor(statusValue)} size="sm" rounded="rounded" />
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    <Badge text={sourceLabel} color={getSourceColor(sourceValue)} size="sm" rounded="rounded" />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">{formatValue(row.value_decimal)}</td>
                  <td className="px-3 py-2">
                    <div className="truncate">{assignee}</div>
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
    </div>
  );
};

export default LeadsTable;
