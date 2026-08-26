import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { SubmitButton, CancelButton } from "../components/ActionButtons";
import { KeyRound, Eye, EyeOff } from "lucide-react";

function ChangePassword() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleCancel = () => {
    navigate(user?.role === "advocate" ? "/appointments" : "/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setSaving(true);
    try {
      await api.put("/auth/change-password", form);
      setSuccess("Password updated successfully.");
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 my-8">
      <header className="border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <KeyRound className="h-7 w-7 shrink-0" />
          </div>
          Change Password
        </h1>
      </header>

      {error && (
        <div className="p-4 text-sm font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 text-sm font-semibold text-green-650 bg-green-50 border border-green-100 rounded-xl" role="status">
          {success}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="current-password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Current Password
          </label>
          <div className="relative">
            <input
              id="current-password"
              type={showCurrentPassword ? "text" : "password"}
              value={form.currentPassword}
              onChange={updateField("currentPassword")}
              required
              autoComplete="current-password"
              className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 outline-none text-sm transition-all focus:ring-4 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50 text-slate-800"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors p-1 rounded-lg hover:bg-slate-100/50 cursor-pointer"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              aria-label={showCurrentPassword ? "Hide password" : "Show password"}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            New Password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              value={form.newPassword}
              onChange={updateField("newPassword")}
              required
              autoComplete="new-password"
              className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 outline-none text-sm transition-all focus:ring-4 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50 text-slate-800"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors p-1 rounded-lg hover:bg-slate-100/50 cursor-pointer"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm-new-password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirm-new-password"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={updateField("confirmPassword")}
              required
              autoComplete="new-password"
              className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 outline-none text-sm transition-all focus:ring-4 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/10 bg-slate-50 text-slate-800"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors p-1 rounded-lg hover:bg-slate-100/50 cursor-pointer"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <CancelButton onClick={handleCancel} disabled={saving} />
          <SubmitButton isEdit={true} saving={saving} disabled={saving} label="Update Password" />
        </div>
      </form>
    </div>
  );
}

export default ChangePassword;
