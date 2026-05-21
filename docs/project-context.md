# Sangkap — Project Context

## Course

ITD110 — Case Study #2 (Graph Database)

## Concept

People underuse what's already in their kitchen because traditional recipe sites can't answer the question that matters most: *"What can I cook **right now** with what I already have, that's safe for me, and that someone like me actually enjoyed?"* That question is fundamentally about **connections** — between dishes, ingredients, allergens, cuisines, and people — which is precisely what a relational database struggles to model efficiently.

**Sangkap** (Filipino for *"ingredient"*) is a web application that treats the food domain as what it really is: a graph. By storing recipes, ingredients, cuisines, allergens, and users as nodes — and `CONTAINS`, `BELONGS_TO`, `CONTAINS_ALLERGEN`, `SUBSTITUTES_FOR`, `CREATED`, and `LIKED` as first-class relationships — Sangkap can answer multi-hop questions with single, readable Cypher queries instead of cascades of SQL JOINs.

## Why Neo4j (the case-study justification)

| Question Sangkap answers | SQL approach | Neo4j approach |
| --- | --- | --- |
| *Recipes I can cook with X, Y, Z* | 2 JOINs + group + having | 1 pattern + collect |
| *Ingredient substitutes for eggs* | Awkward — no clean "similar context" SQL | `(:Ingredient)-[:SUBSTITUTES_FOR]->()` |
| *Recipes safe for someone allergic to soy + dairy* | Anti-join, hard to extend | `NOT EXISTS { ... pattern ... }` |
| *Recipes liked by users who liked the recipes I liked* | 4+ JOINs, slow, hard to read | 4-hop pattern, one paragraph |

The graph database is not a stylistic choice here — it is the only model that keeps these queries **readable, fast, and easy to extend** as the schema grows.

## Domain (per requirements)

Agriculture & Food Systems → Recipe & Ingredient Recommender.

## Core requirements coverage

| Requirement | Where it lives |
| --- | --- |
| Backend uses Neo4j | `server/src/config/db.js` — official `neo4j-driver` |
| Web application | `client/` (React + Vite) and `server/` (Express) |
| User authentication (Login/Logout) | JWT-based auth (planned) |
| CRUD operations | Recipes + Ingredients (planned) |
| Search functionality | By name, cuisine, ingredient (planned) |
| Data visualization (dashboard) | Charts on most-used ingredients, recipes per cuisine, etc. (planned) |
| Backup feature (JSON download) | `GET /api/backup/json` export · `POST /api/backup/import` restore (`/backup` page) |

## Bonus features beyond the rubric

- 🥘 **Pantry Mode** — recipe matching by available ingredients
- 🔁 **Smart Substitutes** — ingredient substitution lookup
- 🛡️ **Allergen-Safe Filter** — negative pattern matching across multiple hops
- 💡 **Collaborative Filtering** — "users who liked X also liked Y" via 4-hop traversal
- 🕸️ **Interactive graph visualization** — embedded force-directed graph view of the data

## Data model

### Nodes

| Label | Purpose | Example properties |
| --- | --- | --- |
| `:User` | Account that logs in and likes recipes | `username`, `email`, `passwordHash`, `createdAt` |
| `:Recipe` | A dish you can cook | `title`, `instructions`, `prepTimeMinutes`, `servings`, `imageUrl` |
| `:Ingredient` | A raw ingredient | `name`, `category` |
| `:Cuisine` | Cooking tradition | `name` |
| `:Allergen` | An allergen group (FDA "Big 9") | `name` |

### Relationships

| Type | Direction | Properties | Purpose |
| --- | --- | --- | --- |
| `:CREATED` | `User → Recipe` | `createdAt` | Ownership |
| `:LIKED` | `User → Recipe` | `likedAt` | Collaborative-filtering signal |
| `:CONTAINS` | `Recipe → Ingredient` | `quantity`, `unit` | Core recipe composition |
| `:BELONGS_TO` | `Recipe → Cuisine` | — | Cuisine filter |
| `:CONTAINS_ALLERGEN` | `Ingredient → Allergen` | — | Allergen safety filter |
| `:SUBSTITUTES_FOR` | `Ingredient → Ingredient` | `ratio` | Substitute lookup |

### Allergen reference

Allergens follow the **U.S. FDA "Big 9"** food allergens defined by the *Food Allergen Labeling and Consumer Protection Act (FALCPA, 2004)* and extended by the *FASTER Act (2021)*:

1. **Milk**
2. **Eggs**
3. **Peanuts**
4. **Tree nuts** (e.g. walnuts, almonds, cashews)
5. **Wheat**
6. **Soybeans**
7. **Fish** (e.g. salmon, tuna, cod)
8. **Crustacean shellfish** (e.g. shrimp, crab, lobster)
9. **Sesame**

Together these account for roughly **90% of all severe food-allergy reactions** in the United States. Each `:Allergen` node is a single, canonical group — every ingredient that contains it gets exactly one `:CONTAINS_ALLERGEN` edge to that node, so adding new recipes inherits the safety classification for free.

### Schema diagram

```text
   (User)──CREATED──▶(Recipe)──BELONGS_TO──▶(Cuisine)
     │                  │
   LIKED              CONTAINS {qty, unit}
     │                  ▼
     ▼              (Ingredient)──CONTAINS_ALLERGEN──▶(Allergen)
   (Recipe)             │
                    SUBSTITUTES_FOR
                        ▼
                    (Ingredient)
```
