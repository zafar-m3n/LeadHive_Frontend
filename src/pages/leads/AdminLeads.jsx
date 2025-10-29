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
import token from "@/lib/utilities";
import BulkActionsModal from "./components/BulkActionsModal";

/** ============================
 *  Simple debounce hook
 *  ============================ */
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

const AdminLeads = () => {
  const navigate = useNavigate();

  // Current user + role
  const me = token.getUserData();
  const role = me?.role?.value;
  const isAdminOrManager = role === "admin" || role === "manager";

  // Data
  const [leads, setLeads] = useState([]);
  const [statuses, setStatuses] = useState([]); // [{value:id,label}]
  const [sources, setSources] = useState([]); // [{value:id,label}]
  const [managers, setManagers] = useState([]); // ← ALL assignees
  const [assigneeOptions, setAssigneeOptions] = useState([]);

  // Bulk targets (uses /bulk/targets)
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

  // Modals (single-lead)
  const [isModalOpen, setIsModalOpen] = useState(false); // Add Lead
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);
  const hasSelection = selectedIds.length > 0;

  // Bulk Actions modal
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);

  // Prevent stale updates (race-safe)
  const fetchGuard = useRef(0);

  // === API calls ===
  const fetchLeads = useCallback(async () => {
    const fetchId = ++fetchGuard.current;
    setLoading(true);
    try {
      const params = {
        page: page ?? 1,
        limit,
        // >>> serialize arrays to comma-separated string for the API <<<
        status_ids: Array.isArray(statusIds) && statusIds.length ? statusIds.join(",") : undefined,
        source_ids: Array.isArray(sourceIds) && sourceIds.length ? sourceIds.join(",") : undefined,
        assignee_id: isAdminOrManager && assigneeId ? assigneeId : undefined,
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
        setSelectedIds([]);
      }
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to fetch leads");
    } finally {
      if (fetchId === fetchGuard.current) setLoading(false);
    }
  }, [
    page,
    limit,
    statusIds,
    sourceIds,
    assigneeId,
    isAdminOrManager,
    orderBy,
    orderDir,
    debouncedSearch,
    assignedFrom,
    assignedTo,
  ]);

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

  // Use UNIVERSAL assignees (admins + managers + reps)
  const fetchAssignees = useCallback(async () => {
    if (!isAdminOrManager) return;
    try {
      const res = await API.private.getAssignees();
      if (res.data?.code === "OK") {
        const all = res.data.data || [];
        const options = all.map((u) => ({
          value: u.id,
          label: u.full_name ? `${u.full_name} (${u.email})` : u.email,
        }));
        setAssigneeOptions(options);
        setManagers(all);
      }
    } catch {
      Notification.error("Failed to fetch assignees");
    }
  }, [isAdminOrManager]);

  const fetchBulkTargets = useCallback(async () => {
    if (!isAdminOrManager) return;
    try {
      const res = await API.private.getBulkAssignableTargets();
      if (res?.data?.code === "OK" || res?.data?.success === true) {
        setBulkTargets(res.data.data?.targets || []);
      }
    } catch {
      // silent
    }
  }, [isAdminOrManager]);

  // Bootstrap lookup data (non-blocking)
  useEffect(() => {
    fetchStatuses();
    fetchSources();
    fetchAssignees();
    fetchBulkTargets();
  }, [fetchStatuses, fetchSources, fetchAssignees, fetchBulkTargets]);

  // Initial and subsequent fetches
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

  // === Handlers ===
  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await API.private.createLead(data);
      Notification.success("Lead created successfully");
      await fetchLeads();
      setIsModalOpen(false);
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to save lead");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lead) => {
    navigate(`/admin/leads/${lead.id}`);
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
      await API.private.assignLead(leadToAssign.id, {
        assignee_id: selectedAssignee.id,
      });
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

  // --------- Bulk Actions (single modal) ---------
  const openBulkActions = () => {
    if (!hasSelection) {
      Notification.error("Please select at least one lead.");
      return;
    }
    setBulkActionsOpen(true);
  };

  // UPDATED: accept optional statusId and pass as status_id to API
  const handleBulkAssign = async ({ assigneeId, overwrite, statusId }) => {
    if (!assigneeId) {
      Notification.error("Please choose an assignee.");
      return;
    }
    try {
      await API.private.bulkAssignLeads({
        lead_ids: selectedIds,
        assignee_id: Number(assigneeId),
        overwrite: !!overwrite,
        // only include when provided
        ...(statusId ? { status_id: Number(statusId) } : {}),
      });
      Notification.success("Leads assigned successfully");
      await fetchLeads();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Bulk assign failed");
      throw err; // keep modal in consistent state
    }
  };

  const handleBulkStatus = async ({ statusId }) => {
    if (!statusId) {
      Notification.error("Please choose a status.");
      return;
    }
    try {
      await API.private.bulkUpdateLeadStatus({
        lead_ids: selectedIds,
        status_id: Number(statusId),
      });
      Notification.success("Status updated for selected leads");
      await fetchLeads();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Bulk status update failed");
      throw err;
    }
  };

  const handleBulkSource = async ({ sourceId }) => {
    if (!sourceId) {
      Notification.error("Please choose a source.");
      return;
    }
    try {
      await API.private.bulkUpdateLeadSource({
        lead_ids: selectedIds,
        source_id: Number(sourceId),
      });
      Notification.success("Source updated for selected leads");
      await fetchLeads();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Bulk source update failed");
      throw err;
    }
  };

  const handleBulkDelete = async () => {
    try {
      await API.private.bulkDeleteLeads(selectedIds);
      Notification.success("Leads deleted successfully");
      await fetchLeads();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Bulk delete failed");
      throw err;
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

  const handleToolbarChange = (partial) => {
    let changed = false;

    if (Object.prototype.hasOwnProperty.call(partial, "search") && partial.search !== search) {
      setSearch(partial.search);
      changed = true;
    }

    // statusIds (array)
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

    // sourceIds (array)
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

  const handleLimitChange = (newValue) => {
    const next = Number(newValue) || DEFAULT_FILTERS.limit;
    setLimit(next);
    setPage(1);
  };

  const idsOnCurrentPage = useMemo(() => leads.map((l) => l.id), [leads]);

  // Inline Status Update (used by table)
  const handleInlineStatusUpdate = async (lead, statusOption) => {
    if (!lead || !statusOption?.id) return;
    const prev = leads;
    const now = new Date().toISOString();
    setLeads((ls) =>
      ls.map((l) =>
        l.id === lead.id
          ? {
              ...l,
              status_id: statusOption.id,
              LeadStatus: { id: statusOption.id, value: statusOption.value, label: statusOption.label },
              updated_at: now,
            }
          : l
      )
    );

    try {
      await API.private.updateLead(lead.id, { status_id: statusOption.id });
      await fetchLeads();
      Notification.success("Status updated");
    } catch (err) {
      setLeads(prev);
      Notification.error(err.response?.data?.error || "Failed to update status");
    }
  };

  return (
    <DefaultLayout>
      <div className="space-y-6">
        {/* Heading + Add/Import + Bulk Actions */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Heading>Admin Leads</Heading>
          <div className="flex flex-wrap gap-2">
            {isAdminOrManager && (
              <button
                onClick={openBulkActions}
                className="px-4 py-2 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                disabled={!hasSelection}
              >
                Bulk Actions
              </button>
            )}
            <div className="w-fit">
              <AccentButton
                text="Add Lead"
                onClick={() => {
                  setIsModalOpen(true);
                }}
              />
            </div>
            <button
              onClick={() => navigate("/admin/leads/import")}
              className="px-4 py-2 rounded bg-black text-white font-medium hover:bg-gray-900 transition"
            >
              Import Leads
            </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <LeadsFiltersToolbar
          statuses={statuses}
          sources={sources}
          sortFields={sortFields}
          orderDirOptions={orderDirOptions}
          assigneeOptions={isAdminOrManager ? assigneeOptions : []}
          showAssignee={isAdminOrManager}
          values={{
            search,
            statusIds, // ← multi-status
            sourceIds,
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

        {/* Selected counter */}
        {hasSelection && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">{selectedIds.length}</span> selected on this page.
          </div>
        )}

        {/* Leads Table + Pagination */}
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
                mode="admin"
                showSelection={true}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={(checked) => toggleSelectAll(idsOnCurrentPage, checked)}
                statuses={statuses} // keep { id, value, label }
                onStatusUpdate={handleInlineStatusUpdate}
              />
              <Pagination
                className="mt-2"
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </>
          )}
        </div>

        {/* Add Lead Modal */}
        <LeadFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          editingLead={null}
          statuses={statuses}
          sources={sources}
          loading={loading}
        />

        {/* Single-lead modals remain unchanged */}
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

        {/* ===== Bulk Actions Modal (assign + status + source + delete) ===== */}
        <BulkActionsModal
          isOpen={bulkActionsOpen}
          onClose={() => setBulkActionsOpen(false)}
          selectedCount={selectedIds.length}
          selectedIds={selectedIds}
          targetOptions={bulkTargetOptions}
          statusOptions={statuses}
          sourceOptions={sources}
          onBulkAssign={handleBulkAssign}
          onBulkStatus={handleBulkStatus}
          onBulkSource={handleBulkSource}
          onBulkDelete={handleBulkDelete}
          canAssign={isAdminOrManager}
        />
      </div>
    </DefaultLayout>
  );
};

export default AdminLeads;
