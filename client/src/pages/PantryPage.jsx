import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { listIngredients, listAllergens } from '../api/ingredients.js';
import { pantryMatch } from '../api/recipes.js';
import './PantryPage.css';

const PANTRY_KEY = 'sangkap.pantry';

function loadStoredPantry() {
  try {
    const raw = localStorage.getItem(PANTRY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function PantryPage() {
  const [allIngredients, setAllIngredients] = useState([]);
  const [allergenOptions, setAllergenOptions] = useState([]);

  const [pantry, setPantry] = useState(loadStoredPantry);
  const [excluded, setExcluded] = useState([]);
  const [minMatch, setMinMatch] = useState(0);

  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    Promise.all([listIngredients(), listAllergens()])
      .then(([ings, allergens]) => {
        setAllIngredients(ings);
        setAllergenOptions(allergens);
      })
      .catch(() => setError('Failed to load ingredients.'));
  }, []);

  useEffect(() => {
    localStorage.setItem(PANTRY_KEY, JSON.stringify(pantry));
  }, [pantry]);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return allIngredients
      .filter((i) => !pantry.includes(i.name))
      .filter((i) => i.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [search, allIngredients, pantry]);

  async function runSearch(currentPantry, currentExcluded, currentMinMatch) {
    if (currentPantry.length === 0) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const data = await pantryMatch({
        pantry: currentPantry,
        excludeAllergens: currentExcluded,
        minMatch: currentMinMatch,
      });
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to search.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pantry.length === 0) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    const handle = setTimeout(() => {
      runSearch(pantry, excluded, minMatch);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pantry, excluded, minMatch]);

  function addToPantry(name) {
    const canon = String(name).trim().toLowerCase();
    if (!canon) return;
    if (pantry.includes(canon)) return;
    setPantry((p) => [...p, canon]);
    setSearch('');
  }

  function removeFromPantry(name) {
    setPantry((p) => p.filter((x) => x !== name));
  }

  function clearPantry() {
    setPantry([]);
    setResults([]);
    setHasSearched(false);
  }

  function toggleAllergen(name) {
    setExcluded((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  }

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        addToPantry(suggestions[0].name);
      } else if (search.trim()) {
        addToPantry(search);
      }
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="pantry-main">
        <div className="container">
          <header className="pantry-head">
            <span className="eyebrow">The star feature</span>
            <h1>Pantry Mode</h1>
            <p className="pantry-sub">
              Tell us what's in your kitchen — we'll find recipes you can make right now,
              ranked by how much of each recipe you already have.
            </p>
          </header>

          <div className="pantry-layout">
            <aside className="pantry-controls">
              <section className="pantry-section">
                <div className="ps-head">
                  <h2>Your pantry</h2>
                  {pantry.length > 0 && (
                    <button
                      type="button"
                      className="link-btn"
                      onClick={clearPantry}
                    >
                      clear all
                    </button>
                  )}
                </div>

                <div className="pantry-search-wrap">
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Type ingredient name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                  />
                  {suggestions.length > 0 && (
                    <ul className="pantry-suggestions">
                      {suggestions.map((s) => (
                        <li key={s.name}>
                          <button
                            type="button"
                            onClick={() => addToPantry(s.name)}
                          >
                            <span className="sug-name">{s.name}</span>
                            <span className="sug-meta">
                              {s.recipeCount} recipe{Number(s.recipeCount) === 1 ? '' : 's'}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {pantry.length === 0 ? (
                  <p className="pantry-empty-mini">
                    Your pantry is empty. Try adding <em>garlic</em>, <em>onion</em>,{' '}
                    <em>soy sauce</em>, or <em>egg</em>.
                  </p>
                ) : (
                  <ul className="pantry-chips">
                    {pantry.map((name) => (
                      <li key={name} className="pantry-chip">
                        {name}
                        <button
                          type="button"
                          className="chip-remove"
                          onClick={() => removeFromPantry(name)}
                          aria-label={`remove ${name}`}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="pantry-section">
                <div className="ps-head">
                  <h2>Exclude allergens</h2>
                </div>
                <div className="allergen-toggles">
                  {allergenOptions.map((a) => {
                    const active = excluded.includes(a.name);
                    return (
                      <button
                        key={a.name}
                        type="button"
                        className={`allergen-toggle ${active ? 'is-active' : ''}`}
                        onClick={() => toggleAllergen(a.name)}
                      >
                        {a.name}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="pantry-section">
                <div className="ps-head">
                  <h2>Minimum match</h2>
                  <span className="ps-sub">{Math.round(minMatch * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={Math.round(minMatch * 100)}
                  onChange={(e) => setMinMatch(Number(e.target.value) / 100)}
                  className="pantry-slider"
                />
                <div className="slider-labels">
                  <span>any overlap</span>
                  <span>perfect match</span>
                </div>
              </section>
            </aside>

            <section className="pantry-results">
              {error && <div className="ingredients-error">{error}</div>}

              {!hasSearched && pantry.length === 0 ? (
                <div className="pantry-placeholder">
                  <div className="pp-icon" aria-hidden="true">🥘</div>
                  <h2>Add ingredients to get started</h2>
                  <p>
                    Pick a few items from your kitchen on the left.
                    Results appear instantly as you build up your pantry.
                  </p>
                </div>
              ) : loading ? (
                <p className="pantry-loading">Searching the graph…</p>
              ) : results.length === 0 ? (
                <div className="pantry-placeholder">
                  <div className="pp-icon" aria-hidden="true">🤔</div>
                  <h2>No recipes match yet</h2>
                  <p>
                    Try adding more ingredients, lowering the minimum match,
                    or removing some allergen exclusions.
                  </p>
                </div>
              ) : (
                <>
                  <div className="results-summary">
                    <strong>{results.length}</strong> recipe
                    {results.length === 1 ? '' : 's'} match your pantry
                    {excluded.length > 0 && (
                      <> (excluding {excluded.join(', ')})</>
                    )}
                  </div>
                  <ul className="match-list">
                    {results.map((r) => (
                      <MatchCard key={r.id} recipe={r} />
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function MatchCard({ recipe }) {
  const pct = Math.round(recipe.matchRatio * 100);
  const tier = pct === 100 ? 'perfect' : pct >= 75 ? 'great' : pct >= 50 ? 'good' : 'partial';
  return (
    <li className={`match-card match-${tier}`}>
      <Link to={`/recipes/${recipe.id}`} className="match-card-inner">
        <div className="match-card-head">
          <div>
            <h3 className="match-title">{recipe.title}</h3>
            <div className="match-meta">
              {recipe.cuisine && <span>{recipe.cuisine}</span>}
              {recipe.prepTimeMinutes != null && <span>{recipe.prepTimeMinutes} min</span>}
              {recipe.servings != null && <span>{recipe.servings} servings</span>}
              {recipe.createdBy && <span>by @{recipe.createdBy}</span>}
            </div>
          </div>
          <div className="match-score">
            <span className="match-pct">{pct}%</span>
            <span className="match-label">
              {recipe.matched.length}/{recipe.totalIngredients}
            </span>
          </div>
        </div>

        <div className="match-bar">
          <div className="match-bar-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="match-cols">
          <div className="match-col">
            <p className="match-col-label">You have</p>
            <ul className="ing-chips have">
              {recipe.matched.map((n) => (
                <li key={`have-${n}`}>{n}</li>
              ))}
            </ul>
          </div>
          {recipe.missing.length > 0 && (
            <div className="match-col">
              <p className="match-col-label">You need</p>
              <ul className="ing-chips need">
                {recipe.missing.map((n) => (
                  <li key={`need-${n}`}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {recipe.allergens.length > 0 && (
          <div className="match-allergens">
            <span className="ma-label">Contains:</span>
            {recipe.allergens.map((a) => (
              <span key={a} className="ma-chip">{a}</span>
            ))}
          </div>
        )}
      </Link>
    </li>
  );
}

export default PantryPage;
