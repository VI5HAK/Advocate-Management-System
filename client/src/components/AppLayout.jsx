import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import { Menu, ChevronDown, KeyRound, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import "../styles/AppLayout.css";

function AppLayout() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const displayName = user?.fullName || user?.email || "User";
  const userRole = user?.role || "Staff";

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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-md">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <span className="text-[10px] xs:text-xs sm:text-sm font-bold tracking-wider text-slate-400 uppercase">
            NEXORA TECHNOLOGY SERVICES PVT LTD
          </span>


          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className={`flex items-center gap-3 rounded-full bg-slate-50 p-1.5 pr-4 border border-slate-200 hover:border-slate-350 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                dropdownOpen ? "bg-slate-100 ring-2 ring-indigo-500/20" : ""
              }`}
              onClick={toggleDropdown}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col items-start text-left">
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] font-medium text-indigo-650 tracking-wider uppercase leading-none">
                  {userRole}
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute right-0 mt-2.5 w-64 origin-top-right rounded-2xl border border-slate-150 bg-white p-2.5 shadow-xl shadow-slate-200/50 focus:outline-none z-50"
                >
                  <div className="px-3.5 py-3 border-b border-slate-100 mb-2">
                    <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Signed in as</p>
                    <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{displayName}</p>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">{userRole} Profile</p>
                  </div>
                  
                  <div className="space-y-1">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      onClick={handleChangePassword}
                    >
                      <KeyRound className="h-4.5 w-4.5 text-slate-400" />
                      Change Password
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-650 hover:bg-red-50 hover:text-red-700 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4.5 w-4.5 text-red-500" />
                      Log out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

        <footer className="flex h-12 w-full items-center justify-center border-t border-slate-200/80 bg-white px-6 text-center text-xs font-medium text-slate-400">
          &copy; {new Date().getFullYear()} Nexora Technology Services Pvt. Ltd. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default AppLayout;
