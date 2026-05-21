import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchBackup, importBackup, downloadBackupFile } from '../api/backup.js';
import './BackupPage.css';

function BackupPage() {
  const { isAuthenticated } = useAuth();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [lastSummary, setLastSummary] = useState(null);

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [replaceOnImport, setReplaceOnImport] = useState(false);
  const [pendingBackup, setPendingBackup] = useState(null);

  async function handleExport() {
    setExportError('');
    setExporting(true);
    try {
      const backup = await fetchBackup();
      setLastSummary(backup.summary);
      downloadBackupFile(backup);
    } catch (err) {
      setExportError(err.response?.data?.error || 'Export failed. Is the server running?');
    } finally {
      setExporting(false);
    }
  }

  function handleFileSelect(e) {
    setImportError('');
    setImportSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        setPendingBackup(parsed);
      } catch {
        setImportError('Invalid JSON file.');
        setPendingBackup(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleImport() {
    if (!pendingBackup) {
      setImportError('Choose a backup JSON file first.');
      return;
    }
    if (replaceOnImport && !window.confirm(
      'Replace will DELETE all current graph data and restore from this file. Continue?'
    )) {
      return;
    }

    setImporting(true);
    setImportError('');
    setImportSuccess('');
    try {
      const result = await importBackup(pendingBackup, { replace: replaceOnImport });
      setImportSuccess(
        `${result.message} (${result.nodes} nodes, ${result.relationships} relationships)`
      );
      setPendingBackup(null);
      setLastSummary(pendingBackup.summary || null);
    } catch (err) {
      setImportError(err.response?.data?.error || 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="backup-main">
        <div className="container">
          <header className="backup-head">
            <span className="eyebrow">Core requirement</span>
            <h1>Graph Backup</h1>
            <p className="backup-sub">
              Export the entire Sangkap graph — every node, every relationship, and all
              properties — as a portable JSON file. Import merges or fully replaces the
              database for disaster recovery or moving between environments.
            </p>
          </header>

          <div className="backup-grid">
            <section className="backup-card">
              <h2>Export JSON</h2>
              <p>
                Downloads a snapshot of your live Neo4j graph: Users, Recipes, Ingredients,
                Cuisines, Allergens, and all relationship types (
                <code>CONTAINS</code>, <code>LIKED</code>, <code>SUBSTITUTES_FOR</code>, etc.).
              </p>
              <pre className="backup-cypher">
{`MATCH (n) RETURN labels(n), properties(n)
MATCH (a)-[r]->(b) RETURN type(r), properties(r), a, b`}
              </pre>
              {exportError && <div className="ingredients-error">{exportError}</div>}
              {lastSummary && (
                <p className="backup-summary">
                  Last snapshot: <strong>{lastSummary.nodes}</strong> nodes,{' '}
                  <strong>{lastSummary.relationships}</strong> relationships
                </p>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? 'Exporting…' : 'Download backup (.json)'}
              </button>
            </section>

            <section className="backup-card">
              <h2>Import JSON</h2>
              {!isAuthenticated ? (
                <p className="backup-login-hint">
                  <Link to="/login">Log in</Link> to restore a backup into the graph.
                </p>
              ) : (
                <>
                  <p>
                    Upload a file previously exported from Sangkap. Choose{' '}
                    <strong>merge</strong> to upsert nodes and relationships, or{' '}
                    <strong>replace</strong> to wipe the database first (like re-seeding).
                  </p>

                  <label className="backup-replace">
                    <input
                      type="checkbox"
                      checked={replaceOnImport}
                      onChange={(e) => setReplaceOnImport(e.target.checked)}
                    />
                    Replace entire database before import
                  </label>

                  <div className="backup-file-row">
                    <label className="btn btn-ghost backup-file-label">
                      Choose file…
                      <input
                        type="file"
                        accept="application/json,.json"
                        onChange={handleFileSelect}
                        hidden
                      />
                    </label>
                    {pendingBackup && (
                      <span className="backup-file-name">
                        Ready: {pendingBackup.summary?.nodes ?? '?'} nodes,{' '}
                        {pendingBackup.summary?.relationships ?? '?'} rels
                        {pendingBackup.exportedAt && (
                          <> · exported {new Date(pendingBackup.exportedAt).toLocaleString()}</>
                        )}
                      </span>
                    )}
                  </div>

                  {importError && <div className="ingredients-error">{importError}</div>}
                  {importSuccess && (
                    <div className="backup-success">{importSuccess}</div>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleImport}
                    disabled={importing || !pendingBackup}
                  >
                    {importing ? 'Importing…' : replaceOnImport ? 'Replace & import' : 'Merge import'}
                  </button>
                </>
              )}
            </section>
          </div>

          <section className="backup-format">
            <h3>Backup file format</h3>
            <p>
              Each file includes <code>version</code>, <code>exportedAt</code>, a{' '}
              <code>nodes</code> array (label + properties + stable <code>ref</code>), and a{' '}
              <code>relationships</code> array (type + endpoints + edge properties). Nodes
              reconnect on import using natural keys — e.g. <code>Recipe.id</code>,{' '}
              <code>Ingredient.name</code>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default BackupPage;
