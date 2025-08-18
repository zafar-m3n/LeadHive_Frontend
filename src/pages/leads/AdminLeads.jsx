import React, { useEffect, useState } from "react";
import DefaultLayout from "@/layouts/DefaultLayout";
import API from "@/services/index";
import Notification from "@/components/ui/Notification";
import Pagination from "@/components/ui/Pagination";
import IconComponent from "@/components/ui/Icon";
import Heading from "@/components/ui/Heading";
import AccentButton from "@/components/ui/AccentButton";
import LeadFormModal from "./components/LeadFormModal";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";

const AdminLeads = () => {
  const [leads, setLeads] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Lead Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  // Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

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

  // ---- Badge color maps ----
  const getStatusColor = (statusValue = "") => {
    const v = String(statusValue).toLowerCase();

    const map = {
      new: "blue",
      call_back: "yellow",
      follow_up: "indigo",
      language_barrier: "purple",
      no_answer: "orange",
      not_interested: "red",
      wrong_number: "pink",
      user_busy: "teal",
      not_reachable: "gray",
    };

    return map[v] || "gray";
  };

  const getSourceColor = (sourceValue = "") => {
    const v = String(sourceValue).toLowerCase();

    const map = {
      facebook: "blue",
      google: "red",
      outsource: "green",
    };

    return map[v] || "gray";
  };

  const fetchLeads = async (currentPage = page) => {
    try {
      const res = await API.private.getLeads({ page: currentPage, limit });
      if (res.data?.code === "OK") {
        setLeads(res.data.data.leads || []);
        setTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to fetch leads");
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await API.private.getLeadStatuses();
      if (res.data?.code === "OK") {
        setStatuses(res.data.data.map((s) => ({ value: s.id, label: s.label })));
      }
    } catch {
      Notification.error("Failed to fetch lead statuses");
    }
  };

  const fetchSources = async () => {
    try {
      const res = await API.private.getLeadSources();
      if (res.data?.code === "OK") {
        setSources(res.data.data.map((s) => ({ value: s.id, label: s.label })));
      }
    } catch {
      Notification.error("Failed to fetch lead sources");
    }
  };

  useEffect(() => {
    fetchLeads(page);
  }, [page]);

  useEffect(() => {
    fetchStatuses();
    fetchSources();
  }, []);

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
      fetchLeads();
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
      fetchLeads();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to delete lead");
    } finally {
      setIsDeleteModalOpen(false);
      setLeadToDelete(null);
    }
  };

  return (
    <DefaultLayout>
      <div className="space-y-6">
        {/* Heading + Add Button */}
        <div className="flex justify-between items-center">
          <Heading>Admin Leads</Heading>
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

        {/* Responsive Custom Table */}
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

                      <td className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">
                        {formatValue(row.value_decimal)}
                      </td>

                      <td className="px-3 py-2">
                        <div className="truncate">{assignee}</div>
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(row)}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                            title="Edit"
                          >
                            <IconComponent icon="mdi:pencil" width={18} className="text-gray-800" />
                          </button>
                          <button
                            onClick={() => confirmDelete(row)}
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

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} className="mt-4" />

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

        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm Deletion"
          size="sm"
        >
          <p>
            Are you sure you want to delete lead{" "}
            <span className="font-semibold">{leadToDelete?.email || leadToDelete?.company}</span>?
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="text-sm px-4 py-1.5 rounded bg-gray-300">
              Cancel
            </button>
            <button onClick={handleDelete} className="text-sm px-4 py-1.5 rounded bg-red-500 text-white">
              Delete
            </button>
          </div>
        </Modal>
      </div>
    </DefaultLayout>
  );
};

export default AdminLeads;
