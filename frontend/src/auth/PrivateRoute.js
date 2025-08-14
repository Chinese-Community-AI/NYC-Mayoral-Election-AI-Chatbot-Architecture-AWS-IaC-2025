import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import authService from "./authService";

function PrivateRoute() {
  const isAuthenticated = authService.isLoggedIn();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default PrivateRoute;
