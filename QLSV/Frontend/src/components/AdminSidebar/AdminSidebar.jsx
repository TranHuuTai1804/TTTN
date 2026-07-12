import React from "react";
import { useNavigate, Outlet, NavLink } from "react-router-dom";

function AdminSidebar() {
  const navigate = useNavigate();
const API_BASE = import.meta.env.VITE_API_URL || "";
  const roleName = String(localStorage.getItem("role") || "").trim().toUpperCase();
  const isTeacher = ["GIANGVIEN", "GIẢNGVIÊN", "GV"].includes(roleName);

  const onLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("roleCode");
    localStorage.removeItem("role");
    localStorage.removeItem("username");

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

  const navLinkStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    margin: '0 8px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s',
    color: '#ffffff',
    backgroundColor: isActive ? '#2563eb' : 'transparent',
    boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{ width: '200px', minWidth: '200px', display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0f172a' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
            <i className="fa-solid fa-check" style={{ fontSize: '12px', color: '#60a5fa' }}></i>
          </div>
          <span style={{ fontWeight: '600', fontSize: '14px', color: '#f97316' }}>CRT Encrypt</span>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, marginTop: '8px' }}>
          <NavLink to="/admin/dashboard" style={({ isActive }) => navLinkStyle(isActive)}>
            <i className="fa-solid fa-table-columns" style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#ffffff' }}></i>
            <span style={{ color: '#ffffff' }}>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/management-key" style={({ isActive }) => navLinkStyle(isActive)}>
            <i className="fa-solid fa-key" style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#ffffff' }}></i>
            <span style={{ color: '#ffffff' }}>Management key</span>
          </NavLink>
          <NavLink to="/admin/students" style={({ isActive }) => navLinkStyle(isActive)}>
            <i className="fa-solid fa-user" style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#ffffff' }}></i>
            <span style={{ color: '#ffffff' }}>Student Information</span>
          </NavLink>
          <NavLink to="/admin/grades" style={({ isActive }) => navLinkStyle(isActive)}>
            <i className="fa-solid fa-graduation-cap" style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#ffffff' }}></i>
            <span style={{ color: '#ffffff' }}>Manage Grades</span>
          </NavLink>
          {isTeacher && (
            <NavLink to="/admin/logs" style={({ isActive }) => navLinkStyle(isActive)}>
              <i className="fa-solid fa-file-lines" style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#ffffff' }}></i>
              <span style={{ color: '#ffffff' }}>Encryption Key</span>
            </NavLink>
          )}
        </nav>

        {/* Logout Button */}
        <div style={{ padding: '8px' }}>
          <button 
            onClick={onLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '8px', fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}
          >
            <i className="fa-solid fa-right-from-bracket" style={{ color: '#ffffff' }}></i>
            <span style={{ color: '#ffffff' }}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#1e293b' }}>
        {/* Top Bar - No logo, only logout */}
        <header style={{ height: '56px', flexShrink: 0, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={onLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: 'pointer' }}
            >
              Logout <i className="fa-solid fa-power-off" style={{ fontSize: '12px', color: '#ffffff' }}></i>
            </button>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #475569' }}>
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" 
                alt="avatar" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#334155' }}
              />
            </div>
          </div>
        </header>

        {/* Page Content - Scrollable */}
        <main style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminSidebar;
