import React, { useMemo } from "react";
import Select from "@/components/form/Select";
import TextInput from "@/components/form/TextInput";
import IconComponent from "@/components/ui/Icon";

const LeadsFiltersToolbar = ({
  statuses = [],
  sources = [],
  sortFields = [],
  orderDirOptions = [],
  assigneeOptions = [], // NEW
  showAssignee = false, // NEW
  values = { search: "", statusId: "", sourceId: "", assigneeId: "", orderBy: "", orderDir: "ASC" }, // NEW
  onChange,
  onResetAll,
}) => {
  const { search, statusId, sourceId, assigneeId, orderBy, orderDir } = values;

  const getLabel = (arr, val) => arr.find((x) => String(x.value) === String(val))?.label;

  const chips = useMemo(() => {
    const items = [];
    if (statusId) items.push({ key: "status", label: `Status: ${getLabel(statuses, statusId) || statusId}` });
    if (sourceId) items.push({ key: "source", label: `Source: ${getLabel(sources, sourceId) || sourceId}` });
    if (showAssignee && assigneeId)
      items.push({ key: "assignee", label: `Assignee: ${getLabel(assigneeOptions, assigneeId) || assigneeId}` }); // NEW
    if (orderBy) items.push({ key: "orderBy", label: `Sort: ${getLabel(sortFields, orderBy) || orderBy}` });
    if (orderDir !== "ASC") items.push({ key: "orderDir", label: `Dir: ${orderDir}` });
    if (search) items.push({ key: "search", label: `Search: “${search}”` });
    return items;
  }, [
    search,
    statusId,
    sourceId,
    assigneeId,
    orderBy,
    orderDir,
    statuses,
    sources,
    assigneeOptions,
    sortFields,
    showAssignee,
  ]);

  const hasActiveFilters = chips.length > 0;

  const clearChip = (key) => {
    if (key === "status") onChange({ statusId: "" });
    if (key === "source") onChange({ sourceId: "" });
    if (key === "assignee") onChange({ assigneeId: "" }); // NEW
    if (key === "orderBy") onChange({ orderBy: "" });
    if (key === "orderDir") onChange({ orderDir: "ASC" });
    if (key === "search") onChange({ search: "" });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Top row: Search + Quick actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <TextInput
            label="Search (name / email)"
            placeholder="Type to search…"
            value={search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="pr-10"
          />
        </div>

        <div className="flex gap-2 md:ml-3">
          <button
            onClick={() => onChange({ search: "" })}
            disabled={!search}
            className={`inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm transition ${
              search ? "border-gray-300 hover:bg-gray-50" : "border-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            title="Clear search text"
          >
            <IconComponent icon="mdi:close-circle" width={18} />
            Clear search
          </button>

          <button
            onClick={onResetAll}
            disabled={!hasActiveFilters}
            className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm transition ${
              hasActiveFilters
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            title="Reset all filters"
          >
            <IconComponent icon="mdi:filter-remove" width={18} />
            Reset filters
            {hasActiveFilters && (
              <span className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px]">{chips.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Second row: Filters */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
        <Select
          label="Status"
          value={statusId}
          onChange={(v) => onChange({ statusId: v })}
          options={[{ value: "", label: "All" }, ...statuses]}
          placeholder="All statuses"
        />

        <Select
          label="Source"
          value={sourceId}
          onChange={(v) => onChange({ sourceId: v })}
          options={[{ value: "", label: "All" }, ...sources]}
          placeholder="All sources"
        />

        {showAssignee && (
          <Select
            label="Assignee"
            value={assigneeId}
            onChange={(v) => onChange({ assigneeId: v })}
            options={[{ value: "", label: "All" }, ...assigneeOptions]}
            placeholder="All assignees"
          />
        )}

        <Select
          label="Sort by"
          value={orderBy}
          onChange={(v) => onChange({ orderBy: v })}
          options={sortFields}
          placeholder="Default (ID)"
        />

        <Select
          label="Direction"
          value={orderDir}
          onChange={(v) => onChange({ orderDir: v })}
          options={orderDirOptions}
          placeholder="Ascending"
        />
      </div>

      {/* Active Chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {chips.length > 0 ? (
          chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs text-gray-800"
            >
              <IconComponent icon="mdi:tag-multiple" width={14} className="text-amber-600" />
              {chip.label}
              <button
                onClick={() => clearChip(chip.key)}
                className="rounded-full p-0.5 hover:bg-black/5"
                aria-label="Clear"
                title="Clear"
              >
                <IconComponent icon="mdi:close" width={14} className="text-gray-700" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-500">No active filters</span>
        )}
      </div>
    </div>
  );
};

export default LeadsFiltersToolbar;
