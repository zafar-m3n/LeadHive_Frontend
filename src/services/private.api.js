import instance from "@/lib/axios";

/* ========================== */
/* Auth Functions             */
/* ========================== */

const registerUser = async (data) => {
  // { full_name, email, password, role_id, phone?, avatar_url? }
  return await instance.apiClient.post("/api/v1/auth/register", data, {
    headers: instance.publicHeaders(),
  });
};

const loginUser = async (data) => {
  // { email, password }
  return await instance.apiClient.post("/api/v1/auth/login", data, {
    headers: instance.publicHeaders(),
  });
};

const getProfile = async () => {
  return await instance.apiClient.get("/api/v1/auth/profile", {
    headers: instance.defaultHeaders(),
  });
};

const updatePassword = async (data) => {
  // { current_password, new_password }
  return await instance.apiClient.patch("/api/v1/auth/password/update", data, {
    headers: instance.defaultHeaders(),
  });
};

/* ========================== */
/* User Functions (Admin only)*/
/* ========================== */

const createUser = async (data) => {
  // { full_name, email, password, role_id, phone?, avatar_url? }
  return await instance.apiClient.post("/api/v1/users", data, {
    headers: instance.defaultHeaders(),
  });
};

const getUsers = async () => {
  return await instance.apiClient.get("/api/v1/users", {
    headers: instance.defaultHeaders(),
  });
};

const getUserById = async (id) => {
  return await instance.apiClient.get(`/api/v1/users/${id}`, {
    headers: instance.defaultHeaders(),
  });
};

const updateUser = async (id, data) => {
  // { full_name?, email?, phone?, avatar_url?, role_id?, is_active? }
  return await instance.apiClient.put(`/api/v1/users/${id}`, data, {
    headers: instance.defaultHeaders(),
  });
};

const deleteUser = async (id) => {
  // Soft delete (set is_active = false)
  return await instance.apiClient.delete(`/api/v1/users/${id}`, {
    headers: instance.defaultHeaders(),
  });
};

/* ========================== */
/* Supporting Data Functions  */
/* ========================== */

const getRoles = async () => {
  return await instance.apiClient.get("/api/v1/supports/roles", {
    headers: instance.defaultHeaders(),
  });
};

const getLeadStatuses = async () => {
  return await instance.apiClient.get("/api/v1/supports/leads/statuses", {
    headers: instance.defaultHeaders(),
  });
};

const getLeadSources = async () => {
  return await instance.apiClient.get("/api/v1/supports/leads/sources", {
    headers: instance.defaultHeaders(),
  });
};

const getManagers = async () => {
  return await instance.apiClient.get("/api/v1/supports/users/managers", {
    headers: instance.defaultHeaders(),
  });
};

const getTeamMembers = async (teamId) => {
  return await instance.apiClient.get(`/api/v1/supports/teams/${teamId}/members`, {
    headers: instance.defaultHeaders(),
  });
};

const getUnassignedSalesReps = async () => {
  return await instance.apiClient.get("/api/v1/supports/users/sales/unassigned", {
    headers: instance.defaultHeaders(),
  });
};

/* ========================== */
/* Team Functions             */
/* ========================== */

const createTeam = async (data) => {
  // { name, manager_id, members?: [user_ids] }
  return await instance.apiClient.post("/api/v1/teams", data, {
    headers: instance.defaultHeaders(),
  });
};

const getTeams = async (page = 1, limit = 10) => {
  return await instance.apiClient.get(`/api/v1/teams?page=${page}&limit=${limit}`, {
    headers: instance.defaultHeaders(),
  });
};

const getTeamById = async (id) => {
  return await instance.apiClient.get(`/api/v1/teams/${id}`, {
    headers: instance.defaultHeaders(),
  });
};

const updateTeam = async (id, data) => {
  // { name?, manager_id?, members?: [user_ids] }
  return await instance.apiClient.put(`/api/v1/teams/${id}`, data, {
    headers: instance.defaultHeaders(),
  });
};

const deleteTeam = async (id) => {
  return await instance.apiClient.delete(`/api/v1/teams/${id}`, {
    headers: instance.defaultHeaders(),
  });
};

const addMemberToTeam = async (id, data) => {
  // data: { user_id }
  return await instance.apiClient.post(`/api/v1/teams/${id}/members`, data, {
    headers: instance.defaultHeaders(),
  });
};

const removeMemberFromTeam = async (id, userId) => {
  return await instance.apiClient.delete(`/api/v1/teams/${id}/members/${userId}`, {
    headers: instance.defaultHeaders(),
  });
};

/* ========================== */
/* Export API                 */
/* ========================== */

const privateAPI = {
  // Auth
  registerUser,
  loginUser,
  getProfile,
  updatePassword,

  // Users (admin only)
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,

  // Supporting Data
  getRoles,
  getLeadStatuses,
  getLeadSources,
  getManagers,
  getTeamMembers,
  getUnassignedSalesReps,

  // Teams
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addMemberToTeam,
  removeMemberFromTeam,
};

export default privateAPI;
