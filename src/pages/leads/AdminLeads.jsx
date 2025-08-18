import React, { useEffect, useState } from "react";
import DefaultLayout from "@/layouts/DefaultLayout";
import API from "@/services/index";
import Notification from "@/components/ui/Notification";
import Pagination from "@/components/ui/Pagination";
import Heading from "@/components/ui/Heading";
import AccentButton from "@/components/ui/AccentButton";
import LeadFormModal from "./components/LeadFormModal";
import Modal from "@/components/ui/Modal";
import LeadsTable from "./components/LeadsTable";

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

  // Assign Lead Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [managers, setManagers] = useState([]);

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

  const fetchManagersAndAdmins = async () => {
    try {
      const res = await API.private.getManagersAndAdmins();
      if (res.data?.code === "OK") {
        setManagers(res.data.data || []);
      }
    } catch {
      Notification.error("Failed to fetch managers");
    }
  };

  useEffect(() => {
    fetchLeads(page);
  }, [page]);

  useEffect(() => {
    fetchStatuses();
    fetchSources();
    fetchManagersAndAdmins();
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
      fetchLeads();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to assign lead");
    } finally {
      setIsAssignModalOpen(false);
      setLeadToAssign(null);
      setSelectedAssignee(null);
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

        {/* Leads Table */}
        <LeadsTable
          leads={leads}
          onEdit={handleEdit}
          onDelete={confirmDelete}
          managers={managers}
          onAssignOptionClick={handleAssignOptionClick}
        />

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

        {/* Delete Confirmation Modal */}
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

        {/* Assign Confirmation Modal */}
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title="Confirm Assignment"
          size="sm"
        >
          <p>
            Assign lead <span className="font-semibold">{leadToAssign?.email || leadToAssign?.company}</span> to{" "}
            <span className="font-semibold">
              {selectedAssignee?.full_name} ({selectedAssignee?.email})
            </span>
            ?
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setIsAssignModalOpen(false)} className="text-sm px-4 py-1.5 rounded bg-gray-300">
              Cancel
            </button>
            <button onClick={handleAssign} className="text-sm px-4 py-1.5 rounded bg-indigo-600 text-white">
              Yes, Assign
            </button>
          </div>
        </Modal>
      </div>
    </DefaultLayout>
  );
};

export default AdminLeads;
