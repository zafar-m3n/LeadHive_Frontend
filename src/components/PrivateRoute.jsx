import React from "react";
import { Navigate } from "react-router-dom";
import token from "@/lib/utilities";

const PrivateRoute = ({ children }) => {
  if (!token.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default PrivateRoute;
