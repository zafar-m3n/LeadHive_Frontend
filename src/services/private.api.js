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
/* Export API                 */
/* ========================== */

const privateAPI = {
  // Auth
  registerUser,
  loginUser,
  getProfile,
  updatePassword,
};

export default privateAPI;
