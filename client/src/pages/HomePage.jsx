import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './HomePage.css';

function HomePage() {
  const { user } = useAuth();

  return (
    <div className="page">
      <Navbar />
      <main className="home-main">
        <div className="container">
          <span className="eyebrow">Signed in</span>
          <h1>Welcome back, {user?.username}.</h1>
          <p className="home-sub">
            You're connected to the Sangkap graph. Pick where to go next.
          </p>

          <div className="home-grid">
            <Link to="/recipes" className="home-card">
              <span className="home-card-icon">🍳</span>
              <h3>Browse Recipes</h3>
              <p>Search, filter, and explore the full recipe network.</p>
            </Link>

            <Link to="/pantry" className="home-card">
              <span className="home-card-icon">🥘</span>
              <h3>Pantry Mode</h3>
              <p>Tell us what you have — get recipes you can cook tonight.</p>
            </Link>

            <Link to="/dashboard" className="home-card">
              <span className="home-card-icon">📊</span>
              <h3>Dashboard</h3>
              <p>See what's popular: ingredients, cuisines, allergens.</p>
            </Link>

            <Link to="/backup" className="home-card">
              <span className="home-card-icon">💾</span>
              <h3>Graph Backup</h3>
              <p>Download or restore the entire Neo4j graph as JSON.</p>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;
