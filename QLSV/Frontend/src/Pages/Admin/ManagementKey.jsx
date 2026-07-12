import React, { useState, useEffect } from "react";
import Pagination from "../../components/Pagination/Pagination";

const API_BASE = import.meta.env.VITE_API_URL || "";
const ITEMS_PER_PAGE = 5;

function ManagementKey() {
  // Faculty Keys data
  const [facultyKeys, setFacultyKeys] = useState([
    {
      maKhoa: "CNTT", 
      tenKhoa: "Công nghệ thông tin",
      status: "Active"
    },
    {
      maKhoa: "DTVT", 
      tenKhoa: "Điện tử viễn thông",
      status: "Active"
    },
    { 
      maKhoa: "KTPM", 
      tenKhoa: "Kỹ thuật phần mềm",
      status: "Active", 
    },
    {
      maKhoa: "HTTT", 
      tenKhoa: "Hệ thống thông tin",
      status: "Expired"
    },
  ]);

  // Search & Filter
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editForm, setEditForm] = useState({ maKhoa: "", tenKhoa: "", status: "Active" });

  // Statistics
  const stats = {
    totalFaculty: facultyKeys.length,
    activeKeys: facultyKeys.filter(f => f.status === "Active").length,
    expiredKeys: facultyKeys.filter(f => f.status === "Expired").length,
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "active": return "text-green-400";
      case "expired": return "text-red-400";
      case "pending": return "text-yellow-400";
      default: return "text-slate-400";
    }
  };


  useEffect(() => {
  const loadFaculty = async () => {
    try {
      setLoading(true);
      setErr("");

      const r = await fetch(`${API_BASE}/faculty`, {
        credentials: "include",
      });

      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      const data = await r.json();

      setFacultyKeys(
        data.map((item) => ({
          ...item,
          status: "Active"
        }))
      );

    } catch (e) {
      setErr(e.message || "Failed to load faculty");
    } finally {
      setLoading(false);
    }
  };

  loadFaculty();
}, []);
  
  const handleVerify = () => {
    console.log("Verify key clicked");
  };

  const openAddModal = () => {
    setIsEdit(false);
    setEditForm({ maKhoa: "", tenKhoa: "", status: "Active" });
    setShowModal(true);
  };

  const openEditModal = (key) => {
    setIsEdit(true);
    setEditForm({ ...key });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEdit(false);
    setEditForm({ maKhoa: "", tenKhoa: "", status: "Active" });
  };

  const handleEditChange = async (field, value) => {
  // Cập nhật state trước
  setEditForm((prev) => ({ ...prev, [field]: value }));

  // Chỉ gọi API nếu đang edit (không phải thêm mới)
  if (isEdit) {
    try {
      const body = { ...editForm, [field]: value }; // dữ liệu mới
      const response = await fetch(`${API_BASE}/admin/fac/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          MaKhoa: editForm.maKhoa,  
          TenKhoa: editForm.tenKhoa
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Lỗi cập nhật khoa");
      else {
        console.log("Cập nhật thành công:", data.message);
      // Cập nhật state chính (facultyKeys) luôn
        setFacultyKeys((prev) =>
          prev.map((item) =>
            item.maKhoa === body.MaKhoa ? { ...item, [field]: value } : item
          )
        );
      }
      
    } catch (err) {
      console.error("Lỗi khi cập nhật:", err.message);
      alert(`Cập nhật thất bại: ${err.message}`);
    }
  }
};

  const handleSave = async () => {
  if (!editForm.maKhoa || !editForm.tenKhoa) {
    alert("Vui lòng điền đầy đủ thông tin.");
    return;
  }

  try {
    if (isEdit) {
      setFacultyKeys((prev) =>
        prev.map((item) =>
          item.maKhoa === editForm.maKhoa ? { ...editForm } : item
        )
      );
    } else {
      const res = await fetch(`${API_BASE}/admin/fac`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          MaKhoa: editForm.maKhoa,
          TenKhoa: editForm.tenKhoa,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      else {
        setFacultyKeys((prev) => [
        ...prev,
        {
          maKhoa: editForm.maKhoa,
          tenKhoa: editForm.tenKhoa,
          status: "Active",
        },
      ]);
        alert("Thêm khoa thành công");
      }
      
    }

    closeModal();
  } catch (e) {
    alert(e.message);
  }
};

  const handleDelete = async (maKhoa) => {
  const ok = window.confirm(`Bạn có chắc muốn xóa khoa "${maKhoa}" không?`);
  if (!ok) return;

  try {
    const res = await fetch(`${API_BASE}/admin/fac/delete`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        MaKhoa: maKhoa,
      }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    setFacultyKeys((prev) =>
      prev.filter((item) => item.maKhoa !== maKhoa)
    );

    alert(data.message || "Xóa khoa thành công");
  } catch (e) {
    alert(e.message || "Xóa thất bại");
  }
};

  // Filter function
  const filteredData = facultyKeys.filter(item => {
    const matchSearch = 
      item.maKhoa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tenKhoa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <div className="text-slate-200 space-y-6">
      {/* Card 1: Page Header */}
      <div className="bg-[#0f172a]/60 rounded-[16px] p-6 shadow-lg shadow-black/10 border border-white/10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-key text-white text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Quản lý Khóa mã hóa CRT</h1>
            <p className="text-slate-400 text-sm mt-1">Quản lý và giám sát các khóa mã hóa Chinese Remainder Theorem theo từng Khoa</p>
          </div>
        </div>
      </div>

      {/* Card 2: Statistics */}
      <div className="bg-[#0f172a]/60 rounded-[16px] p-6 shadow-lg shadow-black/10 border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-4">Thống kê tổng quan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <i className="fa-solid fa-building-columns text-blue-400 text-lg"></i>
            </div>
            <div>
              <span className="text-3xl font-bold text-white">{stats.totalFaculty}</span>
              <p className="text-slate-400 text-sm">Tổng số Khoa</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <i className="fa-solid fa-check-circle text-green-400 text-lg"></i>
            </div>
            <div>
              <span className="text-3xl font-bold text-white">{stats.activeKeys}</span>
              <p className="text-slate-400 text-sm">Khóa hoạt động</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
              <i className="fa-solid fa-triangle-exclamation text-red-400 text-lg"></i>
            </div>
            <div>
              <span className="text-3xl font-bold text-white">{stats.expiredKeys}</span>
              <p className="text-slate-400 text-sm">Khóa hết hạn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Faculty Keys Table */}
      <div className="bg-[#0f172a]/60 rounded-[16px] p-6 shadow-lg shadow-black/10 border border-white/10">
        <h2 className="text-xl font-semibold text-blue-400" style={{ marginBottom: 16 }}>Danh sách Khóa theo Khoa</h2>

        {/* Search & Filter */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(30,41,59,0.7)", borderRadius: 12, flex: 1, maxWidth: 320, border: "1px solid rgba(255,255,255,0.07)" }}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: "#64748b", fontSize: 13 }}></i>
            <input
              type="text"
              placeholder="Tìm kiếm theo mã hoặc tên khoa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontSize: 13, width: "100%" }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "10px 14px", background: "rgba(30,41,59,0.7)", borderRadius: 12, color: "#e2e8f0", fontSize: 13, border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", outline: "none" }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
          <button
            onClick={openAddModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 16px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <i className="fa-solid fa-plus"></i>
            Thêm Khoa
          </button>
          <span style={{ marginLeft: "auto", color: "#60a5fa", fontSize: 13, fontWeight: 600 }}>{filteredData.length} khoa</span>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.6)" }}>
                <th style={thStyle}>STT</th>
                <th style={thStyle}>Mã Khoa</th>
                <th style={thStyle}>Tên Khoa</th>
                <th style={thStyle}>Trạng thái</th>
                <th style={thStyle}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((key, index) => (
                <tr key={key.maKhoa} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={tdStyle}>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: "#f1f5f9" }}>{key.maKhoa}</td>
                  <td style={{ ...tdStyle, color: "#cbd5e1" }}>{key.tenKhoa}</td>
                  <td style={tdStyle}>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      background: key.status === "Active" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      color: key.status === "Active" ? "#4ade80" : "#f87171",
                    }}>
                      {key.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => openEditModal(key)}
                        style={{
                          padding: "5px 14px",
                          borderRadius: 8,
                          background: "rgba(59,130,246,0.15)",
                          color: "#60a5fa",
                          border: "1px solid rgba(59,130,246,0.3)",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Cập nhật
                      </button>
                      <button
                        onClick={() => handleDelete(key.maKhoa)}
                        style={{
                          padding: "5px 14px",
                          borderRadius: 8,
                          background: "rgba(239,68,68,0.15)",
                          color: "#f87171",
                          border: "1px solid rgba(239,68,68,0.3)",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#64748b" }}>
            <i className="fa-solid fa-inbox" style={{ fontSize: 36, display: "block", marginBottom: 10 }}></i>
            <p style={{ fontSize: 14 }}>Không tìm thấy dữ liệu phù hợp</p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredData.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
      {/* Edit Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              width: 480,
              maxWidth: "94%",
              background: "#111827",
              borderRadius: 18,
              padding: "28px 32px",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            }}
          >
            <h3 style={{ marginBottom: 6, fontSize: 18, fontWeight: 700 }}>
              {isEdit ? "Chỉnh sửa thông tin Khoa" : "Thêm Khoa mới"}
            </h3>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 16 }}>
              {isEdit ? "Cập nhật thông tin cho khoa" : "Nhập thông tin để thêm khoa mới"}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, display: "block", fontWeight: 500 }}>Mã Khoa</label>
                <input
                  placeholder="VD: CNTT"
                  value={editForm.maKhoa}
                  disabled={isEdit}
                  onChange={(e) => handleEditChange("maKhoa", e.target.value)}
                  style={{ ...inputStyle, width: "100%", ...(isEdit ? { opacity: 0.5, cursor: "not-allowed" } : {}) }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, display: "block", fontWeight: 500 }}>Tên Khoa</label>
                <input
                  placeholder="VD: Công nghệ thông tin"
                  value={editForm.tenKhoa}
                  onChange={(e) => handleEditChange("tenKhoa", e.target.value)}
                  style={{ ...inputStyle, width: "100%" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, display: "block", fontWeight: 500 }}>Trạng thái</label>
                <select
                  value={editForm.status}
                  onChange={(e) => handleEditChange("status", e.target.value)}
                  style={{ ...inputStyle, width: "100%" }}
                >
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>

            <div
              style={{
                marginTop: 28,
                paddingTop: 18,
                borderTop: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  padding: "9px 20px",
                  borderRadius: 9,
                  background: "rgba(55,65,81,0.8)",
                  color: "#cbd5e1",
                  border: "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: "9px 20px",
                  borderRadius: 9,
                  background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {isEdit ? "Lưu thay đổi" : "Thêm Khoa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "12px 20px",
  fontSize: 11,
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "13px 20px",
  color: "#e2e8f0",
  verticalAlign: "middle",
};

const inputStyle = {
  padding: "10px 14px",
  borderRadius: 9,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#0f172a",
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
  fontSize: 13,
};

export default ManagementKey;
