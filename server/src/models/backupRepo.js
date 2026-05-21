const { getSession } = require('../config/db');

const BACKUP_VERSION = '1.0';

const ALLOWED_LABELS = new Set([
  'User',
  'Recipe',
  'Ingredient',
  'Cuisine',
  'Allergen',
]);

const ALLOWED_REL_TYPES = new Set([
  'CREATED',
  'LIKED',
  'CONTAINS',
  'BELONGS_TO',
  'CONTAINS_ALLERGEN',
  'SUBSTITUTES_FOR',
]);

function assertAllowedLabel(label) {
  if (!ALLOWED_LABELS.has(label)) {
    throw Object.assign(new Error(`unsupported node label: ${label}`), { status: 400 });
  }
}

/** Primary label used to identify a node in the backup file. */
function primaryLabel(labels) {
  const order = ['User', 'Recipe', 'Ingredient', 'Cuisine', 'Allergen'];
  for (const l of order) {
    if (labels.includes(l)) return l;
  }
  return labels[0] || 'Node';
}

function serializeValue(v) {
  if (v == null) return v;
  if (typeof v === 'object') {
    if (typeof v.toNumber === 'function') return v.toNumber();
    if (typeof v.toString === 'function' && v.constructor?.name === 'DateTime') {
      return v.toString();
    }
  }
  return v;
}

function serializeProps(props) {
  const out = {};
  for (const [k, val] of Object.entries(props || {})) {
    out[k] = serializeValue(val);
  }
  return out;
}

/** Stable reference so relationships can reconnect nodes after import. */
function nodeRef(labels, props) {
  const label = primaryLabel(labels);
  const p = serializeProps(props);

  if (label === 'User') {
    return { label, key: 'username', value: p.username };
  }
  if (label === 'Recipe') {
    return { label, key: p.id ? 'id' : 'title', value: p.id || p.title };
  }
  return { label, key: 'name', value: p.name };
}

async function exportGraph() {
  const session = getSession();
  try {
    const nodesResult = await session.run(`
      MATCH (n)
      RETURN labels(n) AS labels, properties(n) AS props
    `);

    const nodes = nodesResult.records.map((r) => {
      const labels = r.get('labels');
      const props = serializeProps(r.get('props'));
      return {
        labels,
        properties: props,
        ref: nodeRef(labels, props),
      };
    });

    const relsResult = await session.run(`
      MATCH (a)-[r]->(b)
      RETURN type(r) AS type,
             properties(r) AS props,
             labels(a) AS startLabels,
             properties(a) AS startProps,
             labels(b) AS endLabels,
             properties(b) AS endProps
    `);

    const relationships = relsResult.records.map((r) => ({
      type: r.get('type'),
      properties: serializeProps(r.get('props')),
      from: nodeRef(r.get('startLabels'), r.get('startProps')),
      to: nodeRef(r.get('endLabels'), r.get('endProps')),
    }));

    return {
      version: BACKUP_VERSION,
      app: 'sangkap',
      exportedAt: new Date().toISOString(),
      summary: {
        nodes: nodes.length,
        relationships: relationships.length,
      },
      nodes,
      relationships,
    };
  } finally {
    await session.close();
  }
}

function validateBackup(data) {
  if (!data || typeof data !== 'object') {
    throw Object.assign(new Error('invalid backup: expected JSON object'), { status: 400 });
  }
  if (!Array.isArray(data.nodes) || !Array.isArray(data.relationships)) {
    throw Object.assign(new Error('invalid backup: missing nodes or relationships arrays'), {
      status: 400,
    });
  }
}

async function mergeNode(session, { labels, properties, ref }) {
  const label = ref?.label || primaryLabel(labels);
  assertAllowedLabel(label);
  const props = { ...properties };

  if (label === 'User') {
    await session.run(
      `
      MERGE (n:User {username: $username})
      SET n.email = $email,
          n.passwordHash = $passwordHash
      `,
      {
        username: props.username,
        email: props.email || '',
        passwordHash: props.passwordHash || '',
      }
    );
    return;
  }

  if (label === 'Recipe') {
    const id = props.id || ref.value;
    await session.run(
      `
      MERGE (n:Recipe {id: $id})
      SET n.title = $title,
          n.instructions = coalesce($instructions, ''),
          n.prepTimeMinutes = coalesce($prepTimeMinutes, 0),
          n.servings = coalesce($servings, 0),
          n.imageUrl = coalesce($imageUrl, ''),
          n.createdAt = coalesce($createdAt, datetime())
      `,
      {
        id,
        title: props.title || 'Untitled',
        instructions: props.instructions,
        prepTimeMinutes: props.prepTimeMinutes,
        servings: props.servings,
        imageUrl: props.imageUrl,
        createdAt: props.createdAt || null,
      }
    );
    return;
  }

  if (label === 'Ingredient') {
    await session.run(
      `
      MERGE (n:Ingredient {name: $name})
      SET n.category = coalesce($category, 'misc')
      `,
      { name: props.name || ref.value, category: props.category }
    );
    return;
  }

  if (label === 'Cuisine') {
    await session.run(
      `MERGE (n:Cuisine {name: $name})`,
      { name: props.name || ref.value }
    );
    return;
  }

  if (label === 'Allergen') {
    await session.run(
      `MERGE (n:Allergen {name: $name})`,
      { name: props.name || ref.value }
    );
  }
}

async function mergeRelationship(session, rel) {
  const { type, properties, from, to } = rel;
  if (!ALLOWED_REL_TYPES.has(type)) return;
  assertAllowedLabel(from.label);
  assertAllowedLabel(to.label);
  const props = properties || {};

  const matchStart = `
    MATCH (a:${from.label} {${from.key}: $fromVal})
    MATCH (b:${to.label} {${to.key}: $toVal})
  `;

  const params = { fromVal: from.value, toVal: to.value };

  switch (type) {
    case 'CREATED':
      await session.run(
        `${matchStart}
         MERGE (a)-[r:CREATED]->(b)
         ON CREATE SET r.createdAt = coalesce($createdAt, datetime())
         ON MATCH  SET r.createdAt = coalesce($createdAt, r.createdAt)`,
        { ...params, createdAt: props.createdAt || null }
      );
      break;
    case 'LIKED':
      await session.run(
        `${matchStart}
         MERGE (a)-[r:LIKED]->(b)
         ON CREATE SET r.likedAt = coalesce($likedAt, datetime())
         ON MATCH  SET r.likedAt = coalesce($likedAt, r.likedAt)`,
        { ...params, likedAt: props.likedAt || null }
      );
      break;
    case 'CONTAINS':
      await session.run(
        `${matchStart}
         MERGE (a)-[r:CONTAINS]->(b)
         SET r.quantity = coalesce($quantity, 0),
             r.unit = coalesce($unit, '')`,
        { ...params, quantity: props.quantity, unit: props.unit }
      );
      break;
    case 'BELONGS_TO':
      await session.run(`${matchStart} MERGE (a)-[:BELONGS_TO]->(b)`, params);
      break;
    case 'CONTAINS_ALLERGEN':
      await session.run(`${matchStart} MERGE (a)-[:CONTAINS_ALLERGEN]->(b)`, params);
      break;
    case 'SUBSTITUTES_FOR':
      await session.run(
        `${matchStart}
         MERGE (a)-[r:SUBSTITUTES_FOR]->(b)
         SET r.ratio = coalesce($ratio, '1:1')`,
        { ...params, ratio: props.ratio }
      );
      break;
    default:
      break;
  }
}

async function importGraph(backup, { replace = false } = {}) {
  validateBackup(backup);

  const session = getSession();
  try {
    if (replace) {
      await session.run('MATCH (n) DETACH DELETE n');
    }

    for (const node of backup.nodes) {
      await mergeNode(session, node);
    }

    let importedRels = 0;
    for (const rel of backup.relationships) {
      try {
        await mergeRelationship(session, rel);
        importedRels += 1;
      } catch (err) {
        console.warn('[backup.import] skipped relationship', rel.type, err.message);
      }
    }

    return {
      replaced: Boolean(replace),
      nodes: backup.nodes.length,
      relationships: importedRels,
    };
  } finally {
    await session.close();
  }
}

module.exports = {
  exportGraph,
  importGraph,
  BACKUP_VERSION,
};
