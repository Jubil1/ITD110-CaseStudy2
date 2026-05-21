import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import MiniGraph from '../components/MiniGraph.jsx';
import './LandingPage.css';

const features = [
  {
    icon: '🥘',
    title: 'Pantry Mode',
    text: "Tell us what's in your kitchen — we'll find what you can cook tonight, ranked by how complete the match is.",
    accent: 'primary',
  },
  {
    icon: '🔁',
    title: 'Smart Substitutes',
    text: 'Out of eggs? Get safe, tested replacements for any ingredient with the right ratio.',
    accent: 'amber',
  },
  {
    icon: '🛡️',
    title: 'Allergen-Safe',
    text: 'Hide recipes containing peanut, dairy, soy, or anything else — a single graph query keeps you safe.',
    accent: 'leaf',
  },
  {
    icon: '💡',
    title: 'You-Might-Like Picks',
    text: 'Recommendations powered by what users like you actually enjoyed — collaborative filtering, the graph way.',
    accent: 'ink',
  },
];

const steps = [
  {
    n: 1,
    title: 'Sign up & explore',
    text: 'Create your account and browse a network of Filipino & international recipes.',
  },
  {
    n: 2,
    title: 'Pick from your pantry',
    text: 'Tap the ingredients you already have at home — even just three are enough.',
  },
  {
    n: 3,
    title: 'Cook smarter, instantly',
    text: 'Sangkap traces the graph and shows recipes you can make, missing items, and safe substitutes.',
  },
];

function LandingPage() {
  return (
    <div className="page">
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Powered by Neo4j</span>
            <h1>
              Cook smarter with <span className="ink-accent">what you already have.</span>
            </h1>
            <p className="hero-sub">
              Sangkap is a recipe network — not a recipe list. We model dishes, ingredients,
              cuisines, allergens, and people as a graph, so finding what to cook tonight
              is one connected question, not a dozen.
            </p>
            <div className="hero-cta">
              <Link to="/signup" className="btn btn-primary">Get started — it's free</Link>
              <Link to="/recipes" className="btn btn-ghost">Explore recipes</Link>
            </div>
            <ul className="hero-bullets">
              <li><span className="check">✓</span> Real Neo4j queries, not toy data</li>
              <li><span className="check">✓</span> Local Filipino flavor first</li>
            </ul>
          </div>

          <div className="hero-visual">
            <MiniGraph />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">What you can do</span>
            <h2>Four features. One graph. Zero JOINs.</h2>
            <p className="section-sub">
              Each capability below is a single Cypher query against our graph database.
              In SQL, the same answers take three to six joins.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((f) => (
              <article key={f.title} className={`feature-card accent-${f.accent}`}>
                <div className="feature-icon" aria-hidden="true">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Why Graph */}
      <section className="why-graph">
        <div className="container why-grid">
          <div>
            <span className="eyebrow">Why a graph database?</span>
            <h2>Food data is a network, not a spreadsheet.</h2>
            <p>
              Recipes connect to ingredients. Ingredients connect to allergens, substitutes,
              and origins. Users connect to the recipes they love — and to each other through
              shared tastes. Storing this in tables means slow, brittle JOINs every time you
              ask a question. In a graph database, connections <em>are</em> the data.
            </p>
            <ul className="why-list">
              <li><strong>Native traversal</strong> — multi-hop queries stay fast, even at scale.</li>
              <li><strong>Readable Cypher</strong> — patterns look like the question itself.</li>
              <li><strong>Easy to extend</strong> — add a new relationship type, not a new table.</li>
            </ul>
          </div>

          <div className="cypher-card">
            <div className="cypher-header">
              <span className="cypher-dot dot-r" />
              <span className="cypher-dot dot-y" />
              <span className="cypher-dot dot-g" />
              <span className="cypher-title">Pantry Mode · Cypher</span>
            </div>
            <pre className="cypher-body">
              <code>
{`WITH ['chicken','garlic','onion'] AS pantry
MATCH (r:Recipe)-[:CONTAINS]->(i:Ingredient)
WITH r,
     pantry,
     collect(i.name) AS need,
     [n IN collect(i.name) WHERE n IN pantry] AS have
RETURN r.title       AS recipe,
       size(have)    AS youHave,
       size(need)    AS needs,
       round(100.0 *
         size(have) / size(need)) AS match
ORDER BY match DESC;`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>Three steps to a better dinner.</h2>
          </div>
          <div className="step-grid">
            {steps.map((s) => (
              <div key={s.n} className="step">
                <div className="step-num">{String(s.n).padStart(2, '0')}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container final-cta-card">
          <h2>Ready to cook smarter?</h2>
          <p>Create your free Sangkap account and try Pantry Mode in 30 seconds.</p>
          <div className="hero-cta">
            <Link to="/signup" className="btn btn-primary">Sign up</Link>
            <Link to="/login" className="btn btn-ghost">I already have an account</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default LandingPage;
