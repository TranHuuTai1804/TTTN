import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const clearAuthState = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("roleCode");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
};

export default function RequireAuth({ allowedRoleCodes = [] }) {
  const loc = useLocation();
  const [sessionState, setSessionState] = useState("checking");
  const [roleCode, setRoleCode] = useState(null);

  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/auth/session`, {
          credentials: "include",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.authenticated) throw new Error("SESSION_EXPIRED");

        const verifiedRoleCode = Number(data.roleCode);
        localStorage.setItem("username", data.username || "");
        localStorage.setItem("roleCode", String(verifiedRoleCode));
        if (data.role) localStorage.setItem("role", data.role);

        if (active) {
          setRoleCode(verifiedRoleCode);
          setSessionState("authenticated");
        }
      } catch {
        clearAuthState();
        if (active) setSessionState("unauthenticated");
      }
    };

    verifySession();
    return () => {
      active = false;
    };
  }, [loc.pathname]);

  if (sessionState === "checking") {
    return <div style={{ padding: "24px" }}>Đang kiểm tra phiên đăng nhập...</div>;
  }
  if (sessionState === "unauthenticated") {
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
