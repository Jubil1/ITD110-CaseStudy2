const { getSession } = require('../config/db');

/**
 * User repository — all Cypher queries that touch `:User` nodes live here.
 *
 * Why a "repo" module?
 *   Keeping queries in one place means controllers don't deal with Cypher
 *   directly. If we later change how a User is stored, only this file changes.
 */

function toPublic(userProps) {
  if (!userProps) return null;
  const { passwordHash, ...rest } = userProps;
  return rest;
}

async function findByUsername(username) {
  const session = getSession();
  try {
    const result = await session.run(
      'MATCH (u:User {username: $username}) RETURN u LIMIT 1',
      { username }
    );
    if (result.records.length === 0) return null;
    return result.records[0].get('u').properties;
  } finally {
    await session.close();
  }
}

async function findByEmail(email) {
  const session = getSession();
  try {
    const result = await session.run(
      'MATCH (u:User {email: $email}) RETURN u LIMIT 1',
      { email }
    );
    if (result.records.length === 0) return null;
    return result.records[0].get('u').properties;
  } finally {
    await session.close();
  }
}

async function createUser({ username, email, passwordHash }) {
  const session = getSession();
  try {
    const result = await session.run(
      `CREATE (u:User {
         username: $username,
         email: $email,
         passwordHash: $passwordHash,
         createdAt: datetime()
       })
       RETURN u`,
      { username, email, passwordHash }
    );
    return result.records[0].get('u').properties;
  } finally {
    await session.close();
  }
}

async function updatePasswordHash(username, passwordHash) {
  const session = getSession();
  try {
    await session.run(
      'MATCH (u:User {username: $username}) SET u.passwordHash = $passwordHash RETURN u',
      { username, passwordHash }
    );
  } finally {
    await session.close();
  }
}

module.exports = {
  findByUsername,
  findByEmail,
  createUser,
  updatePasswordHash,
  toPublic,
};
