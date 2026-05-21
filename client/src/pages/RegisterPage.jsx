import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './AuthPage.css';

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(username.trim(), email.trim(), password);
      navigate('/recipes', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Sign up failed. Please try again.';
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
          <h1 className="auth-side-headline">Create your account.</h1>
          <p className="auth-side-sub">
            Sign up to save recipes, share with friends, and get personalized picks
            from a graph of dishes, ingredients, cuisines, and allergens.
          </p>
          <ul className="auth-side-bullets">
            <li>Save and like recipes</li>
            <li>Build your pantry profile</li>
            <li>Personalized recommendations</li>
          </ul>
        </div>

        <p className="auth-side-foot">ITD110 — Case Study #2</p>
      </aside>

      <main className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <h2>Create your Sangkap account</h2>
          <p className="auth-form-sub">It takes about 30 seconds.</p>

          {error && <div className="auth-error">{error}</div>}

          <div className="field">
            <label className="field-label" htmlFor="username">Username</label>
            <input
              id="username"
              className="field-input"
              type="text"
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
            />
            <span className="field-help">At least 3 characters · letters, numbers, no spaces.</span>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="field-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="field-input"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <span className="field-help">At least 6 characters. We store this hashed with bcrypt.</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={submitting}
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>

          <div className="auth-form-foot">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </form>
      </main>
    </div>
  );
}

export default RegisterPage;
