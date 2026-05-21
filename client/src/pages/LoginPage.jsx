import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './AuthPage.css';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from || '/recipes';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <Link to="/" className="auth-side-brand">
          <span>●—●</span>
          <span>Sangkap</span>
        </Link>

        <div>
          <h1 className="auth-side-headline">Welcome back.</h1>
          <p className="auth-side-sub">
            Log in to discover what's cookable from your pantry tonight,
            track recipes you love, and get smarter suggestions powered by Neo4j.
          </p>
          <ul className="auth-side-bullets">
            <li>Pantry-aware recipe matching</li>
            <li>Allergen-safe filtering in one query</li>
            <li>Collaborative recommendations</li>
          </ul>
        </div>

        <p className="auth-side-foot">ITD110 — Case Study #2 · Graph database demo</p>
      </aside>

      <main className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <h2>Log in to Sangkap</h2>
          <p className="auth-form-sub">Use your username and password.</p>

          {error && <div className="auth-error">{error}</div>}

          <div className="field">
            <label className="field-label" htmlFor="username">Username</label>
            <input
              id="username"
              className="field-input"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="field-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={submitting}
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>

          <div className="auth-form-foot">
            New to Sangkap? <Link to="/signup">Create an account</Link>
          </div>
        </form>
      </main>
    </div>
  );
}

export default LoginPage;
