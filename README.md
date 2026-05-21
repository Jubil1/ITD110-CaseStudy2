# Sangkap

> **Sangkap** (Filipino: *ingredient*) — a recipe and ingredient recommender powered by **Neo4j**.

A full-stack web app for the **Agriculture & Food Systems** domain (ITD110 Case Study #2). It models recipes, ingredients, cuisines, users, and FDA **Big 9** allergens as a graph so multi-hop questions — pantry matching, allergen safety, substitutes — stay readable in Cypher instead of long SQL join chains.

**Repository:** [github.com/Jubil1/ITD110-CaseStudy2](https://github.com/Jubil1/ITD110-CaseStudy2)

---

## Features

| Status | Feature |
| --- | --- |
| ✓ | Landing page |
| ✓ | User authentication (JWT login / register / logout) |
| ✓ | CRUD — Recipes & Ingredients |
| ✓ | Search (name, cuisine, ingredient) |
| ✓ | **Pantry Mode** — match recipes by what you have |
| ✓ | **Smart Substitutes** — `SUBSTITUTES_FOR` lookup |
| ✓ | Dashboard (ingredients, cuisines, allergens, likes) |
| ✓ | JSON backup export / import |
| ✓ | Ingredients hub + FDA Big 9 allergen links |
| — | Allergen-Safe standalone page (covered in Pantry exclusion) |
| — | Collaborative filtering (schema supports `LIKED`; UI not built) |

### Core requirements

| Feature | Route / API |
| --- | --- |
| Neo4j graph backend | `server/src/models/*` — all Cypher in repository modules |
| Web application | React (Vite) + Express REST API |
| User authentication | `POST /api/auth/register`, `login` · JWT on protected routes |
| CRUD | Recipes (`/recipes`) · Ingredients (`/ingredients`) |
| Search | Recipes by title, cuisine, ingredient |
| Dashboard | `/dashboard` — Chart.js charts from live Cypher aggregations |
| JSON backup | `GET /api/backup/json` · `POST /api/backup/import` · `/backup` page |

### Bonus features

| Feature | Route |
| --- | --- |
| **Pantry Mode** | `/pantry` — match recipes by ingredients on hand, % match, allergen exclusion |
| **Smart Substitutes** | `/substitutes` — `SUBSTITUTES_FOR` edges with conversion ratios |
| **Ingredients hub** | `/ingredients` — manage canonical nodes, link allergens, view recipe usage |
| Allergen inference | Recipe detail + form preview via `Ingredient → CONTAINS_ALLERGEN → Allergen` |

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Chart.js, Axios |
| Backend | Node.js, Express |
| Database | Neo4j 5+ (`neo4j-driver`) |
| Auth | bcryptjs, JSON Web Tokens |
| Styling | Plain CSS — Fraunces + Inter |

---

## Graph data model

### Nodes

| Label | Purpose | Key properties |
| --- | --- | --- |
| `User` | Accounts | `username`, `email`, `passwordHash` |
| `Recipe` | Dishes | `id`, `title`, `instructions`, `prepTimeMinutes`, `servings` |
| `Ingredient` | Canonical pantry items | `name`, `category` |
| `Cuisine` | Cooking tradition | `name` |
| `Allergen` | FDA Big 9 groups | `name` |

### Relationships

| Type | Direction | Properties |
| --- | --- | --- |
| `CREATED` | User → Recipe | `createdAt` |
| `LIKED` | User → Recipe | `likedAt` |
| `CONTAINS` | Recipe → Ingredient | `quantity`, `unit` |
| `BELONGS_TO` | Recipe → Cuisine | — |
| `CONTAINS_ALLERGEN` | Ingredient → Allergen | — |
| `SUBSTITUTES_FOR` | Ingredient → Ingredient | `ratio` |

See [`docs/project-context.md`](docs/project-context.md) for schema diagrams, killer Cypher examples, and the Neo4j vs SQL justification.

---

## Project structure

```text
ITD110-CaseStudy2/
├── README.md
├── docs/
│   └── project-context.md
├── client/                    # React + Vite
│   ├── src/
│   │   ├── api/               # Axios clients (recipes, ingredients, stats, backup)
│   │   ├── components/        # Navbar, Footer, RecipeCard, MiniGraph, …
│   │   ├── context/           # AuthContext (JWT session)
│   │   └── pages/             # Landing, Recipes, Pantry, Dashboard, Backup, …
│   └── package.json
└── server/                    # Express + Neo4j
    ├── .env.example
    ├── src/
    │   ├── config/db.js
    │   ├── models/            # recipeRepo, ingredientRepo, statsRepo, backupRepo, userRepo
    │   ├── controllers/
    │   ├── routes/
    │   ├── middleware/auth.js
    │   ├── seed.cypher        # Fresh database seed
    │   └── scripts/           # Migrations (recipe IDs, Big 9 allergens, demo user passwords)
    └── package.json
```

---

## Prerequisites

- **Node.js** 18+ and **pnpm** or **npm**
- **Neo4j 5.x** — [Neo4j Desktop](https://neo4j.com/download) recommended

---

## Quick start

### 1. Neo4j — load demo data

1. Start your Neo4j instance in Neo4j Desktop.
2. Open **Query** (Neo4j Browser).
3. Paste and run everything in [`server/src/seed.cypher`](server/src/seed.cypher).

This creates demo users, three recipes (Adobo, Sinigang, Carbonara), ingredients, cuisines, FDA Big 9 allergens, and sample `SUBSTITUTES_FOR` edges.

**If you already seeded an older version** (3 allergens only), run once from `server/`:

```bash
pnpm migrate:big9-allergens
# or: npm run migrate:big9-allergens
```

Then hash demo user passwords so login works:

```bash
pnpm seed:demo-users
```

Demo logins after seed + hash: register a new account, or use seeded users once passwords are hashed (`sangkap123` if you ran `seed:demo-users` on the original seed).

### 2. Backend

```bash
cd server
cp .env.example .env
```

Edit `.env` — set `NEO4J_PASSWORD` to your Neo4j password and a strong `JWT_SECRET`.

```bash
pnpm install    # or npm install
pnpm dev        # or npm run dev
```

API: **http://localhost:5000**

| Endpoint | Description |
| --- | --- |
| `GET /api/health` | Server status |
| `GET /api/health/db` | Neo4j connectivity + node/relationship counts |
| `GET /api/recipes` | List / search recipes |
| `POST /api/recipes/pantry-match` | Pantry matching (body: `pantry`, `excludeAllergens`, `minMatch`) |
| `GET /api/ingredients` | List ingredients |
| `GET /api/ingredients/substitutes` | All substitution pairs |
| `GET /api/stats/dashboard` | Dashboard aggregates |
| `GET /api/backup/json` | Export full graph as JSON |

### 3. Frontend

```bash
cd client
pnpm install
pnpm dev
```

App: **http://localhost:5173** (Vite default)

Optional: create `client/.env` with:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## App routes

| Path | Description |
| --- | --- |
| `/` | Landing page |
| `/login`, `/signup` | Authentication |
| `/home` | Post-login hub (protected) |
| `/recipes` | Browse, search, filter by cuisine |
| `/recipes/new`, `/recipes/:id/edit` | Create / edit recipe (protected) |
| `/recipes/:id` | Recipe detail, likes, allergens |
| `/ingredients` | Ingredient catalog |
| `/ingredients/:name` | Ingredient detail, allergens, substitutes |
| `/pantry` | Pantry Mode — recipe match by available ingredients |
| `/substitutes` | Substitute Finder |
| `/dashboard` | Charts and rankings |
| `/backup` | JSON export / import |

---

## Pantry Mode (signature query)

The app ranks recipes by how many of their ingredients appear in your pantry, optionally excluding recipes that traverse into banned allergens:

```cypher
MATCH (r:Recipe)-[:CONTAINS]->(i:Ingredient)
WITH r, collect(DISTINCT toLower(i.name)) AS recipeIngs
WHERE NOT EXISTS {
  MATCH (r)-[:CONTAINS]->(:Ingredient)-[:CONTAINS_ALLERGEN]->(a:Allergen)
  WHERE a.name IN $bannedAllergens
}
WITH r, recipeIngs,
     [x IN recipeIngs WHERE x IN $pantry] AS matched,
     [x IN recipeIngs WHERE NOT x IN $pantry] AS missing
WITH r, matched, missing,
     toFloat(size(matched)) / toFloat(size(recipeIngs)) AS matchRatio
WHERE matchRatio >= $minMatch
RETURN r.title, matchRatio, matched, missing
ORDER BY matchRatio DESC
```

Implemented in `server/src/models/recipeRepo.js` → `matchByPantry()`.

---

## Backup format

Export produces JSON with `version`, `exportedAt`, `nodes[]`, and `relationships[]`. Nodes reconnect on import via stable keys (`Recipe.id`, `Ingredient.name`, `User.username`). Import supports **merge** (upsert) or **replace** (wipe then restore). Requires login for import.

---

## Scripts (server)

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start API with nodemon |
| `pnpm seed:demo-users` | Set bcrypt passwords on seeded demo users |
| `pnpm migrate:recipe-ids` | Backfill UUID `id` on recipes missing one |
| `pnpm migrate:big9-allergens` | Upgrade legacy 3-allergen seed to FDA Big 9 |

---

## Security notes

- `server/.env` is **not** committed — use `.env.example` as a template.
- Never commit Neo4j passwords or `JWT_SECRET`.
- Import with **replace** deletes all graph data — use with care.

---

## License

Educational use — ITD110 / RTU.
