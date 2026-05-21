const neo4j = require('neo4j-driver');

let driver;

function getDriver() {
  if (driver) return driver;

  const uri = process.env.NEO4J_URI || 'neo4j://127.0.0.1:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'neo4j';

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    disableLosslessIntegers: true,
  });

  return driver;
}

async function verifyConnectivity() {
  const d = getDriver();
  try {
    await d.verifyConnectivity();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function getSession() {
  const database = process.env.NEO4J_DATABASE || 'neo4j';
  return getDriver().session({ database });
}

async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

module.exports = {
  getDriver,
  getSession,
  verifyConnectivity,
  closeDriver,
};
