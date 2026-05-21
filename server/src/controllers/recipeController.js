const recipeRepo = require('../models/recipeRepo');

async function list(req, res) {
  try {
    const { q = '', cuisine = '', limit = 50, offset = 0 } = req.query;
    const recipes = await recipeRepo.listRecipes({ search: q, cuisine, limit, offset });
    res.json({ recipes });
  } catch (err) {
    console.error('[recipes.list]', err);
    res.status(500).json({ error: 'failed to load recipes' });
  }
}

async function cuisines(req, res) {
  try {
    const items = await recipeRepo.listCuisines();
    res.json({ cuisines: items });
  } catch (err) {
    console.error('[recipes.cuisines]', err);
    res.status(500).json({ error: 'failed to load cuisines' });
  }
}

async function getOne(req, res) {
  try {
    const recipe = await recipeRepo.getRecipeById(req.params.id, {
      viewerUsername: req.user?.username,
    });
    if (!recipe) return res.status(404).json({ error: 'recipe not found' });
    res.json({ recipe });
  } catch (err) {
    console.error('[recipes.getOne]', err);
    res.status(500).json({ error: 'failed to load recipe' });
  }
}

async function create(req, res) {
  try {
    const { title, instructions, prepTimeMinutes, servings, imageUrl, cuisine, ingredients } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    const recipe = await recipeRepo.createRecipe({
      title,
      instructions,
      prepTimeMinutes,
      servings,
      imageUrl,
      cuisine,
      ingredients,
      creatorUsername: req.user.username,
    });
    res.status(201).json({ recipe });
  } catch (err) {
    console.error('[recipes.create]', err);
    res.status(500).json({ error: 'failed to create recipe' });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const creator = await recipeRepo.getCreator(id);
    if (!creator) return res.status(404).json({ error: 'recipe not found' });
    if (creator !== req.user.username) {
      return res.status(403).json({ error: 'only the creator can edit this recipe' });
    }
    const recipe = await recipeRepo.updateRecipe(id, req.body || {});
    res.json({ recipe });
  } catch (err) {
    console.error('[recipes.update]', err);
    res.status(500).json({ error: 'failed to update recipe' });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const creator = await recipeRepo.getCreator(id);
    if (!creator) return res.status(404).json({ error: 'recipe not found' });
    if (creator !== req.user.username) {
      return res.status(403).json({ error: 'only the creator can delete this recipe' });
    }
    await recipeRepo.deleteRecipe(id);
    res.status(204).end();
  } catch (err) {
    console.error('[recipes.remove]', err);
    res.status(500).json({ error: 'failed to delete recipe' });
  }
}

async function like(req, res) {
  try {
    await recipeRepo.likeRecipe({ recipeId: req.params.id, username: req.user.username });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[recipes.like]', err);
    res.status(500).json({ error: 'failed to like recipe' });
  }
}

async function unlike(req, res) {
  try {
    await recipeRepo.unlikeRecipe({ recipeId: req.params.id, username: req.user.username });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[recipes.unlike]', err);
    res.status(500).json({ error: 'failed to unlike recipe' });
  }
}

async function pantryMatch(req, res) {
  try {
    const { pantry, excludeAllergens, minMatch, limit } = req.body || {};
    const results = await recipeRepo.matchByPantry({
      pantry: Array.isArray(pantry) ? pantry : [],
      excludeAllergens: Array.isArray(excludeAllergens) ? excludeAllergens : [],
      minMatch: Number(minMatch) || 0,
      limit: Number(limit) || 50,
    });
    res.json({ recipes: results });
  } catch (err) {
    console.error('[recipes.pantryMatch]', err);
    res.status(500).json({ error: 'failed to match recipes by pantry' });
  }
}

async function previewAllergens(req, res) {
  try {
    const { ingredients } = req.body || {};
    const result = await recipeRepo.previewAllergens(ingredients);
    res.json({ allergens: result });
  } catch (err) {
    console.error('[recipes.previewAllergens]', err);
    res.status(500).json({ error: 'failed to preview allergens' });
  }
}

module.exports = {
  list,
  cuisines,
  getOne,
  create,
  update,
  remove,
  like,
  unlike,
  previewAllergens,
  pantryMatch,
};
