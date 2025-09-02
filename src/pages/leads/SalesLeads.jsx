// src/pages/sales/SalesLeads.jsx
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
import IconComponent from "@/components/ui/Icon";

/** Simple debounce hook */
const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

/* ---------- Collapsible managers UI (hidden by default; no conditional rendering) ---------- */
const ManagersList = ({ managers = [] }) => {
  const [open, setOpen] = useState(false);

  // Always render the card; content toggles via classes only
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

      {/* Content: hidden by default; switches to visible when open */}
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

const SalesLeads = () => {
  const [leads, setLeads] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [myManagers, setMyManagers] = useState([]); // array of managers
  const [me, setMe] = useState(null); // current user profile (for selfId)

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
  const [selectedAssignee, setSelectedAssignee] = useState(null);

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

  const fetchMyManagers = useCallback(async () => {
    try {
      const res = await API.private.getMyManager(); // returns array
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
      // ignore; selfId will be null and reassignment will be disabled
    }
  }, []);

  // Initial loads
  useEffect(() => {
    fetchStatuses();
    fetchSources();
    fetchMyManagers();
    fetchProfile();
  }, [fetchStatuses, fetchSources, fetchMyManagers, fetchProfile]);

  useEffect(() => {
    fetchLeads({ page });
  }, [page, fetchLeads]);

  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1));
  }, [statusId, sourceId, orderBy, orderDir, debouncedSearch]);

  // === Handlers ===
  const handleEdit = (lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleSubmit = async ({ status_id, notes }) => {
    if (!editingLead) return;
    setLoading(true);
    try {
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

  // Table passes back the chosen manager
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
        {/* Heading + Managers */}
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
