import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMenuItemsForRole } from "../config/menu";
import sidebarLogo from "../assets/sidebar-logo.png";
import "../styles/Sidebar.css";

function SidebarLink({ item, className, onClick }) {
  if (item.path) {
    return (
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `${className} ${isActive ? "is-active" : ""}`
        }
        onClick={onClick}
      >
        {item.label}
      </NavLink>
    );
  }

  return (
    <span className={`${className} is-disabled`} aria-disabled="true">
      {item.label}
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
    <nav className={`sidebar ${isOpen ? "is-open" : ""}`} aria-label="Main navigation">
      <div className="sidebar-brand">
        <img src={sidebarLogo} alt="AMS Logo" className="sidebar-brand-logo" />
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) =>
          item.children ? (
            <li key={item.id} className="sidebar-section">
              <button
                type="button"
                className={`sidebar-section-toggle ${
                  expanded[item.id] ? "is-open" : ""
                }`}
                onClick={() => toggleSection(item.id)}
                aria-expanded={Boolean(expanded[item.id])}
              >
                <span>{item.label}</span>
                <span className="sidebar-chevron" aria-hidden="true" />
              </button>
              {expanded[item.id] && (
                <ul className="sidebar-submenu">
                  {item.children.map((child) => (
                    <li key={child.id}>
                      <SidebarLink
                        item={child}
                        className="sidebar-link sidebar-sublink"
                        onClick={onClose}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ) : (
            <li key={item.id}>
              <SidebarLink item={item} className="sidebar-link sidebar-top-link" onClick={onClose} />
            </li>
          ),
        )}
      </ul>
      <div className="sidebar-footer">
        <button type="button" className="sidebar-logout-btn" onClick={logout}>
          Log out
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;
