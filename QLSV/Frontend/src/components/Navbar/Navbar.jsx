import React from "react";
import "./Navbar.css";
import Scur from "../../assets/icon/scurity.png";
import Avt from "../../assets/icon/user.png";
import { useNavigate, Outlet, NavLink } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
const API_BASE = import.meta.env.VITE_API_URL || "";

  const onLogout = async () => {
    try {
      // Gọi API backend để xóa cookie đăng nhập
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include", // quan trọng để gửi cookie
      });

      if (!res.ok) throw new Error("Logout failed");

      // Xóa localStorage (nếu có lưu thông tin user)
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Điều hướng về trang đăng nhập
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      alert("Không thể đăng xuất. Vui lòng thử lại.");
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <img src={Scur} alt="CRT Encrypt" className="sidebar__icon" />
          <span className="sidebar__name">CRT Encrypt</span>
        </div>
        <nav className="sidebar__nav">
          <NavLink to="/dashboard" className="sidebar__link">
            <i className="fa-solid fa-gauge"></i>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/academic" className="sidebar__link">
            <i className="fa-solid fa-graduation-cap"></i>
            <span>Academic</span>
          </NavLink>
          <NavLink to="/personal-info" className="sidebar__link">
            <i className="fa-solid fa-user"></i>
            <span>Personal Info</span>
          </NavLink>
          <NavLink to="/encryption-key" className="sidebar__link">
            <i className="fa-solid fa-key"></i>
            <span>My Encryption Key</span>
          </NavLink>
        </nav>
      </aside>

      <header className="topbar">
        <div className="topbar__right">
          <button className="topbar__logout" onClick={onLogout}>
            <i className="fa-solid fa-right-from-bracket"></i> Logout
          </button>
          <img src={Avt} alt="avatar" className="topbar__avatar" />
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export default Navbar;
