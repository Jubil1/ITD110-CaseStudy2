import { api } from './client.js';

export async function listRecipes({ q = '', cuisine = '', limit = 50, offset = 0 } = {}) {
  const params = {};
  if (q) params.q = q;
  if (cuisine) params.cuisine = cuisine;
  if (limit) params.limit = limit;
  if (offset) params.offset = offset;
  const { data } = await api.get('/recipes', { params });
  return data.recipes;
}

export async function listCuisines() {
  const { data } = await api.get('/recipes/cuisines');
  return data.cuisines;
}

export async function getRecipe(id) {
  const { data } = await api.get(`/recipes/${id}`);
  return data.recipe;
}

export async function createRecipe(payload) {
  const { data } = await api.post('/recipes', payload);
  return data.recipe;
}

export async function updateRecipe(id, payload) {
  const { data } = await api.put(`/recipes/${id}`, payload);
  return data.recipe;
}

export async function deleteRecipe(id) {
  await api.delete(`/recipes/${id}`);
}

export async function likeRecipe(id) {
  await api.post(`/recipes/${id}/like`);
}

export async function unlikeRecipe(id) {
  await api.delete(`/recipes/${id}/like`);
}

export async function previewAllergens(ingredientNames) {
  const { data } = await api.post('/recipes/preview-allergens', {
    ingredients: ingredientNames,
  });
  return data.allergens;
}

export async function pantryMatch({ pantry, excludeAllergens, minMatch, limit } = {}) {
  const { data } = await api.post('/recipes/pantry-match', {
    pantry: pantry || [],
    excludeAllergens: excludeAllergens || [],
    minMatch: minMatch ?? 0,
    limit: limit ?? 50,
  });
  return data.recipes;
}
