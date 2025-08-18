import instance from "@/lib/axios";

/* ========================== */
/* User: Auth Functions       */
/* ========================== */

const registerUser = async (data) => {
  return await instance.apiClient.post("/api/v1/auth/register", data, {
    headers: instance.publicHeaders(),
  });
};

const loginUser = async (data) => {
  return await instance.apiClient.post("/api/v1/auth/login", data, {
    headers: instance.publicHeaders(),
  });
};

/* ========================== */
/* Product Functions          */
/* ========================== */

const fetchAllProducts = async (page = 1, limit = 10, search = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search.trim() !== "") {
    params.append("search", search.trim());
  }

  return await instance.apiClient.get(`/api/v1/products?${params.toString()}`, {
    headers: instance.defaultHeaders(),
  });
};

const fetchProductDetails = async (id) => {
  return await instance.apiClient.get(`/api/v1/products/${id}`, {
    headers: instance.defaultHeaders(),
  });
};

const uploadProductsExcel = async (formData) => {
  return await instance.apiClient.post("/api/v1/products/upload", formData, {
    headers: {
      ...instance.defaultHeaders("multipart/form-data"),
    },
  });
};

/* ========================== */
/* Category Functions         */
/* ========================== */

const fetchAllCategories = async () => {
  return await instance.apiClient.get("/api/v1/categories", {
    headers: instance.defaultHeaders(),
  });
};

const createCategory = async (data) => {
  return await instance.apiClient.post("/api/v1/categories", data, {
    headers: instance.defaultHeaders(),
  });
};

const updateCategory = async (id, data) => {
  return await instance.apiClient.put(`/api/v1/categories/${id}`, data, {
    headers: instance.defaultHeaders(),
  });
};

const deleteCategory = async (id) => {
  return await instance.apiClient.delete(`/api/v1/categories/${id}`, {
    headers: instance.defaultHeaders(),
  });
};

/* ========================== */
/* Warehouse Functions        */
/* ========================== */

const fetchAllWarehouses = async () => {
  return await instance.apiClient.get("/api/v1/warehouses", {
    headers: instance.defaultHeaders(),
  });
};

const createWarehouse = async (data) => {
  return await instance.apiClient.post("/api/v1/warehouses", data, {
    headers: instance.defaultHeaders(),
  });
};

const updateWarehouse = async (id, data) => {
  return await instance.apiClient.put(`/api/v1/warehouses/${id}`, data, {
    headers: instance.defaultHeaders(),
  });
};

const deleteWarehouse = async (id) => {
  return await instance.apiClient.delete(`/api/v1/warehouses/${id}`, {
    headers: instance.defaultHeaders(),
  });
};

/* ========================== */
/* Report & Dashboard         */
/* ========================== */

const getDashboardStats = async () => {
  return await instance.apiClient.get("/api/v1/reports/dashboard", {
    headers: instance.defaultHeaders(),
  });
};

const getLowStockReport = async () => {
  return await instance.apiClient.get("/api/v1/reports/low-stock", {
    headers: instance.defaultHeaders(),
  });
};

const getStockByWarehouseReport = async () => {
  return await instance.apiClient.get("/api/v1/reports/stock-by-warehouse", {
    headers: instance.defaultHeaders(),
  });
};

const getOutOfStockReport = async () => {
  return await instance.apiClient.get("/api/v1/reports/out-of-stock", {
    headers: instance.defaultHeaders(),
  });
};

const downloadReportPDF = async (type) => {
  return await instance.apiClient.get(`/api/v1/reports/pdf/${type}`, {
    headers: instance.defaultHeaders(),
    responseType: "blob",
  });
};

/* ========================== */
/* Export API                 */
/* ========================== */

const privateAPI = {
  // Auth
  registerUser,
  loginUser,

  // Products
  fetchAllProducts,
  fetchProductDetails,
  uploadProductsExcel,

  // Categories
  fetchAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,

  // Warehouses
  fetchAllWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,

  // Reports
  getDashboardStats,
  getLowStockReport,
  getStockByWarehouseReport,
  getOutOfStockReport,
  downloadReportPDF,
};

export default privateAPI;
