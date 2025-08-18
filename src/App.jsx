import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import RegisterPage from "@/pages/auth/RegisterPage";
import LoginPage from "@/pages/auth/LoginPage";

import DashboardPage from "@/pages/dashboard";

import PrivateRoute from "@/components/PrivateRoute";
import PublicRoute from "@/components/PublicRoute";
import token from "@/lib/utilities";

function App() {
  const protectedRoutes = [{ path: "/dashboard", element: DashboardPage }];

  const publicRoutes = [
    { path: "/register", element: RegisterPage },
    { path: "/login", element: LoginPage },
  ];

  return (
    <>
      <Router>
        <Routes>
          <Route
            path="/"
            element={token.isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
          />

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
        </Routes>
      </Router>

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
