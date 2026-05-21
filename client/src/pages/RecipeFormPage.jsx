import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { createRecipe, getRecipe, previewAllergens, updateRecipe } from '../api/recipes.js';
import './RecipeFormPage.css';

const emptyIngredient = () => ({ name: '', quantity: '', unit: '' });

function RecipeFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('');
  const [servings, setServings] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [ingredients, setIngredients] = useState([emptyIngredient()]);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [detectedAllergens, setDetectedAllergens] = useState([]);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    getRecipe(id)
      .then((r) => {
        if (cancelled) return;
        setTitle(r.title || '');
        setCuisine(r.cuisine || '');
        setPrepTimeMinutes(r.prepTimeMinutes ?? '');
        setServings(r.servings ?? '');
        setImageUrl(r.imageUrl || '');
        setInstructions(r.instructions || '');
        setIngredients(
          r.ingredients?.length > 0
            ? r.ingredients.map((ing) => ({
                name: ing.name,
                quantity: ing.quantity ?? '',
                unit: ing.unit ?? '',
              }))
            : [emptyIngredient()]
        );
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load recipe.'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, isEdit]);

  useEffect(() => {
    const names = ingredients
      .map((ing) => ing.name.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) {
      setDetectedAllergens([]);
      return;
    }

    let cancelled = false;
    const handle = setTimeout(() => {
      previewAllergens(names)
        .then((result) => {
          if (!cancelled) setDetectedAllergens(result || []);
        })
        .catch(() => {
          if (!cancelled) setDetectedAllergens([]);
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [ingredients]);

  function updateIngredient(idx, field, value) {
    setIngredients((prev) => prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing)));
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, emptyIngredient()]);
  }

  function removeIngredient(idx) {
    setIngredients((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        cuisine: cuisine.trim(),
        prepTimeMinutes: prepTimeMinutes === '' ? 0 : Number(prepTimeMinutes),
        servings: servings === '' ? 0 : Number(servings),
        imageUrl: imageUrl.trim(),
        instructions: instructions,
        ingredients: ingredients
          .map((ing) => ({
            name: ing.name.trim(),
            quantity: ing.quantity === '' ? 0 : Number(ing.quantity),
            unit: ing.unit.trim(),
          }))
          .filter((ing) => ing.name.length > 0),
      };
      const saved = isEdit ? await updateRecipe(id, payload) : await createRecipe(payload);
      navigate(`/recipes/${saved.id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save recipe.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <main className="recipe-form-main"><div className="container"><p>Loading…</p></div></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <main className="recipe-form-main">
        <div className="container">
          <Link to={isEdit ? `/recipes/${id}` : '/recipes'} className="recipe-back">
            ← Cancel
          </Link>

          <header className="recipe-form-head">
            <span className="eyebrow">{isEdit ? 'Edit recipe' : 'New recipe'}</span>
            <h1>{isEdit ? 'Edit recipe' : 'Add a new recipe'}</h1>
            <p className="recipe-sub">
              Ingredients you add will be linked into the graph — new ones are created automatically.
            </p>
          </header>

          {error && <div className="recipes-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form onSubmit={handleSubmit} className="recipe-form" noValidate>
            <div className="form-grid">
              <div className="field field-span-2">
                <label className="field-label" htmlFor="title">Title *</label>
                <input
                  id="title"
                  className="field-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="cuisine">Cuisine</label>
                <input
                  id="cuisine"
                  className="field-input"
                  type="text"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  placeholder="e.g. Filipino"
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="prep">Prep time (min)</label>
                <input
                  id="prep"
                  className="field-input"
                  type="number"
                  min="0"
                  value={prepTimeMinutes}
                  onChange={(e) => setPrepTimeMinutes(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="servings">Servings</label>
                <input
                  id="servings"
                  className="field-input"
                  type="number"
                  min="0"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="imageUrl">Image URL (optional)</label>
                <input
                  id="imageUrl"
                  className="field-input"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="instructions">Instructions</label>
              <textarea
                id="instructions"
                className="field-input field-textarea"
                rows={6}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Step 1 — …&#10;Step 2 — …"
              />
            </div>

            <div className="ingredients-block">
              <div className="ingredients-head">
                <h3>Ingredients</h3>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addIngredient}>
                  + Add ingredient
                </button>
              </div>

              <div className="ingredients-list">
                {ingredients.map((ing, idx) => (
                  <div className="ingredient-row" key={idx}>
                    <input
                      className="field-input"
                      type="text"
                      placeholder="ingredient name"
                      value={ing.name}
                      onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                    />
                    <input
                      className="field-input ingredient-qty"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="qty"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                    />
                    <input
                      className="field-input ingredient-unit"
                      type="text"
                      placeholder="unit (cup, g…)"
                      value={ing.unit}
                      onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                    />
                    <button
                      type="button"
                      className="ingredient-remove"
                      onClick={() => removeIngredient(idx)}
                      disabled={ingredients.length === 1}
                      title="Remove ingredient"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {detectedAllergens.length > 0 && (
              <div className="allergen-preview">
                <div className="allergen-preview-head">
                  <span className="allergen-preview-label">
                    Allergens inferred from your ingredients
                  </span>
                  <span className="allergen-hint">via the graph</span>
                </div>
                <ul className="allergen-list">
                  {detectedAllergens.map((a) => (
                    <li key={a.allergen} className="allergen-item">
                      <span className="allergen-chip">{a.allergen}</span>
                      <span className="allergen-from">
                        from {a.triggeredBy.join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="recipe-form-foot">
              <Link to={isEdit ? `/recipes/${id}` : '/recipes'} className="btn btn-ghost">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create recipe'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default RecipeFormPage;
