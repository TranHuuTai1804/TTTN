import React from "react";
import { useNavigate } from "react-router-dom";
import "./PageHeader.css";
import Scur from "../../assets/icon/scurity.png";
import Avt from "../../assets/icon/user.png";

const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Reusable PageHeader component
 * @param {Object} props
 * @param {boolean} props.showLogout - Show logout button (default: true)
 * @param {boolean} props.showAvatar - Show avatar (default: true)
 * @param {Array} props.navLinks - Optional navigation links [{label, to}]
 */
function PageHeader({ showLogout = true, showAvatar = true, navLinks = [] }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Logout failed");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("roleCode");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      alert("Không thể đăng xuất. Vui lòng thử lại.");
    }
  };

  return (
    <header className="page-header">
      <div className="page-header__brand">
        <img src={Scur} alt="CRT Encrypt" className="page-header__logo" />
        <span className="page-header__name">CRT Encrypt</span>
      </div>

      <div className="page-header__right">
        {navLinks.length > 0 && (
          <nav className="page-header__nav">
            {navLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.to}
                className="page-header__link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(link.to);
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {showAvatar && (
          <img src={Avt} alt="avatar" className="page-header__avatar" />
        )}

        {showLogout && (
          <button className="page-header__logout" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

export default PageHeader;
