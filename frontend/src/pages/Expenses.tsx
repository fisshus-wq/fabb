import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Account { id: number; code: string; name: string; }
interface Expense { id: number; reference: string; vendor_name: string; date: string; due_date?: string; amount: number; category?: string; status: string; notes?: string; account_id?: number; }

const STATUSES = ["pending", "paid", "void"];

const statusColors: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#fef9c3", color: "#854d0e" },
  paid: { bg: "#d1fae5", color: "#065f46" },
  void: { bg: "#fee2e2", color: "#991b1b" },
};

const s: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700 },
  btn: { padding: "8px 16px", background: "#4f8ef7", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 },
  btnSm: { padding: "4px 10px", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px #0001" },
  th: { textAlign: "left", padding: "12px 16px", background: "#f0f2f5", fontSize: 12, fontWeight: 600, color: "#555", textTransform: "uppercase" },
  td: { padding: "12px 16px", borderTop: "1px solid #f0f0f0", fontSize: 14 },
  badge: { display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 },
  modal: { position: "fixed", inset: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  card: { background: "#fff", borderRadius: 10, padding: 28, width: 480, boxShadow: "0 8px 32px #0002" },
  formRow: { marginBottom: 14 },
  label: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#444" },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14 },
  actions: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 },
};

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reference: "", vendor_name: "", date: "", due_date: "", amount: "", category: "", notes: "", account_id: "" });
  const [error, setError] = useState("");

  const load = () => api.get<Expense[]>("/expenses/").then(setExpenses);
  useEffect(() => {
    load();
    api.get<Account[]>("/accounts/").then(setAccounts);
  }, []);

  const submit = async () => {
    setError("");
    try {
      await api.post("/expenses/", {
        ...form,
        amount: Number(form.amount),
        account_id: form.account_id ? Number(form.account_id) : null,
        due_date: form.due_date || null,
      });
      setShowForm(false);
      setForm({ reference: "", vendor_name: "", date: "", due_date: "", amount: "", category: "", notes: "", account_id: "" });
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const setStatus = async (id: number, status: string) => {
    await api.patch(`/expenses/${id}`, { status });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this expense?")) return;
    await api.delete(`/expenses/${id}`);
    load();
  };

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>Expenses / Bills</h1>
        <button style={s.btn} onClick={() => setShowForm(true)}>+ Add Expense</button>
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            {["Ref", "Vendor", "Date", "Due", "Amount", "Category", "Status", ""].map((h) => <th key={h} style={s.th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => (
            <tr key={exp.id}>
              <td style={s.td}><code>{exp.reference}</code></td>
              <td style={s.td}>{exp.vendor_name}</td>
              <td style={s.td}>{exp.date}</td>
              <td style={{ ...s.td, color: "#888" }}>{exp.due_date ?? "—"}</td>
              <td style={s.td}><strong>${Number(exp.amount).toFixed(2)}</strong></td>
              <td style={{ ...s.td, color: "#555" }}>{exp.category ?? "—"}</td>
              <td style={s.td}><span style={{ ...s.badge, ...statusColors[exp.status] }}>{exp.status}</span></td>
              <td style={s.td}>
                <select
                  style={{ ...s.btnSm, background: "#e0e7ff", color: "#3730a3", padding: "4px 8px" }}
                  value={exp.status}
                  onChange={(e) => setStatus(exp.id, e.target.value)}
                >
                  {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
                <button style={{ ...s.btnSm, background: "#fee2e2", color: "#991b1b", marginLeft: 6 }} onClick={() => del(exp.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {expenses.length === 0 && (
            <tr><td colSpan={8} style={{ ...s.td, textAlign: "center", color: "#aaa", padding: 40 }}>No expenses yet.</td></tr>
          )}
        </tbody>
      </table>

      {showForm && (
        <div style={s.modal} onClick={() => setShowForm(false)}>
          <div style={s.card} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>Add Expense / Bill</h2>
            {error && <p style={{ color: "#dc2626", marginBottom: 12, fontSize: 13 }}>{error}</p>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div><label style={s.label}>Reference</label><input style={s.input} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
              <div><label style={s.label}>Vendor Name</label><input style={s.input} value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} /></div>
              <div><label style={s.label}>Date</label><input type="date" style={s.input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><label style={s.label}>Due Date</label><input type="date" style={s.input} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              <div><label style={s.label}>Amount</label><input type="number" min="0" style={s.input} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><label style={s.label}>Category</label><input style={s.input} placeholder="e.g. Rent, Software" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            </div>
            <div style={s.formRow}>
              <label style={s.label}>Expense Account</label>
              <select style={s.input} value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
                <option value="">— none —</option>
                {accounts.filter((a) => a.name).map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
              </select>
            </div>
            <div style={s.formRow}>
              <label style={s.label}>Notes</label>
              <input style={s.input} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
