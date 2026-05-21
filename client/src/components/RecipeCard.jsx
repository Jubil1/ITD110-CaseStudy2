import { Link } from 'react-router-dom';
import './RecipeCard.css';

function RecipeCard({ recipe }) {
  return (
    <Link to={`/recipes/${recipe.id}`} className="recipe-card">
      <div className="recipe-card-top">
        <span className="recipe-card-cuisine">{recipe.cuisine || 'Uncategorized'}</span>
        <span className="recipe-card-likes" title="Likes">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21s-7-4.5-9.33-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.33 6C19 16.5 12 21 12 21z" />
          </svg>
          {recipe.likeCount ?? 0}
        </span>
      </div>
      <h3 className="recipe-card-title">{recipe.title}</h3>
      <div className="recipe-card-meta">
        <span>{recipe.ingredientCount ?? 0} ingredients</span>
        <span className="dot-sep">·</span>
        <span>{recipe.prepTimeMinutes ?? '—'} min</span>
        <span className="dot-sep">·</span>
        <span>serves {recipe.servings ?? '—'}</span>
      </div>
      {recipe.createdBy && (
        <div className="recipe-card-author">by <strong>{recipe.createdBy}</strong></div>
      )}
    </Link>
  );
}

export default RecipeCard;
