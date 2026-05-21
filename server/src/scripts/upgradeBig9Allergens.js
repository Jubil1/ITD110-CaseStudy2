#!/usr/bin/env node
/**
 * upgradeBig9Allergens.js
 *
 * Idempotent migration: upgrades the existing 3-allergen seed to the
 * U.S. FDA "Big 9" food allergens (FALCPA + FASTER Act, 2021).
 *
 * Steps:
 *   1. Rename existing 'dairy' allergen → 'milk' and 'egg' → 'eggs'
 *      and 'soy' → 'soybeans' to match FDA terminology.
 *   2. Ensure all 9 Big-9 :Allergen nodes exist.
 *   3. Link existing seed ingredients to their correct allergens:
 *        spaghetti  → wheat   (was missing!)
 *        parmesan   → milk    (was 'dairy')
 *        soy sauce  → soybeans
 *        egg        → eggs
 *   4. Add showcase ingredients with allergen links so each Big-9 allergen
 *      has at least one connected ingredient for demos:
 *        peanut butter → peanuts
 *        walnut        → tree nuts
 *        salmon        → fish
 *        shrimp        → crustacean shellfish
 *        sesame seed   → sesame
 *
 * Safe to run multiple times.
 *
 * Usage:
 *   pnpm migrate:big9-allergens
 */
require('dotenv').config();
const { getSession, closeDriver } = require('../config/db');

const BIG_9 = [
  'milk',
  'eggs',
  'peanuts',
  'tree nuts',
  'wheat',
  'soybeans',
  'fish',
  'crustacean shellfish',
  'sesame',
];

const RENAMES = [
  { from: 'dairy', to: 'milk' },
  { from: 'egg', to: 'eggs' },
  { from: 'soy', to: 'soybeans' },
];

const SHOWCASE_INGREDIENTS = [
  { name: 'peanut butter', category: 'spread',  allergen: 'peanuts' },
  { name: 'walnut',        category: 'nut',     allergen: 'tree nuts' },
  { name: 'salmon',        category: 'seafood', allergen: 'fish' },
  { name: 'shrimp',        category: 'seafood', allergen: 'crustacean shellfish' },
  { name: 'sesame seed',   category: 'seed',    allergen: 'sesame' },
];

const EXTRA_LINKS = [
  { ingredient: 'spaghetti', allergen: 'wheat' },
];

(async () => {
  const session = getSession();
  let totalRenamed = 0;
  let totalCreated = 0;
  let totalIngredients = 0;
  let totalLinks = 0;

  try {
    console.log('• Step 1 — renaming existing allergens to FDA terms…');
    for (const { from, to } of RENAMES) {
      const result = await session.run(
        `
        MATCH (old:Allergen {name: $from})
        OPTIONAL MATCH (other:Allergen {name: $to})
        WITH old, other
        WHERE other IS NULL OR id(other) = id(old)
        SET old.name = $to
        RETURN count(old) AS renamed
        `,
        { from, to }
      );
      const n = result.records[0]?.get('renamed') ?? 0;
      const renamed = typeof n === 'object' ? n.toNumber() : Number(n);
      if (renamed > 0) {
        console.log(`    - renamed '${from}' → '${to}'`);
        totalRenamed += renamed;
      }

      const clashResult = await session.run(
        `
        MATCH (a:Allergen {name: $from}), (b:Allergen {name: $to})
        WHERE id(a) <> id(b)
        MATCH (i:Ingredient)-[r:CONTAINS_ALLERGEN]->(a)
        MERGE (i)-[:CONTAINS_ALLERGEN]->(b)
        DELETE r
        WITH a
        DETACH DELETE a
        RETURN 1
        `,
        { from, to }
      );
      if (clashResult.records.length > 0) {
        console.log(`    - merged duplicate '${from}' into '${to}'`);
      }
    }
    if (totalRenamed === 0) console.log('    (no legacy allergen names found)');

    console.log('• Step 2 — ensuring all Big-9 allergen nodes exist…');
    const ensureResult = await session.run(
      `
      UNWIND $names AS name
      MERGE (a:Allergen {name: name})
        ON CREATE SET a.createdAt = datetime()
      RETURN count(a) AS total
      `,
      { names: BIG_9 }
    );
    totalCreated = ensureResult.records[0].get('total');
    console.log(`    ✓ ${BIG_9.length} Big-9 allergens present`);

    console.log('• Step 3 — linking existing ingredients to allergens…');
    for (const { ingredient, allergen } of EXTRA_LINKS) {
      const r = await session.run(
        `
        MATCH (i:Ingredient {name: $ingredient}), (a:Allergen {name: $allergen})
        MERGE (i)-[:CONTAINS_ALLERGEN]->(a)
        RETURN count(*) AS linked
        `,
        { ingredient, allergen }
      );
      const n = r.records[0].get('linked');
      const linked = typeof n === 'object' ? n.toNumber() : Number(n);
      if (linked > 0) {
        console.log(`    - linked '${ingredient}' → '${allergen}'`);
        totalLinks += linked;
      }
    }

    console.log('• Step 4 — adding showcase ingredients for empty allergens…');
    for (const { name, category, allergen } of SHOWCASE_INGREDIENTS) {
      const r = await session.run(
        `
        MERGE (i:Ingredient {name: $name})
          ON CREATE SET i.category = $category
        WITH i
        MATCH (a:Allergen {name: $allergen})
        MERGE (i)-[:CONTAINS_ALLERGEN]->(a)
        RETURN i.name AS ingredient
        `,
        { name, category, allergen }
      );
      if (r.records.length > 0) {
        console.log(`    - ${name} (${category}) → ${allergen}`);
        totalIngredients += 1;
      }
    }

    console.log('');
    console.log('Migration complete:');
    console.log(`  • Allergens renamed:        ${totalRenamed}`);
    console.log(`  • Big-9 allergens present:  9`);
    console.log(`  • Extra ingredient links:   ${totalLinks}`);
    console.log(`  • Showcase ingredients:     ${totalIngredients}`);
  } catch (err) {
    console.error('[upgradeBig9Allergens] failed:', err);
    process.exitCode = 1;
  } finally {
    await session.close();
    await closeDriver();
  }
})();
