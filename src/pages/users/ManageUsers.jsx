import React, { useEffect, useState } from "react";
import DefaultLayout from "@/layouts/DefaultLayout";
import API from "@/services/index";
import Notification from "@/components/ui/Notification";
import Pagination from "@/components/ui/Pagination";
import Table from "@/components/ui/Table";
import IconComponent from "@/components/ui/Icon";
import Heading from "@/components/ui/Heading";
import AccentButton from "@/components/ui/AccentButton";
import UserFormModal from "./components/UserFormModal";
import Modal from "@/components/ui/Modal";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // User Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = async (currentPage = page) => {
    try {
      const res = await API.private.getUsers({ params: { page: currentPage, limit } });
      setUsers(res.data.data.users || []);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to fetch users");
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await API.private.getRoles();
      setRoles(res.data.data.map((role) => ({ value: role.id, label: role.label })));
    } catch (err) {
      Notification.error("Failed to fetch roles");
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  useEffect(() => {
    fetchRoles();
  }, []);

  // ✅ Handle add/edit user form submission
  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      if (editingUser) {
        await API.private.updateUser(editingUser.id, data);
        Notification.success("User updated successfully");
      } else {
        await API.private.createUser(data);
        Notification.success("User created successfully");
      }
      fetchUsers();
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await API.private.deleteUser(userToDelete.id);
      Notification.success("User deleted successfully");
      fetchUsers();
    } catch (err) {
      Notification.error(err.response?.data?.error || "Failed to delete user");
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const columns = [
    { key: "full_name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "phone", label: "Phone" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <DefaultLayout>
      <div className="space-y-6">
        {/* Heading + Add Button */}
        <div className="flex justify-between items-center">
          <Heading>Manage Users</Heading>
          <div className="w-fit">
            <AccentButton
              text="Add User"
              onClick={() => {
                setEditingUser(null);
                setIsModalOpen(true);
              }}
            />
          </div>
        </div>

        {/* Users Table */}
        <Table
          columns={columns}
          data={users}
          emptyMessage="No users found."
          renderCell={(row, col) => {
            switch (col.key) {
              case "role":
                return row.Role?.label || "-";
              case "phone":
                return row.phone && row.phone.length > 4 ? row.phone : "N/A";
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

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} className="mt-4" />

        <UserFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          onSubmit={handleSubmit}
          editingUser={editingUser}
          roles={roles}
          loading={loading}
        />
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm Deletion"
          size="sm"
        >
          <p>
            Are you sure you want to delete <span className="font-semibold">{userToDelete?.full_name}</span>?
          </p>
          <div className="flex justify-end gap-3 mt-2">
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

export default ManageUsers;
