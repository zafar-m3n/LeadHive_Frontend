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

  // Data
  const [leads, setLeads] = useState([]);
  const [statuses, setStatuses] = useState([]); // [{value,label}]
  const [sources, setSources] = useState([]); // [{value,label}]
  const [managers, setManagers] = useState([]);

  // UI
  const [loading, setLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters / Sorting / Search
  const [statusId, setStatusId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [orderBy, setOrderBy] = useState(""); // backend defaults to id ASC if unset
  const [orderDir, setOrderDir] = useState("ASC");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null);

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
          orderBy: orderBy || undefined,
          orderDir: orderDir || undefined,
          search: debouncedSearch || undefined,
        };

        const res = await API.private.getLeads(params);
        if (fetchId !== fetchGuard.current) return; // ignore stale responses

        if (res.data?.code === "OK") {
          setLeads(res.data.data.leads || []);
          setTotalPages(res.data.data.pagination.totalPages);
        }
      } catch (err) {
        Notification.error(err.response?.data?.error || "Failed to fetch leads");
      } finally {
        if (fetchId === fetchGuard.current) setLoading(false);
      }
    },
    [limit, statusId, sourceId, orderBy, orderDir, debouncedSearch]
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

  // Initial loads
  useEffect(() => {
    fetchStatuses();
    fetchSources();
    fetchManagersAndAdmins();
  }, [fetchStatuses, fetchSources, fetchManagersAndAdmins]);

  // Fetch when page changes (single fetch source of truth)
  useEffect(() => {
    fetchLeads({ page });
  }, [page, fetchLeads]);

  // Reset page when filters/sort/search change (use prev form)
  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1));
  }, [statusId, sourceId, orderBy, orderDir, debouncedSearch]);

  // === Handlers ===
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
      await fetchLeads({ page }); // refresh current page once
      setIsModalOpen(false);
      setEditingLead(null);
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to save lead");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
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
      await API.private.assignLead(leadToAssign.id, { assignee_id: selectedAssignee.id });
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
    ],
    []
  );

  const orderDirOptions = [
    { value: "ASC", label: "Ascending" },
    { value: "DESC", label: "Descending" },
  ];

  const handleToolbarChange = (partial) => {
    if (Object.prototype.hasOwnProperty.call(partial, "search")) setSearch(partial.search);
    if (Object.prototype.hasOwnProperty.call(partial, "statusId")) setStatusId(partial.statusId);
    if (Object.prototype.hasOwnProperty.call(partial, "sourceId")) setSourceId(partial.sourceId);
    if (Object.prototype.hasOwnProperty.call(partial, "orderBy")) setOrderBy(partial.orderBy);
    if (Object.prototype.hasOwnProperty.call(partial, "orderDir")) setOrderDir(partial.orderDir);
  };

  const resetAllFilters = () => {
    setStatusId("");
    setSourceId("");
    setOrderBy("");
    setOrderDir("ASC");
    setSearch("");
  };

  return (
    <DefaultLayout>
      <div className="space-y-6">
        {/* Heading + Add Button */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Heading>Admin Leads</Heading>
          <div className="flex space-x-2">
            <div className="w-fit">
              <AccentButton
                text="Add Lead"
                onClick={() => {
                  setEditingLead(null);
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
          values={{ search, statusId, sourceId, orderBy, orderDir }}
          onChange={handleToolbarChange}
          onResetAll={resetAllFilters}
        />

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

        {/* Modals */}
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
      </div>
    </DefaultLayout>
  );
};

export default AdminLeads;
