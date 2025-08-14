import React from "react";
import { Navigate } from "react-router-dom";
import authService from "./authService";

function PrivateRoute({ children }) {
  if (!authService.isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default PrivateRoute;
