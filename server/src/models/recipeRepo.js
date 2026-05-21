const { randomUUID } = require('crypto');
const { getSession } = require('../config/db');

/**
 * Recipe repository — every Cypher query touching :Recipe lives here.
 *
 * Why one big file?  Most of these queries are short and tightly related.
 * Keeping them together makes the data model easy to scan during defense.
 */

function normaliseIngredient(ing) {
  return {
    name: String(ing.name).trim().toLowerCase(),
    category: ing.category ? String(ing.category).trim() : 'misc',
    quantity: typeof ing.quantity === 'number' ? ing.quantity : Number(ing.quantity) || 0,
    unit: ing.unit ? String(ing.unit).trim() : '',
  };
}

async function listRecipes({ search = '', cuisine = '', limit = 50, offset = 0 } = {}) {
  const session = getSession();
  try {
    const params = {
      limit: Number(limit),
      offset: Number(offset),
      search: search || '',
      cuisine: cuisine || '',
    };

    const result = await session.run(
      `
      MATCH (r:Recipe)
      OPTIONAL MATCH (r)-[:BELONGS_TO]->(c:Cuisine)
      WITH r, c
      WHERE
        ($search = '' OR toLower(r.title) CONTAINS toLower($search))
        AND ($cuisine = '' OR (c IS NOT NULL AND toLower(c.name) = toLower($cuisine)))

      OPTIONAL MATCH (r)<-[:CREATED]-(creator:User)
      OPTIONAL MATCH (r)<-[liked:LIKED]-(:User)
      OPTIONAL MATCH (r)-[:CONTAINS]->(i:Ingredient)
      WITH r, c, creator,
           count(DISTINCT liked) AS likeCount,
           count(DISTINCT i)     AS ingredientCount
      RETURN r.id              AS id,
             r.title           AS title,
             r.prepTimeMinutes AS prepTimeMinutes,
             r.servings        AS servings,
             r.imageUrl        AS imageUrl,
             r.createdAt       AS createdAt,
             c.name            AS cuisine,
             creator.username  AS createdBy,
             likeCount,
             ingredientCount
      ORDER BY r.title
      SKIP toInteger($offset) LIMIT toInteger($limit)
      `,
      params
    );

    return result.records.map((r) => ({
      id: r.get('id'),
      title: r.get('title'),
      prepTimeMinutes: r.get('prepTimeMinutes'),
      servings: r.get('servings'),
      imageUrl: r.get('imageUrl'),
      createdAt: r.get('createdAt'),
      cuisine: r.get('cuisine'),
      createdBy: r.get('createdBy'),
      likeCount: r.get('likeCount'),
      ingredientCount: r.get('ingredientCount'),
    }));
  } finally {
    await session.close();
  }
}

async function listCuisines() {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (c:Cuisine)
      OPTIONAL MATCH (c)<-[:BELONGS_TO]-(r:Recipe)
      RETURN c.name AS name, count(r) AS recipeCount
      ORDER BY name
      `
    );
    return result.records.map((r) => ({
      name: r.get('name'),
      recipeCount: r.get('recipeCount'),
    }));
  } finally {
    await session.close();
  }
}

async function getRecipeById(id, { viewerUsername } = {}) {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (r:Recipe {id: $id})
      OPTIONAL MATCH (r)-[:BELONGS_TO]->(c:Cuisine)
      OPTIONAL MATCH (r)<-[:CREATED]-(creator:User)

      WITH r, c, creator

      OPTIONAL MATCH (r)-[contains:CONTAINS]->(i:Ingredient)
      WITH r, c, creator,
           collect(DISTINCT CASE WHEN i IS NULL THEN NULL ELSE {
             name: i.name,
             category: i.category,
             quantity: contains.quantity,
             unit: contains.unit
           } END) AS rawIngredients

      OPTIONAL MATCH (r)-[:CONTAINS]->(:Ingredient)-[:CONTAINS_ALLERGEN]->(a:Allergen)
      WITH r, c, creator, rawIngredients,
           collect(DISTINCT a.name) AS allergens

      OPTIONAL MATCH (r)<-[:LIKED]-(liker:User)
      WITH r, c, creator, rawIngredients, allergens,
           collect(DISTINCT liker.username) AS likers

      RETURN r.id              AS id,
             r.title           AS title,
             r.instructions    AS instructions,
             r.prepTimeMinutes AS prepTimeMinutes,
             r.servings        AS servings,
             r.imageUrl        AS imageUrl,
             r.createdAt       AS createdAt,
             c.name            AS cuisine,
             creator.username  AS createdBy,
             [x IN rawIngredients WHERE x IS NOT NULL] AS ingredients,
             [a IN allergens WHERE a IS NOT NULL]      AS allergens,
             size([x IN likers WHERE x IS NOT NULL])   AS likeCount,
             $viewerUsername IN likers                  AS likedByViewer
      `,
      { id, viewerUsername: viewerUsername || null }
    );

    if (result.records.length === 0) return null;
    const r = result.records[0];
    return {
      id: r.get('id'),
      title: r.get('title'),
      instructions: r.get('instructions'),
      prepTimeMinutes: r.get('prepTimeMinutes'),
      servings: r.get('servings'),
      imageUrl: r.get('imageUrl'),
      createdAt: r.get('createdAt'),
      cuisine: r.get('cuisine'),
      createdBy: r.get('createdBy'),
      ingredients: r.get('ingredients'),
      allergens: r.get('allergens'),
      likeCount: r.get('likeCount'),
      likedByViewer: r.get('likedByViewer'),
    };
  } finally {
    await session.close();
  }
}

async function createRecipe(data) {
  const id = randomUUID();
  const session = getSession();
  try {
    const params = {
      id,
      title: data.title.trim(),
      instructions: data.instructions || '',
      prepTimeMinutes: Number(data.prepTimeMinutes) || 0,
      servings: Number(data.servings) || 0,
      imageUrl: data.imageUrl || '',
      cuisineName: (data.cuisine || '').trim(),
      ingredients: (data.ingredients || [])
        .filter((ing) => ing && ing.name && String(ing.name).trim())
        .map(normaliseIngredient),
      creatorUsername: data.creatorUsername,
    };

    await session.run(
      `
      MATCH (creator:User {username: $creatorUsername})
      CREATE (r:Recipe {
        id: $id,
        title: $title,
        instructions: $instructions,
        prepTimeMinutes: $prepTimeMinutes,
        servings: $servings,
        imageUrl: $imageUrl,
        createdAt: datetime()
      })
      CREATE (creator)-[:CREATED {createdAt: datetime()}]->(r)

      WITH r, $cuisineName AS cuisineName
      FOREACH (_ IN CASE WHEN cuisineName = '' THEN [] ELSE [1] END |
        MERGE (c:Cuisine {name: cuisineName})
        MERGE (r)-[:BELONGS_TO]->(c)
      )

      WITH r
      UNWIND $ingredients AS ing
      MERGE (i:Ingredient {name: ing.name})
        ON CREATE SET i.category = ing.category
      CREATE (r)-[:CONTAINS {quantity: ing.quantity, unit: ing.unit}]->(i)
      `,
      params
    );

    return getRecipeById(id);
  } finally {
    await session.close();
  }
}

async function updateRecipe(id, data) {
  const session = getSession();
  try {
    const params = {
      id,
      title: data.title?.trim(),
      instructions: data.instructions,
      prepTimeMinutes: data.prepTimeMinutes != null ? Number(data.prepTimeMinutes) : null,
      servings: data.servings != null ? Number(data.servings) : null,
      imageUrl: data.imageUrl,
      cuisineName: data.cuisine != null ? String(data.cuisine).trim() : null,
      ingredients: Array.isArray(data.ingredients)
        ? data.ingredients
            .filter((ing) => ing && ing.name && String(ing.name).trim())
            .map(normaliseIngredient)
        : null,
    };

    await session.run(
      `
      MATCH (r:Recipe {id: $id})
      SET r.title           = coalesce($title, r.title),
          r.instructions    = coalesce($instructions, r.instructions),
          r.prepTimeMinutes = coalesce($prepTimeMinutes, r.prepTimeMinutes),
          r.servings        = coalesce($servings, r.servings),
          r.imageUrl        = coalesce($imageUrl, r.imageUrl)
      `,
      params
    );

    if (params.cuisineName !== null) {
      await session.run(
        `
        MATCH (r:Recipe {id: $id})
        OPTIONAL MATCH (r)-[oldRel:BELONGS_TO]->(:Cuisine)
        DELETE oldRel
        WITH r, $cuisineName AS cuisineName
        FOREACH (_ IN CASE WHEN cuisineName = '' THEN [] ELSE [1] END |
          MERGE (c:Cuisine {name: cuisineName})
          MERGE (r)-[:BELONGS_TO]->(c)
        )
        `,
        { id, cuisineName: params.cuisineName }
      );
    }

    if (params.ingredients !== null) {
      await session.run(
        `
        MATCH (r:Recipe {id: $id})-[oldRel:CONTAINS]->(:Ingredient)
        DELETE oldRel
        `,
        { id }
      );
      if (params.ingredients.length > 0) {
        await session.run(
          `
          MATCH (r:Recipe {id: $id})
          UNWIND $ingredients AS ing
          MERGE (i:Ingredient {name: ing.name})
            ON CREATE SET i.category = ing.category
          CREATE (r)-[:CONTAINS {quantity: ing.quantity, unit: ing.unit}]->(i)
          `,
          { id, ingredients: params.ingredients }
        );
      }
    }

    return getRecipeById(id);
  } finally {
    await session.close();
  }
}

async function deleteRecipe(id) {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (r:Recipe {id: $id})
      DETACH DELETE r
      RETURN count(*) AS deleted
      `,
      { id }
    );
    return result.records[0].get('deleted') > 0;
  } finally {
    await session.close();
  }
}

async function getCreator(id) {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (creator:User)-[:CREATED]->(r:Recipe {id: $id})
      RETURN creator.username AS username LIMIT 1
      `,
      { id }
    );
    if (result.records.length === 0) return null;
    return result.records[0].get('username');
  } finally {
    await session.close();
  }
}

async function likeRecipe({ recipeId, username }) {
  const session = getSession();
  try {
    await session.run(
      `
      MATCH (u:User {username: $username}), (r:Recipe {id: $recipeId})
      MERGE (u)-[liked:LIKED]->(r)
        ON CREATE SET liked.likedAt = datetime()
      `,
      { username, recipeId }
    );
  } finally {
    await session.close();
  }
}

async function matchByPantry({
  pantry = [],
  excludeAllergens = [],
  minMatch = 0,
  limit = 50,
} = {}) {
  const pantryNames = (pantry || [])
    .map((n) => String(n || '').trim().toLowerCase())
    .filter(Boolean);
  const bannedAllergens = (excludeAllergens || [])
    .map((n) => String(n || '').trim().toLowerCase())
    .filter(Boolean);

  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (r:Recipe)-[:CONTAINS]->(i:Ingredient)
      WITH r, $pantry AS pantry, $banned AS banned, toFloat($minMatch) AS minMatch,
           collect(DISTINCT toLower(i.name)) AS recipeIngs

      WHERE size(banned) = 0 OR NOT EXISTS {
        MATCH (r)-[:CONTAINS]->(:Ingredient)-[:CONTAINS_ALLERGEN]->(a:Allergen)
        WHERE a.name IN banned
      }

      WITH r, recipeIngs, minMatch,
           [x IN recipeIngs WHERE x IN pantry] AS matched,
           [x IN recipeIngs WHERE NOT x IN pantry] AS missing

      WITH r, recipeIngs, matched, missing, minMatch,
           toFloat(size(matched)) / toFloat(size(recipeIngs)) AS matchRatio

      WHERE matchRatio >= minMatch

      OPTIONAL MATCH (r)-[:BELONGS_TO]->(c:Cuisine)
      OPTIONAL MATCH (r)<-[:CREATED]-(creator:User)
      OPTIONAL MATCH (r)<-[liked:LIKED]-(:User)
      OPTIONAL MATCH (r)-[:CONTAINS]->(:Ingredient)-[:CONTAINS_ALLERGEN]->(a:Allergen)

      WITH r, c, creator, recipeIngs, matched, missing, matchRatio,
           count(DISTINCT liked) AS likeCount,
           collect(DISTINCT a.name) AS allergens

      RETURN r.id              AS id,
             r.title           AS title,
             r.prepTimeMinutes AS prepTimeMinutes,
             r.servings        AS servings,
             r.imageUrl        AS imageUrl,
             c.name            AS cuisine,
             creator.username  AS createdBy,
             likeCount,
             size(recipeIngs)  AS totalIngredients,
             matched,
             missing,
             matchRatio,
             [a IN allergens WHERE a IS NOT NULL] AS allergens
      ORDER BY matchRatio DESC, size(missing) ASC, r.title
      LIMIT toInteger($limit)
      `,
      {
        pantry: pantryNames,
        banned: bannedAllergens,
        minMatch: Number(minMatch) || 0,
        limit: Number(limit) || 50,
      }
    );

    return result.records.map((r) => ({
      id: r.get('id'),
      title: r.get('title'),
      prepTimeMinutes: r.get('prepTimeMinutes'),
      servings: r.get('servings'),
      imageUrl: r.get('imageUrl'),
      cuisine: r.get('cuisine'),
      createdBy: r.get('createdBy'),
      likeCount: r.get('likeCount'),
      totalIngredients: r.get('totalIngredients'),
      matched: r.get('matched'),
      missing: r.get('missing'),
      matchRatio: r.get('matchRatio'),
      allergens: r.get('allergens'),
    }));
  } finally {
    await session.close();
  }
}

async function previewAllergens(ingredientNames = []) {
  const names = (ingredientNames || [])
    .map((n) => String(n || '').trim().toLowerCase())
    .filter(Boolean);
  if (names.length === 0) return [];

  const session = getSession();
  try {
    const result = await session.run(
      `
      UNWIND $names AS name
      MATCH (i:Ingredient {name: name})-[:CONTAINS_ALLERGEN]->(a:Allergen)
      WITH a.name AS allergen, collect(DISTINCT i.name) AS triggeredBy
      RETURN allergen, triggeredBy
      ORDER BY allergen
      `,
      { names }
    );
    return result.records.map((r) => ({
      allergen: r.get('allergen'),
      triggeredBy: r.get('triggeredBy'),
    }));
  } finally {
    await session.close();
  }
}

async function unlikeRecipe({ recipeId, username }) {
  const session = getSession();
  try {
    await session.run(
      `
      MATCH (u:User {username: $username})-[liked:LIKED]->(r:Recipe {id: $recipeId})
      DELETE liked
      `,
      { username, recipeId }
    );
  } finally {
    await session.close();
  }
}

module.exports = {
  listRecipes,
  listCuisines,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getCreator,
  likeRecipe,
  unlikeRecipe,
  previewAllergens,
  matchByPantry,
};
