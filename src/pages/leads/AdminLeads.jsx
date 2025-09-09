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

const AdminLeads = () => {
  const navigate = useNavigate();

  // Current user + role
  const me = token.getUserData();
  const role = me?.role.value;
  const isAdminOrManager = role === "admin" || role === "manager";

  // Data
  const [leads, setLeads] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [managers, setManagers] = useState([]);
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

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  // Filters / Sorting / Search
  const [statusId, setStatusId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [orderBy, setOrderBy] = useState("");
  const [orderDir, setOrderDir] = useState("ASC");
  const [search, setSearch] = useState("");
  const [assignedFrom, setAssignedFrom] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false); // for Add Lead
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

  // Prevent stale updates (race-safe)
  const fetchGuard = useRef(0);

  // === API calls ===
  const fetchLeads = useCallback(
    async ({ page: pageParam } = {}) => {
      const fetchId = ++fetchGuard.current;
      setLoading(true);
      try {
        const params = {
          page: pageParam ?? 1,
          limit,
          status_id: statusId || undefined,
          source_id: sourceId || undefined,
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
    },
    [
      limit,
      statusId,
      sourceId,
      assigneeId,
      isAdminOrManager,
      orderBy,
      orderDir,
      debouncedSearch,
      assignedFrom,
      assignedTo,
    ]
  );

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

  const fetchManagersAndAdmins = useCallback(async () => {
    try {
      const res = await API.private.getManagersAndAdmins();
      if (res.data?.code === "OK") {
        setManagers(res.data.data || []);
      }
    } catch {
      Notification.error("Failed to fetch assignees");
    }
  }, []);

  const fetchAssignees = useCallback(async () => {
    if (!isAdminOrManager) return;
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

  useEffect(() => {
    fetchStatuses();
    fetchSources();
    fetchManagersAndAdmins();
    fetchAssignees();
    fetchBulkTargets();
  }, [fetchStatuses, fetchSources, fetchManagersAndAdmins, fetchAssignees, fetchBulkTargets]);

  useEffect(() => {
    fetchLeads({ page });
  }, [page, fetchLeads]);

  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1));
  }, [statusId, sourceId, assigneeId, orderBy, orderDir, debouncedSearch, limit, assignedFrom, assignedTo]);

  // === Handlers ===
  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await API.private.createLead(data);
      Notification.success("Lead created successfully");
      await fetchLeads({ page });
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
      await fetchLeads({ page });
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
      await fetchLeads({ page });
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to assign lead");
    } finally {
      setIsAssignModalOpen(false);
      setLeadToAssign(null);
      setSelectedAssignee(null);
    }
  };

  // === Bulk handlers ===
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
      await fetchLeads({ page });
    } catch (err) {
      Notification.error(err.response?.data?.error || "Bulk assign failed");
    }
  };

  const executeBulkDelete = async () => {
    try {
      await API.private.bulkDeleteLeads(selectedIds);
      Notification.success("Leads deleted successfully");
      setBulkDeleteOpen(false);
      await fetchLeads({ page });
    } catch (err) {
      Notification.error(err.response?.data?.error || "Bulk delete failed");
    }
  };

  // Bulk selection handlers
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
    if (Object.prototype.hasOwnProperty.call(partial, "search")) setSearch(partial.search);
    if (Object.prototype.hasOwnProperty.call(partial, "statusId")) setStatusId(partial.statusId);
    if (Object.prototype.hasOwnProperty.call(partial, "sourceId")) setSourceId(partial.sourceId);
    if (Object.prototype.hasOwnProperty.call(partial, "assigneeId")) setAssigneeId(partial.assigneeId);
    if (Object.prototype.hasOwnProperty.call(partial, "orderBy")) setOrderBy(partial.orderBy);
    if (Object.prototype.hasOwnProperty.call(partial, "orderDir")) setOrderDir(partial.orderDir);
    if (Object.prototype.hasOwnProperty.call(partial, "assignedFrom")) setAssignedFrom(partial.assignedFrom);
    if (Object.prototype.hasOwnProperty.call(partial, "assignedTo")) setAssignedTo(partial.assignedTo);
  };

  const resetAllFilters = () => {
    setStatusId("");
    setSourceId("");
    setAssigneeId("");
    setOrderBy("");
    setOrderDir("ASC");
    setSearch("");
    setAssignedFrom("");
    setAssignedTo("");
  };

  const handleLimitChange = (newValue) => {
    const next = Number(newValue) || 25;
    setLimit(next);
    setPage(1);
  };

  const idsOnCurrentPage = useMemo(() => leads.map((l) => l.id), [leads]);

  return (
    <DefaultLayout>
      <div className="space-y-6">
        {/* Heading + Add/Import Buttons */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Heading>Admin Leads</Heading>
          <div className="flex flex-wrap gap-2">
            {isAdminOrManager && (
              <>
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
              </>
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
            statusId,
            sourceId,
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
                className="rounded border-gray-300"
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

export default AdminLeads;
