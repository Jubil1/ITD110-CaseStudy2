import { useState } from 'react';
import { likeRecipe, unlikeRecipe } from '../api/recipes.js';
import { useAuth } from '../context/AuthContext.jsx';
import './LikeButton.css';

function LikeButton({ recipeId, initialLiked = false, initialCount = 0, onChange }) {
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function handleToggle() {
    if (!isAuthenticated || busy) return;
    setBusy(true);

    const wasLiked = liked;
    const optimisticLiked = !wasLiked;
    const optimisticCount = count + (wasLiked ? -1 : 1);
    setLiked(optimisticLiked);
    setCount(optimisticCount);

    try {
      if (wasLiked) {
        await unlikeRecipe(recipeId);
      } else {
        await likeRecipe(recipeId);
      }
      onChange?.({ liked: optimisticLiked, count: optimisticCount });
    } catch (err) {
      setLiked(wasLiked);
      setCount(count);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={!isAuthenticated || busy}
      className={`like-btn ${liked ? 'is-liked' : ''}`}
      title={isAuthenticated ? (liked ? 'Unlike' : 'Like') : 'Log in to like'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M12 21s-7-4.5-9.33-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.33 6C19 16.5 12 21 12 21z" />
      </svg>
      <span>{count}</span>
    </button>
  );
}

export default LikeButton;
