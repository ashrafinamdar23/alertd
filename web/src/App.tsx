import { Routes, Route, Link } from "react-router-dom";

function Dashboard() {
  return <div style={{ padding: 24 }}><h1>Dashboard</h1></div>;
}

function Incidents() {
  return <div style={{ padding: 24 }}><h1>Incidents</h1></div>;
}

export default function App() {
  return (
    <>
      {/* temporary links just to test routing; we'll replace with AntD Menu next */}
      <nav style={{ padding: 12 }}>
        <Link to="/" style={{ marginRight: 12 }}>Home</Link>
        <Link to="/incidents">Incidents</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/incidents" element={<Incidents />} />
      </Routes>
    </>
  );
}
