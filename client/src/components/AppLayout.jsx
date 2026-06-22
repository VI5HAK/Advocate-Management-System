import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import profileIcon from "../assets/profile.svg";
import downArrowIcon from "../assets/down-arrow.svg";
import "../styles/AppLayout.css";

function AppLayout() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const displayName = user?.fullName || user?.email || "User";

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  const handleChangePassword = () => {
    setDropdownOpen(false);
    navigate("/change-password");
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <header className="app-header">
          <span className="app-header-title">NEXORA TECHNOLOGY SERVICES PVT LTD</span>
          <div className="app-header-actions" ref={dropdownRef}>
            <button
              type="button"
              className={`app-profile-trigger ${dropdownOpen ? "active" : ""}`}
              onClick={toggleDropdown}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <img src={profileIcon} alt="" className="profile-icon-img" />
              <span className="profile-username">{displayName}</span>
              <img src={downArrowIcon} alt="" className="down-arrow-img" />
            </button>

            {dropdownOpen && (
              <div className="app-profile-dropdown">
                <div className="dropdown-welcome">
                  Hi, {displayName}
                </div>
                <div className="dropdown-actions-grid">
                  <button
                    type="button"
                    className="dropdown-box-btn"
                    onClick={handleChangePassword}
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    className="dropdown-box-btn logout-box-btn"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          &copy; {new Date().getFullYear()} Nexora Technology Services Pvt. Ltd. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default AppLayout;
