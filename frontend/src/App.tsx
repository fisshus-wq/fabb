import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Accounts from "./pages/Accounts";
import JournalEntries from "./pages/JournalEntries";
import Invoices from "./pages/Invoices";
import Expenses from "./pages/Expenses";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/accounts" replace />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/journal" element={<JournalEntries />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/expenses" element={<Expenses />} />
      </Route>
    </Routes>
  );
}
