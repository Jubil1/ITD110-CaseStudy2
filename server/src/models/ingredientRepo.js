const { getSession } = require('../config/db');

/**
 * Ingredient repository — every Cypher query touching :Ingredient lives here.
 *
 * Ingredients are merge-by-name (lower-cased), so the canonical identifier
 * is the trimmed lowercase name.  Allergens are managed via the
 * (:Ingredient)-[:CONTAINS_ALLERGEN]->(:Allergen) edges.
 */

function canon(s) {
  return String(s || '').trim().toLowerCase();
}

async function listIngredients({ search = '', allergen = '', category = '' } = {}) {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (i:Ingredient)
      WHERE
        ($search   = '' OR toLower(i.name) CONTAINS toLower($search))
        AND ($category = '' OR toLower(coalesce(i.category, '')) = toLower($category))

      OPTIONAL MATCH (i)-[:CONTAINS_ALLERGEN]->(a:Allergen)
      WITH i, collect(DISTINCT a.name) AS allergens
      WHERE $allergen = '' OR $allergen IN allergens

      OPTIONAL MATCH (r:Recipe)-[:CONTAINS]->(i)
      WITH i, allergens, count(DISTINCT r) AS recipeCount

      RETURN i.name     AS name,
             i.category AS category,
             allergens,
             recipeCount
      ORDER BY recipeCount DESC, name
      `,
      { search, allergen, category }
    );

    return result.records.map((r) => ({
      name: r.get('name'),
      category: r.get('category'),
      allergens: r.get('allergens'),
      recipeCount: r.get('recipeCount'),
    }));
  } finally {
    await session.close();
  }
}

async function getIngredient(name) {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (i:Ingredient {name: $name})

      OPTIONAL MATCH (i)-[:CONTAINS_ALLERGEN]->(a:Allergen)
      WITH i, collect(DISTINCT a.name) AS allergens

      OPTIONAL MATCH (r:Recipe)-[c:CONTAINS]->(i)
      OPTIONAL MATCH (r)-[:BELONGS_TO]->(cu:Cuisine)
      WITH i, allergens,
           collect(DISTINCT CASE WHEN r IS NULL THEN NULL ELSE {
             id: r.id, title: r.title, cuisine: cu.name,
             quantity: c.quantity, unit: c.unit
           } END) AS recipes

      OPTIONAL MATCH (i)-[s:SUBSTITUTES_FOR]->(sub:Ingredient)
      WITH i, allergens, recipes,
           collect(DISTINCT CASE WHEN sub IS NULL THEN NULL ELSE {
             name: sub.name, ratio: s.ratio
           } END) AS substitutesOut

      OPTIONAL MATCH (i)<-[s2:SUBSTITUTES_FOR]-(orig:Ingredient)
      WITH i, allergens, recipes, substitutesOut,
           collect(DISTINCT CASE WHEN orig IS NULL THEN NULL ELSE {
             name: orig.name, ratio: s2.ratio
           } END) AS substitutesIn

      RETURN i.name AS name,
             i.category AS category,
             allergens,
             [x IN recipes WHERE x IS NOT NULL]        AS recipes,
             [x IN substitutesOut WHERE x IS NOT NULL] AS substitutesOut,
             [x IN substitutesIn WHERE x IS NOT NULL]  AS substitutesIn
      `,
      { name: canon(name) }
    );

    if (result.records.length === 0) return null;
    const r = result.records[0];
    return {
      name: r.get('name'),
      category: r.get('category'),
      allergens: r.get('allergens'),
      recipes: r.get('recipes'),
      substitutesOut: r.get('substitutesOut'),
      substitutesIn: r.get('substitutesIn'),
    };
  } finally {
    await session.close();
  }
}

async function createIngredient({ name, category = 'misc', allergens = [] }) {
  const canonName = canon(name);
  if (!canonName) throw new Error('name is required');

  const session = getSession();
  try {
    const existing = await session.run(
      `MATCH (i:Ingredient {name: $name}) RETURN i LIMIT 1`,
      { name: canonName }
    );
    if (existing.records.length > 0) {
      const err = new Error('ingredient already exists');
      err.status = 409;
      throw err;
    }

    await session.run(
      `
      CREATE (i:Ingredient {name: $name, category: $category})
      WITH i
      UNWIND $allergens AS allergenName
      MERGE (a:Allergen {name: toLower(allergenName)})
      MERGE (i)-[:CONTAINS_ALLERGEN]->(a)
      `,
      {
        name: canonName,
        category: String(category || 'misc').trim().toLowerCase(),
        allergens: allergens.map(canon).filter(Boolean),
      }
    );

    return getIngredient(canonName);
  } finally {
    await session.close();
  }
}

async function updateIngredient(name, { category, newName }) {
  const session = getSession();
  try {
    const params = {
      name: canon(name),
      category: category != null ? String(category).trim().toLowerCase() : null,
      newName: newName != null ? canon(newName) : null,
    };

    if (params.newName && params.newName !== params.name) {
      const clash = await session.run(
        `MATCH (i:Ingredient {name: $newName}) RETURN i LIMIT 1`,
        { newName: params.newName }
      );
      if (clash.records.length > 0) {
        const err = new Error('an ingredient with that name already exists');
        err.status = 409;
        throw err;
      }
    }

    await session.run(
      `
      MATCH (i:Ingredient {name: $name})
      SET i.category = coalesce($category, i.category),
          i.name     = coalesce($newName, i.name)
      `,
      params
    );

    return getIngredient(params.newName || params.name);
  } finally {
    await session.close();
  }
}

async function deleteIngredient(name) {
  const session = getSession();
  try {
    const usage = await session.run(
      `
      MATCH (i:Ingredient {name: $name})
      OPTIONAL MATCH (r:Recipe)-[:CONTAINS]->(i)
      RETURN i.name AS name, count(r) AS recipeCount
      `,
      { name: canon(name) }
    );
    if (usage.records.length === 0) return { deleted: false, reason: 'not found' };
    const recipeCount = usage.records[0].get('recipeCount');
    const safeRecipeCount =
      typeof recipeCount === 'object' ? recipeCount.toNumber() : Number(recipeCount);
    if (safeRecipeCount > 0) {
      const err = new Error(
        `cannot delete — used by ${safeRecipeCount} recipe(s). Remove from those recipes first.`
      );
      err.status = 409;
      throw err;
    }

    await session.run(
      `MATCH (i:Ingredient {name: $name}) DETACH DELETE i`,
      { name: canon(name) }
    );
    return { deleted: true };
  } finally {
    await session.close();
  }
}

async function addAllergen(ingredientName, allergenName) {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (i:Ingredient {name: $ingredient})
      MERGE (a:Allergen {name: $allergen})
      MERGE (i)-[:CONTAINS_ALLERGEN]->(a)
      RETURN i.name AS ingredient, a.name AS allergen
      `,
      { ingredient: canon(ingredientName), allergen: canon(allergenName) }
    );
    if (result.records.length === 0) {
      const err = new Error('ingredient not found');
      err.status = 404;
      throw err;
    }
    return getIngredient(ingredientName);
  } finally {
    await session.close();
  }
}

async function removeAllergen(ingredientName, allergenName) {
  const session = getSession();
  try {
    await session.run(
      `
      MATCH (i:Ingredient {name: $ingredient})-[r:CONTAINS_ALLERGEN]->(a:Allergen {name: $allergen})
      DELETE r
      `,
      { ingredient: canon(ingredientName), allergen: canon(allergenName) }
    );
    return getIngredient(ingredientName);
  } finally {
    await session.close();
  }
}

async function listAllSubstitutes() {
  const session = getSession();
  try {
    const result = await session.run(`
      MATCH (from:Ingredient)-[s:SUBSTITUTES_FOR]->(to:Ingredient)
      RETURN from.name AS fromName,
             from.category AS fromCategory,
             to.name AS toName,
             to.category AS toCategory,
             s.ratio AS ratio
      ORDER BY fromName, toName
    `);
    return result.records.map((r) => ({
      from: { name: r.get('fromName'), category: r.get('fromCategory') },
      to: { name: r.get('toName'), category: r.get('toCategory') },
      ratio: r.get('ratio'),
    }));
  } finally {
    await session.close();
  }
}

async function addSubstitute({ fromName, toName, ratio = '1:1' }) {
  const from = canon(fromName);
  const to = canon(toName);
  if (!from || !to) throw new Error('both ingredients are required');
  if (from === to) {
    const err = new Error('an ingredient cannot substitute for itself');
    err.status = 400;
    throw err;
  }

  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (a:Ingredient {name: $from})
      MERGE (b:Ingredient {name: $to})
        ON CREATE SET b.category = 'misc'
      MERGE (a)-[s:SUBSTITUTES_FOR]->(b)
        ON CREATE SET s.ratio = $ratio
        ON MATCH  SET s.ratio = $ratio
      RETURN a.name AS fromName, b.name AS toName, s.ratio AS ratio
      `,
      { from, to, ratio: String(ratio || '1:1').trim() }
    );
    if (result.records.length === 0) {
      const err = new Error('source ingredient not found');
      err.status = 404;
      throw err;
    }
    const r = result.records[0];
    return {
      from: r.get('fromName'),
      to: r.get('toName'),
      ratio: r.get('ratio'),
    };
  } finally {
    await session.close();
  }
}

async function removeSubstitute({ fromName, toName }) {
  const session = getSession();
  try {
    await session.run(
      `
      MATCH (a:Ingredient {name: $from})-[s:SUBSTITUTES_FOR]->(b:Ingredient {name: $to})
      DELETE s
      `,
      { from: canon(fromName), to: canon(toName) }
    );
    return { ok: true };
  } finally {
    await session.close();
  }
}

async function listAllergens() {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (a:Allergen)
      OPTIONAL MATCH (a)<-[:CONTAINS_ALLERGEN]-(i:Ingredient)
      RETURN a.name AS name, count(DISTINCT i) AS ingredientCount
      ORDER BY name
      `
    );
    return result.records.map((r) => ({
      name: r.get('name'),
      ingredientCount: r.get('ingredientCount'),
    }));
  } finally {
    await session.close();
  }
}

async function listCategories() {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (i:Ingredient)
      WHERE i.category IS NOT NULL AND i.category <> ''
      RETURN DISTINCT i.category AS category
      ORDER BY category
      `
    );
    return result.records.map((r) => r.get('category'));
  } finally {
    await session.close();
  }
}

module.exports = {
  listIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  addAllergen,
  removeAllergen,
  listAllergens,
  listCategories,
  listAllSubstitutes,
  addSubstitute,
  removeSubstitute,
};
