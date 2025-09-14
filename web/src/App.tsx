import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { message, Spin } from "antd";
import AppShell from "./components/AppShell";
import type { NavNode } from "./components/AppShell";

function Dashboard() { return <div style={{ padding: 24 }}><h1>Dashboard</h1></div>; }
function Incidents() { return <div style={{ padding: 24 }}><h1>Incidents</h1></div>; }
function Placeholder({ title }: { title: string }) { return <div style={{ padding: 24 }}><h1>{title}</h1></div>; }

export default function App() {
  const [nav, setNav] = useState<NavNode[] | null>(null);

 useEffect(() => {
  const NAV_URL = "/app/config/nav.json";   // absolute to the app mount
  fetch(NAV_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`nav load failed: ${r.status}`);
      return r.json();
    })
    .then(setNav)
    .catch((err) => {
      console.error(err);
      message.error("Failed to load navigation");
      setNav([]);
    });
}, []);

  if (nav === null) {
    return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}><Spin /></div>;
  }

  return (
    <AppShell nav={nav}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/rules/routing" element={<Placeholder title="Routing Rules" />} />
        <Route path="/rules/suppressions" element={<Placeholder title="Suppressions" />} />
        <Route path="/endpoints" element={<Placeholder title="Notification Endpoints" />} />
        <Route path="/sources/alertmanager" element={<Placeholder title="Alertmanager" />} />
        <Route path="/sources/webhook" element={<Placeholder title="Webhook" />} />
        <Route path="/sources/email" element={<Placeholder title="Email/IMAP" />} />
        <Route path="/reports" element={<Placeholder title="Reports" />} />
      </Routes>
    </AppShell>
  );
}
