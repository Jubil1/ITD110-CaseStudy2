import { api } from './client.js';

export async function listIngredients({ search, allergen, category } = {}) {
  const params = {};
  if (search) params.search = search;
  if (allergen) params.allergen = allergen;
  if (category) params.category = category;
  const { data } = await api.get('/ingredients', { params });
  return data;
}

export async function getIngredient(name) {
  const { data } = await api.get(`/ingredients/${encodeURIComponent(name)}`);
  return data;
}

export async function createIngredient(payload) {
  const { data } = await api.post('/ingredients', payload);
  return data;
}

export async function updateIngredient(name, payload) {
  const { data } = await api.patch(`/ingredients/${encodeURIComponent(name)}`, payload);
  return data;
}

export async function deleteIngredient(name) {
  await api.delete(`/ingredients/${encodeURIComponent(name)}`);
}

export async function addAllergen(name, allergen) {
  const { data } = await api.post(
    `/ingredients/${encodeURIComponent(name)}/allergens`,
    { allergen }
  );
  return data;
}

export async function removeAllergen(name, allergen) {
  const { data } = await api.delete(
    `/ingredients/${encodeURIComponent(name)}/allergens/${encodeURIComponent(allergen)}`
  );
  return data;
}

export async function listAllergens() {
  const { data } = await api.get('/ingredients/allergens');
  return data;
}

export async function listCategories() {
  const { data } = await api.get('/ingredients/categories');
  return data;
}

export async function listSubstitutes() {
  const { data } = await api.get('/ingredients/substitutes');
  return data;
}

export async function addSubstitute(fromName, target, ratio) {
  const { data } = await api.post(
    `/ingredients/${encodeURIComponent(fromName)}/substitutes`,
    { target, ratio }
  );
  return data;
}

export async function removeSubstitute(fromName, targetName) {
  await api.delete(
    `/ingredients/${encodeURIComponent(fromName)}/substitutes/${encodeURIComponent(targetName)}`
  );
}
