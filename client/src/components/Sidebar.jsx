import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMenuItemsForRole } from "../config/menu";
import sidebarLogo from "../assets/sidebar-logo.png";
import {
  Home,
  LayoutDashboard,
  Database,
  Users,
  UserCheck,
  Briefcase,
  Calendar,
  Scale,
  ClipboardList,
  CheckCircle,
  FileSpreadsheet,
  ChevronDown,
  X,
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import "../styles/Sidebar.css";

const ICON_MAP = {
  home: Home,
  dashboard: LayoutDashboard,
  masters: Database,
  advocate: UserCheck,
  client: Users,
  case: Briefcase,
  appointments: Calendar,
  hearings: Scale,
  reports: ClipboardList,
  "completed-appointments": CheckCircle,
  "hearing-report": FileSpreadsheet,
};

function SidebarLink({ item, className, onClick, icon: Icon }) {
  if (item.path) {
    return (
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            isActive
              ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-200/80 hover:bg-indigo-700"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
          }`
        }
        onClick={onClick}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
        <span>{item.label}</span>
      </NavLink>
    );
  }

  return (
    <span className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 cursor-not-allowed" aria-disabled="true">
      {Icon && <Icon className="h-5 w-5 shrink-0" />}
      <span>{item.label}</span>
    </span>
  );
}

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const menuItems = getMenuItemsForRole(user?.role);
  const location = useLocation();
  const [expanded, setExpanded] = useState(() => {
    const initial = {};
    menuItems.forEach((item) => {
      if (item.children) {
        const isActive = item.children.some(
          (child) => child.path && location.pathname.startsWith(child.path),
        );
        initial[item.id] = isActive;
      }
    });
    return initial;
  });

  const toggleSection = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 md:sticky md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      aria-label="Main navigation"
    >
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200/80">
        <img src={sidebarLogo} alt="AMS Logo" className="h-9 w-auto object-contain" />
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 no-scrollbar">
        {menuItems.map((item) => {
          const Icon = ICON_MAP[item.id];
          return item.children ? (
            <div key={item.id} className="space-y-1">
              <button
                type="button"
                className={`flex w-full items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  expanded[item.id]
                    ? "text-indigo-600 hover:bg-slate-50"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                onClick={() => toggleSection(item.id)}
                aria-expanded={Boolean(expanded[item.id])}
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="h-5 w-5 shrink-0" />}
                  <span>{item.label}</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    expanded[item.id] ? "rotate-180 text-indigo-600" : ""
                  }`}
                />
              </button>
              
              <AnimatePresence initial={false}>
                {expanded[item.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden pl-11 pr-2 py-0.5 space-y-1"
                  >
                    {item.children.map((child) => {
                      const isChildActive = location.pathname === child.path;
                      return (
                        <NavLink
                          key={child.id}
                          to={child.path}
                          onClick={onClose}
                          className={() =>
                            `flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-200 ${
                              isChildActive
                                ? "bg-indigo-100 text-indigo-700 font-bold"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                            }`
                          }
                        >
                          <div className={`h-1.5 w-1.5 rounded-full ${isChildActive ? "bg-indigo-600" : "bg-slate-350"}`} />
                          {child.label}
                        </NavLink>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <SidebarLink
              key={item.id}
              item={item}
              icon={Icon}
              onClick={onClose}
            />
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200/80">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-red-650 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
          onClick={logout}
        >
          <LogOut className="h-4.5 w-4.5 text-red-500" />
          Log out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
