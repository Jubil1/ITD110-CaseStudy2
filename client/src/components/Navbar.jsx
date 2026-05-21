import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Navbar.css';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="32" height="32">
              <defs>
                <linearGradient id="navgrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D2691E" />
                  <stop offset="100%" stopColor="#C84B31" />
                </linearGradient>
              </defs>
              <rect width="64" height="64" rx="14" fill="url(#navgrad)" />
              <g fill="#FFF7EB">
                <circle cx="22" cy="20" r="4.5" />
                <circle cx="44" cy="20" r="4.5" />
                <circle cx="32" cy="42" r="6" />
                <circle cx="14" cy="46" r="3.5" />
                <circle cx="52" cy="46" r="3.5" />
              </g>
              <g stroke="#FFF7EB" strokeWidth="2.2" fill="none" strokeLinecap="round">
                <line x1="22" y1="20" x2="32" y2="42" />
                <line x1="44" y1="20" x2="32" y2="42" />
                <line x1="22" y1="20" x2="44" y2="20" />
                <line x1="14" y1="46" x2="32" y2="42" />
                <line x1="52" y1="46" x2="32" y2="42" />
              </g>
            </svg>
          </span>
          <span className="brand-name">Sangkap</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/recipes">Recipes</NavLink>
          <NavLink to="/ingredients">Ingredients</NavLink>
          <NavLink to="/pantry">Pantry</NavLink>
          <NavLink to="/substitutes">Swaps</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>

          {isAuthenticated ? (
            <>
              <span className="nav-user">Hi, <strong>{user?.username}</strong></span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-ghost btn-sm">Log in</NavLink>
              <NavLink to="/signup" className="btn btn-primary btn-sm">Sign up</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
