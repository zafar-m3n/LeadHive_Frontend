import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import DefaultLayout from "@/layouts/DefaultLayout";
import API from "@/services/index";
import Notification from "@/components/ui/Notification";
import Pagination from "@/components/ui/Pagination";
import Spinner from "@/components/ui/Spinner";
import Heading from "@/components/ui/Heading";
import LeadsTable from "./components/LeadsTable";
import LeadsFiltersToolbar from "./components/LeadsFiltersToolbar";
import ConfirmAssignModal from "./components/ConfirmAssignModal";
import SalesLeadsModal from "./components/SalesLeadsModal";

/** Simple debounce hook */
const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const SalesLeads = () => {
  const [leads, setLeads] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [myManager, setMyManager] = useState(null);

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters / Sorting / Search
  const [statusId, setStatusId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [orderBy, setOrderBy] = useState("");
  const [orderDir, setOrderDir] = useState("ASC");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null); // will be myManager

  const fetchGuard = useRef(0);

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
        if (fetchId !== fetchGuard.current) return;

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

  const fetchMyManager = useCallback(async () => {
    try {
      const res = await API.private.getMyManager();
      if (res.data?.code === "OK") {
        setMyManager(res.data.data || null); // a single manager object
      } else {
        setMyManager(null);
      }
    } catch (err) {
      // If 404 (no team), we just keep it null to disable assignment
      setMyManager(null);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
    fetchSources();
    fetchMyManager();
  }, [fetchStatuses, fetchSources, fetchMyManager]);

  useEffect(() => {
    fetchLeads({ page });
  }, [page, fetchLeads]);

  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1));
  }, [statusId, sourceId, orderBy, orderDir, debouncedSearch]);

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleSubmit = async ({ status_id, notes }) => {
    if (!editingLead) return;
    setLoading(true);
    try {
      // Only send fields the sales rep is allowed to change
      await API.private.updateLead(editingLead.id, { status_id, notes });
      Notification.success("Lead updated successfully");
      await fetchLeads({ page });
      setIsModalOpen(false);
      setEditingLead(null);
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to update lead");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOptionClick = (lead /*, assigneeFromTable */) => {
    if (!myManager) {
      Notification.error("You are not assigned to a team/manager.");
      return;
    }
    setLeadToAssign(lead);
    setSelectedAssignee(myManager);
    setIsAssignModalOpen(true);
  };

  const handleAssign = async () => {
    if (!leadToAssign || !selectedAssignee) return;
    try {
      await API.private.assignLead(leadToAssign.id, { assignee_id: selectedAssignee.id });
      Notification.success("Lead assigned to your manager");
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
        {/* Heading (no Add button for sales reps) */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Heading>My Leads</Heading>
          {/* Optionally show manager info */}
          <div className="text-sm text-gray-600">
            {myManager ? (
              <span>
                Manager:&nbsp;
                <span className="font-medium text-gray-800">{myManager.full_name}</span>{" "}
                <span className="text-gray-500">({myManager.email})</span>
              </span>
            ) : (
              <span className="italic">No manager assigned</span>
            )}
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
                onDelete={null}
                managers={myManager ? [myManager] : []}
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

        {/* Edit (Status + Notes only) */}
        <SalesLeadsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLead(null);
          }}
          onSubmit={handleSubmit}
          editingLead={editingLead}
          statuses={statuses}
          loading={loading}
        />

        {/* Assign to Manager */}
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

export default SalesLeads;
