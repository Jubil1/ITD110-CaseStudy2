import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import { listRecipes, listCuisines } from '../api/recipes.js';
import './RecipesPage.css';

function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listCuisines().then(setCuisines).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const handle = setTimeout(() => {
      listRecipes({ q: search, cuisine })
        .then((data) => {
          if (!cancelled) setRecipes(data);
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err.response?.data?.error || 'Failed to load recipes.');
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [search, cuisine]);

  return (
    <div className="page">
      <Navbar />
      <main className="recipes-main">
        <div className="container">
          <header className="recipes-header">
            <div>
              <span className="eyebrow">Recipes</span>
              <h1>Explore the recipe graph</h1>
              <p className="recipes-sub">
                Every recipe links to its ingredients, cuisine, allergens, and the user who created it.
              </p>
            </div>
            <Link to="/recipes/new" className="btn btn-primary">+ Add recipe</Link>
          </header>

          <div className="recipes-toolbar">
            <input
              type="search"
              placeholder="Search by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="recipes-search"
            />

            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="recipes-filter"
            >
              <option value="">All cuisines</option>
              {cuisines.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.recipeCount})
                </option>
              ))}
            </select>
          </div>

          {error && <div className="recipes-error">{error}</div>}

          {loading ? (
            <div className="recipes-state">Loading recipes…</div>
          ) : recipes.length === 0 ? (
            <div className="recipes-state">
              No recipes match your filters yet. <Link to="/recipes/new">Add one →</Link>
            </div>
          ) : (
            <>
              <p className="recipes-count">{recipes.length} recipe{recipes.length === 1 ? '' : 's'}</p>
              <div className="recipes-grid">
                {recipes.map((r) => (
                  <RecipeCard key={r.id} recipe={r} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default RecipesPage;
