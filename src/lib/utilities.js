const getAuthToken = () => {
  return localStorage.getItem("leadhive.token");
};

const setAuthToken = (authToken) => {
  localStorage.setItem("leadhive.token", authToken);
};

const removeAuthToken = () => {
  localStorage.removeItem("leadhive.token");
};

const getUserData = () => {
  const userData = localStorage.getItem("leadhive.user");
  if (userData) {
    return JSON.parse(userData);
  }
  return null;
};

const setUserData = (userData) => {
  localStorage.setItem("leadhive.user", JSON.stringify(userData));
};

const removeUserData = () => {
  localStorage.removeItem("leadhive.user");
};

const isAuthenticated = () => {
  return !!getAuthToken();
};

const token = {
  getAuthToken,
  setAuthToken,
  removeAuthToken,

  getUserData,
  setUserData,
  removeUserData,

  isAuthenticated,
};

export default token;
