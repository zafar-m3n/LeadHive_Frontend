import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DefaultLayout from "@/layouts/DefaultLayout";
import API from "@/services/index";
import Notification from "@/components/ui/Notification";
import Pagination from "@/components/ui/Pagination";
import Spinner from "@/components/ui/Spinner";
import Heading from "@/components/ui/Heading";
import AccentButton from "@/components/ui/AccentButton";
import LeadFormModal from "./components/LeadFormModal";
import LeadsTable from "./components/LeadsTable";
import LeadsFiltersToolbar from "./components/LeadsFiltersToolbar";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import ConfirmAssignModal from "./components/ConfirmAssignModal";
import Modal from "@/components/ui/Modal";
import Select from "@/components/form/Select";
import GrayButton from "@/components/ui/GrayButton";
import token from "@/lib/utilities";

/** Simple debounce hook */
const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// Defaults (note: search is NEVER persisted)
const DEFAULT_FILTERS = {
  search: "",
  statusIds: [], // ← multi-status
  sourceIds: [], // ← multi-source
  assigneeId: "",
  orderBy: "",
  orderDir: "ASC",
  assignedFrom: "",
  assignedTo: "",
  limit: 25,
  page: 1,
};

// Read once from storage (sync) and build initial state
const getInitialFilters = () => {
  const stored = token.getPersistedLeadsFilters(DEFAULT_FILTERS) || {};
  return {
    statusIds: Array.isArray(stored.statusIds) ? stored.statusIds : DEFAULT_FILTERS.statusIds,
    sourceIds: Array.isArray(stored.sourceIds) ? stored.sourceIds : DEFAULT_FILTERS.sourceIds,
    assigneeId: stored.assigneeId ?? DEFAULT_FILTERS.assigneeId,
    orderBy: stored.orderBy ?? DEFAULT_FILTERS.orderBy,
    orderDir: stored.orderDir ?? DEFAULT_FILTERS.orderDir,
    assignedFrom: stored.assignedFrom ?? DEFAULT_FILTERS.assignedFrom,
    assignedTo: stored.assignedTo ?? DEFAULT_FILTERS.assignedTo,
    limit: Number(stored.limit ?? DEFAULT_FILTERS.limit),
    page: Number(stored.page ?? DEFAULT_FILTERS.page),
    // IMPORTANT: search is volatile (never persisted)
    search: DEFAULT_FILTERS.search,
  };
};

const ManagerLeads = () => {
  const navigate = useNavigate();

  // Data
  const [leads, setLeads] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [managers, setManagers] = useState([]); // assignment list (scoped: admins + self + team)
  const [assigneeOptions, setAssigneeOptions] = useState([]); // filter list (all active users)

  // Bulk assign options (from /bulk/targets; manager gets reps in their teams)
  const [bulkTargets, setBulkTargets] = useState([]);
  const bulkTargetOptions = useMemo(
    () =>
      (bulkTargets || []).map((u) => ({
        value: u.id,
        label: u.full_name ? `${u.full_name} (${u.email})` : u.email,
      })),
    [bulkTargets]
  );

  // UI
  const [loading, setLoading] = useState(false);

  // ---------- Hydrated initial state (from localStorage) ----------
  const initial = useRef(getInitialFilters()).current;

  // Pagination
  const [page, setPage] = useState(() => initial.page);
  const [limit, setLimit] = useState(() => initial.limit);
  const [totalPages, setTotalPages] = useState(1);

  // Filters / Sorting / Search
  const [statusIds, setStatusIds] = useState(() => initial.statusIds); // ← array
  const [sourceIds, setSourceIds] = useState(() => initial.sourceIds); // ← array
  const [assigneeId, setAssigneeId] = useState(() => initial.assigneeId);
  const [orderBy, setOrderBy] = useState(() => initial.orderBy);
  const [orderDir, setOrderDir] = useState(() => initial.orderDir);
  const [search, setSearch] = useState(() => initial.search); // never persisted
  const [assignedFrom, setAssignedFrom] = useState(() => initial.assignedFrom);
  const [assignedTo, setAssignedTo] = useState(() => initial.assignedTo);
  const debouncedSearch = useDebouncedValue(search, 300);

  // Modals (single lead)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);
  const hasSelection = selectedIds.length > 0;

  // Bulk assign modal
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssigneeId, setBulkAssigneeId] = useState("");
  const [bulkOverwrite, setBulkOverwrite] = useState(false);

  // Bulk delete modal
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Prevent stale updates
  const fetchGuard = useRef(0);

  // === API calls ===
  const fetchLeads = useCallback(async () => {
    const fetchId = ++fetchGuard.current;
    setLoading(true);
    try {
      const params = {
        page: page ?? 1,
        limit,
        // serialize arrays to CSV for API
        status_ids: Array.isArray(statusIds) && statusIds.length ? statusIds.join(",") : undefined,
        source_ids: Array.isArray(sourceIds) && sourceIds.length ? sourceIds.join(",") : undefined,
        assignee_id: assigneeId || undefined, // manager can filter by any assignee
        orderBy: orderBy || undefined,
        orderDir: orderDir || undefined,
        search: debouncedSearch || undefined,
        assigned_from: assignedFrom || undefined,
        assigned_to: assignedTo || undefined,
      };

      const res = await API.private.getLeads(params);
      if (fetchId !== fetchGuard.current) return;

      if (res.data?.code === "OK") {
        setLeads(res.data.data.leads || []);
        setTotalPages(res.data.data.pagination.totalPages);
        setSelectedIds([]); // clear selection when (re)loading
      }
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to fetch leads");
    } finally {
      if (fetchId === fetchGuard.current) setLoading(false);
    }
  }, [page, limit, statusIds, sourceIds, assigneeId, orderBy, orderDir, debouncedSearch, assignedFrom, assignedTo]);

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await API.private.getLeadStatuses();
      if (res.data?.code === "OK") {
        setStatuses(res.data.data.map((s) => ({ value: s.id, label: s.label })));
      }
    } catch {
      Notification.error("Failed to fetch lead statuses");
    }
  }, []);

  const fetchSources = useCallback(async () => {
    try {
      const res = await API.private.getLeadSources();
      if (res.data?.code === "OK") {
        setSources(res.data.data.map((s) => ({ value: s.id, label: s.label })));
      }
    } catch {
      Notification.error("Failed to fetch lead sources");
    }
  }, []);

  // Assignment options (scoped): team members + admins + self
  const fetchAssignableUsers = useCallback(async () => {
    try {
      const res = await API.private.getAssignableUsersForManager();
      if (res.data?.code === "OK") {
        setManagers(res.data.data || []);
      }
    } catch {
      Notification.error("Failed to fetch assignable users");
    }
  }, []);

  // Assignee filter options (full active users): /assignees
  const fetchAssignees = useCallback(async () => {
    try {
      const res = await API.private.getAssignees();
      if (res.data?.code === "OK") {
        const options = (res.data.data || []).map((u) => ({
          value: u.id,
          label: u.full_name ? `${u.full_name} (${u.email})` : u.email,
        }));
        setAssigneeOptions(options);
      }
    } catch {
      Notification.error("Failed to fetch assignees");
    }
  }, []);

  // Bulk assign targets (manager → reps in their teams)
  const fetchBulkTargets = useCallback(async () => {
    try {
      const res = await API.private.getBulkAssignableTargets();
      if (res?.data?.code === "OK" || res?.data?.success === true) {
        setBulkTargets(res.data.data?.targets || []);
      }
    } catch {
      // silent; modal will show empty options if this fails
    }
  }, []);

  // Initial loads
  useEffect(() => {
    fetchStatuses();
    fetchSources();
    fetchAssignableUsers(); // per-row assign targets
    fetchAssignees(); // filter dropdown
    fetchBulkTargets(); // bulk assign targets
  }, [fetchStatuses, fetchSources, fetchAssignableUsers, fetchAssignees, fetchBulkTargets]);

  // Initial and subsequent fetches — because initial state is already hydrated,
  // this runs once with the correct persisted values.
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Persist everything EXCEPT search
  useEffect(() => {
    token.setPersistedLeadsFilters({
      statusIds, // ← persist array
      sourceIds, // ← persist array
      assigneeId,
      orderBy,
      orderDir,
      assignedFrom,
      assignedTo,
      limit,
      page,
    });
  }, [statusIds, sourceIds, assigneeId, orderBy, orderDir, assignedFrom, assignedTo, limit, page]);

  // === Handlers (single) ===
  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      if (editingLead) {
        await API.private.updateLead(editingLead.id, data);
        Notification.success("Lead updated successfully");
      } else {
        await API.private.createLead(data);
        Notification.success("Lead created successfully");
      }
      await fetchLeads();
      setIsModalOpen(false);
      setEditingLead(null);
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to save lead");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lead) => {
    navigate(`/manager/leads/${lead.id}`);
  };

  const confirmDelete = (lead) => {
    setLeadToDelete(lead);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!leadToDelete) return;
    try {
      await API.private.deleteLead(leadToDelete.id);
      Notification.success("Lead deleted successfully");
      await fetchLeads();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to delete lead");
    } finally {
      setIsDeleteModalOpen(false);
      setLeadToDelete(null);
    }
  };

  const handleAssignOptionClick = (lead, assignee) => {
    setLeadToAssign(lead);
    setSelectedAssignee(assignee);
    setIsAssignModalOpen(true);
  };

  const handleAssign = async () => {
    if (!leadToAssign || !selectedAssignee) return;
    try {
      await API.private.assignLead(leadToAssign.id, { assignee_id: selectedAssignee.id });
      Notification.success("Lead assigned successfully");
      await fetchLeads();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to assign lead");
    } finally {
      setIsAssignModalOpen(false);
      setLeadToAssign(null);
      setSelectedAssignee(null);
    }
  };

  // === Handlers (bulk) ===
  const openBulkAssign = () => {
    if (!hasSelection) {
      Notification.error("Please select at least one lead.");
      return;
    }
    setBulkAssigneeId("");
    setBulkOverwrite(false);
    setBulkAssignOpen(true);
  };

  const openBulkDelete = () => {
    if (!hasSelection) {
      Notification.error("Please select at least one lead.");
      return;
    }
    setBulkDeleteOpen(true);
  };

  const executeBulkAssign = async () => {
    if (!bulkAssigneeId) {
      Notification.error("Please choose an assignee.");
      return;
    }
    try {
      await API.private.bulkAssignLeads({
        lead_ids: selectedIds,
        assignee_id: Number(bulkAssigneeId),
        overwrite: !!bulkOverwrite,
      });
      Notification.success("Leads assigned successfully");
      setBulkAssignOpen(false);
      await fetchLeads();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Bulk assign failed");
    }
  };

  const executeBulkDelete = async () => {
    try {
      await API.private.bulkDeleteLeads(selectedIds);
      Notification.success("Leads deleted successfully");
      setBulkDeleteOpen(false);
      await fetchLeads();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Bulk delete failed");
    }
  };

  // Bulk selection helpers
  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleSelectAll = (idsOnPage, checked) => {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...idsOnPage])));
    } else {
      setSelectedIds((prev) => prev.filter((id) => !idsOnPage.includes(id)));
    }
  };

  // Sorting choices
  const sortFields = useMemo(
    () => [
      { value: "", label: "Default (ID)" },
      { value: "first_name", label: "First name" },
      { value: "last_name", label: "Last name" },
      { value: "email", label: "Email" },
      { value: "company", label: "Company" },
      { value: "value_decimal", label: "Value" },
      { value: "created_at", label: "Created at" },
      { value: "updated_at", label: "Updated at" },
      { value: "assigned_at", label: "Assigned at (latest)" },
    ],
    []
  );

  const orderDirOptions = [
    { value: "ASC", label: "Ascending" },
    { value: "DESC", label: "Descending" },
  ];

  // Same limitOptions pattern as AdminLeads
  const limitOptions = useMemo(
    () => [
      { value: 10, label: "10" },
      { value: 25, label: "25" },
      { value: 50, label: "50" },
      { value: 100, label: "100" },
      { value: 200, label: "200" },
    ],
    []
  );

  // Rows-per-page change (same as AdminLeads)
  const handleLimitChange = (newValue) => {
    const next = Number(newValue) || DEFAULT_FILTERS.limit;
    setLimit(next);
    setPage(1);
  };

  // >>> Only reset to page 1 when the user actually changes something
  const handleToolbarChange = (partial) => {
    let changed = false;

    if (Object.prototype.hasOwnProperty.call(partial, "search") && partial.search !== search) {
      setSearch(partial.search);
      changed = true;
    }

    // multi-status
    if (Object.prototype.hasOwnProperty.call(partial, "statusIds")) {
      const next = Array.isArray(partial.statusIds) ? partial.statusIds : [];
      const same =
        Array.isArray(next) &&
        Array.isArray(statusIds) &&
        next.length === statusIds.length &&
        next.every((v, i) => String(v) === String(statusIds[i]));
      if (!same) {
        setStatusIds(next);
        changed = true;
      }
    }

    // multi-source
    if (Object.prototype.hasOwnProperty.call(partial, "sourceIds")) {
      const next = Array.isArray(partial.sourceIds) ? partial.sourceIds : [];
      const same =
        Array.isArray(next) &&
        Array.isArray(sourceIds) &&
        next.length === sourceIds.length &&
        next.every((v, i) => String(v) === String(sourceIds[i]));
      if (!same) {
        setSourceIds(next);
        changed = true;
      }
    }

    if (Object.prototype.hasOwnProperty.call(partial, "assigneeId") && partial.assigneeId !== assigneeId) {
      setAssigneeId(partial.assigneeId);
      changed = true;
    }
    if (Object.prototype.hasOwnProperty.call(partial, "orderBy") && partial.orderBy !== orderBy) {
      setOrderBy(partial.orderBy);
      changed = true;
    }
    if (Object.prototype.hasOwnProperty.call(partial, "orderDir") && partial.orderDir !== orderDir) {
      setOrderDir(partial.orderDir);
      changed = true;
    }
    if (Object.prototype.hasOwnProperty.call(partial, "assignedFrom") && partial.assignedFrom !== assignedFrom) {
      setAssignedFrom(partial.assignedFrom);
      changed = true;
    }
    if (Object.prototype.hasOwnProperty.call(partial, "assignedTo") && partial.assignedTo !== assignedTo) {
      setAssignedTo(partial.assignedTo);
      changed = true;
    }

    if (changed) setPage(1);
  };

  const resetAllFilters = () => {
    setStatusIds(DEFAULT_FILTERS.statusIds); // ← []
    setSourceIds(DEFAULT_FILTERS.sourceIds); // ← []
    setAssigneeId(DEFAULT_FILTERS.assigneeId);
    setOrderBy(DEFAULT_FILTERS.orderBy);
    setOrderDir(DEFAULT_FILTERS.orderDir);
    setSearch(DEFAULT_FILTERS.search); // not persisted
    setAssignedFrom(DEFAULT_FILTERS.assignedFrom);
    setAssignedTo(DEFAULT_FILTERS.assignedTo);
    setLimit(DEFAULT_FILTERS.limit);
    setPage(DEFAULT_FILTERS.page);

    // Persist everything EXCEPT search
    token.setPersistedLeadsFilters({
      statusIds: DEFAULT_FILTERS.statusIds,
      sourceIds: DEFAULT_FILTERS.sourceIds,
      assigneeId: DEFAULT_FILTERS.assigneeId,
      orderBy: DEFAULT_FILTERS.orderBy,
      orderDir: DEFAULT_FILTERS.orderDir,
      assignedFrom: DEFAULT_FILTERS.assignedFrom,
      assignedTo: DEFAULT_FILTERS.assignedTo,
      limit: DEFAULT_FILTERS.limit,
      page: DEFAULT_FILTERS.page,
    });
  };

  const idsOnCurrentPage = useMemo(() => leads.map((l) => l.id), [leads]);

  return (
    <DefaultLayout>
      <div className="space-y-6">
        {/* Heading + Actions */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Heading>Manager Leads</Heading>
          <div className="flex flex-wrap gap-2">
            {/* Bulk actions */}
            <button
              onClick={openBulkAssign}
              className="px-4 py-2 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              disabled={!hasSelection}
            >
              Assign Selected
            </button>
            <button
              onClick={openBulkDelete}
              className="px-4 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700 transition disabled:opacity-50"
              disabled={!hasSelection}
            >
              Delete Selected
            </button>

            {/* Add lead */}
            <div className="w-fit">
              <AccentButton
                text="Add Lead"
                onClick={() => {
                  setEditingLead(null);
                  setIsModalOpen(true);
                }}
              />
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar (includes Assigned date range & Rows selector) */}
        <LeadsFiltersToolbar
          statuses={statuses}
          sources={sources}
          sortFields={sortFields}
          orderDirOptions={orderDirOptions}
          assigneeOptions={assigneeOptions}
          showAssignee={true}
          values={{
            search,
            statusIds, // ← pass array
            sourceIds, // ← pass array
            assigneeId,
            orderBy,
            orderDir,
            limit,
            assignedFrom,
            assignedTo,
          }}
          limitOptions={limitOptions}
          onLimitChange={handleLimitChange}
          onChange={handleToolbarChange}
          onResetAll={resetAllFilters}
        />

        {/* Selected count */}
        {hasSelection && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">{selectedIds.length}</span> selected on this page.
          </div>
        )}

        {/* Leads Table */}
        <div className="relative">
          {loading ? (
            <Spinner message="Loading leads..." />
          ) : (
            <>
              <LeadsTable
                leads={leads}
                onEdit={handleEdit}
                onDelete={confirmDelete}
                managers={managers}
                onAssignOptionClick={handleAssignOptionClick}
                mode="manager"
                // bulk selection
                showSelection={true}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={(checked) => toggleSelectAll(idsOnCurrentPage, checked)}
              />
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
                className="mt-2"
              />
            </>
          )}
        </div>

        {/* Single-Item Modals */}
        <LeadFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLead(null);
          }}
          onSubmit={handleSubmit}
          editingLead={editingLead}
          statuses={statuses}
          sources={sources}
          loading={loading}
        />

        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          lead={leadToDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
        />

        <ConfirmAssignModal
          isOpen={isAssignModalOpen}
          lead={leadToAssign}
          assignee={selectedAssignee}
          onCancel={() => setIsAssignModalOpen(false)}
          onConfirm={handleAssign}
        />

        {/* ===== Bulk Assign Modal ===== */}
        <Modal isOpen={bulkAssignOpen} onClose={() => setBulkAssignOpen(false)} title="Assign Selected Leads" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You’re assigning <span className="font-semibold">{selectedIds.length}</span> selected lead
              {selectedIds.length > 1 ? "s" : ""}.
            </p>

            <Select
              label="Assign to"
              value={bulkAssigneeId}
              onChange={(val) => setBulkAssigneeId(val)}
              options={bulkTargetOptions}
              placeholder="Choose user…"
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                checked={bulkOverwrite}
                onChange={(e) => setBulkOverwrite(e.target.checked)}
              />
              Overwrite existing assignees (otherwise, already-assigned leads will be skipped)
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <div className="w-fit">
                <GrayButton text="Cancel" onClick={() => setBulkAssignOpen(false)} />
              </div>
              <div className="w-fit">
                <AccentButton text="Assign" onClick={executeBulkAssign} />
              </div>
            </div>
          </div>
        </Modal>

        {/* ===== Bulk Delete Modal ===== */}
        <Modal isOpen={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} title="Delete Selected Leads" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              This will permanently delete <span className="font-semibold">{selectedIds.length}</span> lead
              {selectedIds.length > 1 ? "s" : ""}. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setBulkDeleteOpen(false)}
                className="text-sm px-4 py-1.5 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkDelete}
                className="text-sm px-4 py-1.5 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DefaultLayout>
  );
};

export default ManagerLeads;
