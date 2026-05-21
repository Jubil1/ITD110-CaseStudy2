// ─────────────────────────────────────────────────────────────────────────────
// Sangkap seed data — ITD110 Case Study #2
//
// Allergens follow the U.S. FDA "Big 9" (FALCPA + FASTER Act):
//   milk, eggs, peanuts, tree_nuts, wheat, soybeans, fish,
//   crustacean_shellfish, sesame
//
// Paste this whole file into Neo4j Browser (or run via the Neo4j Desktop
// "Query" tool) on an empty database to load demo data.
// ─────────────────────────────────────────────────────────────────────────────

// Clean slate (only run on a database you control)
MATCH (n) DETACH DELETE n;

// ── Users ─────────────────────────────────────────────────────────────────────
CREATE (jubil:User {username: 'jubil', email: 'jubil@example.com', passwordHash: 'demo-hash'})
CREATE (maria:User {username: 'maria', email: 'maria@example.com', passwordHash: 'demo-hash'})

// ── Recipes ───────────────────────────────────────────────────────────────────
CREATE (adobo:Recipe    {title: 'Chicken Adobo',       prepTimeMinutes: 45, servings: 4})
CREATE (sinigang:Recipe {title: 'Pork Sinigang',       prepTimeMinutes: 60, servings: 5})
CREATE (carbonara:Recipe{title: 'Spaghetti Carbonara', prepTimeMinutes: 25, servings: 2})

// ── Ingredients (core demo set) ───────────────────────────────────────────────
CREATE (chicken:Ingredient   {name: 'chicken',    category: 'meat'})
CREATE (pork:Ingredient      {name: 'pork',       category: 'meat'})
CREATE (soy:Ingredient       {name: 'soy sauce',  category: 'condiment'})
CREATE (vinegar:Ingredient   {name: 'vinegar',    category: 'condiment'})
CREATE (garlic:Ingredient    {name: 'garlic',     category: 'aromatic'})
CREATE (onion:Ingredient     {name: 'onion',      category: 'aromatic'})
CREATE (tamarind:Ingredient  {name: 'tamarind',   category: 'fruit'})
CREATE (spaghetti:Ingredient {name: 'spaghetti',  category: 'pasta'})
CREATE (egg:Ingredient       {name: 'egg',        category: 'dairy-egg'})
CREATE (bacon:Ingredient     {name: 'bacon',      category: 'meat'})
CREATE (cheese:Ingredient    {name: 'parmesan',   category: 'dairy-egg'})

// ── Big 9 "showcase" ingredients (so every allergen has examples) ─────────────
CREATE (peanutbutter:Ingredient {name: 'peanut butter', category: 'spread'})
CREATE (walnut:Ingredient       {name: 'walnut',        category: 'nut'})
CREATE (salmon:Ingredient       {name: 'salmon',        category: 'seafood'})
CREATE (shrimp:Ingredient       {name: 'shrimp',        category: 'seafood'})
CREATE (sesameseed:Ingredient   {name: 'sesame seed',   category: 'seed'})

// ── Cuisines ──────────────────────────────────────────────────────────────────
CREATE (filipino:Cuisine {name: 'Filipino'})
CREATE (italian:Cuisine  {name: 'Italian'})

// ── Allergens (FDA Big 9) ─────────────────────────────────────────────────────
CREATE (a_milk:Allergen     {name: 'milk'})
CREATE (a_eggs:Allergen     {name: 'eggs'})
CREATE (a_peanuts:Allergen  {name: 'peanuts'})
CREATE (a_treenuts:Allergen {name: 'tree nuts'})
CREATE (a_wheat:Allergen    {name: 'wheat'})
CREATE (a_soy:Allergen      {name: 'soybeans'})
CREATE (a_fish:Allergen     {name: 'fish'})
CREATE (a_shellfish:Allergen {name: 'crustacean shellfish'})
CREATE (a_sesame:Allergen   {name: 'sesame'})

// ── Recipe ownership and likes ────────────────────────────────────────────────
CREATE (jubil)-[:CREATED {createdAt: datetime()}]->(adobo)
CREATE (jubil)-[:CREATED {createdAt: datetime()}]->(carbonara)
CREATE (maria)-[:CREATED {createdAt: datetime()}]->(sinigang)

CREATE (jubil)-[:LIKED {likedAt: datetime()}]->(sinigang)
CREATE (maria)-[:LIKED {likedAt: datetime()}]->(adobo)
CREATE (maria)-[:LIKED {likedAt: datetime()}]->(carbonara)

// ── Recipe → Cuisine ──────────────────────────────────────────────────────────
CREATE (adobo)-[:BELONGS_TO]->(filipino)
CREATE (sinigang)-[:BELONGS_TO]->(filipino)
CREATE (carbonara)-[:BELONGS_TO]->(italian)

// ── Recipe → Ingredient ───────────────────────────────────────────────────────
CREATE (adobo)-[:CONTAINS {quantity: 1,    unit: 'kg'}]->(chicken)
CREATE (adobo)-[:CONTAINS {quantity: 0.5,  unit: 'cup'}]->(soy)
CREATE (adobo)-[:CONTAINS {quantity: 0.25, unit: 'cup'}]->(vinegar)
CREATE (adobo)-[:CONTAINS {quantity: 6,    unit: 'cloves'}]->(garlic)
CREATE (adobo)-[:CONTAINS {quantity: 1,    unit: 'pc'}]->(onion)

CREATE (sinigang)-[:CONTAINS {quantity: 1, unit: 'kg'}]->(pork)
CREATE (sinigang)-[:CONTAINS {quantity: 1, unit: 'pack'}]->(tamarind)
CREATE (sinigang)-[:CONTAINS {quantity: 1, unit: 'pc'}]->(onion)
CREATE (sinigang)-[:CONTAINS {quantity: 4, unit: 'cloves'}]->(garlic)

CREATE (carbonara)-[:CONTAINS {quantity: 200, unit: 'g'}]->(spaghetti)
CREATE (carbonara)-[:CONTAINS {quantity: 2,   unit: 'pcs'}]->(egg)
CREATE (carbonara)-[:CONTAINS {quantity: 100, unit: 'g'}]->(bacon)
CREATE (carbonara)-[:CONTAINS {quantity: 50,  unit: 'g'}]->(cheese)
CREATE (carbonara)-[:CONTAINS {quantity: 2,   unit: 'cloves'}]->(garlic)

// ── Ingredient → Allergen (the magic: one edge, many recipes benefit) ─────────
CREATE (soy)-[:CONTAINS_ALLERGEN]->(a_soy)
CREATE (egg)-[:CONTAINS_ALLERGEN]->(a_eggs)
CREATE (cheese)-[:CONTAINS_ALLERGEN]->(a_milk)
CREATE (spaghetti)-[:CONTAINS_ALLERGEN]->(a_wheat)
CREATE (peanutbutter)-[:CONTAINS_ALLERGEN]->(a_peanuts)
CREATE (walnut)-[:CONTAINS_ALLERGEN]->(a_treenuts)
CREATE (salmon)-[:CONTAINS_ALLERGEN]->(a_fish)
CREATE (shrimp)-[:CONTAINS_ALLERGEN]->(a_shellfish)
CREATE (sesameseed)-[:CONTAINS_ALLERGEN]->(a_sesame)

// ── Substitutes ───────────────────────────────────────────────────────────────
CREATE (egg)-[:SUBSTITUTES_FOR {ratio: '1 egg ≈ ¼ cup applesauce'}]->(:Ingredient {name: 'applesauce', category: 'fruit'})
CREATE (bacon)-[:SUBSTITUTES_FOR {ratio: '1:1'}]->(:Ingredient {name: 'pancetta', category: 'meat'})

RETURN 'Seed complete ✓ — 9 allergens, 16 ingredients, 3 recipes' AS status;
