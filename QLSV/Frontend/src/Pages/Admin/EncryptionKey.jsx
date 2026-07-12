import React, { useEffect, useState } from "react";
import "./EncryptionKey.css";

function AdminEncryptionKey() {
  const keyInfo = {
    status: "Active",
    keyId: "LPIN-2024-001-A",
    generatedAt: "2024-01-15",
    expiryAt: "2025-01-15",
  };

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState("");

  const [form, setForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const formatDateTime = (value, textValue) => {
    if (textValue) return textValue;
    if (!value) return "N/A";
    return new Date(value).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const fetchPinChangeHistory = async () => {
    try {
      setLogsLoading(true);
      setLogsError("");

      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/pin-change-history`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Không tải được lịch sử đổi PIN giảng viên");
      }

      const history = Array.isArray(data) ? data : (data.data || data.history || []);
      setLogs(history.slice(0, 5));
    } catch (error) {
      console.error("Lỗi lấy lịch sử đổi PIN giảng viên:", error);
      setLogsError(error.message || "Không tải được lịch sử đổi PIN giảng viên");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchPinChangeHistory();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!form.current || !form.next || !form.confirm) {
      return setMsg("Vui lòng nhập đầy đủ thông tin.");
    }

    if (!/^\d+$/.test(form.current) || !/^\d+$/.test(form.next) || !/^\d+$/.test(form.confirm)) {
      return setMsg("PIN chỉ được chứa chữ số.");
    }

    if (form.next.length < 4) {
      return setMsg("PIN mới phải có ít nhất 4 chữ số.");
    }

    if (form.next !== form.confirm) {
      return setMsg("PIN mới và xác nhận PIN không khớp.");
    }

    try {
      setLoading(true);

      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/set-pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPin: form.current,
          newPin: form.next,
        }),
      });

      const responseText = await res.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText || `Máy chủ trả về lỗi HTTP ${res.status}` };
      }

      if (!res.ok) {
        setMsg(data.message || "Cập nhật PIN giảng viên thất bại");
        setLoading(false);
        return;
      }

      setMsg(data.message || "Cập nhật PIN giảng viên thành công!");

      setForm({
        current: "",
        next: "",
        confirm: "",
      });

      await fetchPinChangeHistory();
      setLoading(false);
    } catch (error) {
      console.error(error);
      setMsg(error.message || "Lỗi kết nối server khi đổi PIN giảng viên");
      setLoading(false);
    }
  };

  return (
    <div className="admin-ek">
      <div className="admin-ek__grid">
        <section className="card admin-ek__status">
          <div className="admin-ek__statusHeader">
            <div>
              <div className="admin-ek__eyebrow">Bảo mật giảng viên</div>
              <div className="admin-ek__title admin-ek__title--compact">Trạng thái mã PIN</div>
            </div>
            <span className="badge badge--ok">{keyInfo.status}</span>
          </div>

          <ul className="admin-ek__kv">
            <li>
              <span>PIN ID</span>
              <strong className="mono">{keyInfo.keyId}</strong>
            </li>
            <li>
              <span>Created Date</span>
              <strong>{keyInfo.generatedAt}</strong>
            </li>
            <li>
              <span>Expiry Date</span>
              <strong>{keyInfo.expiryAt}</strong>
            </li>
          </ul>
        </section>

        <section className="card admin-ek__logs">
          <div className="admin-ek__title">Lịch sử đổi mã PIN gần đây</div>

          <div className="admin-ek__logsTable">
            <div className="admin-ek__logsHead">
              <div>Date</div>
              <div>Action</div>
            </div>

            <div className="admin-ek__logsBody">
              {logsLoading ? (
                <div className="admin-ek__logsRow">
                  <div>Đang tải...</div>
                  <div />
                </div>
              ) : logsError ? (
                <div className="admin-ek__logsRow">
                  <div>{logsError}</div>
                  <div />
                </div>
              ) : logs.length === 0 ? (
                <div className="admin-ek__logsRow">
                  <div>Chưa có lịch sử đổi PIN giảng viên</div>
                  <div />
                </div>
              ) : (
                logs.map((log, index) => (
                  <div className="admin-ek__logsRow" key={index}>
                    <div className="mono">{formatDateTime(log.THOI_GIAN, log.THOI_GIAN_TEXT)}</div>
                    <div>{log.HANH_DONG || "Đổi PIN giảng viên"}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="card admin-ek__change">
          <div className="admin-ek__title">Đổi mã PIN giảng viên</div>

          <form className="admin-ek__form" onSubmit={submit}>
            <label className="admin-ek__field">
              <span>PIN hiện tại</span>
              <input
                type="password"
                name="current"
                value={form.current}
                onChange={onChange}
                placeholder="PIN hiện tại"
              />
            </label>

            <label className="admin-ek__field">
              <span>PIN mới</span>
              <input
                type="password"
                name="next"
                value={form.next}
                onChange={onChange}
                placeholder="PIN mới"
              />
            </label>

            <label className="admin-ek__field">
              <span>Xác nhận PIN mới</span>
              <input
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={onChange}
                placeholder="Nhập lại PIN mới"
              />
            </label>

            {msg && <div className="admin-ek__msg">{msg}</div>}

            <button className="btn btn--primary" type="submit" disabled={loading}>
              {loading ? "Đang đồng bộ dữ liệu CRT..." : "Đổi PIN của tôi"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default AdminEncryptionKey;
