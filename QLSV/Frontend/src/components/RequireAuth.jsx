import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function RequireAuth({ allowedRoleCodes = [] }) {
  const username = localStorage.getItem("username");
  const roleCode = Number(localStorage.getItem("roleCode"));
  const loc = useLocation();
  if (!username || !Number.isInteger(roleCode)) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  if (allowedRoleCodes.length > 0 && !allowedRoleCodes.includes(roleCode)) {
    return <Navigate to={roleCode === 1 ? "/admin/dashboard" : "/student/dashboard"} replace />;
  }
  return <Outlet />;
}

export function RedirectIfAuthed() {
  const username = localStorage.getItem("username");
  const roleCode = Number(localStorage.getItem("roleCode"));
  if (username && Number.isInteger(roleCode)) {
    return <Navigate to={roleCode === 1 ? "/admin/dashboard" : "/student/dashboard"} replace />;
  }
  return <Outlet />;
}
