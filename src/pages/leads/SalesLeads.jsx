// src/pages/sales/SalesLeads.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import IconComponent from "@/components/ui/Icon";
import token from "@/lib/utilities";

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

/** ============================
 *  Persisted filter defaults
 *  (search is NEVER persisted)
 *  ============================ */
const DEFAULT_FILTERS = {
  search: "",
  statusId: "",
  sourceId: "",
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
    statusId: stored.statusId ?? DEFAULT_FILTERS.statusId,
    sourceId: stored.sourceId ?? DEFAULT_FILTERS.sourceId,
    orderBy: stored.orderBy ?? DEFAULT_FILTERS.orderBy,
    orderDir: stored.orderDir ?? DEFAULT_FILTERS.orderDir,
    assignedFrom: stored.assignedFrom ?? DEFAULT_FILTERS.assignedFrom,
    assignedTo: stored.assignedTo ?? DEFAULT_FILTERS.assignedTo,
    limit: Number(stored.limit ?? DEFAULT_FILTERS.limit),
    page: Number(stored.page ?? DEFAULT_FILTERS.page),
    // volatile: never persisted
    search: DEFAULT_FILTERS.search,
  };
};

/** ============================
 *  Collapsible Managers Card
 *  ============================ */
const ManagersList = ({ managers = [] }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
        type="button"
      >
        <span className="flex items-center gap-2">
          <IconComponent icon="mdi:account-multiple" width={18} className="text-gray-700" />
          Managers
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
            {managers.length}
          </span>
        </span>
        <IconComponent icon={open ? "mdi:chevron-up" : "mdi:chevron-down"} width={18} />
      </button>

      <div
        className={`${
          open ? "visible max-h-[320px] opacity-100" : "hidden max-h-0 opacity-0"
        } border-t border-gray-100 overflow-hidden transition-all duration-200`}
      >
        {managers.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <IconComponent icon="mdi:account-alert-outline" width={18} />
              <span className="italic">No manager assigned</span>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {managers.map((m) => (
              <li key={m.id} className="px-3 py-2">
                <div className="truncate text-sm font-medium text-gray-900">{m.full_name || "Manager"}</div>
                <div className="truncate text-xs text-gray-500">{m.email}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

/** ============================
 *  Component
 *  ============================ */
const SalesLeads = () => {
  const navigate = useNavigate();

  // Data
  const [leads, setLeads] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [myManagers, setMyManagers] = useState([]); // assigned managers
  const [me, setMe] = useState(null); // current sales rep

  // UI
  const [loading, setLoading] = useState(false);

  // ---------- Hydrated initial state (from localStorage) ----------
  const initial = useRef(getInitialFilters()).current;

  // Pagination
  const [page, setPage] = useState(() => initial.page);
  const [limit, setLimit] = useState(() => initial.limit);
  const [totalPages, setTotalPages] = useState(1);

  // Filters (search not persisted)
  const [statusId, setStatusId] = useState(() => initial.statusId);
  const [sourceId, setSourceId] = useState(() => initial.sourceId);
  const [orderBy, setOrderBy] = useState(() => initial.orderBy);
  const [orderDir, setOrderDir] = useState(() => initial.orderDir);
  const [search, setSearch] = useState(() => initial.search);
  const [assignedFrom, setAssignedFrom] = useState(() => initial.assignedFrom);
  const [assignedTo, setAssignedTo] = useState(() => initial.assignedTo);
  const debouncedSearch = useDebouncedValue(search, 300);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null);

  const fetchGuard = useRef(0);

  /** ============================
   *  API calls
   *  ============================ */
  const fetchLeads = useCallback(async () => {
    const fetchId = ++fetchGuard.current;
    setLoading(true);
    try {
      const params = {
        page: page ?? 1,
        limit,
        status_id: statusId || undefined,
        source_id: sourceId || undefined,
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
      }
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to fetch leads");
    } finally {
      if (fetchId === fetchGuard.current) setLoading(false);
    }
  }, [page, limit, statusId, sourceId, orderBy, orderDir, debouncedSearch, assignedFrom, assignedTo]);

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

  const fetchMyManagers = useCallback(async () => {
    try {
      const res = await API.private.getMyManager();
      if (res.data?.code === "OK" && Array.isArray(res.data.data)) {
        setMyManagers(res.data.data);
      } else {
        setMyManagers([]);
      }
    } catch {
      setMyManagers([]);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await API.private.getProfile?.();
      if (res?.data?.code === "OK") {
        setMe(res.data.data);
      }
    } catch {
      // ignore
    }
  }, []);

  // Initial loads (lookups)
  useEffect(() => {
    fetchStatuses();
    fetchSources();
    fetchMyManagers();
    fetchProfile();
  }, [fetchStatuses, fetchSources, fetchMyManagers, fetchProfile]);

  // Initial + subsequent fetches — runs once immediately with hydrated values,
  // and then whenever dependencies change (including page).
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset page to 1 when any filter/sort/limit/search/date range changes
  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1));
  }, [statusId, sourceId, orderBy, orderDir, debouncedSearch, assignedFrom, assignedTo, limit]);

  // Persist everything EXCEPT search
  useEffect(() => {
    token.setPersistedLeadsFilters({
      statusId,
      sourceId,
      orderBy,
      orderDir,
      assignedFrom,
      assignedTo,
      limit,
      page,
    });
  }, [statusId, sourceId, orderBy, orderDir, assignedFrom, assignedTo, limit, page]);

  /** ============================
   *  Handlers
   *  ============================ */
  const handleEdit = (lead) => {
    navigate(`/leads/${lead.id}`);
  };

  const handleSubmit = async ({ status_id, notes }) => {
    if (!editingLead) return;
    setLoading(true);
    try {
      await API.private.updateLead(editingLead.id, { status_id, notes });
      Notification.success("Lead updated successfully");
      await fetchLeads();
      setIsModalOpen(false);
      setEditingLead(null);
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to update lead");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOptionClick = (lead, managerChoice) => {
    if (!myManagers.length) {
      Notification.error("You are not assigned to a manager.");
      return;
    }
    setLeadToAssign(lead);
    setSelectedAssignee(managerChoice || myManagers[0]);
    setIsAssignModalOpen(true);
  };

  const handleAssign = async () => {
    if (!leadToAssign || !selectedAssignee) return;
    try {
      await API.private.assignLead(leadToAssign.id, { assignee_id: selectedAssignee.id });
      Notification.success("Lead assigned to your manager");
      await fetchLeads();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to assign lead");
    } finally {
      setIsAssignModalOpen(false);
      setLeadToAssign(null);
      setSelectedAssignee(null);
    }
  };

  /** ============================
   *  Config
   *  ============================ */
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

  const handleLimitChange = (newValue) => {
    const next = Number(newValue) || DEFAULT_FILTERS.limit;
    setLimit(next);
    setPage(1);
  };

  const handleToolbarChange = (partial) => {
    if ("search" in partial) setSearch(partial.search);
    if ("statusId" in partial) setStatusId(partial.statusId);
    if ("sourceId" in partial) setSourceId(partial.sourceId);
    if ("orderBy" in partial) setOrderBy(partial.orderBy);
    if ("orderDir" in partial) setOrderDir(partial.orderDir);
    if ("assignedFrom" in partial) setAssignedFrom(partial.assignedFrom);
    if ("assignedTo" in partial) setAssignedTo(partial.assignedTo);
  };

  const resetAllFilters = () => {
    setStatusId(DEFAULT_FILTERS.statusId);
    setSourceId(DEFAULT_FILTERS.sourceId);
    setOrderBy(DEFAULT_FILTERS.orderBy);
    setOrderDir(DEFAULT_FILTERS.orderDir);
    setSearch(DEFAULT_FILTERS.search); // not persisted
    setAssignedFrom(DEFAULT_FILTERS.assignedFrom);
    setAssignedTo(DEFAULT_FILTERS.assignedTo);
    setLimit(DEFAULT_FILTERS.limit);
    setPage(DEFAULT_FILTERS.page);

    // persist everything EXCEPT search
    token.setPersistedLeadsFilters({
      statusId: DEFAULT_FILTERS.statusId,
      sourceId: DEFAULT_FILTERS.sourceId,
      orderBy: DEFAULT_FILTERS.orderBy,
      orderDir: DEFAULT_FILTERS.orderDir,
      assignedFrom: DEFAULT_FILTERS.assignedFrom,
      assignedTo: DEFAULT_FILTERS.assignedTo,
      limit: DEFAULT_FILTERS.limit,
      page: DEFAULT_FILTERS.page,
    });
  };

  /** ============================
   *  Render
   *  ============================ */
  return (
    <DefaultLayout>
      <div className="space-y-6">
        {/* Heading + Managers card */}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <Heading>My Leads</Heading>
          <div className="w-full md:w-auto md:min-w-[360px]">
            <ManagersList managers={myManagers} />
          </div>
        </div>

        {/* Filters & Search */}
        <LeadsFiltersToolbar
          statuses={statuses}
          sources={sources}
          sortFields={sortFields}
          orderDirOptions={orderDirOptions}
          values={{
            search,
            statusId,
            sourceId,
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
                managers={myManagers}
                onAssignOptionClick={handleAssignOptionClick}
                mode="sales"
                selfId={me?.id || null}
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

        {/* Confirm Assign */}
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
