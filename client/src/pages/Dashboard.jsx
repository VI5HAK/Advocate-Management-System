import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import entityService from "../api/services/entity.service";
import {
  UserCheck,
  Users,
  Briefcase,
  Calendar,
  Scale,
  Shield,
  ArrowRight,
  LayoutDashboard
} from "lucide-react";
import { motion } from "motion/react";
import { HelpButton } from "../components/common/ActionButtons";

const STAT_LABELS = {
  advocates: "Advocates",
  clients: "Clients",
  cases: "Cases",
  appointments: "Appointments",
  hearings: "Hearings",
  roles: "Roles",
};

const STAT_ROUTES = {
  advocates: "/advocate",
  clients: "/client",
  cases: "/case",
  appointments: "/appointments",
  hearings: "/hearings",
  roles: "/masters/role",
};

const CARD_THEMES = {
  advocates: {
    icon: UserCheck,
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50/30 hover:bg-blue-50/60 border-blue-200/60",
    text: "text-indigo-600",
    iconBg: "bg-blue-100/80",
  },
  clients: {
    icon: Users,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50/30 hover:bg-emerald-50/60 border-emerald-200/60",
    text: "text-emerald-700",
    iconBg: "bg-emerald-100/80",
  },
  cases: {
    icon: Briefcase,
    color: "from-purple-500 to-violet-600",
    bg: "bg-purple-50/30 hover:bg-purple-50/60 border-purple-200/60",
    text: "text-purple-700",
    iconBg: "bg-purple-100/80",
  },
  appointments: {
    icon: Calendar,
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50/30 hover:bg-amber-50/60 border-amber-200/60",
    text: "text-amber-700",
    iconBg: "bg-amber-100/80",
  },
  hearings: {
    icon: Scale,
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50/30 hover:bg-rose-50/60 border-rose-200/60",
    text: "text-rose-700",
    iconBg: "bg-rose-100/80",
  },
  roles: {
    icon: Shield,
    color: "from-slate-500 to-slate-700",
    bg: "bg-slate-50/50 hover:bg-slate-100/50 border-slate-200/80",
    text: "text-slate-700",
    iconBg: "bg-slate-200/70",
  },
};

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    entityService
      .getDashboardSummary()
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <LayoutDashboard className="h-8 w-8 shrink-0" />
          </div>
          Dashboard
          <HelpButton title="Dashboard" />
        </h1>
        <p className="text-sm font-medium text-slate-550 mt-1">
          Welcome to the Advocate Management System home screen.
        </p>
      </div>

      {error && (
        <div className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-2xl">
          {error}
        </div>
      )}

      {!summary && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 h-40 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-8 bg-slate-200 rounded w-1/4" />
                </div>
                <div className="h-12 w-12 bg-slate-200 rounded-xl" />
              </div>
              <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                <div className="h-3 bg-slate-200 rounded w-1/4" />
                <div className="h-4 w-4 bg-slate-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const theme = CARD_THEMES[card.key] || CARD_THEMES.roles;
            const CardIcon = theme.icon;
            return (
              <motion.div
                key={card.key}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col justify-between shadow-sm cursor-pointer transition-all duration-200 bg-white ${theme.bg}`}
                onClick={() => handleCardClick(card.key)}
              >
                {/* Accent line on top of card */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.color}`} />
                
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {card.label}
                    </span>
                    <span className="block text-4xl font-extrabold text-slate-800 tracking-tight">
                      {card.value}
                    </span>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${theme.iconBg} ${theme.text}`}>
                    <CardIcon className="h-6 w-6 shrink-0" />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                  <span>View Details</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;

