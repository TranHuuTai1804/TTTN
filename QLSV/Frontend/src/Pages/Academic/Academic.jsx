import React, { useMemo, useState, useEffect } from "react";
import "./Academic.css";
import Student from "../../assets/icon/student-bg.png";

const API_BASE = import.meta.env.VITE_API_URL || "";

function pick(obj, keys, defaultValue = "") {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return defaultValue;
}

function normalizeCourse(c) {
  const maHp = String(
    pick(c, ["MaHP", "MAHP", "maHP", "mahp", "courseId", "MaHocPhan"])
  ).trim();

  return {
    ...c,

    // Giữ cả 2 key để không bị lỗi do SQL Server trả MaHP còn JSX đọc MAHP.
    MaHP: maHp,
    MAHP: maHp,

    TenHP: String(
      pick(c, ["TenHP", "TENHP", "tenHP", "tenhp", "courseName", "TenHocPhan"])
    ).trim(),

    SoTinChi: Number(
      pick(c, ["SoTinChi", "SOTINCHI", "soTinChi", "credits"], 0)
    ),

    MaLop: String(
      pick(c, ["MaLop", "MALOP", "maLop", "classId"])
    ).trim(),

    LichHoc: String(
      pick(c, ["LichHoc", "LICHHOC", "lichHoc", "schedule"])
    ).trim(),

    GK: c.GK ?? c.gk ?? null,
    CK: c.CK ?? c.ck ?? null,
    DiemTrungBinh:
      c.DiemTrungBinh ??
      c.diemTrungBinh ??
      c.average ??
      c.DiemThat ??
      c.Diem ??
      null,
    error: c.error || "",
  };
}

function getFriendlyDecryptError(rawMessage, status) {
  const message = String(rawMessage || "").trim();
  const lower = message.toLowerCase();

  // Backend có thể trả thông báo kỹ thuật dài khi PIN sai hoặc shared secret không khớp.
  // Frontend chỉ hiển thị thông báo ngắn gọn cho sinh viên.
  const isWrongPinMessage =
    lower.includes("pin sai") ||
    lower.includes("public_key") ||
    lower.includes("public key") ||
    lower.includes("flow cũ") ||
    lower.includes("flow cu") ||
    lower.includes("giải mã thất bại") ||
    lower.includes("giai ma that bai") ||
    lower.includes("decrypt") ||
    lower.includes("sharedsecret") ||
    lower.includes("shared secret") ||
    status === 401 ||
    status === 403;

  if (isWrongPinMessage) {
    return "Nhập PIN sai";
  }

  if (status === 404 || lower.includes("không tìm thấy điểm crt")) {
    return "Chưa có điểm cho môn học này";
  }

  return message || "Không giải mã được điểm";
}

function Academic() {
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [loadingYear, setLoadingYear] = useState(false);
  const [loadingSemester, setLoadingSemester] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);

  const [errorYear, setErrorYear] = useState("");
  const [errorSemester, setErrorSemester] = useState("");
  const [errorCourse, setErrorCourse] = useState("");

  const [pin, setPin] = useState("");
  const [year, setYear] = useState("");
  const [sem, setSem] = useState("");
  const [q, setQ] = useState("");
  const [decrypted, setDecrypted] = useState(false);

  const formatGrade = (value) => {
    if (value === null || value === undefined || value === "") return "-";

    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return "-";

    return Number.isInteger(numberValue)
      ? String(numberValue)
      : numberValue.toFixed(1);
  };

  useEffect(() => {
    let dead = false;

    (async () => {
      try {
        setLoadingYear(true);
        setErrorYear("");

        const res = await fetch(`${API_BASE}/api/tkb/year`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load years");

        const data = await res.json();

        if (!dead) {
          let listYears = [];

          // Backend chuẩn mới trả [{ NamHoc: "2023-2024" }, ...]
          if (Array.isArray(data) && data.some((x) => x?.NamHoc || x?.NAMHOC)) {
            listYears = data
              .map((x) => String(x.NamHoc || x.NAMHOC || "").trim())
              .filter(Boolean);
          }

          // Fallback cho backend cũ trả KhoaHoc, ví dụ 2022-2026.
          if (!listYears.length && Array.isArray(data) && data[0]?.KhoaHoc) {
            const [start, end] = String(data[0].KhoaHoc).split("-").map(Number);
            if (Number.isFinite(start) && Number.isFinite(end)) {
              for (let y = start; y < end; y++) {
                listYears.push(`${y}-${y + 1}`);
              }
            }
          }

          setYears([...new Set(listYears)].sort());
        }
      } catch (err) {
        if (!dead) setErrorYear(err.message);
      } finally {
        if (!dead) setLoadingYear(false);
      }
    })();

    return () => {
      dead = true;
    };
  }, []);

  useEffect(() => {
    if (!year) {
      setSemesters([]);
      setSem("");
      setCourses([]);
      setDecrypted(false);
      return;
    }

    let dead = false;

    (async () => {
      try {
        setLoadingSemester(true);
        setErrorSemester("");
        setSemesters([]);
        setSem("");
        setCourses([]);
        setDecrypted(false);

        const res = await fetch(`${API_BASE}/api/tkb/semester/${year}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load semesters");

        const data = await res.json();
        const cleanSemesters = (data || [])
          .map((item) => ({
            HocKy: Number(item.HocKy ?? item.HOCKY ?? item.hocKy ?? item.semester),
          }))
          .filter((item) => Number.isFinite(item.HocKy))
          .sort((a, b) => a.HocKy - b.HocKy);

        if (!dead) {
          setSemesters(cleanSemesters);
        }
      } catch (err) {
        if (!dead) setErrorSemester(err.message);
      } finally {
        if (!dead) setLoadingSemester(false);
      }
    })();

    return () => {
      dead = true;
    };
  }, [year]);

  useEffect(() => {
    if (!year || !sem) {
      setCourses([]);
      setDecrypted(false);
      return;
    }

    let dead = false;

    (async () => {
      try {
        setLoadingCourse(true);
        setErrorCourse("");
        setDecrypted(false);

        const res = await fetch(`${API_BASE}/api/tkb/${year}/${sem}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load courses");

        const data = await res.json();

        if (!dead) {
          const clean = (data || []).map(normalizeCourse);
          setCourses(clean);
        }
      } catch (err) {
        if (!dead) setErrorCourse(err.message);
      } finally {
        if (!dead) setLoadingCourse(false);
      }
    })();

    return () => {
      dead = true;
    };
  }, [year, sem]);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();

    return courses.filter((c) => {
      const maHp = String(c.MAHP || c.MaHP || "").toLowerCase();
      const tenHp = String(c.TenHP || "").toLowerCase();
      const maLop = String(c.MaLop || "").toLowerCase();
      const lichHoc = String(c.LichHoc || "").toLowerCase();
      const soTinChi = String(c.SoTinChi || "").toLowerCase();

      return (
        !search ||
        maHp.includes(search) ||
        tenHp.includes(search) ||
        maLop.includes(search) ||
        lichHoc.includes(search) ||
        soTinChi.includes(search)
      );
    });
  }, [courses, q]);

  const semesterSummary = useMemo(() => {
    if (!decrypted) {
      return {
        gpa: null,
        totalCredits: 0,
        countedCourses: 0,
      };
    }

    let totalGpaPoints = 0;
    let totalCredits = 0;
    let countedCourses = 0;

    courses.forEach((c) => {
      if (c.error) return;

      const finalGrade =
        c.DiemTrungBinh ??
        c.average ??
        c.DiemThat ??
        c.Diem ??
        null;

      const score10 = Number(finalGrade);
      const credits = Number(c.SoTinChi || 0);

      if (Number.isFinite(score10) && credits > 0) {
        const score4 = (score10 / 10) * 4;

        totalGpaPoints += score4 * credits;
        totalCredits += credits;
        countedCourses += 1;
      }
    });

    if (!totalCredits) {
      return {
        gpa: null,
        totalCredits: 0,
        countedCourses: 0,
      };
    }

    return {
      gpa: (totalGpaPoints / totalCredits).toFixed(2),
      totalCredits,
      countedCourses,
    };
  }, [courses, decrypted]);

  const handleDecrypt = async () => {
    const pinClean = String(pin || "").trim();

    if (!/^\d{4,10}$/.test(pinClean)) {
      alert("PIN phải là số và dài từ 4 đến 10 chữ số");
      return;
    }

    if (!year || !sem) {
      alert("Vui lòng chọn năm học và học kỳ trước khi giải mã điểm");
      return;
    }

    if (!courses || courses.length === 0) {
      alert("Không có học phần nào để giải mã");
      return;
    }

    try {
      const decryptedCourses = await Promise.all(
        courses.map(async (course) => {
          const courseId = String(course.MAHP || course.MaHP || "").trim();

          if (!courseId) {
            return {
              ...course,
              GK: null,
              CK: null,
              DiemTrungBinh: null,
              error: "Thiếu mã học phần",
            };
          }

          const res = await fetch(`${API_BASE}/api/view-grades`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              pin: pinClean,
              courseId,
              academicYear: year,
              semester: sem,
            }),
          });

          const text = await res.text();

          let data = null;
          try {
            data = text ? JSON.parse(text) : null;
          } catch {
            data = null;
          }

          if (!res.ok) {
            const rawMessage = data?.message || text || "Không giải mã được điểm";
            const friendlyMessage = getFriendlyDecryptError(rawMessage, res.status);

            return {
              ...course,
              GK: null,
              CK: null,
              DiemTrungBinh: null,
              error: friendlyMessage,
            };
          }

          return normalizeCourse({
            ...course,
            GK:
              data?.gk ??
              data?.GK ??
              data?.grades?.gk ??
              data?.grades?.GK ??
              null,

            CK:
              data?.ck ??
              data?.CK ??
              data?.grades?.ck ??
              data?.grades?.CK ??
              null,

            DiemTrungBinh:
              data?.average ??
              data?.DiemTrungBinh ??
              data?.DiemThat ??
              data?.grades?.average ??
              data?.grades?.DiemTrungBinh ??
              data?.grades?.DiemThat ??
              null,

            error: "",
          });
        })
      );

      setCourses(decryptedCourses);
      setDecrypted(true);
    } catch (err) {
      console.error("Lỗi handleDecrypt:", err);
      alert(err?.message || "Lỗi khi giải mã điểm. Vui lòng thử lại.");
    }
  };

  return (
    <div className="acad">
      <section className="acad__hero card first">
        <div className="hero__left">
          <div className="hero__content">
            <img src={Student} alt="" className="hero__icon" />
            <h1 className="hero__title">
              My Academic <br /> Records
            </h1>
          </div>

          <p className="hero__desc">
            Nhập mã PIN dạng số để giải mã và xem điểm giữa kỳ, cuối kỳ,
            điểm trung bình.
          </p>
        </div>

        <div className="hero__right">
          <label htmlFor="pin" className="pin__label">
            Secure PIN
          </label>

          <div className="pin__field">
            <i className="fa-regular fa-square-check" aria-hidden="true" />
            <input
              id="pin"
              className="pin__input"
              type="password"
              maxLength={10}
              placeholder="Nhập PIN dạng số"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </div>

          <button className="btn btn--primary" onClick={handleDecrypt}>
            Giải mã điểm
          </button>
        </div>
      </section>

      <section className="acad__section">
        <div className="sec__header">
          <div className="sec__title">
            <i className="fa-regular fa-clipboard" aria-hidden="true" />
            {decrypted ? "Kết quả giải mã điểm" : "Course Performance Overview"}
          </div>

          <div className="filters">
            <select className="filters__select" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">Chọn năm học</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select className="filters__select" value={sem} onChange={(e) => setSem(e.target.value)}>
              <option value="">Chọn học kỳ</option>
              {semesters.map((s) => (
                <option key={s.HocKy} value={s.HocKy}>
                  Học kỳ {s.HocKy}
                </option>
              ))}
            </select>

            <div className="search">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search by course code or name..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        {errorYear && <div className="error">{errorYear}</div>}
        {errorSemester && <div className="error">{errorSemester}</div>}
        {errorCourse && <div className="error">{errorCourse}</div>}

        <div className="table card">
          <div className="table__scroll">
            <table>
              <thead>
                <tr>
                  <th>MAHP</th>
                  <th>TenHP</th>
                  <th>SoTinChi</th>
                  {!decrypted && <th>MaLop</th>}
                  {!decrypted && <th>LichHoc</th>}
                  {decrypted && <th>GK</th>}
                  {decrypted && <th>CK</th>}
                  {decrypted && <th>Điểm trung bình</th>}
                </tr>
              </thead>

              <tbody>
                {loadingYear || loadingSemester || loadingCourse ? (
                  <tr>
                    <td colSpan={decrypted ? 6 : 5} className="empty">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((c, index) => (
                    <tr key={`${c.MAHP || c.MaHP || index}-${index}`}>
                      <td className="mono">{c.MAHP || c.MaHP || "-"}</td>
                      <td>{c.TenHP || "-"}</td>
                      <td>{c.SoTinChi || "-"}</td>

                      {!decrypted && <td>{c.MaLop || "-"}</td>}
                      {!decrypted && <td>{c.LichHoc || "-"}</td>}

                      {decrypted && (
                        <>
                          <td className="mono">
                            {c.error ? c.error : formatGrade(c.GK)}
                          </td>
                          <td className="mono">
                            {c.error ? "-" : formatGrade(c.CK)}
                          </td>
                          <td className="mono">
                            {c.error ? "-" : formatGrade(c.DiemTrungBinh)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={decrypted ? 6 : 5} className="empty">
                      {!year || !sem
                        ? "Vui lòng chọn năm học và học kỳ để xem học phần."
                        : "Sinh viên chưa có học phần đăng ký trong năm học và học kỳ này."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>


    </div>
  );
}

export default Academic;
