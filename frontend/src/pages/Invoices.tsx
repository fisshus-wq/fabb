import { useEffect, useState } from "react";
import { api } from "../api/client";

interface LineItem { id: number; description: string; quantity: number; unit_price: number; amount: number; }
interface Invoice { id: number; number: string; customer_name: string; customer_email?: string; date: string; due_date: string; status: string; notes?: string; line_items: LineItem[]; }
interface FormLine { description: string; quantity: string; unit_price: string; }

const STATUSES = ["draft", "sent", "paid", "void"];

const statusColors: Record<string, { bg: string; color: string }> = {
  draft: { bg: "#f3f4f6", color: "#374151" },
  sent: { bg: "#dbeafe", color: "#1e40af" },
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
  card: { background: "#fff", borderRadius: 10, padding: 28, width: 640, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px #0002" },
  formRow: { marginBottom: 14 },
  label: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#444" },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14 },
  actions: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 },
};

const emptyLine = (): FormLine => ({ description: "", quantity: "1", unit_price: "" });

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({ number: "", customer_name: "", customer_email: "", date: "", due_date: "", notes: "" });
  const [lines, setLines] = useState<FormLine[]>([emptyLine()]);
  const [error, setError] = useState("");

  const load = () => api.get<Invoice[]>("/invoices/").then(setInvoices);
  useEffect(() => { load(); }, []);

  const updateLine = (i: number, field: keyof FormLine, val: string) => {
    setLines(lines.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  };

  const total = (inv: Invoice) => inv.line_items.reduce((s, i) => s + i.amount, 0);

  const submit = async () => {
    setError("");
    try {
      await api.post("/invoices/", {
        ...form,
        line_items: lines.map((l) => ({ description: l.description, quantity: Number(l.quantity), unit_price: Number(l.unit_price) })),
      });
      setShowForm(false);
      setForm({ number: "", customer_name: "", customer_email: "", date: "", due_date: "", notes: "" });
      setLines([emptyLine()]);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const setStatus = async (id: number, status: string) => {
    await api.patch(`/invoices/${id}`, { status });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this invoice?")) return;
    await api.delete(`/invoices/${id}`);
    load();
  };

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>Invoices</h1>
        <button style={s.btn} onClick={() => setShowForm(true)}>+ New Invoice</button>
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            {["Number", "Customer", "Date", "Due", "Total", "Status", ""].map((h) => <th key={h} style={s.th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <>
              <tr key={inv.id} style={{ cursor: "pointer" }} onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}>
                <td style={s.td}><code>{inv.number}</code></td>
                <td style={s.td}>{inv.customer_name}</td>
                <td style={s.td}>{inv.date}</td>
                <td style={s.td}>{inv.due_date}</td>
                <td style={s.td}><strong>${total(inv).toFixed(2)}</strong></td>
                <td style={s.td}>
                  <span style={{ ...s.badge, ...statusColors[inv.status] }}>{inv.status}</span>
                </td>
                <td style={s.td}>
                  <select
                    style={{ ...s.btnSm, background: "#e0e7ff", color: "#3730a3", padding: "4px 8px" }}
                    value={inv.status}
                    onChange={(e) => { e.stopPropagation(); setStatus(inv.id, e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                  <button style={{ ...s.btnSm, background: "#fee2e2", color: "#991b1b", marginLeft: 6 }} onClick={(e) => { e.stopPropagation(); del(inv.id); }}>Delete</button>
                </td>
              </tr>
              {expanded === inv.id && (
                <tr key={`${inv.id}-exp`}>
                  <td colSpan={7} style={{ ...s.td, background: "#f8f9fa" }}>
                    <table style={{ width: "100%", fontSize: 13 }}>
                      <thead>
                        <tr>{["Description", "Qty", "Unit Price", "Amount"].map((h) => (
                          <th key={h} style={{ textAlign: "left", padding: "4px 8px", color: "#888", fontWeight: 600 }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {inv.line_items.map((li) => (
                          <tr key={li.id}>
                            <td style={{ padding: "4px 8px" }}>{li.description}</td>
                            <td style={{ padding: "4px 8px" }}>{li.quantity}</td>
                            <td style={{ padding: "4px 8px" }}>${Number(li.unit_price).toFixed(2)}</td>
                            <td style={{ padding: "4px 8px" }}><strong>${Number(li.amount).toFixed(2)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {inv.notes && <p style={{ marginTop: 8, fontSize: 13, color: "#555" }}>Notes: {inv.notes}</p>}
                  </td>
                </tr>
              )}
            </>
          ))}
          {invoices.length === 0 && (
            <tr><td colSpan={7} style={{ ...s.td, textAlign: "center", color: "#aaa", padding: 40 }}>No invoices yet.</td></tr>
          )}
        </tbody>
      </table>

      {showForm && (
        <div style={s.modal} onClick={() => setShowForm(false)}>
          <div style={s.card} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>New Invoice</h2>
            {error && <p style={{ color: "#dc2626", marginBottom: 12, fontSize: 13 }}>{error}</p>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div><label style={s.label}>Invoice #</label><input style={s.input} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></div>
              <div><label style={s.label}>Customer Name</label><input style={s.input} value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
              <div><label style={s.label}>Customer Email</label><input style={s.input} value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} /></div>
              <div></div>
              <div><label style={s.label}>Date</label><input type="date" style={s.input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><label style={s.label}>Due Date</label><input type="date" style={s.input} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div style={s.formRow}><label style={s.label}>Notes</label><input style={s.input} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

            <div style={{ marginTop: 16, marginBottom: 8 }}>
              <strong style={{ fontSize: 13 }}>Line Items</strong>
              <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr", gap: 8, marginTop: 8, marginBottom: 6 }}>
                {["Description", "Qty", "Unit Price"].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase" }}>{h}</span>
                ))}
              </div>
              {lines.map((l, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr", gap: 8, marginBottom: 6 }}>
                  <input style={{ ...s.input, padding: "6px 8px" }} placeholder="description" value={l.description} onChange={(e) => updateLine(i, "description", e.target.value)} />
                  <input style={{ ...s.input, padding: "6px 8px" }} type="number" min="0" value={l.quantity} onChange={(e) => updateLine(i, "quantity", e.target.value)} />
                  <input style={{ ...s.input, padding: "6px 8px" }} type="number" min="0" placeholder="0.00" value={l.unit_price} onChange={(e) => updateLine(i, "unit_price", e.target.value)} />
                </div>
              ))}
              <button style={{ ...s.btnSm, background: "#e0e7ff", color: "#3730a3", marginTop: 4 }} onClick={() => setLines([...lines, emptyLine()])}>+ Add line</button>
            </div>

            <div style={s.actions}>
              <button style={{ ...s.btnSm, background: "#f3f4f6", color: "#374151", padding: "8px 16px" }} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={s.btn} onClick={submit}>Create Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
