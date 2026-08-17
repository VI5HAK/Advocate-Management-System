import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import lawyerImage from "../assets/lawyer.webp";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      navigate("/", { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-slate-50 font-sans overflow-hidden lg:flex-row flex-col">
      {/* Form panel */}
      <section className="flex-1 flex items-center justify-center bg-white p-8 sm:p-12 md:p-16 lg:p-20 relative z-10 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md space-y-8"
        >
          <div className="space-y-2">
            <h1 id="login-heading" className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Advocate Login
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Secure access to Advocate Management System.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 text-xs font-semibold text-red-650 bg-red-50 border border-red-100 rounded-xl"
                role="alert"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-bold tracking-wider text-slate-500 uppercase">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="practitioner@firm.com"
                  className="pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm w-full bg-slate-50/55 focus:bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs font-bold tracking-wider text-slate-500 uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm w-full bg-slate-50/55 focus:bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm tracking-wider uppercase rounded-xl transition-all shadow-md shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign in to dashboard"}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-250"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Access</span>
            <div className="flex-grow border-t border-slate-250"></div>
          </div>

          <p className="text-center text-xs font-semibold text-slate-400 tracking-wide">
            Forgot Password? Contact Administrator to reset.
          </p>
        </motion.div>
      </section>

      <aside className="hidden lg:flex lg:w-1/2 relative bg-slate-950 items-end p-16 overflow-hidden min-h-0" aria-hidden="true">
        <img
          src={lawyerImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-900/10" />
        
        <motion.blockquote
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-xl space-y-6"
        >
          <p className="text-2xl sm:text-3xl font-serif italic font-medium leading-relaxed text-white drop-shadow-sm">
            &ldquo;A lawyer operates as a soldier in the army of justice. If you aren't ready to fight, you are misplaced in the profession.&rdquo;
          </p>
          <footer className="flex items-center gap-3">
            <span className="w-8 h-[2px] bg-amber-500" />
            <span className="text-xs font-bold tracking-widest text-amber-500 uppercase">
              Ram Jethmalani
            </span>
          </footer>
        </motion.blockquote>
      </aside>
    </div>
  );
}

export default Login;
