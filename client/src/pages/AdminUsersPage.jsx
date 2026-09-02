import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../api/services/auth.service";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  CreateButton,
  SubmitButton,
  CancelButton,
  DeleteButton,
  HelpButton,
} from "../components/common/ActionButtons";
import { UserCog } from "lucide-react";

function AdminUsersPage() {
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await authService.getAdminUsers();
      setAdmins(data);
    } catch {
      setError("Failed to load admin users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "list") {
      fetchAdmins();
    }
  }, [fetchAdmins, view]);

  const updateField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const openCreateForm = () => {
    setForm({ email: "", fullName: "", password: "", confirmPassword: "" });
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setView("form");
  };

  const backToList = () => {
    setView("list");
    setError("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await authService.createAdminUser(form);
      backToList();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create admin.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (admin) => {
    setAdminToDelete(admin);
  };

  const confirmDelete = async () => {
    if (!adminToDelete) return;
    setError("");
    try {
      await authService.deleteAdminUser(adminToDelete.id);
      setAdminToDelete(null);
      await fetchAdmins();
    } catch (err) {
      setAdminToDelete(null);
      setError(err.response?.data?.message || "Failed to delete admin.");
    }
  };

  if (view === "form") {
    return (
      <div className="advocate-form-page">
        <h1 className="advocate-form-title flex items-center justify-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <UserCog className="h-8 w-8 shrink-0" />
          </div>
          Create Admin
        </h1>

        {error && (
          <p className="master-error" role="alert">
            {error}
          </p>
        )}

        <form className="advocate-form" onSubmit={handleCreate}>
          <div className="advocate-form-row advocate-form-row-wide">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              value={form.email}
              onChange={updateField("email")}
              required
            />
          </div>

          <div className="advocate-form-row advocate-form-row-wide">
            <label htmlFor="admin-full-name">Full Name</label>
            <input
              id="admin-full-name"
              type="text"
              value={form.fullName}
              onChange={updateField("fullName")}
              required
            />
          </div>

          <div className="advocate-form-row advocate-form-row-pair">
            <label htmlFor="admin-password">Password</label>
            <div className="password-input-container">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={updateField("password")}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <label htmlFor="admin-confirm-password">Confirm Password</label>
            <div className="password-input-container">
              <input
                id="admin-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={updateField("confirmPassword")}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="advocate-form-actions">
            <SubmitButton isEdit={false} saving={saving} />
            <CancelButton onClick={backToList} disabled={saving} />
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="master-page">
      <header className="flex items-center justify-between gap-3 sm:gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <UserCog className="h-6 w-6 sm:h-8 sm:w-8 shrink-0" />
          </div>
          <span className="truncate">Admin Users</span>
          <HelpButton title="Admin Users" />
        </h1>
        <CreateButton onClick={openCreateForm} label="Create Admin" />
      </header>

      {error && (
        <p className="master-error" role="alert">
          {error}
        </p>
      )}

      <div className="master-table-wrap">
        <table className="master-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Full Name</th>
              <th className="master-actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="master-empty">
                  Loading…
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={3} className="master-empty">
                  No admin users found.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr
                  key={admin.id}
                  className="hover:bg-indigo-50/30 even:bg-slate-200/60 transition-colors"
                >
                  <td>{admin.email}</td>
                  <td>{admin.fullName}</td>
                  <td className="master-actions">
                    <DeleteButton onClick={() => handleDelete(admin)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        isOpen={!!adminToDelete}
        title="Confirm Delete"
        message={adminToDelete ? `Delete admin "${adminToDelete.email}"?` : ""}
        onConfirm={confirmDelete}
        onCancel={() => setAdminToDelete(null)}
      />
    </div>
  );
}

export default AdminUsersPage;
