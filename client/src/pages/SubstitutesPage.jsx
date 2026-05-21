import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  listIngredients,
  getIngredient,
  listSubstitutes,
  addSubstitute,
  removeSubstitute,
} from '../api/ingredients.js';
import './SubstitutesPage.css';

function SubstitutesPage() {
  const { isAuthenticated } = useAuth();

  const [allIngredients, setAllIngredients] = useState([]);
  const [allPairs, setAllPairs] = useState([]);
  const [filter, setFilter] = useState('');

  const [picked, setPicked] = useState(null);
  const [pickSearch, setPickSearch] = useState('');
  const [pickedDetail, setPickedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addFrom, setAddFrom] = useState('');
  const [addTo, setAddTo] = useState('');
  const [addRatio, setAddRatio] = useState('1:1');
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  async function reload() {
    const [ings, pairs] = await Promise.all([listIngredients(), listSubstitutes()]);
    setAllIngredients(ings);
    setAllPairs(pairs);
  }

  useEffect(() => {
    reload().catch(() => {});
  }, []);

  const pickSuggestions = useMemo(() => {
    const q = pickSearch.trim().toLowerCase();
    if (!q) return [];
    return allIngredients
      .filter((i) => i.name.toLowerCase().includes(q))
      .filter((i) => i.name !== picked)
      .slice(0, 8);
  }, [pickSearch, allIngredients, picked]);

  useEffect(() => {
    if (!picked) {
      setPickedDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    getIngredient(picked)
      .then((d) => { if (!cancelled) setPickedDetail(d); })
      .catch(() => { if (!cancelled) setPickedDetail(null); })
      .finally(() => { if (!cancelled) setLoadingDetail(false); });
    return () => { cancelled = true; };
  }, [picked]);

  const filteredPairs = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return allPairs;
    return allPairs.filter(
      (p) =>
        p.from.name.toLowerCase().includes(q) ||
        p.to.name.toLowerCase().includes(q) ||
        (p.ratio || '').toLowerCase().includes(q)
    );
  }, [filter, allPairs]);

  async function handleAdd(e) {
    e.preventDefault();
    setAddError('');
    if (!addFrom.trim() || !addTo.trim()) {
      setAddError('Both ingredients are required.');
      return;
    }
    setAddSubmitting(true);
    try {
      await addSubstitute(addFrom.trim(), addTo.trim(), addRatio.trim() || '1:1');
      await reload();
      setAddFrom('');
      setAddTo('');
      setAddRatio('1:1');
      setShowAdd(false);
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add substitution.');
    } finally {
      setAddSubmitting(false);
    }
  }

  async function handleRemove(fromName, toName) {
    if (!window.confirm(`Remove substitution: ${fromName} → ${toName}?`)) return;
    try {
      await removeSubstitute(fromName, toName);
      await reload();
      if (picked === fromName) {
        const d = await getIngredient(picked);
        setPickedDetail(d);
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="subs-main">
        <div className="container">
          <header className="subs-head">
            <span className="eyebrow">Smart swaps</span>
            <h1>Substitute Finder</h1>
            <p className="subs-sub">
              Out of an ingredient? Allergic to one? Type it in below and the graph
              follows <code>SUBSTITUTES_FOR</code> edges to find what you can use instead.
              Each edge carries a <code>ratio</code> property so you know the conversion.
            </p>
          </header>

          <section className="subs-pick">
            <div className="subs-pick-head">
              <h2>What are you out of?</h2>
              {isAuthenticated && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAdd((v) => !v)}
                >
                  {showAdd ? 'Cancel' : '+ Add substitution'}
                </button>
              )}
            </div>

            <div className="subs-pick-wrap">
              <input
                type="text"
                className="field-input"
                placeholder="Type an ingredient name (e.g. egg, bacon, milk)…"
                value={pickSearch}
                onChange={(e) => setPickSearch(e.target.value)}
              />
              {pickSuggestions.length > 0 && (
                <ul className="subs-suggestions">
                  {pickSuggestions.map((s) => (
                    <li key={s.name}>
                      <button
                        type="button"
                        onClick={() => {
                          setPicked(s.name);
                          setPickSearch('');
                        }}
                      >
                        <span className="sug-name">{s.name}</span>
                        {s.category && <span className="sug-meta">{s.category}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {showAdd && (
              <form className="subs-add-form" onSubmit={handleAdd}>
                <div className="subs-add-grid">
                  <div className="field">
                    <label className="field-label">If you don't have</label>
                    <input
                      className="field-input"
                      type="text"
                      value={addFrom}
                      onChange={(e) => setAddFrom(e.target.value)}
                      list="add-from-list"
                      placeholder="e.g. butter"
                    />
                    <datalist id="add-from-list">
                      {allIngredients.map((i) => (
                        <option key={`f-${i.name}`} value={i.name} />
                      ))}
                    </datalist>
                  </div>
                  <div className="subs-add-arrow" aria-hidden="true">→</div>
                  <div className="field">
                    <label className="field-label">You can use</label>
                    <input
                      className="field-input"
                      type="text"
                      value={addTo}
                      onChange={(e) => setAddTo(e.target.value)}
                      list="add-to-list"
                      placeholder="e.g. coconut oil"
                    />
                    <datalist id="add-to-list">
                      {allIngredients.map((i) => (
                        <option key={`t-${i.name}`} value={i.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">Conversion ratio</label>
                  <input
                    className="field-input"
                    type="text"
                    value={addRatio}
                    onChange={(e) => setAddRatio(e.target.value)}
                    placeholder='e.g. "1:1" or "1 egg ≈ ¼ cup applesauce"'
                  />
                </div>
                {addError && <div className="ingredients-error">{addError}</div>}
                <div className="subs-add-foot">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowAdd(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={addSubmitting}
                  >
                    {addSubmitting ? 'Saving…' : 'Add substitution'}
                  </button>
                </div>
              </form>
            )}
          </section>

          {picked && (
            <section className="subs-result">
              {loadingDetail ? (
                <p className="subs-loading">Looking up substitutes for {picked}…</p>
              ) : !pickedDetail ? (
                <p className="subs-loading">Ingredient not found.</p>
              ) : (
                <>
                  <div className="subs-result-head">
                    <div>
                      <span className="eyebrow">Substitutes for</span>
                      <h2>{pickedDetail.name}</h2>
                      {pickedDetail.category && (
                        <span className="sr-category">{pickedDetail.category}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => setPicked(null)}
                    >
                      clear selection
                    </button>
                  </div>

                  <div className="sr-cols">
                    <div className="sr-col">
                      <h3>You can use these instead</h3>
                      <p className="sr-help">
                        <code>({pickedDetail.name})-[:SUBSTITUTES_FOR]-&gt;(?)</code>
                      </p>
                      {pickedDetail.substitutesOut.length === 0 ? (
                        <p className="sr-empty">
                          No substitutes recorded yet.
                          {isAuthenticated && ' Try adding one above.'}
                        </p>
                      ) : (
                        <ul className="sr-list">
                          {pickedDetail.substitutesOut.map((s) => (
                            <li key={`out-${s.name}`} className="sr-pair">
                              <Link
                                to={`/ingredients/${encodeURIComponent(s.name)}`}
                                className="sr-pair-name"
                              >
                                {s.name}
                              </Link>
                              {s.ratio && <span className="sr-ratio">{s.ratio}</span>}
                              {isAuthenticated && (
                                <button
                                  type="button"
                                  className="sr-remove"
                                  onClick={() => handleRemove(pickedDetail.name, s.name)}
                                  title="Remove substitution"
                                >
                                  ×
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="sr-col">
                      <h3>{pickedDetail.name} can replace</h3>
                      <p className="sr-help">
                        <code>(?)-[:SUBSTITUTES_FOR]-&gt;({pickedDetail.name})</code>
                      </p>
                      {pickedDetail.substitutesIn.length === 0 ? (
                        <p className="sr-empty">
                          Nothing is recorded as substitutable by {pickedDetail.name} yet.
                        </p>
                      ) : (
                        <ul className="sr-list">
                          {pickedDetail.substitutesIn.map((s) => (
                            <li key={`in-${s.name}`} className="sr-pair">
                              <Link
                                to={`/ingredients/${encodeURIComponent(s.name)}`}
                                className="sr-pair-name"
                              >
                                {s.name}
                              </Link>
                              {s.ratio && <span className="sr-ratio">{s.ratio}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          <section className="subs-all">
            <div className="subs-all-head">
              <h2>All substitutions in the graph</h2>
              <input
                type="search"
                className="field-input subs-filter"
                placeholder="Filter…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            {filteredPairs.length === 0 ? (
              <p className="subs-loading">
                {allPairs.length === 0
                  ? 'No substitution edges in the graph yet.'
                  : 'No substitutions match your filter.'}
              </p>
            ) : (
              <ul className="pair-grid">
                {filteredPairs.map((p) => (
                  <li key={`${p.from.name}->${p.to.name}`} className="pair-card">
                    <div className="pair-row">
                      <Link
                        to={`/ingredients/${encodeURIComponent(p.from.name)}`}
                        className="pair-from"
                      >
                        {p.from.name}
                      </Link>
                      <span className="pair-arrow" aria-hidden="true">→</span>
                      <Link
                        to={`/ingredients/${encodeURIComponent(p.to.name)}`}
                        className="pair-to"
                      >
                        {p.to.name}
                      </Link>
                    </div>
                    {p.ratio && <div className="pair-ratio">{p.ratio}</div>}
                    {isAuthenticated && (
                      <button
                        type="button"
                        className="pair-remove"
                        onClick={() => handleRemove(p.from.name, p.to.name)}
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default SubstitutesPage;
