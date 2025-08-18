import React from "react";
import { Navigate } from "react-router-dom";
import token from "@/lib/utilities";

const PrivateRoute = ({ children, allowedRoles }) => {
  if (!token.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = token.getUserData();
  const role = user?.role?.value;

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect user back to their dashboard
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role === "manager") return <Navigate to="/manager/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;
