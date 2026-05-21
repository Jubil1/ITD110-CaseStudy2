import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { getDashboard } from '../api/stats.js';
import './DashboardPage.css';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const ORANGE = '#C84B31';
const ORANGE_SOFT = 'rgba(200,75,49,0.18)';

const PALETTE = [
  '#C84B31', '#D2691E', '#E8A33D', '#5B8C5A', '#3F7CAC',
  '#7A5C8F', '#B85C5C', '#3E8E89', '#A35A2B', '#8C8C8C',
];

function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <span className="stat-card-value">{value}</span>
      <span className="stat-card-label">{label}</span>
      {hint && <span className="stat-card-hint">{hint}</span>}
    </div>
  );
}

function ChartCard({ title, subtitle, cypher, children }) {
  return (
    <section className="chart-card">
      <header className="chart-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="chart-sub">{subtitle}</p>}
        </div>
        {cypher && <code className="chart-cypher">{cypher}</code>}
      </header>
      <div className="chart-body">{children}</div>
    </section>
  );
}

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getDashboard()
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {
        if (!cancelled) setError('Failed to load dashboard data.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <main className="dashboard-main">
          <div className="container"><p>Loading dashboard…</p></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page">
        <Navbar />
        <main className="dashboard-main">
          <div className="container">
            <p>{error || 'No data.'}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { overview, topIngredients, cuisines, allergens, topRecipes, topCreators, ingredientCategories } = data;

  const topIngredientsChart = {
    labels: topIngredients.map((i) => i.name),
    datasets: [
      {
        label: 'Recipes that use this',
        data: topIngredients.map((i) => i.recipeCount),
        backgroundColor: ORANGE_SOFT,
        borderColor: ORANGE,
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const cuisinesChart = {
    labels: cuisines.map((c) => c.cuisine),
    datasets: [
      {
        data: cuisines.map((c) => c.recipeCount),
        backgroundColor: cuisines.map((_, i) => PALETTE[i % PALETTE.length]),
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const allergensChart = {
    labels: allergens.map((a) => a.allergen),
    datasets: [
      {
        label: 'Recipes containing this allergen',
        data: allergens.map((a) => a.recipeCount),
        backgroundColor: allergens.map((a) =>
          a.recipeCount === 0 ? 'rgba(0,0,0,0.06)' : ORANGE_SOFT
        ),
        borderColor: allergens.map((a) =>
          a.recipeCount === 0 ? 'rgba(0,0,0,0.15)' : ORANGE
        ),
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const categoriesChart = {
    labels: ingredientCategories.map((c) => c.category),
    datasets: [
      {
        data: ingredientCategories.map((c) => c.count),
        backgroundColor: ingredientCategories.map((_, i) => PALETTE[i % PALETTE.length]),
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0, font: { size: 11 } },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
    },
  };

  const horizontalBarOpts = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0, font: { size: 11 } },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  const donutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { font: { size: 12 }, padding: 12 } },
    },
    cutout: '60%',
  };

  return (
    <div className="page">
      <Navbar />
      <main className="dashboard-main">
        <div className="container">
          <header className="dashboard-head">
            <span className="eyebrow">Data visualization</span>
            <h1>Sangkap Dashboard</h1>
            <p className="dashboard-sub">
              Every number here is a single Cypher aggregation against the live graph —
              no offline batch jobs, no materialised views. Refresh the page to see your data update in real time.
            </p>
          </header>

          <div className="stat-grid">
            <StatCard label="Recipes" value={overview.recipes} />
            <StatCard label="Ingredients" value={overview.ingredients} />
            <StatCard label="Users" value={overview.users} />
            <StatCard label="Cuisines" value={overview.cuisines} />
            <StatCard
              label="Allergens"
              value={overview.allergens}
              hint="FDA Big 9"
            />
            <StatCard
              label="Likes"
              value={overview.likes}
              hint="LIKED relationships"
            />
            <StatCard
              label="Total edges"
              value={overview.relationships}
              hint="all relationships"
            />
          </div>

          <div className="dashboard-grid">
            <ChartCard
              title="Top ingredients"
              subtitle="Most-used canonical ingredients across all recipes"
            >
              <div className="chart-canvas">
                <Bar data={topIngredientsChart} options={barOpts} />
              </div>
            </ChartCard>

            <ChartCard
              title="Recipes by cuisine"
              subtitle="Distribution across cooking traditions"
            >
              <div className="chart-canvas">
                <Doughnut data={cuisinesChart} options={donutOpts} />
              </div>
            </ChartCard>

            <ChartCard
              title="Allergen exposure"
              subtitle="How many recipes contain each FDA Big 9 allergen (via 2-hop traversal)"
            >
              <div className="chart-canvas chart-tall">
                <Bar data={allergensChart} options={horizontalBarOpts} />
              </div>
            </ChartCard>

            <ChartCard
              title="Ingredient categories"
              subtitle="How the pantry is organised"
            >
              <div className="chart-canvas">
                <Doughnut data={categoriesChart} options={donutOpts} />
              </div>
            </ChartCard>

            <ChartCard
              title="Most-liked recipes"
              subtitle="Top 5 by LIKED edges"
            >
              {topRecipes.length === 0 ? (
                <p className="ranking-empty">No likes yet.</p>
              ) : (
                <ol className="ranking-list">
                  {topRecipes.map((r, idx) => (
                    <li key={r.id} className="ranking-row">
                      <span className="ranking-num">#{idx + 1}</span>
                      <div className="ranking-main">
                        <Link to={`/recipes/${r.id}`} className="ranking-title">
                          {r.title}
                        </Link>
                        <span className="ranking-meta">
                          {r.cuisine || 'no cuisine'} · by @{r.createdBy || 'unknown'}
                        </span>
                      </div>
                      <span className="ranking-count">
                        {r.likeCount} <span>♥</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </ChartCard>

            <ChartCard
              title="Top creators"
              subtitle="Users with the most recipes"
            >
              {topCreators.length === 0 ? (
                <p className="ranking-empty">No creators yet.</p>
              ) : (
                <ol className="ranking-list">
                  {topCreators.map((u, idx) => (
                    <li key={u.username} className="ranking-row">
                      <span className="ranking-num">#{idx + 1}</span>
                      <div className="ranking-main">
                        <span className="ranking-title">@{u.username}</span>
                        <span className="ranking-meta">
                          {u.receivedLikes} like{u.receivedLikes === 1 ? '' : 's'} received
                        </span>
                      </div>
                      <span className="ranking-count">
                        {u.recipeCount} <span>recipes</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </ChartCard>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default DashboardPage;
