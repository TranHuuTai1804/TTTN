import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import Pagination from "../../components/Pagination/Pagination";

const ITEMS_PER_PAGE = 5;
const API_BASE = import.meta.env.VITE_API_URL || "";
const CURRENT_GRADE_YEAR = "2025-2026";
const CURRENT_GRADE_SEMESTER = 2;


const inputStyle = {
  backgroundColor: "#fff",
  color: "#334155",
  borderRadius: "8px",
  padding: "10px 12px",
  height: "40px",
  fontSize: "13px",
  fontWeight: "500",
  border: "none",
  cursor: "pointer",
};

const getGradeText = (value) => {
  if (value === "" || value === null || value === undefined || value === "-") {
    return "Chưa import";
  }

  return String(value);
};

const getGradeBadgeStyle = (value) => {
  const hasGrade = !(value === "" || value === null || value === undefined || value === "-");

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "84px",
    height: "32px",
    padding: "0 10px",
    borderRadius: "8px",
    fontWeight: "700",
    fontSize: "13px",
    backgroundColor: hasGrade ? "rgba(34, 197, 94, 0.14)" : "rgba(100, 116, 139, 0.18)",
    color: hasGrade ? "#22c55e" : "#94a3b8",
    border: hasGrade ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid rgba(148, 163, 184, 0.2)",
  };
};

function ManageGrades() {
  const [academicYears, setAcademicYears] = useState([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState("");

  const [semesters, setSemesters] = useState([]);
  const [currentSemester, setCurrentSemester] = useState("");

  const [courses, setCourses] = useState([]);
  const [currentCourseId, setCurrentCourseId] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  const [students, setStudents] = useState([]);

  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [errYears, setErrYears] = useState("");
  const [errSemesters, setErrSemesters] = useState("");
  const [errCourses, setErrCourses] = useState("");
  const [errStudents, setErrStudents] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.MaHP).trim() === String(currentCourseId).trim()),
    [courses, currentCourseId]
  );

  const normalizeText = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredCourses = useMemo(() => {
    const keyword = normalizeText(courseSearch);

    if (!keyword) return courses;

    return courses.filter((course) => {
      const maHp = normalizeText(course.MaHP);
      const tenHp = normalizeText(course.TenHP);
      return maHp.includes(keyword) || tenHp.includes(keyword);
    });
  }, [courses, courseSearch]);

  const chooseCourse = (course) => {
    const maHp = String(course.MaHP || "").trim();
    setCurrentCourseId(maHp);
    setCourseSearch(`${maHp} - ${course.TenHP || ""}`);
    setShowCourseDropdown(false);
  };

  const totalPages = Math.ceil(students.length / ITEMS_PER_PAGE);
  const paginatedStudents = students.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );


  const importedCount = students.filter(
    (student) =>
      student.midterm !== "" &&
      student.midterm !== null &&
      student.midterm !== undefined &&
      student.final !== "" &&
      student.final !== null &&
      student.final !== undefined &&
      student.average !== "" &&
      student.average !== null &&
      student.average !== undefined &&
      student.average !== "-"
  ).length;

  const canSaveGrades =
    !saving &&
    !loadingStudents &&
    students.length > 0 &&
    importedCount === students.length &&
    pin.trim().length > 0;

  useEffect(() => {
    setCurrentPage(1);
    setImportMessage("");
  }, [currentAcademicYear, currentSemester, currentCourseId]);

  useEffect(() => {
    let dead = false;

    (async () => {
      try {
        setLoadingYears(true);
        setErrYears("");

        const response = await fetch(`${API_BASE}/api/academic-years`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!dead) {
          const list = Array.isArray(data) ? data : [];
          const currentYear =
            list.find((item) => String(item.NamHoc || "").trim() === CURRENT_GRADE_YEAR) ||
            { NamHoc: CURRENT_GRADE_YEAR };

          // Trang nhập điểm chỉ dành cho học kỳ hiện tại: 2025-2026 HK2.
          // HK1 và các học kỳ cũ đã được seed bằng seedHistoricalEncryptedGrades_CRT.js.
          setAcademicYears([currentYear]);
          setCurrentAcademicYear(CURRENT_GRADE_YEAR);
        }
      } catch (error) {
        if (!dead) {
          setErrYears(error.message || "Không tải được danh sách năm học");
        }
      } finally {
        if (!dead) {
          setLoadingYears(false);
        }
      }
    })();

    return () => {
      dead = true;
    };
  }, []);

  useEffect(() => {
    if (!currentAcademicYear) {
      setSemesters([]);
      setCurrentSemester("");
      setCourses([]);
      setCurrentCourseId("");
      setCourseSearch("");
      setShowCourseDropdown(false);
      setStudents([]);
      return;
    }

    // Chỉ cho nhập điểm học kỳ 2 của năm học hiện tại.
    // Không gọi danh sách học kỳ từ DB nữa để tránh hiện HK1 đã được seed sẵn.
    setLoadingSemesters(false);
    setErrSemesters("");
    setSemesters([{ HocKy: CURRENT_GRADE_SEMESTER }]);
    setCurrentSemester(String(CURRENT_GRADE_SEMESTER));
    setCourses([]);
    setCurrentCourseId("");
    setCourseSearch("");
    setShowCourseDropdown(false);
    setStudents([]);
  }, [currentAcademicYear]);

  useEffect(() => {
    if (!currentAcademicYear || !currentSemester) {
      setCourses([]);
      setCurrentCourseId("");
      setCourseSearch("");
      setShowCourseDropdown(false);
      setStudents([]);
      return;
    }

    let dead = false;

    (async () => {
      try {
        setLoadingCourses(true);
        setErrCourses("");

        const response = await fetch(
          `${API_BASE}/api/courses/${currentAcademicYear}/${currentSemester}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!dead) {
          setCourses(Array.isArray(data) ? data : []);
          setCurrentCourseId("");
          setCourseSearch("");
          setShowCourseDropdown(false);
          setStudents([]);
        }
      } catch (error) {
        if (!dead) {
          setErrCourses(error.message || "Không tải được danh sách học phần");
        }
      } finally {
        if (!dead) {
          setLoadingCourses(false);
        }
      }
    })();

    return () => {
      dead = true;
    };
  }, [currentAcademicYear, currentSemester]);

  useEffect(() => {
    if (!currentAcademicYear || !currentSemester || !currentCourseId) {
      setStudents([]);
      return;
    }

    let dead = false;

    (async () => {
      try {
        setLoadingStudents(true);
        setErrStudents("");

        const response = await fetch(
          `${API_BASE}/api/students-by-course/${currentAcademicYear}/${currentSemester}/${currentCourseId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!dead) {
          const normalizedStudents = Array.isArray(data)
            ? data.map((student) => ({
                ...student,
                MaSV: normalizeStudentId(student.MaSV || student.MASV || student.MSSV || ""),
                HoTen: student.HoTen || student.HOTEN || student.hoTen || "",
                midterm: student.midterm ?? student.GK ?? "",
                final: student.final ?? student.CK ?? "",
                average: student.average ?? student.DiemThat ?? student.TB ?? "",
              }))
            : [];

          setStudents(normalizedStudents);
        }
      } catch (error) {
        if (!dead) {
          setErrStudents(error.message || "Không tải được danh sách sinh viên");
        }
      } finally {
        if (!dead) {
          setLoadingStudents(false);
        }
      }
    })();

    return () => {
      dead = true;
    };
  }, [currentAcademicYear, currentSemester, currentCourseId]);

  const normalizeHeader = (value) => {
    return String(value ?? "")
      .trim()
      .replace(/\uFEFF/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  };

  const normalizeStudentId = (value) => {
    const raw = String(value ?? "")
      .trim()
      .replace(/\uFEFF/g, "")
      .replace(/\s+/g, "")
      .toUpperCase();

    if (!raw) return "";

    // Nếu Excel nhập 1, 2, 3 thì tự hiểu là SV001, SV002, SV003
    if (/^\d+$/.test(raw)) {
      return `SV${raw.padStart(3, "0")}`;
    }

    // Nếu Excel nhập SV1, SV01 thì tự chuẩn hóa thành SV001
    const match = raw.match(/^SV0*(\d+)$/);
    if (match) {
      return `SV${match[1].padStart(3, "0")}`;
    }

    return raw;
  };

  const isMssvHeader = (value) => {
    const header = normalizeHeader(value);
    return ["mssv", "masv", "masinhvien", "sinhvien", "studentid", "studentcode"].includes(header);
  };

  const isMidtermHeader = (value) => {
    const header = normalizeHeader(value);
    return ["gk", "giuaky", "diemgiuaky", "diemgk", "midterm"].includes(header);
  };

  const isFinalHeader = (value) => {
    const header = normalizeHeader(value);
    return ["ck", "cuoiky", "diemcuoiky", "diemck", "final"].includes(header);
  };

  const isAverageHeader = (value) => {
    const header = normalizeHeader(value);
    return ["tb", "trungbinh", "diemtrungbinh", "diemtb", "average", "avg"].includes(header);
  };

  const parseExcelGrade = (value) => {
    if (value === null || value === undefined || value === "") return null;

    const normalizedValue = String(value).trim().replace(",", ".");
    const numberValue = Number(normalizedValue);

    if (!Number.isFinite(numberValue)) return NaN;
    if (numberValue < 0 || numberValue > 10) return NaN;

    return Math.round(numberValue * 10) / 10;
  };

  const readRowsFromWorksheet = (worksheet) => {
    const matrix = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false,
    });

    const headerRowIndex = matrix.findIndex((row) => {
      const hasMssv = row.some(isMssvHeader);
      const hasGk = row.some(isMidtermHeader);
      const hasCk = row.some(isFinalHeader);
      const hasTb = row.some(isAverageHeader);
      return hasMssv && hasGk && hasCk && hasTb;
    });

    if (headerRowIndex === -1) {
      return [];
    }

    const headers = matrix[headerRowIndex].map((cell) => String(cell ?? "").trim());

    return matrix.slice(headerRowIndex + 1).map((line, index) => {
      const row = { __rowNumber: headerRowIndex + index + 2 };
      headers.forEach((header, colIndex) => {
        if (header) row[header] = line[colIndex] ?? "";
      });
      return row;
    });
  };

  const getCellByHeader = (row, checker) => {
    const foundKey = Object.keys(row).find((key) => key !== "__rowNumber" && checker(key));
    return foundKey ? row[foundKey] : "";
  };

  const convertExcelRowsToMap = (rows, currentStudentIds) => {
    const excelMap = new Map();
    const invalidRows = [];
    const notInClass = [];
    let matchedCount = 0;

    rows.forEach((row) => {
      const rowNumber = row.__rowNumber || "?";
      const mssv = normalizeStudentId(getCellByHeader(row, isMssvHeader));

      if (!mssv) return;

      const gk = parseExcelGrade(getCellByHeader(row, isMidtermHeader));
      const ck = parseExcelGrade(getCellByHeader(row, isFinalHeader));
      const tb = parseExcelGrade(getCellByHeader(row, isAverageHeader));

      if (
        gk === null ||
        ck === null ||
        tb === null ||
        Number.isNaN(gk) ||
        Number.isNaN(ck) ||
        Number.isNaN(tb)
      ) {
        invalidRows.push(rowNumber);
        return;
      }

      if (currentStudentIds.has(mssv)) {
        matchedCount += 1;
      } else {
        notInClass.push(mssv);
      }

      excelMap.set(mssv, {
        midterm: gk,
        final: ck,
        average: tb,
      });
    });

    return { excelMap, invalidRows, notInClass, matchedCount };
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportMessage("");

      if (!currentAcademicYear || !currentSemester || !currentCourseId) {
        alert("Vui lòng chọn năm học, học kỳ và học phần trước khi import Excel");
        event.target.value = "";
        return;
      }

      if (
        String(currentAcademicYear).trim() !== CURRENT_GRADE_YEAR ||
        Number(currentSemester) !== CURRENT_GRADE_SEMESTER
      ) {
        alert(`Chỉ import điểm cho ${CURRENT_GRADE_YEAR} học kỳ ${CURRENT_GRADE_SEMESTER}.`);
        event.target.value = "";
        return;
      }

      if (students.length === 0) {
        alert("Chưa có danh sách sinh viên để import điểm");
        event.target.value = "";
        return;
      }

      const currentStudentIds = new Set(
        students.map((student) => normalizeStudentId(student.MaSV))
      );

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      if (!workbook.SheetNames.length) {
        alert("File Excel không có sheet dữ liệu");
        event.target.value = "";
        return;
      }

      let bestImport = null;
      let bestSheetName = "";
      let foundReadableSheet = false;

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const rows = readRowsFromWorksheet(worksheet);

        if (!rows.length) continue;
        foundReadableSheet = true;

        const result = convertExcelRowsToMap(rows, currentStudentIds);

        if (!bestImport || result.matchedCount > bestImport.matchedCount) {
          bestImport = result;
          bestSheetName = sheetName;
        }
      }

      if (!foundReadableSheet || !bestImport) {
        alert(
          "Không đọc được file Excel. File cần có một sheet chứa đúng các cột: MSSV, GK, CK, TB."
        );
        event.target.value = "";
        return;
      }

      if (bestImport.invalidRows.length > 0) {
        alert(
          `File Excel có dòng thiếu điểm hoặc điểm không hợp lệ: ${bestImport.invalidRows.join(
            ", "
          )}. Điểm GK, CK, TB phải nằm trong khoảng 0 - 10.`
        );
        event.target.value = "";
        return;
      }

      if (bestImport.matchedCount === 0) {
        alert(
          `Import không khớp sinh viên nào.\n\n` +
            `Danh sách trên giao diện đang có MSSV ví dụ: ${Array.from(currentStudentIds)
              .slice(0, 5)
              .join(", ")}\n` +
            `File Excel phải có cột MSSV trùng với danh sách này, ví dụ SV001, SV002, SV003.\n\n` +
            `Lưu ý: nếu file có nhiều sheet, hệ thống sẽ tự chọn sheet có dữ liệu phù hợp nhất.`
        );
        event.target.value = "";
        return;
      }

      let updatedCount = 0;

      const updatedStudents = students.map((student) => {
        const mssv = normalizeStudentId(student.MaSV);
        const importedGrade = bestImport.excelMap.get(mssv);

        if (!importedGrade) return student;

        updatedCount += 1;

        return {
          ...student,
          midterm: importedGrade.midterm,
          final: importedGrade.final,
          average: importedGrade.average,
        };
      });

      setStudents(updatedStudents);
      setCurrentPage(1);
      setImportMessage(
        `Đã import ${updatedCount}/${students.length} sinh viên từ sheet "${bestSheetName}". ${
          bestImport.notInClass.length
            ? `Có ${bestImport.notInClass.length} MSSV trong Excel không thuộc học phần này: ${bestImport.notInClass.join(", ")}`
            : ""
        }`
      );

      event.target.value = "";
    } catch (error) {
      console.error("IMPORT_EXCEL_ERROR:", error);
      alert(error.message || "Import Excel thất bại");
      event.target.value = "";
    }
  };

  const isValidGrade = (value) => {
    if (value === "" || value === null || value === undefined) return true;

    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue >= 0 && numericValue <= 10;
  };

  const validateBeforeSave = () => {
    if (!currentAcademicYear) {
      alert("Vui lòng chọn năm học");
      return false;
    }

    if (!currentSemester) {
      alert("Vui lòng chọn học kỳ");
      return false;
    }

    if (
      String(currentAcademicYear).trim() !== CURRENT_GRADE_YEAR ||
      Number(currentSemester) !== CURRENT_GRADE_SEMESTER
    ) {
      alert(`Chỉ được nhập điểm cho ${CURRENT_GRADE_YEAR} học kỳ ${CURRENT_GRADE_SEMESTER}. HK1 và các học kỳ cũ đã được seed.`);
      return false;
    }

    if (!currentCourseId) {
      alert("Vui lòng chọn học phần");
      return false;
    }

    if (!pin.trim()) {
      alert("Vui lòng nhập PIN để mã hóa điểm");
      return false;
    }

    if (students.length === 0) {
      alert("Chưa có sinh viên để lưu điểm");
      return false;
    }

    const missingGradeStudent = students.find(
      (student) =>
        student.midterm === "" ||
        student.midterm === null ||
        student.midterm === undefined ||
        student.final === "" ||
        student.final === null ||
        student.final === undefined ||
        student.average === "" ||
        student.average === null ||
        student.average === undefined ||
        student.average === "-"
    );

    if (missingGradeStudent) {
      alert(`Sinh viên ${missingGradeStudent.MaSV} chưa có đủ điểm. Vui lòng import file Excel có đủ GK, CK và TB.`);
      return false;
    }

    const invalidGradeStudent = students.find(
      (student) =>
        !isValidGrade(student.midterm) ||
        !isValidGrade(student.final) ||
        !isValidGrade(student.average)
    );

    if (invalidGradeStudent) {
      alert(`Sinh viên ${invalidGradeStudent.MaSV} có điểm không hợp lệ. Điểm phải nằm trong khoảng 0 - 10`);
      return false;
    }

    return true;
  };

  const handleSaveGrades = async () => {
    if (!validateBeforeSave()) return;

    const payload = {
      courseId: currentCourseId.trim(),
      academicYear: currentAcademicYear,
      semester: currentSemester,
      pin: pin.trim(),
      grades: students.map((student) => ({
        MaSV: String(student.MaSV).trim(),
        gk: Number(student.midterm),
        ck: Number(student.final),
        average: Number(student.average),
      })),
    };

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/admin/nhap-diem`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.message || text || "Lưu điểm thất bại");
      }

      alert(data?.message || "Đã lưu và mã hóa điểm thành công!");
    } catch (error) {
      console.error("SAVE_GRADES_ERROR:", error);
      alert(error.message || "Có lỗi khi lưu điểm!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", color: "#e2e8f0" }}>
      <div style={{ marginBottom: "4px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "#fff" }}>Quản lý Điểm</h1>
        <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
          Chỉ import điểm học kỳ 2 năm 2025-2026; HK1 và điểm cũ đã được seed CRT
        </p>
      </div>

      <div
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 280px))", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Năm học
            </label>
            <select
              value={currentAcademicYear}
              onChange={(event) => setCurrentAcademicYear(event.target.value)}
              disabled={loadingYears || academicYears.length <= 1}
              style={inputStyle}
            >
              <option value="">{loadingYears ? "Đang tải..." : "Chọn năm học"}</option>
              {academicYears.map((year) => (
                <option key={year.NamHoc} value={year.NamHoc}>
                  {year.NamHoc}
                </option>
              ))}
            </select>
            {errYears && <span style={{ color: "#f87171", fontSize: "12px" }}>{errYears}</span>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Học kỳ
            </label>
            <select
              value={currentSemester}
              onChange={(event) => setCurrentSemester(event.target.value)}
              disabled={!currentAcademicYear || loadingSemesters || semesters.length <= 1}
              style={{ ...inputStyle, color: "#3b82f6" }}
            >
              <option value="">
                {loadingSemesters ? "Đang tải..." : "Chọn học kỳ"}
              </option>
              {semesters.map((semester) => (
                <option key={semester.HocKy} value={semester.HocKy}>
                  Học kỳ {String(semester.HocKy)}
                </option>
              ))}
            </select>
            {errSemesters && <span style={{ color: "#f87171", fontSize: "12px" }}>{errSemesters}</span>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Học phần
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={courseSearch}
                onChange={(event) => {
                  setCourseSearch(event.target.value);
                  setCurrentCourseId("");
                  setShowCourseDropdown(true);
                }}
                onFocus={() => setShowCourseDropdown(true)}
                disabled={!currentSemester || loadingCourses}
                placeholder={loadingCourses ? "Đang tải..." : "Nhập mã HP hoặc tên học phần"}
                autoComplete="off"
                style={{
                  ...inputStyle,
                  width: "100%",
                  cursor: !currentSemester || loadingCourses ? "not-allowed" : "text",
                  color: "#2563eb",
                  border: currentCourseId ? "2px solid #3b82f6" : "2px solid rgba(148,163,184,0.55)",
                }}
              />

              {showCourseDropdown && currentSemester && !loadingCourses && (
                <div
                  style={{
                    position: "absolute",
                    zIndex: 50,
                    top: "44px",
                    left: 0,
                    right: 0,
                    maxHeight: "260px",
                    overflowY: "auto",
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.25)",
                  }}
                >
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                      <div
                        key={`${course.MaHP}-${course.NamHoc}-${course.HocKy}-${course.MaLop || ""}`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          chooseCourse(course);
                        }}
                        style={{
                          padding: "11px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #e2e8f0",
                          color: "#2563eb",
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      >
                        {course.MaHP} - {course.TenHP}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "12px", color: "#64748b", fontSize: "13px" }}>
                      Không tìm thấy học phần phù hợp
                    </div>
                  )}
                </div>
              )}
            </div>
            {errCourses && <span style={{ color: "#f87171", fontSize: "12px" }}>{errCourses}</span>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              PIN mã hóa
            </label>
            <input
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Nhập mã PIN dạng số "
              autoComplete="off"
              style={{
                ...inputStyle,
                cursor: "text",
                border: pin.trim() ? "2px solid #22c55e" : "2px solid #f59e0b",
              }}
            />
            
          </div>
        </div>

        {selectedCourse && (
          <div
            style={{
              marginTop: "16px",
              backgroundColor: "#1e293b",
              borderRadius: "8px",
              padding: "16px",
              border: "1px solid rgba(100,116,139,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  backgroundColor: "rgba(59,130,246,0.2)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <i className="fa-solid fa-book" style={{ color: "#60a5fa", fontSize: "16px" }}></i>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#60a5fa" }}>
                  {selectedCourse.TenHP}
                </h3>
                <p style={{ fontSize: "12px", color: "#60a5fa" }}>Mã HP: {selectedCourse.MaHP}</p>
                <p style={{ fontSize: "12px", color: "#60a5fa" }}>
                  Số sinh viên: {selectedCourse.totalStudents || selectedCourse.TotalStudents || selectedCourse.SoSinhVien || students.length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#fff" }}>Bảng điểm</h2>
            {loadingStudents && (
              <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>Đang tải danh sách sinh viên...</p>
            )}
            {errStudents && (
              <p style={{ color: "#f87171", fontSize: "12px", marginTop: "4px" }}>{errStudents}</p>
            )}
            {importMessage && (
              <p style={{ color: "#22c55e", fontSize: "12px", marginTop: "4px" }}>{importMessage}</p>
            )}
            {!importMessage && students.length > 0 && (
              <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
                Đã có điểm {importedCount}/{students.length} sinh viên. Không nhập tay trên bảng; vui lòng import file Excel có cột MSSV, GK, CK, TB.
              </p>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                backgroundColor: loadingStudents || students.length === 0 ? "#64748b" : "#f59e0b",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                border: "none",
                cursor: loadingStudents || students.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              <i className="fa-solid fa-file-import"></i>
              <span>Import Excel</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                disabled={loadingStudents || students.length === 0}
                style={{ display: "none" }}
              />
            </label>

            <button
              onClick={handleSaveGrades}
              disabled={!canSaveGrades}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                backgroundColor: !canSaveGrades ? "#64748b" : "#22c55e",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                border: "none",
                cursor: !canSaveGrades ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(34, 197, 94, 0.25)",
              }}
            >
              <i className="fa-solid fa-lock"></i>
              <span>{saving ? "Đang mã hóa..." : "Lưu & mã hóa điểm"}</span>
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(100,116,139,0.3)" }}>
                <th style={{ textAlign: "left", padding: "10px 16px", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  MSSV
                </th>
                <th style={{ textAlign: "left", padding: "10px 16px", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Họ tên
                </th>
                <th style={{ textAlign: "center", padding: "10px 16px", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Giữa kỳ
                </th>
                <th style={{ textAlign: "center", padding: "10px 16px", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Cuối kỳ
                </th>
                <th style={{ textAlign: "center", padding: "10px 16px", fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Trung bình
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => (
                  <tr key={student.MaSV} style={{ borderBottom: "1px solid rgba(100,116,139,0.15)" }}>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ fontWeight: "600", color: "#fff", fontSize: "13px" }}>{student.MaSV}</span>
                    </td>
                    <td style={{ padding: "10px 16px", color: "#cbd5e1", fontWeight: "500", fontSize: "13px" }}>
                      {student.HoTen || "Chưa có tên"}
                    </td>
                    <td style={{ padding: "10px 16px", textAlign: "center" }}>
                      <span style={getGradeBadgeStyle(student.midterm)}>{getGradeText(student.midterm)}</span>
                    </td>
                    <td style={{ padding: "10px 16px", textAlign: "center" }}>
                      <span style={getGradeBadgeStyle(student.final)}>{getGradeText(student.final)}</span>
                    </td>
                    <td style={{ padding: "10px 16px", textAlign: "center" }}>
                      <span style={getGradeBadgeStyle(student.average)}>{getGradeText(student.average)}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: "24px 16px", textAlign: "center", color: "#94a3b8" }}>
                    {currentCourseId ? "Chưa có sinh viên trong học phần này" : "Vui lòng chọn năm học, học kỳ và học phần"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={students.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>

      <footer style={{ textAlign: "center", padding: "16px 0", color: "#64748b", fontSize: "12px" }}>
        <p>2025 CRT Encrypt. All right reserved.</p>
      </footer>
    </div>
  );
}

export default ManageGrades;
