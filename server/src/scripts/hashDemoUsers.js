#!/usr/bin/env node
/**
 * hashDemoUsers.js
 *
 * One-off script: replaces the placeholder passwordHash on the seeded
 * demo users (jubil, maria) with a real bcrypt hash so you can actually
 * log in as them during a demo.
 *
 * Usage:
 *   node src/scripts/hashDemoUsers.js
 *
 * Result:
 *   jubil  / sangkap123
 *   maria  / sangkap123
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getSession, closeDriver } = require('../config/db');

const DEMO_PASSWORD = 'sangkap123';
const DEMO_USERS = ['jubil', 'maria'];

(async () => {
  const session = getSession();
  try {
    for (const username of DEMO_USERS) {
      const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
      const result = await session.run(
        `MATCH (u:User {username: $username})
         SET u.passwordHash = $hash
         RETURN u.username AS username`,
        { username, hash }
      );

      if (result.records.length === 0) {
        console.warn(`  ⚠  ${username} not found — skipping`);
      } else {
        console.log(`  ✓  ${username}  → password "${DEMO_PASSWORD}"`);
      }
    }
    console.log('\nDone. You can now log in as the demo users.');
  } catch (err) {
    console.error('[hashDemoUsers] failed:', err);
    process.exitCode = 1;
  } finally {
    await session.close();
    await closeDriver();
  }
})();
