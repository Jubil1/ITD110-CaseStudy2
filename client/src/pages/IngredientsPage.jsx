import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  listIngredients,
  listAllergens,
  listCategories,
  createIngredient,
} from '../api/ingredients.js';
import './IngredientsPage.css';

function IngredientsPage() {
  const { isAuthenticated } = useAuth();

  const [ingredients, setIngredients] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState('');
  const [allergen, setAllergen] = useState('');
  const [category, setCategory] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newAllergens, setNewAllergens] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    Promise.all([listAllergens(), listCategories()])
      .then(([a, c]) => {
        setAllergens(a);
        setCategories(c);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const handle = setTimeout(() => {
      listIngredients({ search, allergen, category })
        .then((data) => { if (!cancelled) setIngredients(data); })
        .catch(() => {
          if (!cancelled) setError('Failed to load ingredients.');
        })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [search, allergen, category]);

  const summary = useMemo(() => {
    const total = ingredients.length;
    const withAllergens = ingredients.filter((i) => i.allergens.length > 0).length;
    const unused = ingredients.filter((i) => Number(i.recipeCount) === 0).length;
    return { total, withAllergens, unused };
  }, [ingredients]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    if (!newName.trim()) {
      setCreateError('Name is required.');
      return;
    }
    setCreating(true);
    try {
      await createIngredient({
        name: newName.trim(),
        category: newCategory.trim() || 'misc',
        allergens: newAllergens
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setNewName('');
      setNewCategory('');
      setNewAllergens('');
      setShowCreate(false);
      const refreshed = await listIngredients({ search, allergen, category });
      setIngredients(refreshed);
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create ingredient.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="ingredients-main">
        <div className="container">
          <header className="ingredients-head">
            <div>
              <span className="eyebrow">Graph nodes</span>
              <h1>Ingredients</h1>
            </div>
            {isAuthenticated && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowCreate((v) => !v)}
              >
                {showCreate ? 'Cancel' : '+ New ingredient'}
              </button>
            )}
          </header>

          {showCreate && (
            <form onSubmit={handleCreate} className="ingredient-create-card">
              <div className="ic-grid">
                <div className="field field-span-2">
                  <label className="field-label">Name *</label>
                  <input
                    className="field-input"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. coconut milk"
                    autoFocus
                  />
                </div>
                <div className="field">
                  <label className="field-label">Category</label>
                  <input
                    className="field-input"
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. dairy-egg, condiment, meat"
                  />
                </div>
                <div className="field field-span-2">
                  <label className="field-label">Allergens (comma-separated, optional)</label>
                  <input
                    className="field-input"
                    type="text"
                    value={newAllergens}
                    onChange={(e) => setNewAllergens(e.target.value)}
                    placeholder="e.g. soy, gluten"
                  />
                </div>
              </div>
              {createError && <div className="ingredients-error">{createError}</div>}
              <div className="ic-foot">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Create ingredient'}
                </button>
              </div>
            </form>
          )}

          <div className="ingredients-summary">
            <div className="summary-stat">
              <span className="stat-value">{summary.total}</span>
              <span className="stat-label">visible</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{summary.withAllergens}</span>
              <span className="stat-label">w/ allergens</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{summary.unused}</span>
              <span className="stat-label">unused</span>
            </div>
          </div>

          <div className="ingredients-filters">
            <input
              type="search"
              className="field-input"
              placeholder="Search ingredient…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="field-input"
              value={allergen}
              onChange={(e) => setAllergen(e.target.value)}
            >
              <option value="">All allergens</option>
              {allergens.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name} ({a.ingredientCount})
                </option>
              ))}
            </select>
            <select
              className="field-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {error && <div className="ingredients-error">{error}</div>}

          {loading ? (
            <p className="ingredients-empty">Loading ingredients…</p>
          ) : ingredients.length === 0 ? (
            <p className="ingredients-empty">
              No ingredients found. Try adjusting your filters.
            </p>
          ) : (
            <div className="ingredients-grid">
              {ingredients.map((i) => (
                <Link
                  to={`/ingredients/${encodeURIComponent(i.name)}`}
                  key={i.name}
                  className="ingredient-card"
                >
                  <div className="ic-header">
                    <h3 className="ic-name">{i.name}</h3>
                    {i.category && (
                      <span className="ic-category">{i.category}</span>
                    )}
                  </div>
                  <div className="ic-allergens">
                    {i.allergens.length > 0 ? (
                      i.allergens.map((a) => (
                        <span key={a} className="ic-allergen-chip">{a}</span>
                      ))
                    ) : (
                      <span className="ic-allergen-none">no allergens</span>
                    )}
                  </div>
                  <div className="ic-meta">
                    <strong>{i.recipeCount}</strong> recipe
                    {Number(i.recipeCount) === 1 ? '' : 's'} use this
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default IngredientsPage;
