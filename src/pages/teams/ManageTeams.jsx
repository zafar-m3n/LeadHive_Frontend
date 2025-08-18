import React, { useEffect, useState } from "react";
import DefaultLayout from "@/layouts/DefaultLayout";
import API from "@/services/index";
import Notification from "@/components/ui/Notification";
import Pagination from "@/components/ui/Pagination";
import Table from "@/components/ui/Table";
import IconComponent from "@/components/ui/Icon";
import Heading from "@/components/ui/Heading";
import AccentButton from "@/components/ui/AccentButton";
import TeamFormModal from "./components/TeamFormModal";
import Modal from "@/components/ui/Modal";

const ManageTeams = () => {
  const [teams, setTeams] = useState([]);
  const [managers, setManagers] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Team Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  // Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);

  // ==========================
  // Fetch Functions
  // ==========================
  const fetchTeams = async (currentPage = page) => {
    try {
      const res = await API.private.getTeams(currentPage, limit);
      setTeams(res.data.data.teams || []);
      setTotalPages(res.data.data.pages);
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to fetch teams");
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await API.private.getManagers();
      setManagers(res.data.data.map((m) => ({ value: m.id, label: m.full_name })));
    } catch (err) {
      Notification.error("Failed to fetch managers");
    }
  };

  const fetchSalesReps = async () => {
    try {
      const res = await API.private.getUnassignedSalesReps();
      setSalesReps(res.data.data.map((s) => ({ value: s.id, label: s.full_name })));
    } catch (err) {
      Notification.error("Failed to fetch sales reps");
    }
  };

  useEffect(() => {
    fetchTeams(page);
  }, [page]);

  useEffect(() => {
    fetchManagers();
    fetchSalesReps();
  }, []);

  // ==========================
  // CRUD Handlers
  // ==========================
  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      if (editingTeam) {
        await API.private.updateTeam(editingTeam.id, data);
        Notification.success("Team updated successfully");
      } else {
        await API.private.createTeam(data);
        Notification.success("Team created successfully");
      }
      fetchTeams();
      setIsModalOpen(false);
      setEditingTeam(null);
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to save team");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (team) => {
    try {
      // Fetch full team data including members
      const res = await API.private.getTeamById(team.id);
      const teamData = res.data.data;

      setEditingTeam({
        id: teamData.id,
        name: teamData.name,
        manager_id: teamData.manager?.id || null,
        members: teamData.Users?.map((u) => u.id) || [],
      });
      setIsModalOpen(true);
    } catch (err) {
      Notification.error("Failed to fetch team details");
    }
  };

  const confirmDelete = (team) => {
    setTeamToDelete(team);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!teamToDelete) return;
    try {
      await API.private.deleteTeam(teamToDelete.id);
      Notification.success("Team deleted successfully");
      fetchTeams();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to delete team");
    } finally {
      setIsDeleteModalOpen(false);
      setTeamToDelete(null);
    }
  };

  // ==========================
  // Table Columns
  // ==========================
  const columns = [
    { key: "name", label: "Team Name" },
    { key: "manager", label: "Manager" },
    { key: "members", label: "Members" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <DefaultLayout>
      <div className="space-y-6">
        {/* Heading + Add Button */}
        <div className="flex justify-between items-center">
          <Heading>Manage Teams</Heading>
          <div className="w-fit">
            <AccentButton
              text="Add Team"
              onClick={() => {
                setEditingTeam(null);
                setIsModalOpen(true);
              }}
            />
          </div>
        </div>

        {/* Teams Table */}
        <Table
          columns={columns}
          data={teams}
          emptyMessage="No teams found."
          renderCell={(row, col) => {
            switch (col.key) {
              case "manager":
                return row.manager?.full_name || "-";
              case "members":
                return row.Users?.length || 0;
              case "actions":
                return (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(row)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                      title="Edit"
                    >
                      <IconComponent icon="mdi:pencil" width={20} className="text-gray-800" />
                    </button>
                    <button
                      onClick={() => confirmDelete(row)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                      title="Delete"
                    >
                      <IconComponent icon="mdi:delete" width={20} className="text-gray-800" />
                    </button>
                  </div>
                );
              default:
                return row[col.key] || "-";
            }
          }}
        />
        {totalPages >= 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} className="mt-4" />
        )}

        {/* Form Modal */}
        <TeamFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTeam(null);
          }}
          onSubmit={handleSubmit}
          editingTeam={editingTeam}
          managers={managers}
          salesReps={salesReps}
          loading={loading}
        />

        {/* Delete Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm Deletion"
          size="sm"
        >
          <p>
            Are you sure you want to delete <span className="font-semibold">{teamToDelete?.name}</span>?
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

export default ManageTeams;
