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

        {/* Leads Table */}
        <LeadsTable leads={leads} onEdit={handleEdit} onDelete={confirmDelete} />

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
