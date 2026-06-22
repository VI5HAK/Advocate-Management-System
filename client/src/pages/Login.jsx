import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";
import lawyerImage from "../assets/lawyer.webp";

function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, login, user } = useAuth();
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
    <div className="login-page">
      <section className="login-form-panel" aria-labelledby="login-heading">
        <div className="login-form-inner">
          <h1 id="login-heading" className="login-title">
            Advocate Login
          </h1>
          <p className="login-subtitle">
            Secure access to Advocate management systems.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <div className="form-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="practitioner@firm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in to dashboard"}
            </button>
          </form>

          <hr className="login-divider" />

          <p className="login-forgot">
            Forgot Password?
            <a href="#forgot-password">Contact Administrator</a>
          </p>
        </div>
      </section>

      <aside className="login-hero-panel" aria-hidden="true">
        <img src={lawyerImage} alt="" className="login-hero-image" />
        <div className="login-hero-overlay" />
        <blockquote className="login-quote">
          <p className="login-quote-text">
            &ldquo;A lawyer operates as a soldier in the army of justice. If you aren't ready to fight, you are misplaced in the profession.&rdquo;
          </p>
          <footer className="login-quote-attribution">
            <span className="login-quote-line" aria-hidden="true" />
            Ram Jethmalani
          </footer>
        </blockquote>
      </aside>
    </div>
  );
}

export default Login;
