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

const getUsers = async (params = {}) => {
  return await instance.apiClient.get("/api/v1/users", {
    headers: instance.defaultHeaders(),
    params, // <-- forward page/limit
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
const getUnassignedManagers = async () => {
  return await instance.apiClient.get("/api/v1/supports/users/managers/unassigned", {
    headers: instance.defaultHeaders(),
  });
};

const getManagersAndAdmins = async () => {
  return await instance.apiClient.get("/api/v1/supports/users/managers-admins", {
    headers: instance.defaultHeaders(),
  });
};

const getAssignableUsersForManager = async () => {
  return await instance.apiClient.get("/api/v1/supports/users/assignable", {
    headers: instance.defaultHeaders(),
  });
};

// Supporting Data Functions (add this)
const getMyManager = async () => {
  return await instance.apiClient.get("/api/v1/supports/users/manager", {
    headers: instance.defaultHeaders(),
  });
};

const getAssignees = async () => {
  return await instance.apiClient.get("/api/v1/supports/users/assignees", {
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
/* Lead Functions             */
/* ========================== */

const createLead = async (data) => {
  // { first_name?, last_name?, company?, email?, phone?, country?, status_id, source_id?, value_decimal?, notes? }
  return await instance.apiClient.post("/api/v1/leads", data, {
    headers: instance.defaultHeaders(),
  });
};

const getLeads = async (params = {}) => {
  // params: { status_id?, source_id?, orderBy?, orderDir?, search?, page?, limit? }
  return await instance.apiClient.get("/api/v1/leads", {
    headers: instance.defaultHeaders(),
    params,
  });
};

const getLeadById = async (id) => {
  return await instance.apiClient.get(`/api/v1/leads/${id}`, {
    headers: instance.defaultHeaders(),
  });
};

const updateLead = async (id, data) => {
  // { first_name?, last_name?, company?, email?, phone?, country?, status_id?, source_id?, value_decimal?, notes? }
  return await instance.apiClient.put(`/api/v1/leads/${id}`, data, {
    headers: instance.defaultHeaders(),
  });
};

const deleteLead = async (id) => {
  return await instance.apiClient.delete(`/api/v1/leads/${id}`, {
    headers: instance.defaultHeaders(),
  });
};

const assignLead = async (id, data) => {
  // { assignee_id }
  return await instance.apiClient.post(`/api/v1/leads/${id}/assign`, data, {
    headers: instance.defaultHeaders(),
  });
};

const getLeadAssignments = async (id) => {
  return await instance.apiClient.get(`/api/v1/leads/${id}/assignments`, {
    headers: instance.defaultHeaders(),
  });
};

/* ========================== */
/* Lead Upload Functions      */
/* ========================== */

const getLeadTemplateSchema = async () => {
  return await instance.apiClient.get("/api/v1/leads/upload/template", {
    headers: instance.defaultHeaders(),
  });
};

const importLeads = async (data) => {
  // { leads: [ { first_name, last_name, company, email, phone, country, status, source, value_decimal, notes } ] }
  return await instance.apiClient.post("/api/v1/leads/upload/import", data, {
    headers: instance.defaultHeaders(),
  });
};

/* ========================== */
/* Dashboard Functions        */
/* ========================== */

const getAdminDashboardSummary = async (params = {}) => {
  // params: { recentLimit?: number }
  return await instance.apiClient.get("/api/v1/dashboard/summary/admin", {
    headers: instance.defaultHeaders(),
    params,
  });
};

const getManagerDashboardSummary = async (params = {}) => {
  // params: { recentLimit?: number }
  return await instance.apiClient.get("/api/v1/dashboard/summary/manager", {
    headers: instance.defaultHeaders(),
    params,
  });
};

const getSalesRepDashboardSummary = async (params = {}) => {
  // params: { recentLimit?: number }
  return await instance.apiClient.get("/api/v1/dashboard/summary/sales_rep", {
    headers: instance.defaultHeaders(),
    params,
  });
};

const getMyDashboardAssignments = async () => {
  return await instance.apiClient.get("/api/v1/dashboard/assignments", {
    headers: instance.defaultHeaders(),
  });
};

// Manager: get own team (with members)
const getMyTeam = async () => {
  return await instance.apiClient.get("/api/v1/teams/my", {
    headers: instance.defaultHeaders(),
  });
};

// Manager: remove a member from own team
const removeMemberFromMyTeam = async (userId) => {
  return await instance.apiClient.delete(`/api/v1/teams/my/members/${userId}`, {
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
  getUnassignedManagers,
  getManagersAndAdmins,
  getAssignableUsersForManager,
  getMyManager,
  getAssignees,

  // Teams
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addMemberToTeam,
  removeMemberFromTeam,

  // Leads
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
  getLeadAssignments,

  // Leads Upload
  getLeadTemplateSchema,
  importLeads,

  // Dashboard
  getAdminDashboardSummary,
  getManagerDashboardSummary,
  getSalesRepDashboardSummary,
  getMyDashboardAssignments,

  // Manager specific
  getMyTeam,
  removeMemberFromMyTeam,
};

export default privateAPI;
