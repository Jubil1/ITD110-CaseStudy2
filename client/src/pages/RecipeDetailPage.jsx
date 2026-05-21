import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import LikeButton from '../components/LikeButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { deleteRecipe, getRecipe } from '../api/recipes.js';
import './RecipeDetailPage.css';

function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRecipe(id);
      setRecipe(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load recipe.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!window.confirm('Delete this recipe? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteRecipe(id);
      navigate('/recipes', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete recipe.');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <main className="recipe-main"><div className="container"><p>Loading recipe…</p></div></main>
        <Footer />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="page">
        <Navbar />
        <main className="recipe-main">
          <div className="container">
            <p className="recipe-error">{error || 'Recipe not found.'}</p>
            <Link to="/recipes" className="btn btn-ghost">← Back to recipes</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = isAuthenticated && user?.username === recipe.createdBy;

  return (
    <div className="page">
      <Navbar />
      <main className="recipe-main">
        <div className="container">
          <Link to="/recipes" className="recipe-back">← Back to recipes</Link>

          <div className="recipe-head">
            <div>
              {recipe.cuisine && (
                <span className="recipe-chip recipe-chip-cuisine">{recipe.cuisine}</span>
              )}
              <h1>{recipe.title}</h1>
              <div className="recipe-meta">
                <span>⏱ {recipe.prepTimeMinutes || '—'} min</span>
                <span>·</span>
                <span>🍽 serves {recipe.servings || '—'}</span>
                {recipe.createdBy && (<>
                  <span>·</span>
                  <span>by <strong>{recipe.createdBy}</strong></span>
                </>)}
              </div>
            </div>

            <div className="recipe-actions">
              <LikeButton
                recipeId={recipe.id}
                initialLiked={recipe.likedByViewer}
                initialCount={recipe.likeCount}
              />
              {isOwner && (
                <>
                  <Link to={`/recipes/${recipe.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </>
              )}
            </div>
          </div>

          <section className="recipe-body">
            <article className="recipe-instructions">
              <h2>Instructions</h2>
              {recipe.instructions
                ? <p style={{ whiteSpace: 'pre-line' }}>{recipe.instructions}</p>
                : <p className="recipe-empty">No instructions yet.</p>}
            </article>

            <aside className="recipe-side">
              <div className="recipe-panel">
                <h3>Ingredients</h3>
                {recipe.ingredients?.length > 0 ? (
                  <ul className="ingredient-list">
                    {recipe.ingredients.map((ing) => (
                      <li key={ing.name}>
                        <span className="ing-name">{ing.name}</span>
                        <span className="ing-qty">{ing.quantity} {ing.unit}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="recipe-empty">No ingredients listed.</p>
                )}
              </div>

              {recipe.allergens?.length > 0 && (
                <div className="recipe-panel allergen-panel">
                  <h3>Contains allergens</h3>
                  <div className="allergen-chips">
                    {recipe.allergens.map((a) => (
                      <span key={a} className="recipe-chip recipe-chip-allergen">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default RecipeDetailPage;
