import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Avt from "../../assets/icon/user.png";

function StudentSidebar() {
  const navigate = useNavigate();
const API_BASE = import.meta.env.VITE_API_URL || "";

  const onLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const linkStyle = ({ isActive }) => ({
    display: "block",
    marginBottom: "12px",
    color: "white",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: "8px",
    background: isActive ? "#2563eb" : "transparent",
    fontWeight: 500,
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <div
        style={{
          width: "220px",
          background: "#0b1a33",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3 style={{ color: "white", marginBottom: "20px" }}>CRT Encrypt</h3>

        <nav>
          <NavLink to="dashboard" style={linkStyle}>
            Dashboard
          </NavLink>

          <NavLink to="academic" style={linkStyle}>
            Academic
          </NavLink>

          <NavLink to="personal-info" style={linkStyle}>
            Personal Info
          </NavLink>

          <NavLink to="encryption-key" style={linkStyle}>
            My encryption key
          </NavLink>
        </nav>

        <div style={{ marginTop: "auto", paddingTop: "20px" }}>
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 12px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            Logout
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          style={{
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 24px",
            background: "white",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              onClick={onLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Logout <i className="fa-solid fa-power-off" style={{ fontSize: "12px" }}></i>
            </button>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #cbd5e1",
                backgroundColor: "#f1f5f9",
              }}
            >
              <img
                src={Avt}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentSidebar;
