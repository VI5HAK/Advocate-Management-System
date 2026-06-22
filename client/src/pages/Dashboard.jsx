import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const STAT_LABELS = {
  advocates: "Advocates",
  clients: "Clients",
  cases: "Cases",
  appointments: "Appointments",
  roles: "Roles",
};

const STAT_ROUTES = {
  advocates: "/advocate",
  clients: "/client",
  cases: "/case",
  appointments: "/appointments",
  roles: "/masters/role",
};

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setError("Could not load dashboard data."));
  }, []);

  const cards = summary
    ? Object.entries(summary.counts).map(([key, value]) => ({
      key,
      label: STAT_LABELS[key] || key,
      value,
    }))
    : [];

  const handleCardClick = (key) => {
    const route = STAT_ROUTES[key];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      <p>Welcome to the Advocate Appointment System home screen.</p>

      {error && <p className="dashboard-error">{error}</p>}

      {!summary && !error && <p className="dashboard-loading">Loading…</p>}

      {summary && (
        <div className="dashboard-stats">
          {cards.map((card) => (
            <div
              key={card.key}
              className={`dashboard-stat-card card-${card.key}`}
              onClick={() => handleCardClick(card.key)}
            >
              <span className="dashboard-stat-value">{card.value}</span>
              <span className="dashboard-stat-label">{card.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;

