import React, { useEffect, useState } from "react";
import "./PersonalInfo.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

function PersonalInfo() {
  const [profile, setProfile] = useState({
    MaSV: "",
    HoTen: "",
    NgaySinh: "",
    NoiSinh: "",
    GioiTinh: "",
    MaLop: "",
    Email: "",
    KhoaHoc: "",
    BacDaoTao: "",
    LoaiHinhDT: "",
    ChuyeNganh: "",
    Khoa: "",
    TinhTrang: "verified", // verified | unverified
  });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const r = await fetch(`${API_BASE}/student`, {
          credentials: "include",
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();

        if (!dead) {
          setProfile({
            MaSV: data?.MaSV || "",
            HoTen: data?.HoTen || "",
            NgaySinh: data?.NgaySinh.split("T")[0] || "",
            NoiSinh: data?.NoiSinh || "",
            GioiTinh: data?.GioiTinh || "",
            MaLop: data?.MaLop || "",
            Email: data?.Email || "",
            KhoaHoc: data?.KhoaHoc || "",
            BacDaoTao: data?.BacDaoTao || "",
            LoaiHinhDT: data?.LoaiHinhDT || "",
            NganhDT: data?.NganhDT || "",
            ChuyenNganh: data?.ChuyenNganh || "",
            Khoa: data?.Khoa || "",
            TinhTrang: data?.TinhTrang || "verified",
          });
        }
      } catch (e) {
        if (!dead) setErr(e.message || "Failed to load profile");
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, []);

  const handleVerify = () => {
    // TODO: Implement verify logic
    console.log("Verify key clicked");
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${API_BASE}/student/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          noisinh: profile.NoiSinh
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Update failed");
      }

      alert("Cập nhật thành công");
      setIsEditing(false);

    } catch (err) {
      alert("Cập nhật thất bại");
    }
  };

  return (
    <div className="pi-page">
      <div className="pi">
        <div className="pi__card">
        <h1 className="pi__title">Personal Information</h1>

        {!!err && (
          <div className="pi__error">Error: {err}</div>
        )}

        <div className="pi__form">
          {/* Left column */}
          <div className="pi__column">
            <div className="pi__field">
              <label className="pi__label">Full name</label>
              <input
                type="text"
                className="pi__input pi__input--readonly"
                placeholder="Enter full name"
                value={loading ? "" : profile.HoTen}
                readOnly
                disabled={loading}
              />
            </div>

            <div className="pi__field">
              <label className="pi__label">Date of birth</label>
              <input
                type="date"
                className="pi__input pi__input--readonly"
                placeholder="YYYY-MM-DD"
                value={loading ? "" : profile.NgaySinh}
                readOnly
                disabled={loading}
              />
            </div>

            <div className="pi__field">
              <label className="pi__label">Place of birth</label>
              <input
                type="text"
                className={`pi__input ${isEditing ? 'pi__input--editable' : ''}`}
                placeholder="Nhập nơi sinh"
                value={loading ? "" : profile.NoiSinh}
                readOnly={!isEditing}
                disabled={loading}
                onChange={(e) => setProfile({ ...profile, NoiSinh: e.target.value })}
              />
            </div>

            <div className="pi__field">
              <label className="pi__label">Gender</label>
              <input
                type="text"
                className="pi__input pi__input--readonly"
                placeholder="Select gender"
                value={loading ? "" : profile.GioiTinh}
                readOnly
                disabled={loading}
              />
            </div>

            <div className="pi__field">
              <label className="pi__label">Education level</label>
              <input
                type="text"
                className="pi__input pi__input--readonly"
                placeholder="Select education level"
                value={loading ? "" : profile.BacDaoTao}
                readOnly
                disabled={loading}
              />
            </div>

            <div className="pi__field">
              <label className="pi__label">Course</label>
              <input
                type="text"
                className="pi__input pi__input--readonly"
                placeholder=""
                value={loading ? "" : profile.KhoaHoc}
                readOnly
                disabled={loading}
              />
            </div>
          </div>

          {/* Right column */}
          <div className="pi__column">
            <div className="pi__field">
              <label className="pi__label">Training type</label>
              <input
                type="text"
                className="pi__input pi__input--readonly"
                placeholder="Select training type"
                value={loading ? "" : profile.LoaiHinhDT}
                readOnly
                disabled={loading}
              />
            </div>

            <div className="pi__field">
              <label className="pi__label">Specialization</label>
              <input
                type="text"
                className="pi__input pi__input--readonly"
                placeholder="Select specialization"
                value={loading ? "" : profile.ChuyenNganh}
                readOnly
                disabled={loading}
              />
            </div>

            <div className="pi__field">
              <label className="pi__label">Faculty</label>
              <input
                type="text"
                className="pi__input pi__input--readonly"
                placeholder="Select faculty"
                value={loading ? "" : profile.Khoa}
                readOnly
                disabled={loading}
              />
            </div>

            <div className="pi__field">
              <label className="pi__label">Class</label>
              <input
                type="text"
                className="pi__input pi__input--readonly"
                placeholder="Select class"
                value={loading ? "" : profile.MaLop}
                readOnly
                disabled={loading}
              />
            </div>

            <div className="pi__field">
              <label className="pi__label">Student ID</label>
              <input
                type="text"
                className="pi__input pi__input--readonly"
                placeholder="Enter student ID"
                value={loading ? "" : profile.MaSV}
                readOnly
                disabled={loading}
              />
            </div>

            <div className="pi__field">
              <label className="pi__label">Key status</label>
              <div className="pi__keyStatus">
                <span className={`pi__badge ${profile.TinhTrang === "verified" ? "pi__badge--verified" : "pi__badge--unverified"}`}>
                  {profile.TinhTrang === "verified" ? "Verified" : "Unverified"}
                </span>
                <button 
                  type="button" 
                  className="pi__verifyBtn"
                  onClick={handleVerify}
                  disabled={loading}
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        </div>

        <button 
          className="pi__editBtn" 
          disabled={loading}
          onClick={() => {
            if (isEditing) {
              handleUpdate();   
            } else {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? "Save" : "Edit"}
        </button>
      </div>
      </div>
    </div>
  );
}

export default PersonalInfo;
