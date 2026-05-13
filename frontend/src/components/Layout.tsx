import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/accounts", label: "Chart of Accounts" },
  { to: "/journal", label: "Journal Entries" },
  { to: "/invoices", label: "Invoices" },
  { to: "/expenses", label: "Expenses" },
];

const s: Record<string, React.CSSProperties> = {
  shell: { display: "flex", minHeight: "100vh" },
  sidebar: {
    width: 220,
    background: "#1a1a2e",
    color: "#e0e0e0",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
    flexShrink: 0,
  },
  logo: {
    fontSize: 22,
    fontWeight: 700,
    color: "#fff",
    padding: "0 24px 24px",
    letterSpacing: 1,
  },
  nav: { display: "flex", flexDirection: "column", gap: 4 },
  link: {
    display: "block",
    padding: "10px 24px",
    color: "#b0b0c0",
    textDecoration: "none",
    borderRadius: 0,
    fontSize: 14,
    transition: "background 0.15s, color 0.15s",
  },
  activeLink: {
    background: "#16213e",
    color: "#fff",
    borderLeft: "3px solid #4f8ef7",
    paddingLeft: 21,
  },
  main: { flex: 1, padding: 32, overflowY: "auto" },
};

export default function Layout() {
  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.logo}>fabb</div>
        <nav style={s.nav}>
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                ...s.link,
                ...(isActive ? s.activeLink : {}),
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}
