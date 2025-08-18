import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import RegisterPage from "@/pages/auth/RegisterPage";
import LoginPage from "@/pages/auth/LoginPage";

import SalesDashboard from "@/pages/dashboard/SalesDashboard";
import AdminDashboard from "@/pages/dashboard/AdminDashboard";
import ManagerDashboard from "@/pages/dashboard/ManagerDashboard";
import NotFound from "@/pages/NotFound";

import PrivateRoute from "@/components/PrivateRoute";
import PublicRoute from "@/components/PublicRoute";
import token from "@/lib/utilities";

function App() {
  const protectedRoutes = [
    { path: "/dashboard", element: SalesDashboard },
    { path: "/admin/dashboard", element: AdminDashboard },
    { path: "/manager/dashboard", element: ManagerDashboard },
  ];

  const publicRoutes = [
    { path: "/register", element: RegisterPage },
    { path: "/login", element: LoginPage },
  ];

  const getDashboardRedirect = () => {
    if (!token.isAuthenticated()) return "/login";

    const user = token.getUserData();
    const role = user?.role?.value;

    if (role === "admin") return "/admin/dashboard";
    if (role === "manager") return "/manager/dashboard";
    return "/dashboard"; // default for sales_rep or fallback
  };

  return (
    <>
      <Router>
        <Routes>
          {/* Root redirect by role */}
          <Route path="/" element={<Navigate to={getDashboardRedirect()} replace />} />

          {/* Protected routes */}
          {protectedRoutes.map((route, idx) => (
            <Route
              key={idx}
              path={route.path}
              element={
                <PrivateRoute>
                  <route.element />
                </PrivateRoute>
              }
            />
          ))}

          {/* Public routes */}
          {publicRoutes.map((route, idx) => (
            <Route
              key={idx}
              path={route.path}
              element={
                <PublicRoute>
                  <route.element />
                </PublicRoute>
              }
            />
          ))}

          {/* Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>

      {/* Toasts */}
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={true}
        closeOnClick={true}
        draggable={false}
        pauseOnHover={true}
        theme="light"
      />
    </>
  );
}

export default App;
