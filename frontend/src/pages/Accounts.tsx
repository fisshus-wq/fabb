import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Account {
  id: number;
  code: string;
  name: string;
  account_type: string;
  description?: string;
  is_active: boolean;
}

const TYPES = ["asset", "liability", "equity", "income", "expense"];

const s: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700 },
  btn: {
    padding: "8px 16px", background: "#4f8ef7", color: "#fff",
    border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14,
  },
  btnSm: {
    padding: "4px 10px", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12,
  },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px #0001" },
  th: { textAlign: "left", padding: "12px 16px", background: "#f0f2f5", fontSize: 12, fontWeight: 600, color: "#555", textTransform: "uppercase" },
  td: { padding: "12px 16px", borderTop: "1px solid #f0f0f0", fontSize: 14 },
  badge: { display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: "capitalize" },
  modal: {
    position: "fixed", inset: 0, background: "#0006", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 100,
  },
  card: { background: "#fff", borderRadius: 10, padding: 28, width: 420, boxShadow: "0 8px 32px #0002" },
  formRow: { marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#444" },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14 },
  actions: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 },
};

const typeColors: Record<string, string> = {
  asset: "#d1fae5", liability: "#fee2e2", equity: "#e0e7ff",
  income: "#fef9c3", expense: "#fce7f3",
};

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", account_type: "asset", description: "" });
  const [error, setError] = useState("");

  const load = () => api.get<Account[]>("/accounts/").then(setAccounts);
  useEffect(() => { load(); }, []);

  const submit = async () => {
    setError("");
    try {
      await api.post("/accounts/", form);
      setShowForm(false);
      setForm({ code: "", name: "", account_type: "asset", description: "" });
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const toggle = async (a: Account) => {
    await api.patch(`/accounts/${a.id}`, { is_active: !a.is_active });
    load();
  };

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>Chart of Accounts</h1>
        <button style={s.btn} onClick={() => setShowForm(true)}>+ Add Account</button>
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            {["Code", "Name", "Type", "Description", "Status", ""].map((h) => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.id}>
              <td style={s.td}><code>{a.code}</code></td>
              <td style={s.td}>{a.name}</td>
              <td style={s.td}>
                <span style={{ ...s.badge, background: typeColors[a.account_type] ?? "#eee" }}>
                  {a.account_type}
                </span>
              </td>
              <td style={{ ...s.td, color: "#888" }}>{a.description ?? "—"}</td>
              <td style={s.td}>
                <span style={{ ...s.badge, background: a.is_active ? "#d1fae5" : "#f3f4f6", color: a.is_active ? "#065f46" : "#6b7280" }}>
                  {a.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td style={s.td}>
                <button
                  style={{ ...s.btnSm, background: a.is_active ? "#fee2e2" : "#d1fae5", color: a.is_active ? "#991b1b" : "#065f46" }}
                  onClick={() => toggle(a)}
                >
                  {a.is_active ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
          {accounts.length === 0 && (
            <tr><td colSpan={6} style={{ ...s.td, textAlign: "center", color: "#aaa", padding: 40 }}>No accounts yet.</td></tr>
          )}
        </tbody>
      </table>

      {showForm && (
        <div style={s.modal} onClick={() => setShowForm(false)}>
          <div style={s.card} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>New Account</h2>
            {error && <p style={{ color: "#dc2626", marginBottom: 12, fontSize: 13 }}>{error}</p>}
            {(["code", "name", "description"] as const).map((field) => (
              <div key={field} style={s.formRow}>
                <label style={s.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <input
                  style={s.input}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                />
              </div>
            ))}
            <div style={s.formRow}>
              <label style={s.label}>Type</label>
              <select style={s.input} value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={s.actions}>
              <button style={{ ...s.btnSm, background: "#f3f4f6", color: "#374151", padding: "8px 16px" }} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={s.btn} onClick={submit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
