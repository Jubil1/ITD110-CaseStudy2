import { useEffect, useRef } from 'react';
import './MiniGraph.css';

/**
 * A small animated SVG showing a recipe graph:
 *   Adobo — chicken
 *   Adobo — soy sauce
 *   Adobo — Filipino cuisine
 *   soy sauce — soy allergen
 *   chicken — pork (substitute)
 *
 * Pure SVG, no graph library. Nodes gently drift so the graph feels alive.
 */
function MiniGraph() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf;
    const start = performance.now();
    const animate = (t) => {
      const elapsed = (t - start) / 1000;
      const dots = el.querySelectorAll('[data-drift]');
      dots.forEach((d, i) => {
        const dx = Math.sin(elapsed * 0.6 + i) * 3;
        const dy = Math.cos(elapsed * 0.7 + i * 1.3) * 3;
        d.setAttribute('transform', `translate(${dx} ${dy})`);
      });
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="mini-graph" ref={containerRef} aria-label="Recipe graph preview">
      <svg viewBox="0 0 460 380" role="img">
        <defs>
          <radialGradient id="bgGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFE6CC" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFF7EB" stopOpacity="0" />
          </radialGradient>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <rect width="460" height="380" fill="url(#bgGlow)" />

        {/* Edges (drawn first so circles sit on top) */}
        <g className="edges" stroke="#C84B31" strokeWidth="1.6" strokeOpacity="0.45" strokeLinecap="round">
          <line x1="230" y1="180" x2="120" y2="90" />
          <line x1="230" y1="180" x2="350" y2="90" />
          <line x1="230" y1="180" x2="380" y2="200" />
          <line x1="230" y1="180" x2="90" y2="260" />
          <line x1="350" y1="90" x2="400" y2="40" />
          <line x1="90" y1="260" x2="60" y2="330" />
          <line x1="230" y1="180" x2="220" y2="320" />
        </g>

        {/* Edge labels */}
        <g className="edge-labels" fontFamily="Inter, sans-serif" fontSize="9" fill="#8A847C" fontWeight="500">
          <text x="160" y="130">CONTAINS</text>
          <text x="290" y="130">CONTAINS</text>
          <text x="300" y="195">BELONGS_TO</text>
          <text x="135" y="225">CONTAINS</text>
          <text x="167" y="255">CREATED</text>
        </g>

        {/* Nodes */}
        <g className="nodes" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600">
          {/* Recipe — center */}
          <g data-drift>
            <circle cx="230" cy="180" r="34" fill="#C84B31" />
            <text x="230" y="184" textAnchor="middle" fill="#FFF7EB">Adobo</text>
          </g>

          {/* Ingredient — chicken */}
          <g data-drift>
            <circle cx="120" cy="90" r="22" fill="#E89B4E" />
            <text x="120" y="93" textAnchor="middle" fill="#1F2421">chicken</text>
          </g>

          {/* Ingredient — soy sauce */}
          <g data-drift>
            <circle cx="350" cy="90" r="22" fill="#E89B4E" />
            <text x="350" y="93" textAnchor="middle" fill="#1F2421">soy</text>
          </g>

          {/* Cuisine — Filipino */}
          <g data-drift>
            <circle cx="380" cy="200" r="20" fill="#3A7D44" />
            <text x="380" y="203" textAnchor="middle" fill="#FFF7EB">Filipino</text>
          </g>

          {/* Allergen — soy */}
          <g data-drift>
            <circle cx="400" cy="40" r="14" fill="#7A3E2A" />
            <text x="400" y="43" textAnchor="middle" fill="#FFF7EB" fontSize="8">soy</text>
          </g>

          {/* User — jubil */}
          <g data-drift>
            <circle cx="90" cy="260" r="20" fill="#1F2421" />
            <text x="90" y="263" textAnchor="middle" fill="#FFF7EB">jubil</text>
          </g>

          {/* Substitute — pork */}
          <g data-drift>
            <circle cx="60" cy="330" r="14" fill="#E89B4E" opacity="0.7" />
            <text x="60" y="333" textAnchor="middle" fill="#1F2421" fontSize="8">pork</text>
          </g>

          {/* Recipe — Sinigang */}
          <g data-drift>
            <circle cx="220" cy="320" r="20" fill="#C84B31" opacity="0.8" />
            <text x="220" y="323" textAnchor="middle" fill="#FFF7EB" fontSize="10">Sinigang</text>
          </g>
        </g>
      </svg>

      <div className="mini-graph-legend">
        <span className="dot dot-recipe" /> Recipe
        <span className="dot dot-ingredient" /> Ingredient
        <span className="dot dot-cuisine" /> Cuisine
        <span className="dot dot-user" /> User
        <span className="dot dot-allergen" /> Allergen
      </div>
    </div>
  );
}

export default MiniGraph;
