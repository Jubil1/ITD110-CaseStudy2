#!/usr/bin/env node
/**
 * addRecipeIds.js
 *
 * Idempotent migration: every :Recipe node without an `id` property gets
 * one assigned via randomUUID(). Safe to run multiple times.
 *
 * Usage:
 *   pnpm migrate:recipe-ids
 */
require('dotenv').config();
const { getSession, closeDriver } = require('../config/db');

(async () => {
  const session = getSession();
  try {
    const result = await session.run(`
      MATCH (r:Recipe)
      WHERE r.id IS NULL
      SET r.id = randomUUID()
      RETURN count(r) AS updated
    `);
    const updated = result.records[0].get('updated');
    console.log(`  ✓  ${updated} recipe(s) backfilled with a UUID id.`);
  } catch (err) {
    console.error('[addRecipeIds] failed:', err);
    process.exitCode = 1;
  } finally {
    await session.close();
    await closeDriver();
  }
})();
