import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, clearSession, dateTime, getStoredUser, getToken, money, setSession } from './api.js';

const regions = { '/': ['dashboard', 'leyndell'], '/login': ['login', 'limgrave'], '/inventory': ['inventory', 'raya-lucaria'], '/history': ['history', 'farum-azula'], '/item/new': ['add-item', 'volcano-manor'] };
const categories = ['Vinyl', 'Plushie', 'Apparel', 'Figure', 'Accessories'];
const franchises = ['Elden Ring', 'Dark Souls', 'Tekken', 'Pac-Man', 'Gundam', 'Other'];

export default function App() {
  const [user, setUser] = useState(() => getToken() ? getStoredUser() : null);
  const location = useLocation();
  useEffect(() => {
    const signout = () => setUser(null);
    window.addEventListener('ledger:signout', signout);
    return () => window.removeEventListener('ledger:signout', signout);
  }, []);
  useEffect(() => {
    const route = location.pathname.startsWith('/item/') ? '/item/new' : location.pathname;
    const [page, region] = regions[route] || regions['/'];
    document.body.dataset.page = page;
    document.body.dataset.region = region;
    if (localStorage.getItem('ims-mode') === 'nokron') document.body.dataset.mode = 'nokron';
    else delete document.body.dataset.mode;
  }, [location.pathname]);
  return <>
    <AmbientBackground />
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onSignIn={setUser} />} />
      <Route element={user ? <Shell user={user} onSignOut={() => { clearSession(); setUser(null); }} /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory user={user} />} />
        <Route path="/item/new" element={<ItemForm user={user} />} />
        <Route path="/item/:id" element={<ItemForm user={user} />} />
        <Route path="/history" element={<History />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
    <StartupSplash />
  </>;
}

function AmbientBackground() {
  useEffect(() => {
    if (window.__tarnishedEffectsLoading) return;
    window.__tarnishedEffectsLoading = true;
    const script = document.createElement('script');
    script.src = '/js/region-effects.js'; script.async = true;
    document.body.append(script);
  }, []);
  return <><div className="bg-scene" aria-hidden="true" /><div className="bg-vignette" aria-hidden="true" /><canvas id="region-canvas" aria-hidden="true" /></>;
}

function StartupSplash() {
  const [stage, setStage] = useState('white');
  const [visible, setVisible] = useState(true);
  const finished = useRef(false);
  const timers = useRef([]);
  useEffect(() => {
    const finish = (skip) => {
      if (finished.current) return;
      finished.current = true;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (skip || reduced) {
        setStage('fade');
        timers.current.push(window.setTimeout(() => {
          setVisible(false);
          window.dispatchEvent(new Event('ledger:splash-end'));
        }, reduced ? 100 : 550));
      } else {
        setStage('dark');
        timers.current.push(window.setTimeout(() => setStage('fade'), 850));
        timers.current.push(window.setTimeout(() => {
          setVisible(false);
          window.dispatchEvent(new Event('ledger:splash-end'));
        }, 1750));
      }
    };
    const onKey = (event) => {
      if (!finished.current && ['Enter', ' ', 'Escape'].includes(event.key)) {
        event.preventDefault(); finish(true);
      }
    };
    const auto = window.setTimeout(() => finish(false), 2300);
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(auto);
      timers.current.forEach(window.clearTimeout);
      window.removeEventListener('keydown', onKey);
    };
  }, []);
  if (!visible) return null;
  return <div className={'splash-screen' + (stage !== 'white' ? ' to-dark' : '') + (stage === 'fade' ? ' fade-out' : '')} role="dialog" aria-modal="true" aria-label="Bandai Namco Store" tabIndex="0" onClick={() => {
    if (finished.current) return;
    finished.current = true; setStage('fade');
    timers.current.push(window.setTimeout(() => {
      setVisible(false);
      window.dispatchEvent(new Event('ledger:splash-end'));
    }, 550));
  }}>
    <div className="splash-content"><img className="splash-brand-logo" src="/assets/bandai-namco-logo.png" alt="Bandai Namco" /></div>
  </div>;
}

function Login({ onSignIn }) {
  const [email, setEmail] = useState('admin@bandainamco.com');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cardRevealed, setCardRevealed] = useState(false);
  useEffect(() => {
    const onSplashEnd = () => setCardRevealed(true);
    window.addEventListener('ledger:splash-end', onSplashEnd);
    return () => window.removeEventListener('ledger:splash-end', onSplashEnd);
  }, []);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setSession(result.token, result.user); onSignIn(result.user);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <>
    <main className="login-page page-enter">
      <section className={'login-card' + (cardRevealed ? ' reveal-card' : '')}>
        <div className="jar-logo-wrap"><img src="/assets/alexandernoBG.png" alt="Alexander the Warrior Jar" className="jar-logo" /></div><p className="eyebrow">THE ROUNDTABLE HOLD</p>
        <h1>Enter the Lands Between</h1><p className="login-copy">The ledger awaits, Tarnished. Take up your watch over the stores.</p>
        <div className="login-rules" />
        <form className="login-fields" onSubmit={submit}>
          <div className="field"><label htmlFor="email">Bearer of the account</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></div>
          <div className="field"><label htmlFor="password">Secret phrase</label><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></div>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="button button-gold login-submit" disabled={busy}>{busy ? 'Entering…' : 'Enter the Hold'}</button>
        </form>
        <p className="login-foot">BANDAI NAMCO MERCHANDISE LEDGER · Local demo: admin@bandainamco.com / admin123</p><div className="login-rules" style={{ margin: '19px 0 0' }} />
      </section>
      <ThemeToggle login />
    </main>
  </>;
}

function Shell({ user, onSignOut }) {
  const location = useLocation();
  const route = location.pathname.startsWith('/item/') ? '/item/new' : location.pathname;
  const titles = { '/': 'Site of Grace', '/inventory': 'Equipment & Pouch', '/history': 'Ledger of Deeds', '/item/new': 'Smithing Table' };
  const initials = user.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const [banner, setBanner] = useState('');
  useEffect(() => {
    const handler = (event) => { setBanner(event.detail || 'STOCK UPDATED'); window.setTimeout(() => setBanner(''), 2400); };
    window.addEventListener('ledger:banner', handler);
    return () => window.removeEventListener('ledger:banner', handler);
  }, []);
  return <>
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" to="/"><span className="jar-logo-wrap jar-logo-sidebar"><img src="/assets/alexandernoBG.png" alt="" className="jar-logo" /></span><span><span className="brand-name">Tarnished Ledger</span><span className="brand-caption">Bandai Namco · Inventory</span></span></Link>
        <p className="nav-caption">The Roundtable</p>
        <nav className="nav sidebar-nav" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => 'region-btn btn-leyndell' + (isActive ? ' active' : '')}><span className="nav-icon">✧</span><span className="btn-label"><span className="btn-title">Site of Grace</span><span className="btn-sub">Leyndell</span></span></NavLink>
          <NavLink to="/inventory" className={({ isActive }) => 'region-btn btn-lucaria' + (isActive ? ' active' : '')}><span className="nav-icon">⚔</span><span className="btn-label"><span className="btn-title">Inventory</span><span className="btn-sub">Raya Lucaria</span></span></NavLink>
          {user.role === 'Admin' && <NavLink to="/item/new" className={({ isActive }) => 'region-btn btn-volcano' + (isActive ? ' active' : '')}><span className="nav-icon">⚒</span><span className="btn-label"><span className="btn-title">Add Item</span><span className="btn-sub">Volcano Manor</span></span></NavLink>}
          <NavLink to="/history" className={({ isActive }) => 'region-btn btn-farum' + (isActive ? ' active' : '')}><span className="nav-icon">◷</span><span className="btn-label"><span className="btn-title">Stock History</span><span className="btn-sub">Farum Azula</span></span></NavLink>
          <button className="region-btn btn-limgrave nav-signout" onClick={onSignOut}><span className="nav-icon">↪</span><span className="btn-label"><span className="btn-title">Sign Out</span><span className="btn-sub">Limgrave</span></span></button>
        </nav>
        <div className="sidebar-bottom"><div className="sidebar-ornament" /><div className="sidebar-note"><b>THE GOLDEN ORDER</b>Keep your stores in balance. Every movement leaves its mark.</div><div className="user-mini"><div className="avatar">{initials}</div><div><strong>{user.name}</strong><span>{user.role} · Roundtable Hold</span></div></div></div>
      </aside>
      <main className="main">
        <header className="topbar"><div className="breadcrumb">Roundtable Hold <span> / </span><b>{titles[route] || 'Smithing Table'}</b></div><div className="top-actions"><span>{new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date())}</span><ThemeToggle /><span className="grace-mark">✧</span></div></header>
        <div className="route-view page-enter" key={location.pathname}><Outlet /></div>
      </main>
    </div>
    {banner && <div className="toast-banner show" role="status"><strong>{banner}</strong></div>}
  </>;
}

function ThemeToggle({ login = false }) {
  const [night, setNight] = useState(() => localStorage.getItem('ims-mode') === 'nokron');
  const [transition, setTransition] = useState('');
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  function toggle() {
    if (transition) return;
    const next = !night;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const applyMode = () => {
      setNight(next);
      if (next) { document.body.dataset.mode = 'nokron'; localStorage.setItem('ims-mode', 'nokron'); }
      else { delete document.body.dataset.mode; localStorage.setItem('ims-mode', 'day'); }
    };
    if (reducedMotion) { applyMode(); return; }
    setTransition(next ? 'to-night' : 'to-day');
    timers.current.forEach(window.clearTimeout); timers.current = [];
    timers.current.push(window.setTimeout(applyMode, 950));
    timers.current.push(window.setTimeout(() => setTransition(''), 1800));
  }
  return <>
    <button type="button" className={'button pass-time-btn' + (login ? ' pass-time-login' : '')} onClick={toggle} aria-pressed={night} disabled={Boolean(transition)}>Pass Time: {night ? 'Daybreak' : 'Nightfall'}</button>
    {transition && <div className={'celestial-overlay active' + (transition === 'to-day' ? ' to-day' : '')} aria-hidden="true"><div className="celestial-sun" /><div className="celestial-moon" /><div className="celestial-stars" /><div className="pass-time-dial"><div className="pass-time-dial-face"><span className="pass-time-dial-sun">☼</span><span className="pass-time-dial-moon">☾</span><span className="pass-time-dial-hand" /><span className="pass-time-dial-hub" /></div></div></div>}
  </>;
}

function PageTitle({ eyebrow, title, subtitle, action }) {
  return <div className="title-row"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="subtitle">{subtitle}</p></div>{action}</div>;
}

function useLoad(loader, deps = []) {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const refresh = async () => {
    setLoading(true); setError('');
    try { setData(await loader()); } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, deps);
  return { data, setData, loading, error, refresh };
}
function Notice({ error, loading }) {
  if (loading) return <div className="panel panel-body state-message">Reading the ledger…</div>;
  if (error) return <div className="panel panel-body state-message error-message" role="alert">{error}</div>;
  return null;
}

function Dashboard() {
  const stats = useLoad(() => api('/products/stats'));
  const low = useLoad(() => api('/products?status=low'));
  const logs = useLoad(() => api('/logs?limit=100'));
  const days = useMemo(() => {
    const result = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { key: d.toDateString(), day: d.getDate(), inbound: 0, outbound: 0 }; });
    (logs.data || []).forEach((log) => { const day = result.find((d) => d.key === new Date(log.createdAt).toDateString()); if (day && log.type === 'IN') day.inbound += Math.abs(log.quantityChanged); if (day && log.type === 'OUT') day.outbound += Math.abs(log.quantityChanged); });
    return result;
  }, [logs.data]);
  const points = (key) => days.map((d, i) => (i * 100) + ',' + (140 - Math.min(d[key] * 4, 115))).join(' ');
  if (stats.loading) return <section className="content"><PageTitle eyebrow="A TARNISHED'S RECORD" title="Site of Grace" subtitle="A quiet account of the stores under your watch." /><Notice loading /></section>;
  const total = stats.data || {};
  return <section className="content">
    <PageTitle eyebrow="A TARNISHED'S RECORD" title="Site of Grace" subtitle="A quiet account of the stores under your watch." action={<Link className="button button-gold" to="/item/new">＋ &nbsp; Enter new item</Link>} />
    {stats.error && <Notice error={stats.error} />}
    <section className="hud"><div className="hud-cell"><span className="hud-label">Total inventory value</span><strong className="hud-value">{money(total.totalInventoryValue)}</strong><span className="hud-note">An accounting of all held goods</span></div><div className="hud-cell"><span className="hud-label">Total SKUs</span><strong className="hud-value">{total.totalSkus ?? '—'}</strong><span className="hud-note">Distinct articles in the ledger</span></div><div className="hud-cell"><span className="hud-label">Low-stock alerts</span><strong className="hud-value crimson-value">{total.lowStockCount ?? '—'}</strong><span className="hud-note">Items at or below their threshold</span></div></section>
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-head"><div><h2>Waning and waxing stores</h2><p>Recorded stock movement · last seven days</p></div><span className="small-label">IN / OUT UNITS</span></div><div className="chart-wrap"><div className="chart-lines"><span /><span /><span /><span /></div><svg className="chart-svg" viewBox="0 0 600 145" preserveAspectRatio="none" aria-label="Stock movement for the past seven days"><polyline points={points('inbound')} fill="none" stroke="#c5a059" strokeWidth="2" vectorEffect="non-scaling-stroke" /><polyline points={points('outbound')} fill="none" stroke="#4b7b9c" strokeWidth="1.7" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" /></svg><div className="chart-labels">{days.map((d) => <span key={d.key}>{d.day}</span>)}</div></div><div className="legend"><span><i />Received</span><span><i />Dispatched</span></div></section>
      <section className="panel"><div className="panel-head"><div><h2>Embers running low</h2><p>These stores may soon be depleted</p></div><Link className="text-link" to="/inventory?status=low">Inspect all →</Link></div>{low.loading ? <div className="panel-body">Reading stores…</div> : low.error ? <div className="panel-body error-message">{low.error}</div> : <div className="alert-list">{(low.data || []).slice(0, 5).map((p) => <div className="alert-row" key={p._id}><span className="alert-glyph">♧</span><span className="alert-name"><b>{p.name}</b><small>{p.sku}</small></span><span className="alert-qty">{p.stock === 0 ? 'Out' : p.stock + ' left'}</span></div>)}{!low.data?.length && <div className="panel-body muted">No low-stock items.</div>}</div>}</section>
    </div>
    <div className="dashboard-lower"><section className="panel"><div className="panel-head"><div><h2>Stores by order</h2><p>Articles held across the Roundtable</p></div><Link className="text-link" to="/inventory">Open pouch →</Link></div><div className="category-bars">{(total.byCategory || []).map((row) => <div className="category-line" key={row._id}><div className="category-meta"><span>{row._id}</span><b>{row.count} SKUs · {row.units} units</b></div><div className="bar-track"><i style={{ width: Math.max(4, (row.count / Math.max(total.totalSkus || 1, 1)) * 100) + '%' }} /></div></div>)}{!total.byCategory?.length && <p className="muted">No item records yet.</p>}</div></section><section className="panel"><div className="panel-head"><div><h2>Grace-given paths</h2><p>Common ledger pages</p></div></div><div className="quick-links"><Link className="quick-link" to="/item/new"><span>⚒</span><span>Record an article</span></Link><Link className="quick-link" to="/inventory"><span>⚔</span><span>Inspect equipment &amp; pouch</span></Link><Link className="quick-link" to="/history"><span>◷</span><span>Read the ledger of deeds</span></Link></div></section></div>
  </section>;
}

function Inventory({ user }) {
  const location = useLocation(); const navigate = useNavigate();
  const [search, setSearch] = useState(''); const [category, setCategory] = useState('');
  const [status, setStatus] = useState(() => new URLSearchParams(location.search).get('status') || '');
  const [selectedId, setSelectedId] = useState('');
  const [stockType, setStockType] = useState('IN'); const [quantity, setQuantity] = useState('1'); const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const query = new URLSearchParams();
  if (search.trim()) query.set('search', search.trim());
  if (category) query.set('category', category);
  if (status) query.set('status', status);
  const store = useLoad(() => api('/products' + (query.size ? '?' + query.toString() : '')), [search, category, status]);
  const products = store.data || [];
  const selected = products.find((product) => product._id === selectedId) || products[0];
  useEffect(() => {
    if (selected && selected._id !== selectedId) setSelectedId(selected._id);
  }, [selected, selectedId]);

  async function adjust(event) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true); setError('');
    try {
      await api('/products/' + selected._id + '/stock', { method: 'PATCH', body: JSON.stringify({ type: stockType, quantity: Number(quantity), reason }) });
      window.dispatchEvent(new CustomEvent('ledger:banner', { detail: 'STOCK UPDATED' }));
      setReason(''); await store.refresh();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }
  async function remove() {
    if (!selected || !window.confirm('Delete ' + selected.name + '? Its stock history will be retained.')) return;
    try {
      await api('/products/' + selected._id, { method: 'DELETE' });
      setSelectedId(''); await store.refresh();
      window.dispatchEvent(new CustomEvent('ledger:banner', { detail: 'ITEM REMOVED' }));
    } catch (e) { setError(e.message); }
  }
  return <section className="content">
    <PageTitle eyebrow="THE POUCH OF ARTICLES" title="Equipment & Pouch" subtitle="Search the stores, then inspect an article without leaving the ledger." action={user.role === 'Admin' && <Link className="button button-gold" to="/item/new">＋ &nbsp; Record new item</Link>} />
    <div className="inventory-layout">
      <section className="panel">
        <div className="inventory-tools"><label className="search-box"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search name or SKU" aria-label="Search inventory" value={search} onChange={(e) => setSearch(e.target.value)} /></label><select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by stock"><option value="">All stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select><span className="small-label">{store.loading ? '…' : products.length + ' items'}</span></div>
        <div className="category-tabs" aria-label="Filter by category"><button className={'category-tab' + (!category ? ' active' : '')} onClick={() => setCategory('')}>✧ &nbsp; All stores</button>{categories.map((item) => <button key={item} className={'category-tab' + (category === item ? ' active' : '')} onClick={() => setCategory(category === item ? '' : item)}>{item}</button>)}</div>
        {store.error ? <div className="panel-body error-message">{store.error}</div> : store.loading ? <div className="panel-body muted">Reading stores…</div> : <div className="item-list">{products.map((product) => <button type="button" key={product._id} className={'item-row' + (selected?._id === product._id ? ' selected' : '')} onClick={() => setSelectedId(product._id)} aria-pressed={selected?._id === product._id}><span className="item-emblem">{product.category === 'Figure' ? '♙' : product.category === 'Apparel' ? '♧' : '✧'}</span><span><span className="item-row-name">{product.name}</span><span className="item-row-meta">{product.sku} · {product.franchise}</span></span><span className={'item-row-stock' + (product.stock <= product.minStock ? ' low' : '')}>{product.stock === 0 ? 'Out' : product.stock + ' left'}</span></button>)}{!products.length && <div className="panel-body muted">No items match these filters.</div>}</div>}
      </section>
      {selected ? <aside className="panel inspection" aria-live="polite">
        <div className="inspection-head"><div className="inspection-emblem">{selected.category === 'Figure' ? '♙' : '✧'}</div><div className="inspection-title"><p className="eyebrow">ITEM INSPECTION</p><h2>{selected.name}</h2><p>{selected.franchise} · {selected.sku}</p></div></div>
        <div className="inspection-stats"><div className="inspection-stat"><small>In stores</small><b>{selected.stock}</b></div><div className="inspection-stat"><small>Unit value</small><b>{money(selected.price)}</b></div><div className="inspection-stat"><small>Condition</small><b className={selected.stock <= selected.minStock ? 'crimson-value' : ''}>{selected.stock === 0 ? 'Out' : selected.stock <= selected.minStock ? 'Low' : 'Ready'}</b></div></div>
        <div className="relic-detail"><span>Category</span><b>{selected.category}</b></div><div className="relic-detail"><span>Variant</span><b>{selected.variant || 'Standard'}</b></div><div className="relic-detail"><span>Reorder mark</span><b>{selected.minStock} units</b></div>
        {error && <p className="error-message" role="alert">{error}</p>}
        <form className="stock-adjust" onSubmit={adjust}><h3 className="section-title">Record stock movement</h3><div className="stock-adjust-row"><select value={stockType} onChange={(e) => setStockType(e.target.value)} aria-label="Movement type"><option value="IN">Receive (+IN)</option><option value="OUT">Dispatch (−OUT)</option><option value="ADJUST">Set count</option></select><input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} aria-label="Quantity" required /><button type="submit" className="button button-gold button-sm" disabled={saving}>{saving ? 'Saving…' : 'Record'}</button></div><input className="reason-input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength="500" placeholder="Reason (optional)" /></form>
        <div className="inspection-actions">{user.role === 'Admin' && <><button className="button" onClick={() => navigate('/item/' + selected._id)}>Edit record</button><button className="button button-danger" onClick={remove}>Remove</button></>}</div>
      </aside> : <aside className="panel inspection empty-inspection">Select an item to inspect its record.</aside>}
    </div>
  </section>;
}

const emptyForm = { sku: '', name: '', category: 'Figure', franchise: 'Elden Ring', variant: 'Standard', price: '', stock: '0', minStock: '5', imageUrl: '' };
function ItemForm({ user }) {
  const { id } = useParams(); const navigate = useNavigate(); const editing = Boolean(id);
  const [form, setForm] = useState(emptyForm); const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    if (!editing) { setForm(emptyForm); setLoading(false); return; }
    let active = true; setLoading(true);
    api('/products/' + id).then((product) => {
      if (active) setForm({ ...emptyForm, ...product, stock: String(product.stock), price: String(product.price), minStock: String(product.minStock) });
    }).catch((e) => setError(e.message)).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  const update = (field) => (event) => setForm((old) => ({ ...old, [field]: event.target.value }));
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    const body = { sku: form.sku, name: form.name, category: form.category, franchise: form.franchise, variant: form.variant, price: Number(form.price), minStock: Number(form.minStock), imageUrl: form.imageUrl };
    if (!editing) body.stock = Number(form.stock);
    try {
      await api(editing ? '/products/' + id : '/products', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(body) });
      window.dispatchEvent(new CustomEvent('ledger:banner', { detail: editing ? 'RECORD FORGED' : 'ITEM INSCRIBED' }));
      navigate('/inventory');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }
  if (user.role !== 'Admin') return <section className="content"><div className="panel panel-body error-message">Administrator access is required to change item records.</div></section>;
  if (loading) return <section className="content"><Notice loading /></section>;
  return <section className="content">
    <PageTitle eyebrow={editing ? 'REFINE AN ARTICLE' : 'RECORD AN ARTICLE'} title="Smithing Table" subtitle="Shape an inventory record and see its stat card take form." />
    <div className="smithing-layout">
      <form className="panel form-panel" onSubmit={submit}>
        <h2 className="section-title">Article inscription</h2><div className="form-grid">
          <Field label="Item name"><input value={form.name} onChange={update('name')} maxLength="160" required placeholder="e.g. Cerulean Flask" /></Field>
          <Field label="Mark / SKU"><input value={form.sku} onChange={update('sku')} maxLength="40" required placeholder="e.g. BN-ER-FIG-001" /></Field>
          <Field label="Article class"><select value={form.category} onChange={update('category')}>{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Franchise"><select value={form.franchise} onChange={update('franchise')}>{franchises.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Variant"><input value={form.variant} onChange={update('variant')} maxLength="120" placeholder="Standard" /></Field>
          <Field label="Value per article"><input type="number" min="0" step="0.01" value={form.price} onChange={update('price')} required /></Field>
          {!editing && <Field label="Initial stock"><div className="quantity-control"><button type="button" onClick={() => setForm((f) => ({ ...f, stock: String(Math.max(0, Number(f.stock) - 1)) }))} aria-label="Decrease stock">−</button><input type="number" min="0" step="1" value={form.stock} onChange={update('stock')} required /><button type="button" onClick={() => setForm((f) => ({ ...f, stock: String(Number(f.stock) + 1) }))} aria-label="Increase stock">+</button></div></Field>}
          <Field label="Reorder mark"><input type="number" min="0" step="1" value={form.minStock} onChange={update('minStock')} required /></Field>
          <Field label="Image URL (optional)" full><input type="url" value={form.imageUrl} onChange={update('imageUrl')} placeholder="https://…" /></Field>
        </div>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="form-actions"><Link className="button button-muted" to="/inventory">Back to pouch</Link><button className="button button-gold" type="submit" disabled={saving}>{saving ? 'Inscribing…' : editing ? '✧ Save changes' : '✧ Set inscription'}</button></div>
      </form>
      <aside className="panel preview-panel"><div className="preview-topline"><h2 className="section-title" style={{ margin: 0 }}>Article preview</h2><span className="small-label">SMITHING RECORD</span></div><div className="preview-art">{form.imageUrl ? <img src={form.imageUrl} alt="Item preview" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : '✧'}</div><h3 className="preview-name">{form.name || 'Unnamed article'}</h3><p className="preview-sku">{form.sku || 'SKU UNMARKED'}</p><div className="preview-details"><PreviewDetail name="Class" value={form.category} /><PreviewDetail name="Franchise" value={form.franchise} /><PreviewDetail name="Count" value={editing ? 'Current stock managed separately' : (form.stock || 0) + ' units'} /><PreviewDetail name="Value" value={money(form.price)} /><PreviewDetail name="Reorder mark" value={(form.minStock || 0) + ' units'} /></div></aside>
    </div>
  </section>;
}
function Field({ label, children, full }) { return <div className={'field' + (full ? ' full' : '')}><label>{label}</label>{children}</div>; }
function PreviewDetail({ name, value }) { return <div className="preview-detail"><span>{name}</span><b>{value}</b></div>; }

function History() {
  const [type, setType] = useState(''); const [search, setSearch] = useState('');
  const history = useLoad(() => api('/logs?limit=500' + (type ? '&type=' + encodeURIComponent(type) : '')), [type]);
  const logs = (history.data || []).filter((row) => (row.productName + ' ' + row.sku + ' ' + row.reason).toLowerCase().includes(search.toLowerCase()));
  const inbound = logs.filter((l) => l.type === 'IN').reduce((sum, l) => sum + Math.abs(l.quantityChanged), 0);
  const outbound = logs.filter((l) => l.type === 'OUT').reduce((sum, l) => sum + Math.abs(l.quantityChanged), 0);
  function exportCsv() {
    const rows = [['Date', 'Item', 'SKU', 'Type', 'Quantity changed', 'Previous stock', 'New stock', 'Reason', 'Performed by']];
    logs.forEach((l) => rows.push([dateTime(l.createdAt), l.productName, l.sku, l.type, l.quantityChanged, l.previousStock, l.newStock, l.reason, l.performedBy?.name || l.performedByName]));
    const csv = rows.map((row) => row.map((cell) => '"' + String(cell == null ? '' : cell).replaceAll('"', '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'tarnished-ledger-stock-history.csv'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="content">
    <PageTitle eyebrow="THE CHRONICLE OF MOVEMENT" title="Ledger of Deeds" subtitle="Every arrival and departure, kept in order." action={<button className="button button-gold" onClick={exportCsv} disabled={!logs.length}>↓ &nbsp; Export CSV</button>} />
    <div className="ledger-summary"><div className="ledger-stat"><small>Visible entries</small><b>{logs.length}</b></div><div className="ledger-stat"><small>Items received</small><b className="in-value">+{inbound}</b></div><div className="ledger-stat"><small>Items dispatched</small><b className="out-value">−{outbound}</b></div><div className="ledger-stat"><small>Stock movements</small><b>{logs.filter((l) => ['IN', 'OUT', 'ADJUST'].includes(l.type)).length}</b></div></div>
    {history.error ? <Notice error={history.error} /> : <section className="panel">
      <div className="ledger-tools"><label className="search-box"><span>⌕</span><input type="search" placeholder="Search item or SKU" value={search} onChange={(e) => setSearch(e.target.value)} /></label><select className="filter-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter movement type"><option value="">All movements</option>{['IN', 'OUT', 'ADJUST', 'CREATED', 'DELETED'].map((item) => <option key={item}>{item}</option>)}</select></div>
      {history.loading ? <div className="panel-body muted">Reading the chronicle…</div> : <><div className="table-wrap"><table><thead><tr><th>Date &amp; time</th><th>Item</th><th>SKU</th><th>Movement</th><th className="numeric">Change</th><th className="numeric">Previous</th><th className="numeric">New</th><th>Keeper</th></tr></thead><tbody>
        {logs.map((log) => <tr className="ledger-row" key={log._id}><td>{dateTime(log.createdAt)}</td><td className="td-title">{log.productName}</td><td>{log.sku}</td><td><span className={'movement ' + (log.type === 'IN' ? 'movement-in' : ['OUT', 'DELETED'].includes(log.type) ? 'movement-out' : '')}>{log.type === 'IN' ? '↑ ' : ['OUT', 'DELETED'].includes(log.type) ? '↓ ' : '◇ '}{log.type}</span></td><td className="numeric">{log.quantityChanged > 0 ? '+' : ''}{log.quantityChanged}</td><td className="numeric">{log.previousStock}</td><td className="numeric">{log.newStock}</td><td>{log.performedBy?.name || log.performedByName || 'System'}</td></tr>)}
      </tbody></table>{!logs.length && <div className="panel-body muted">No history entries match this search.</div>}</div><div className="table-footer"><span>Showing {logs.length} entries</span><span>Stock history is retained for audit</span></div></>}
    </section>}
    <div className="reports-grid"><section className="panel"><div className="panel-head"><div><h2>Movement at a glance</h2><p>From the currently filtered chronicle</p></div></div><div className="report-body report-kpis"><div className="report-kpi"><span>Inbound units</span><b className="in-value">+{inbound}</b></div><div className="report-kpi"><span>Outbound units</span><b className="out-value">−{outbound}</b></div><div className="report-kpi"><span>Adjustments</span><b>{logs.filter((l) => l.type === 'ADJUST').length}</b></div><div className="report-kpi"><span>New / removed items</span><b>{logs.filter((l) => ['CREATED', 'DELETED'].includes(l.type)).length}</b></div></div></section>
      <section className="panel"><div className="panel-head"><div><h2>Ledger notes</h2><p>Recorded reasons</p></div></div><div className="ledger-notes">{logs.filter((l) => l.reason).slice(0, 4).map((l) => <div className="ledger-note-row" key={l._id}><span>{l.type === 'IN' ? '↑' : l.type === 'OUT' ? '↓' : '◇'}</span><span>{l.reason} · {l.sku}</span></div>)}{!logs.some((l) => l.reason) && <p className="panel-body muted">Reasons entered during stock changes appear here.</p>}</div></section>
    </div>
  </section>;
}
