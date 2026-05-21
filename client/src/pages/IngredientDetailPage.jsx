import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getIngredient,
  updateIngredient,
  deleteIngredient,
  addAllergen,
  removeAllergen,
  listAllergens,
} from '../api/ingredients.js';
import './IngredientDetailPage.css';

function IngredientDetailPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [ingredient, setIngredient] = useState(null);
  const [knownAllergens, setKnownAllergens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editCategory, setEditCategory] = useState('');
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const [newAllergen, setNewAllergen] = useState('');
  const [addingAllergen, setAddingAllergen] = useState(false);
  const [allergenError, setAllergenError] = useState('');

  const [deleting, setDeleting] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const data = await getIngredient(name);
      if (!data) {
        setError('Ingredient not found.');
        setIngredient(null);
      } else {
        setIngredient(data);
        setEditCategory(data.category || '');
        setEditName(data.name);
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load ingredient.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    listAllergens().then(setKnownAllergens).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const updated = await updateIngredient(name, {
        category: editCategory.trim() || undefined,
        newName: editName.trim() !== ingredient.name ? editName.trim() : undefined,
      });
      setEditing(false);
      if (updated.name !== ingredient.name) {
        navigate(`/ingredients/${encodeURIComponent(updated.name)}`, { replace: true });
      } else {
        setIngredient(updated);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddAllergen(e) {
    e.preventDefault();
    setAllergenError('');
    if (!newAllergen.trim()) return;
    setAddingAllergen(true);
    try {
      const updated = await addAllergen(name, newAllergen.trim());
      setIngredient(updated);
      setNewAllergen('');
      const refreshedAllergens = await listAllergens();
      setKnownAllergens(refreshedAllergens);
    } catch (err) {
      setAllergenError(err.response?.data?.error || 'Failed to add allergen.');
    } finally {
      setAddingAllergen(false);
    }
  }

  async function handleRemoveAllergen(allergen) {
    try {
      const updated = await removeAllergen(name, allergen);
      setIngredient(updated);
    } catch {
      setAllergenError('Failed to remove allergen.');
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ingredient "${ingredient.name}"?`)) return;
    setDeleting(true);
    try {
      await deleteIngredient(name);
      navigate('/ingredients', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete.');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <main className="ingredient-detail-main">
          <div className="container"><p>Loading…</p></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!ingredient) {
    return (
      <div className="page">
        <Navbar />
        <main className="ingredient-detail-main">
          <div className="container">
            <Link to="/ingredients" className="recipe-back">← Back to ingredients</Link>
            <p style={{ marginTop: 24 }}>{error || 'Not found.'}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <main className="ingredient-detail-main">
        <div className="container">
          <Link to="/ingredients" className="recipe-back">← Back to ingredients</Link>

          <header className="id-header">
            {editing ? (
              <div className="id-edit-form">
                <div className="field">
                  <label className="field-label">Name</label>
                  <input
                    className="field-input"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Category</label>
                  <input
                    className="field-input"
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  />
                </div>
                <div className="id-edit-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setEditing(false);
                      setEditName(ingredient.name);
                      setEditCategory(ingredient.category || '');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <span className="eyebrow">Ingredient</span>
                  <h1>{ingredient.name}</h1>
                  {ingredient.category && (
                    <span className="id-category">{ingredient.category}</span>
                  )}
                </div>
                {isAuthenticated && (
                  <div className="id-header-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditing(true)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={handleDelete}
                      disabled={deleting || ingredient.recipes.length > 0}
                      title={
                        ingredient.recipes.length > 0
                          ? 'Cannot delete — used by recipes'
                          : 'Delete ingredient'
                      }
                    >
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                )}
              </>
            )}
          </header>

          {error && <div className="ingredients-error">{error}</div>}

          <section className="id-section">
            <div className="id-section-head">
              <h2>Allergens</h2>
              <span className="id-section-sub">
                <code>(:Ingredient)-[:CONTAINS_ALLERGEN]-&gt;(:Allergen)</code>
              </span>
            </div>

            <div className="id-allergens">
              {ingredient.allergens.length === 0 ? (
                <p className="id-empty">No allergens linked yet.</p>
              ) : (
                ingredient.allergens.map((a) => (
                  <span key={a} className="id-allergen-chip">
                    {a}
                    {isAuthenticated && (
                      <button
                        type="button"
                        className="id-allergen-remove"
                        onClick={() => handleRemoveAllergen(a)}
                        title="Remove allergen"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))
              )}
            </div>

            {isAuthenticated && (
              <form className="id-allergen-form" onSubmit={handleAddAllergen}>
                <input
                  className="field-input"
                  type="text"
                  placeholder="Add allergen (e.g. soy, gluten)…"
                  value={newAllergen}
                  onChange={(e) => setNewAllergen(e.target.value)}
                  list="known-allergens"
                />
                <datalist id="known-allergens">
                  {knownAllergens.map((a) => (
                    <option key={a.name} value={a.name} />
                  ))}
                </datalist>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={addingAllergen || !newAllergen.trim()}
                >
                  {addingAllergen ? 'Adding…' : '+ Link allergen'}
                </button>
              </form>
            )}
            {allergenError && <div className="ingredients-error">{allergenError}</div>}
          </section>

          <section className="id-section">
            <div className="id-section-head">
              <h2>Recipes using this</h2>
              <span className="id-section-sub">
                <code>(:Recipe)-[:CONTAINS]-&gt;(:Ingredient)</code>
              </span>
            </div>
            {ingredient.recipes.length === 0 ? (
              <p className="id-empty">
                Not used by any recipe yet. You can safely delete this ingredient.
              </p>
            ) : (
              <ul className="id-recipe-list">
                {ingredient.recipes.map((r) => (
                  <li key={r.id} className="id-recipe-row">
                    <Link to={`/recipes/${r.id}`} className="id-recipe-link">
                      {r.title}
                    </Link>
                    {r.cuisine && <span className="id-recipe-cuisine">{r.cuisine}</span>}
                    <span className="id-recipe-qty">
                      {r.quantity} {r.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(ingredient.substitutesOut.length > 0 || ingredient.substitutesIn.length > 0) && (
            <section className="id-section">
              <div className="id-section-head">
                <h2>Substitutes</h2>
                <span className="id-section-sub">
                  <code>SUBSTITUTES_FOR</code>
                </span>
              </div>
              {ingredient.substitutesOut.length > 0 && (
                <div className="id-sub-block">
                  <p className="id-sub-label">Can be substituted with:</p>
                  <ul className="id-sub-list">
                    {ingredient.substitutesOut.map((s) => (
                      <li key={`out-${s.name}`}>
                        <strong>{s.name}</strong>
                        {s.ratio && <span className="id-sub-ratio"> — {s.ratio}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ingredient.substitutesIn.length > 0 && (
                <div className="id-sub-block">
                  <p className="id-sub-label">Used as a substitute for:</p>
                  <ul className="id-sub-list">
                    {ingredient.substitutesIn.map((s) => (
                      <li key={`in-${s.name}`}>
                        <strong>{s.name}</strong>
                        {s.ratio && <span className="id-sub-ratio"> — {s.ratio}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default IngredientDetailPage;
