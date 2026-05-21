import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="footer-mark">●—●</span>
          <span className="footer-name">Sangkap</span>
        </div>

        <p className="footer-tagline">
          A recipe network powered by Neo4j. Built for ITD110 — Case Study #2.
        </p>

        <div className="footer-meta">
          <span className="badge">React</span>
          <span className="badge">Express</span>
          <span className="badge badge-leaf">Neo4j</span>
        </div>

        <p className="footer-copy">© {new Date().getFullYear()} Sangkap · ITD110 Case Study #2</p>
      </div>
    </footer>
  );
}

export default Footer;
