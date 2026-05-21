# Sangkap — ITD110 Case Study #2

> *Sangkap* (Filipino: "ingredient") — a recipe & ingredient recommender built on a **Neo4j graph database**.

A web application that helps you cook smarter with what you already have. Built to demonstrate the practical advantages of a graph database (Neo4j) over relational and other NoSQL data models in the **Agriculture and Food Systems** domain.

## Features

| Status | Feature |
| --- | --- |
| ✓ | Landing page with Sangkap branding |
| ☐ | User authentication (Login / Logout) — JWT |
| ☐ | CRUD operations (Recipes, Ingredients) |
| ☐ | Search (by name, cuisine, ingredient) |
| ☐ | **Pantry Mode** — "What can I cook with rice, egg, soy sauce?" |
| ☐ | **Smart Substitutes** — "What can replace eggs?" |
| ☐ | **Allergen-Safe Filter** — exclude recipes by allergen |
| ☐ | **Collaborative Filtering** — "users like you also liked..." |
| ☐ | Dashboard (most-used ingredients, recipes per cuisine, etc.) |
| ☐ | JSON backup export / import |

## Tech stack

- **Frontend:** React + Vite, React Router, Chart.js
- **Backend:** Node.js + Express
- **Database:** Neo4j 5+ via `neo4j-driver`
- **Auth:** bcryptjs + JSON Web Tokens
- **Styling:** Plain CSS with Fraunces + Inter web fonts

## Project structure

```text
ITD110-CaseStudy2/
├── README.md
├── docs/
│   └── project-context.md
├── client/                              # React + Vite frontend
│   ├── index.html
│   ├── package.json
│   ├── public/
│   │   └── sangkap-icon.svg
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css                    # Theme tokens + base styles
│       ├── components/
│       │   ├── Navbar.jsx + .css
│       │   ├── Footer.jsx + .css
│       │   └── MiniGraph.jsx + .css     # SVG graph preview on landing page
│       └── pages/
│           └── LandingPage.jsx + .css
└── server/                              # Express + Neo4j API
    ├── package.json
    ├── .env.example
    └── src/
        ├── server.js                    # HTTP bootstrap
        ├── app.js                       # Express setup
        ├── seed.cypher                  # Demo data (paste into Neo4j Browser)
        ├── config/
        │   └── db.js                    # Neo4j driver + session helpers
        ├── routes/
        │   └── healthRoutes.js          # /api/health and /api/health/db
        ├── controllers/                 # (CRUD controllers — coming soon)
        ├── middleware/                  # (auth middleware — coming soon)
        └── models/                      # (Cypher repository modules — coming soon)
```

## Prerequisites

- **Node.js** (v18 or later) and npm
- **Neo4j 5.x or 2026.x** running locally — easiest via [Neo4j Desktop](https://neo4j.com/download)

## 1. Start Neo4j

1. Open Neo4j Desktop
2. Create a Local DBMS (or use the "Case Study 2" instance you already have)
3. Start the database — note the password you set
4. Open the **Query** tool inside Neo4j Desktop
5. Paste the contents of `server/src/seed.cypher` and run it to load demo data

## 2. Run the backend

```bash
cd server
cp .env.example .env       # then edit NEO4J_PASSWORD to match your instance
npm install
npm run dev
```

The API will boot at <http://localhost:5000>. Verify it sees Neo4j:

- `GET http://localhost:5000/api/health` → `{ status: "ok" }`
- `GET http://localhost:5000/api/health/db` → `{ db: "connected", nodeCount: 23, relationshipCount: 28 }`

## 3. Run the frontend

```bash
cd client
npm install
npm run dev
```

Vite will pick a free port (usually <http://localhost:5173>). Open it in your browser to see the Sangkap landing page.

## Demo data overview

The seed creates **23 nodes** and **28 relationships** across all five node labels and all six relationship types — enough to demo every feature in the rubric without feeling sparse.

See `docs/project-context.md` for the full data model, schema diagram, and the "Why Neo4j?" justification.

## License

Educational use — ITD110 / RTU.
