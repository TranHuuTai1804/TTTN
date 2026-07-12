import React, { useMemo, useState, useEffect } from "react";
import Pagination from "../../components/Pagination/Pagination";

const ITEMS_PER_PAGE = 5;
const API_BASE = import.meta.env.VITE_API_URL || "";

function Badge({ children, tone }) {
  const bg =
    tone === "success" ? "#1f7a3a" :
    tone === "danger" ? "#8a1f1f" :
    tone === "info" ? "#1f5f7a" :
    "#444";

  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: 999,
        background: bg,
        color: "#fff",
        fontSize: 12,
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
}

const emptyForm = {
  facultyId: "",
  classId: "",
  studentId: "",
  fullName: "",
  email: "",
  status: "Đang học",
  keyStatus: "Not yet",
  ngaysinh: "",
  noisinh: "",
  gioitinh: "",
  khoahoc: "",
  bacdaotao: "",
  loaihinhDT: "",
  nganhDT: "",
  chuyennganh: "",
};

export default function ManageStudentInformation() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [facultiesData, setFacultiesData] = useState([]);

  const [q, setQ] = useState("");
  const [faculty, setFaculty] = useState("All");
  const [status, setStatus] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const parseJsonSafe = (text, label) => {
    try {
      return JSON.parse(text);
    } catch {
      console.error(`${label} không trả JSON:`, text);
      throw new Error(`${label} không trả JSON từ backend`);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/admin/students`, {
        method: "GET",
        credentials: "include",
      });

      const text = await res.text();
      console.log("students status:", res.status);
      console.log("students body:", text);

      const data = parseJsonSafe(text, "students");

      if (!res.ok) {
        throw new Error(data.message || "Không tải được danh sách sinh viên");
      }

      setStudents(data);
    } catch (error) {
      console.error("fetchStudents error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch(`${API_BASE}/classes`, {
        method: "GET",
        credentials: "include",
      });

      const text = await res.text();
      console.log("classes status:", res.status);
      console.log("classes body:", text);

      const data = parseJsonSafe(text, "classes");

      if (!res.ok) {
        throw new Error(data.message || "Không tải được danh sách lớp");
      }

      setClasses(data);
    } catch (error) {
      console.error("fetchClasses error:", error);
      alert(error.message);
    }
  };

  const fetchFaculties = async () => {
    try {
      const res = await fetch(`${API_BASE}/faculty`, {
        method: "GET",
        credentials: "include",
      });

      const text = await res.text();
      console.log("faculty status:", res.status);
      console.log("faculty body:", text);

      const data = parseJsonSafe(text, "faculty");

      if (!res.ok) {
        throw new Error(data.message || "Không tải được danh sách khoa");
      }

      setFacultiesData(data);
    } catch (error) {
      console.error("fetchFaculties error:", error);
      alert(error.message);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchFaculties();
  }, []);

  const faculties = useMemo(
    () => ["All", ...Array.from(new Set(students.map((x) => x.facultyId).filter(Boolean)))],
    [students]
  );

  const statuses = ["All", "Đang học", "Bảo lưu", "Đã nghỉ"];

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();

    return students.filter((r) => {
      const matchKw =
        !kw ||
        (r.fullName || "").toLowerCase().includes(kw) ||
        (r.studentId || "").toLowerCase().includes(kw) ||
        (r.email || "").toLowerCase().includes(kw) ||
        (r.facultyId || "").toLowerCase().includes(kw);

      const matchFaculty = faculty === "All" || r.facultyId === faculty;
      const matchStatus = status === "All" || r.status === status;

      return matchKw && matchFaculty && matchStatus;
    });
  }, [students, q, faculty, status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [q, faculty, status]);

  const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE) || 1;
  const paginatedRows = rows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const openAddModal = () => {
    setIsEdit(false);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setIsEdit(true);
    setForm(student);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm);
    setIsEdit(false);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (
      !form.facultyId ||
      !form.classId ||
      !form.studentId ||
      !form.fullName ||
      !form.email
    ) {
      alert("Vui lòng nhập đủ thông tin bắt buộc.");
      return;
    }

    const payload = {
      mssv: form.studentId,
      hoten: form.fullName,
      ngaysinh: form.ngaysinh || null,
      noisinh: form.noisinh || null,
      gioitinh: form.gioitinh || null,
      malop: form.classId,
      email: form.email,
      khoahoc: form.khoahoc || null,
      bacdaotao: form.bacdaotao || null,
      loaihinhDT: form.loaihinhDT || null,
      nganhDT: form.nganhDT || null,
      khoa: form.facultyId,
      chuyennganh: form.chuyennganh || null,
      tinhtrang: form.status || "Đang học",
    };

    try {
      const url = isEdit
        ? `${API_BASE}/admin/student/update`
        : `${API_BASE}/admin/student`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      console.log("save status:", res.status);
      console.log("save body:", text);

      const data = parseJsonSafe(text, "save student");

      if (!res.ok) {
        throw new Error(data.message || "Lưu sinh viên thất bại");
      }

      await fetchStudents();
      closeModal();
      alert(data.message || "Thành công");
    } catch (error) {
      console.error("handleSave error:", error);
      alert(error.message);
    }
  };

  const handleDelete = async (studentId) => {
    const ok = window.confirm(`Delete ${studentId}?`);
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/admin/student/delete`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mssv: studentId }),
      });

      const text = await res.text();
      console.log("delete status:", res.status);
      console.log("delete body:", text);

      const data = parseJsonSafe(text, "delete student");

      if (!res.ok) {
        throw new Error(data.message || "Xóa thất bại");
      }

      await fetchStudents();
      alert(data.message || "Đã xóa");
    } catch (error) {
      console.error("handleDelete error:", error);
      alert(error.message);
    }
  };

  return (
    <div style={{ padding: 24, color: "#fff" }}>
      <h2 style={{ margin: "8px 0 18px" }}>Student Information</h2>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, student ID, or faculty"
          style={{
            flex: 1,
            minWidth: 240,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #2c2c2c",
            background: "#111",
            color: "#fff",
          }}
        />

        <select
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            background: "#111",
            color: "#fff",
            border: "1px solid #2c2c2c",
          }}
        >
          {faculties.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            background: "#111",
            color: "#fff",
            border: "1px solid #2c2c2c",
          }}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          onClick={fetchStudents}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "#111",
            color: "#fff",
            border: "1px solid #2c2c2c",
            cursor: "pointer",
          }}
        >
          Search
        </button>

        <button
          onClick={openAddModal}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "#2b5cff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          + Add Student
        </button>
      </div>

      <div
        style={{
          background: "#0d0f14",
          border: "1px solid #2c2c2c",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "110px 110px 120px 1.2fr 1.3fr 120px 140px 160px",
            padding: "12px 12px",
            background: "#151a22",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          <div>Faculty ID</div>
          <div>Class ID</div>
          <div>Student ID</div>
          <div>Full name</div>
          <div>Email</div>
          <div>Status</div>
          <div>Key Status</div>
          <div>Actions</div>
        </div>

        {loading && (
          <div style={{ padding: 16, color: "#bbb" }}>Loading...</div>
        )}

        {!loading &&
          paginatedRows.map((r) => (
            <div
              key={r.studentId}
              style={{
                display: "grid",
                gridTemplateColumns: "110px 110px 120px 1.2fr 1.3fr 120px 140px 160px",
                padding: "12px 12px",
                borderTop: "1px solid #222",
              }}
            >
              <div>{r.facultyId}</div>
              <div>{r.classId}</div>
              <div>{r.studentId}</div>
              <div>{r.fullName}</div>
              <div>{r.email}</div>

              <div>
                <Badge tone={r.status === "Đang học" ? "success" : "danger"}>
                  {r.status}
                </Badge>
              </div>

              <div>
                <Badge tone={r.keyStatus === "Generated" ? "info" : "neutral"}>
                  {r.keyStatus}
                </Badge>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => openEditModal(r)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#f5c84b",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(r.studentId)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#e04b4b",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

        {!loading && rows.length === 0 && (
          <div style={{ padding: 16, color: "#bbb" }}>No students found.</div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={rows.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              width: 720,
              maxWidth: "95%",
              background: "#111827",
              borderRadius: 16,
              padding: 24,
              border: "1px solid #2c2c2c",
              color: "#fff",
            }}
          >
            <h3 style={{ marginBottom: 18 }}>
              {isEdit ? "Edit Student" : "Add Student"}
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <select
                value={form.facultyId}
                onChange={(e) => handleChange("facultyId", e.target.value)}
                style={inputStyle}
              >
                <option value="">Chọn khoa</option>
                {facultiesData.map((f) => (
                  <option key={f.maKhoa} value={f.maKhoa}>
                    {f.maKhoa} - {f.tenKhoa}
                  </option>
                ))}
              </select>

              <select
                value={form.classId}
                onChange={(e) => handleChange("classId", e.target.value)}
                style={inputStyle}
              >
                <option value="">Chọn lớp</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.name}
                  </option>
                ))}
              </select>

              <input
                placeholder="Student ID"
                value={form.studentId}
                disabled={isEdit}
                onChange={(e) => handleChange("studentId", e.target.value)}
                style={{
                  ...inputStyle,
                  opacity: isEdit ? 0.7 : 1,
                  cursor: isEdit ? "not-allowed" : "text",
                }}
              />

              <input
                placeholder="Full name"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                style={inputStyle}
              />

              <input
                type="date"
                value={form.ngaysinh || ""}
                onChange={(e) => handleChange("ngaysinh", e.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="Nơi sinh"
                value={form.noisinh || ""}
                onChange={(e) => handleChange("noisinh", e.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="Giới tính"
                value={form.gioitinh || ""}
                onChange={(e) => handleChange("gioitinh", e.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="Khóa học"
                value={form.khoahoc || ""}
                onChange={(e) => handleChange("khoahoc", e.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="Bậc đào tạo"
                value={form.bacdaotao || ""}
                onChange={(e) => handleChange("bacdaotao", e.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="Loại hình đào tạo"
                value={form.loaihinhDT || ""}
                onChange={(e) => handleChange("loaihinhDT", e.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="Ngành đào tạo"
                value={form.nganhDT || ""}
                onChange={(e) => handleChange("nganhDT", e.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="Chuyên ngành"
                value={form.chuyennganh || ""}
                onChange={(e) => handleChange("chuyennganh", e.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                style={{ ...inputStyle, gridColumn: "span 2" }}
              />

              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                style={inputStyle}
              >
                <option value="Đang học">Đang học</option>
                <option value="Bảo lưu">Bảo lưu</option>
                <option value="Đã nghỉ">Đã nghỉ</option>
              </select>

              <select
                value={form.keyStatus}
                onChange={(e) => handleChange("keyStatus", e.target.value)}
                style={inputStyle}
                disabled
              >
                <option value="Generated">Generated</option>
                <option value="Not yet">Not yet</option>
              </select>
            </div>

            <div
              style={{
                marginTop: 18,
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#374151",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#2b5cff",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {isEdit ? "Save Changes" : "Add Student"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#0f172a",
  color: "#fff",
};
