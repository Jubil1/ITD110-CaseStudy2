const repo = require('../models/ingredientRepo');

async function list(req, res) {
  try {
    const { search, allergen, category } = req.query;
    const data = await repo.listIngredients({ search, allergen, category });
    res.json(data);
  } catch (err) {
    console.error('[ingredients.list]', err);
    res.status(500).json({ error: 'failed to list ingredients' });
  }
}

async function getOne(req, res) {
  try {
    const data = await repo.getIngredient(req.params.name);
    if (!data) return res.status(404).json({ error: 'ingredient not found' });
    res.json(data);
  } catch (err) {
    console.error('[ingredients.getOne]', err);
    res.status(500).json({ error: 'failed to fetch ingredient' });
  }
}

async function create(req, res) {
  try {
    const { name, category, allergens } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const data = await repo.createIngredient({ name, category, allergens });
    res.status(201).json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[ingredients.create]', err);
    res.status(500).json({ error: 'failed to create ingredient' });
  }
}

async function update(req, res) {
  try {
    const { category, newName } = req.body || {};
    const data = await repo.updateIngredient(req.params.name, { category, newName });
    if (!data) return res.status(404).json({ error: 'ingredient not found' });
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[ingredients.update]', err);
    res.status(500).json({ error: 'failed to update ingredient' });
  }
}

async function remove(req, res) {
  try {
    const result = await repo.deleteIngredient(req.params.name);
    if (!result.deleted) return res.status(404).json({ error: result.reason });
    res.status(204).end();
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[ingredients.remove]', err);
    res.status(500).json({ error: 'failed to delete ingredient' });
  }
}

async function addAllergen(req, res) {
  try {
    const { allergen } = req.body || {};
    if (!allergen || !String(allergen).trim()) {
      return res.status(400).json({ error: 'allergen is required' });
    }
    const data = await repo.addAllergen(req.params.name, allergen);
    res.json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[ingredients.addAllergen]', err);
    res.status(500).json({ error: 'failed to add allergen' });
  }
}

async function removeAllergen(req, res) {
  try {
    const data = await repo.removeAllergen(req.params.name, req.params.allergen);
    res.json(data);
  } catch (err) {
    console.error('[ingredients.removeAllergen]', err);
    res.status(500).json({ error: 'failed to remove allergen' });
  }
}

async function listSubstitutes(req, res) {
  try {
    const data = await repo.listAllSubstitutes();
    res.json(data);
  } catch (err) {
    console.error('[ingredients.listSubstitutes]', err);
    res.status(500).json({ error: 'failed to list substitutes' });
  }
}

async function addSubstitute(req, res) {
  try {
    const { target, ratio } = req.body || {};
    if (!target || !String(target).trim()) {
      return res.status(400).json({ error: 'target ingredient is required' });
    }
    const data = await repo.addSubstitute({
      fromName: req.params.name,
      toName: target,
      ratio,
    });
    res.status(201).json(data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[ingredients.addSubstitute]', err);
    res.status(500).json({ error: 'failed to add substitute' });
  }
}

async function removeSubstitute(req, res) {
  try {
    await repo.removeSubstitute({
      fromName: req.params.name,
      toName: req.params.target,
    });
    res.status(204).end();
  } catch (err) {
    console.error('[ingredients.removeSubstitute]', err);
    res.status(500).json({ error: 'failed to remove substitute' });
  }
}

async function allergens(req, res) {
  try {
    const data = await repo.listAllergens();
    res.json(data);
  } catch (err) {
    console.error('[ingredients.allergens]', err);
    res.status(500).json({ error: 'failed to list allergens' });
  }
}

async function categories(req, res) {
  try {
    const data = await repo.listCategories();
    res.json(data);
  } catch (err) {
    console.error('[ingredients.categories]', err);
    res.status(500).json({ error: 'failed to list categories' });
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  addAllergen,
  removeAllergen,
  allergens,
  categories,
  listSubstitutes,
  addSubstitute,
  removeSubstitute,
};
