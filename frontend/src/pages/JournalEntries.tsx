import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Account { id: number; code: string; name: string; }
interface Line { account_id: number; debit: string; credit: string; description: string; }
interface JournalLine { id: number; account: Account; debit: number; credit: number; description?: string; }
interface JournalEntry { id: number; reference: string; date: string; description?: string; lines: JournalLine[]; }

const s: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700 },
  btn: { padding: "8px 16px", background: "#4f8ef7", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 },
  btnSm: { padding: "4px 10px", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px #0001" },
  th: { textAlign: "left", padding: "12px 16px", background: "#f0f2f5", fontSize: 12, fontWeight: 600, color: "#555", textTransform: "uppercase" },
  td: { padding: "12px 16px", borderTop: "1px solid #f0f0f0", fontSize: 14 },
  modal: { position: "fixed", inset: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  card: { background: "#fff", borderRadius: 10, padding: 28, width: 620, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px #0002" },
  formRow: { marginBottom: 14 },
  label: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#444" },
  input: { width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14 },
  actions: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 },
  linesHeader: { display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", gap: 8, marginBottom: 6 },
  lineRow: { display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", gap: 8, marginBottom: 6, alignItems: "center" },
};

const emptyLine = (): Line => ({ account_id: 0, debit: "", credit: "", description: "" });

export default function JournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({ reference: "", date: "", description: "" });
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine()]);
  const [error, setError] = useState("");

  const load = () => api.get<JournalEntry[]>("/journal-entries/").then(setEntries);
  useEffect(() => {
    load();
    api.get<Account[]>("/accounts/").then(setAccounts);
  }, []);

  const updateLine = (i: number, field: keyof Line, val: string) => {
    setLines(lines.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  };

  const submit = async () => {
    setError("");
    try {
      const payload = {
        ...form,
        lines: lines.map((l) => ({
          account_id: Number(l.account_id),
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description,
        })),
      };
      await api.post("/journal-entries/", payload);
      setShowForm(false);
      setForm({ reference: "", date: "", description: "" });
      setLines([emptyLine(), emptyLine()]);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    await api.delete(`/journal-entries/${id}`);
    load();
  };

  const fmt = (n: number) => n > 0 ? n.toFixed(2) : "—";

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>Journal Entries</h1>
        <button style={s.btn} onClick={() => setShowForm(true)}>+ New Entry</button>
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            {["Reference", "Date", "Description", "Lines", ""].map((h) => <th key={h} style={s.th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <>
              <tr key={e.id} style={{ cursor: "pointer" }} onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                <td style={s.td}><code>{e.reference}</code></td>
                <td style={s.td}>{e.date}</td>
                <td style={{ ...s.td, color: "#555" }}>{e.description ?? "—"}</td>
                <td style={s.td}>{e.lines.length}</td>
                <td style={s.td}>
                  <button style={{ ...s.btnSm, background: "#fee2e2", color: "#991b1b" }} onClick={(ev) => { ev.stopPropagation(); del(e.id); }}>Delete</button>
                </td>
              </tr>
              {expanded === e.id && (
                <tr key={`${e.id}-exp`}>
                  <td colSpan={5} style={{ ...s.td, background: "#f8f9fa" }}>
                    <table style={{ width: "100%", fontSize: 13 }}>
                      <thead>
                        <tr>
                          {["Account", "Description", "Debit", "Credit"].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: "4px 8px", color: "#888", fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {e.lines.map((l) => (
                          <tr key={l.id}>
                            <td style={{ padding: "4px 8px" }}>{l.account.code} — {l.account.name}</td>
                            <td style={{ padding: "4px 8px", color: "#888" }}>{l.description ?? "—"}</td>
                            <td style={{ padding: "4px 8px", color: "#065f46" }}>{fmt(l.debit)}</td>
                            <td style={{ padding: "4px 8px", color: "#991b1b" }}>{fmt(l.credit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </>
          ))}
          {entries.length === 0 && (
            <tr><td colSpan={5} style={{ ...s.td, textAlign: "center", color: "#aaa", padding: 40 }}>No journal entries yet.</td></tr>
          )}
        </tbody>
      </table>

      {showForm && (
        <div style={s.modal} onClick={() => setShowForm(false)}>
          <div style={s.card} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>New Journal Entry</h2>
            {error && <p style={{ color: "#dc2626", marginBottom: 12, fontSize: 13 }}>{error}</p>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={s.label}>Reference</label>
                <input style={s.input} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Date</label>
                <input type="date" style={s.input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div style={s.formRow}>
              <label style={s.label}>Description</label>
              <input style={s.input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div style={{ marginTop: 16, marginBottom: 8 }}>
              <strong style={{ fontSize: 13 }}>Lines</strong>
              <div style={{ ...s.linesHeader, marginTop: 8 }}>
                {["Account", "Description", "Debit", "Credit"].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase" }}>{h}</span>
                ))}
              </div>
              {lines.map((l, i) => (
                <div key={i} style={s.lineRow}>
                  <select style={{ ...s.input, padding: "6px 8px" }} value={l.account_id} onChange={(e) => updateLine(i, "account_id", e.target.value)}>
                    <option value={0}>— select —</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                  </select>
                  <input style={{ ...s.input, padding: "6px 8px" }} placeholder="note" value={l.description} onChange={(e) => updateLine(i, "description", e.target.value)} />
                  <input style={{ ...s.input, padding: "6px 8px" }} type="number" min="0" placeholder="0.00" value={l.debit} onChange={(e) => updateLine(i, "debit", e.target.value)} />
                  <input style={{ ...s.input, padding: "6px 8px" }} type="number" min="0" placeholder="0.00" value={l.credit} onChange={(e) => updateLine(i, "credit", e.target.value)} />
                </div>
              ))}
              <button style={{ ...s.btnSm, background: "#e0e7ff", color: "#3730a3", marginTop: 4 }} onClick={() => setLines([...lines, emptyLine()])}>
                + Add line
              </button>
            </div>

            <div style={s.actions}>
              <button style={{ ...s.btnSm, background: "#f3f4f6", color: "#374151", padding: "8px 16px" }} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={s.btn} onClick={submit}>Post Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
