import React, { useEffect, useState } from "react";
import "./MEK.css";

function EncryptionKey() {
  const keyInfo = {
    status: "Active",
    keyId: "EK-2024-001-A",
    generatedAt: "2024-01-15",
    expiryAt: "2025-01-15",
  };

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState("");

  const [form, setForm] = useState({
    current: "",
    next: "",
    confirm: ""
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
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
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Không tải được lịch sử đổi PIN");
      }

      const history = Array.isArray(data) ? data : (data.data || data.history || []);
      setLogs(history.slice(0, 5));
    } catch (error) {
      console.error("Lỗi lấy lịch sử đổi PIN:", error);
      setLogsError(error.message || "Không tải được lịch sử đổi PIN");
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

    if (form.next.length < 4) {
      return setMsg("PIN mới phải có ít nhất 4 chữ số.");
    }

    if (form.next !== form.confirm) {
      return setMsg("PIN mới và xác nhận PIN không khớp.");
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/set-pin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            currentPin: form.current,
            newPin: form.next
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || "Cập nhật PIN thất bại");
        setLoading(false);
        return;
      }

      setMsg(data.message || "Cập nhật PIN thành công!");

      setForm({
        current: "",
        next: "",
        confirm: ""
      });

      await fetchPinChangeHistory();
      setLoading(false);
    } catch (error) {
      console.error(error);
      setMsg("Lỗi server khi đổi PIN");
      setLoading(false);
    }
  };

  return (
    <div className="ek">
      <div className="ek__grid">
        {/* Key status */}
        <section className="card ek__status">
          <div className="ek__statusHeader">
            <div className="ek__title one">
              Encryption Key Status
            </div>
            <span className="badge badge--ok">
              {keyInfo.status}
            </span>
          </div>

          <ul className="ek__kv">
            <li>
              <span>Key ID:</span>
              <strong className="mono">
                {keyInfo.keyId}
              </strong>
            </li>

            <li>
              <span>Generated Date:</span>
              <strong>{keyInfo.generatedAt}</strong>
            </li>

            <li>
              <span>Expiry Date:</span>
              <strong>{keyInfo.expiryAt}</strong>
            </li>
          </ul>
        </section>

        {/* Logs */}
        <section className="card ek__logs">
          <div className="ek__title two">
            Recent PIN Update Logs
          </div>

          <div className="ek__logsTable">
            <div className="ek__logsHead">
              <div>Date</div>
              <div>Action</div>
            </div>

            <div className="ek__logsBody">
              {logsLoading ? (
                <div className="ek__logsRow">
                  <div>Loading...</div>
                  <div></div>
                </div>
              ) : logsError ? (
                <div className="ek__logsRow">
                  <div>{logsError}</div>
                  <div></div>
                </div>
              ) : logs.length === 0 ? (
                <div className="ek__logsRow">
                  <div>Chưa có lịch sử đổi PIN</div>
                  <div></div>
                </div>
              ) : (
                logs.map((log, i) => (
                  <div className="ek__logsRow" key={i}>
                    <div className="mono">
                      {formatDateTime(log.THOI_GIAN, log.THOI_GIAN_TEXT)}
                    </div>
                    <div>{log.HANH_DONG || "Đổi PIN"}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Change PIN */}
        <section className="card ek__change">
          <div className="ek__title">
            Change Your PIN
          </div>

          <form className="ek__form" onSubmit={submit}>
            <label className="ek__field">
              <input
                type="password"
                name="current"
                value={form.current}
                onChange={onChange}
                placeholder="Current PIN"
              />
            </label>

            <label className="ek__field">
              <input
                type="password"
                name="next"
                value={form.next}
                onChange={onChange}
                placeholder="New PIN"
              />
            </label>

            <label className="ek__field">
              <input
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={onChange}
                placeholder="Confirm New PIN"
              />
            </label>

            {msg && (
              <div className="ek__msg">
                {msg}
              </div>
            )}

            <button
              className="btn btn--primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Updating..." : "Change PIN"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default EncryptionKey;
