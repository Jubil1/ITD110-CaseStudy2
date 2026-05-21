const { getSession } = require('../config/db');

/**
 * Stats repository — Cypher aggregations powering the dashboard.
 *
 * Each function returns plain JSON ready for Chart.js / React.
 * All queries are read-only.
 */

function toNum(v) {
  if (v == null) return 0;
  return typeof v === 'object' && typeof v.toNumber === 'function'
    ? v.toNumber()
    : Number(v);
}

async function overview() {
  const session = getSession();
  try {
    const result = await session.run(`
      OPTIONAL MATCH (u:User)         WITH count(DISTINCT u) AS users
      OPTIONAL MATCH (r:Recipe)       WITH users, count(DISTINCT r) AS recipes
      OPTIONAL MATCH (i:Ingredient)   WITH users, recipes, count(DISTINCT i) AS ingredients
      OPTIONAL MATCH (c:Cuisine)      WITH users, recipes, ingredients, count(DISTINCT c) AS cuisines
      OPTIONAL MATCH (a:Allergen)     WITH users, recipes, ingredients, cuisines, count(DISTINCT a) AS allergens
      OPTIONAL MATCH ()-[likes:LIKED]->()
      WITH users, recipes, ingredients, cuisines, allergens, count(likes) AS likes
      OPTIONAL MATCH ()-[rels]->()
      RETURN users, recipes, ingredients, cuisines, allergens, likes,
             count(rels) AS relationships
    `);
    const r = result.records[0];
    return {
      users: toNum(r.get('users')),
      recipes: toNum(r.get('recipes')),
      ingredients: toNum(r.get('ingredients')),
      cuisines: toNum(r.get('cuisines')),
      allergens: toNum(r.get('allergens')),
      likes: toNum(r.get('likes')),
      relationships: toNum(r.get('relationships')),
    };
  } finally {
    await session.close();
  }
}

async function topIngredients({ limit = 10 } = {}) {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (i:Ingredient)
      OPTIONAL MATCH (r:Recipe)-[:CONTAINS]->(i)
      WITH i, count(DISTINCT r) AS recipeCount
      WHERE recipeCount > 0
      RETURN i.name AS name, i.category AS category, recipeCount
      ORDER BY recipeCount DESC, name
      LIMIT toInteger($limit)
      `,
      { limit }
    );
    return result.records.map((r) => ({
      name: r.get('name'),
      category: r.get('category'),
      recipeCount: toNum(r.get('recipeCount')),
    }));
  } finally {
    await session.close();
  }
}

async function cuisineBreakdown() {
  const session = getSession();
  try {
    const result = await session.run(`
      MATCH (c:Cuisine)
      OPTIONAL MATCH (r:Recipe)-[:BELONGS_TO]->(c)
      WITH c.name AS cuisine, count(DISTINCT r) AS recipeCount
      RETURN cuisine, recipeCount
      ORDER BY recipeCount DESC, cuisine
    `);
    return result.records.map((r) => ({
      cuisine: r.get('cuisine'),
      recipeCount: toNum(r.get('recipeCount')),
    }));
  } finally {
    await session.close();
  }
}

async function allergenBreakdown() {
  const session = getSession();
  try {
    const result = await session.run(`
      MATCH (a:Allergen)
      OPTIONAL MATCH (r:Recipe)-[:CONTAINS]->(:Ingredient)-[:CONTAINS_ALLERGEN]->(a)
      WITH a.name AS allergen, count(DISTINCT r) AS recipeCount
      RETURN allergen, recipeCount
      ORDER BY recipeCount DESC, allergen
    `);
    return result.records.map((r) => ({
      allergen: r.get('allergen'),
      recipeCount: toNum(r.get('recipeCount')),
    }));
  } finally {
    await session.close();
  }
}

async function topRecipes({ limit = 5 } = {}) {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (r:Recipe)
      OPTIONAL MATCH (r)<-[liked:LIKED]-(:User)
      OPTIONAL MATCH (r)-[:BELONGS_TO]->(c:Cuisine)
      OPTIONAL MATCH (r)<-[:CREATED]-(creator:User)
      WITH r, c, creator, count(liked) AS likeCount
      ORDER BY likeCount DESC, r.title
      LIMIT toInteger($limit)
      RETURN r.id AS id, r.title AS title,
             c.name AS cuisine,
             creator.username AS createdBy,
             likeCount
      `,
      { limit }
    );
    return result.records.map((r) => ({
      id: r.get('id'),
      title: r.get('title'),
      cuisine: r.get('cuisine'),
      createdBy: r.get('createdBy'),
      likeCount: toNum(r.get('likeCount')),
    }));
  } finally {
    await session.close();
  }
}

async function topCreators({ limit = 5 } = {}) {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (u:User)
      OPTIONAL MATCH (u)-[:CREATED]->(r:Recipe)
      WITH u, count(DISTINCT r) AS recipeCount
      WHERE recipeCount > 0
      OPTIONAL MATCH (u)-[:CREATED]->(r2:Recipe)<-[liked:LIKED]-(:User)
      WITH u, recipeCount, count(liked) AS receivedLikes
      RETURN u.username AS username, recipeCount, receivedLikes
      ORDER BY recipeCount DESC, receivedLikes DESC, username
      LIMIT toInteger($limit)
      `,
      { limit }
    );
    return result.records.map((r) => ({
      username: r.get('username'),
      recipeCount: toNum(r.get('recipeCount')),
      receivedLikes: toNum(r.get('receivedLikes')),
    }));
  } finally {
    await session.close();
  }
}

async function ingredientCategories() {
  const session = getSession();
  try {
    const result = await session.run(`
      MATCH (i:Ingredient)
      WITH coalesce(i.category, 'uncategorized') AS category, count(i) AS count
      RETURN category, count
      ORDER BY count DESC, category
    `);
    return result.records.map((r) => ({
      category: r.get('category'),
      count: toNum(r.get('count')),
    }));
  } finally {
    await session.close();
  }
}

async function dashboard() {
  const [
    overviewData,
    topIngredientsData,
    cuisines,
    allergens,
    topRecipesData,
    topCreatorsData,
    categories,
  ] = await Promise.all([
    overview(),
    topIngredients({ limit: 10 }),
    cuisineBreakdown(),
    allergenBreakdown(),
    topRecipes({ limit: 5 }),
    topCreators({ limit: 5 }),
    ingredientCategories(),
  ]);

  return {
    overview: overviewData,
    topIngredients: topIngredientsData,
    cuisines,
    allergens,
    topRecipes: topRecipesData,
    topCreators: topCreatorsData,
    ingredientCategories: categories,
  };
}

module.exports = {
  overview,
  topIngredients,
  cuisineBreakdown,
  allergenBreakdown,
  topRecipes,
  topCreators,
  ingredientCategories,
  dashboard,
};
