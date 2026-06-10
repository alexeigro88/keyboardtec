/* global React, ReactDOM, Icons */
const { useState, useRef, useEffect, useCallback } = React;
const Ic = Icons;

/* ─────────────────────────── Sample data ─────────────────────────── */
const ORCH = {
  showName: "Aida",
  orchName: "23524642444",
  pieces: 12,
  permalink: "https://keyboardtek.bubbleapps.io/version-43ctu/shows/123qwe/",
  status: "Published",
  visibility: "Public",
  created: "05/29/2026 at 11:47 am",
  modified: "06/09/2026 at 11:04 am",
};

const FIELD_DEFS = [
  { k: "partName", label: "Part Name" },
  { k: "category", label: "Category" },
  { k: "subcategory", label: "Subcategory" },
  { k: "sku", label: "SKU", mono: true },
  { k: "software", label: "Software" },
  { k: "quickbooks", label: "Quickbooks Product", placeholder: "Choose Quickbooks Product" },
  { k: "pricingControl", label: "Pricing Control" },
  { k: "pricingType", label: "Pricing Type" },
  { k: "pricingTier", label: "Pricing Tier" },
];

const initialProducts = [
  {
    id: "p1", code: "23524642444", active: true, activationKey: false, productType: "Variable",
    commission: { label: "Commission Split Partial", tone: "amber" },
    fields: {
      partName: "DK PartName 1", category: "DK Category 2", subcategory: "At Variation",
      sku: "6346", software: "Ableton", quickbooks: "",
      pricingControl: "at Variable", pricingType: "Time", pricingTier: "DK S S Tier",
    },
    description: "test",
    variations: [
      {
        id: "v1", code: "23524642444", commission: null,
        fields: {
          partName: "DK PartName 2", category: "DK Category 2", subcategory: "DK SC 22",
          sku: "3526", software: "Ableton", quickbooks: "",
          pricingControl: "at Variable", pricingType: "Time", pricingTier: "DK S S Tier",
        },
      },
      {
        id: "v2", code: "23524642444", commission: { label: "Commission Split Empty", tone: "red" },
        fields: {
          partName: "DK PartName 3", category: "DK Category 2", subcategory: "DK SC 31",
          sku: "9981", software: "Logic Pro", quickbooks: "",
          pricingControl: "at Variable", pricingType: "Time", pricingTier: "DK M Tier",
        },
      },
    ],
  },
  {
    id: "p2", code: "23524642455", active: true, activationKey: true, productType: "Fixed",
    commission: { label: "Commission Split Full", tone: "green" },
    fields: {
      partName: "Strings Ensemble", category: "DK Category 4", subcategory: "Full Section",
      sku: "7720", software: "Cubase", quickbooks: "QB-STR-04",
      pricingControl: "Fixed", pricingType: "License", pricingTier: "DK L Tier",
    },
    description: "Lush sampled string section, recorded at 96kHz.",
    variations: [],
  },
];

const ACTIVITY = [
  { when: "06/05/2026 at 5:56 pm", who: "Vladislav K.", color: "#2D6BD4", accent: true, msg: <span><span className="hl">Orchestration updated</span></span> },
  { when: "06/05/2026 at 5:56 pm", who: "Vladislav K.", color: "#2D6BD4", msg: <span>Unpublished changes saved: Variation added <span className="hl">"23524642444 | DK PartName 3"</span> (Product: "23524642444 | DK PartName 1")</span> },
  { when: "06/05/2026 at 5:50 pm", who: "Oksana E.", color: "#DC2237", msg: <span><span className="hl">Orchestration updated</span></span> },
  { when: "05/29/2026 at 11:47 am", who: "Oksana E.", color: "#DC2237", msg: <span>Orchestration <span className="hl">created</span> from template</span> },
];

/* ─────────────────────────── Small UI atoms ─────────────────────────── */
function Toggle({ on, onChange, label }) {
  return (
    <button type="button" className="toggle" onClick={() => onChange(!on)} aria-pressed={on}>
      <span className={"switch" + (on ? " on" : "")}></span>
      {label}
    </button>
  );
}

function Chip({ tone = "navy", children }) {
  return <span className={"chip chip-" + tone}><span className="dot"></span>{children}</span>;
}

function Field({ def, value, onChange }) {
  const isSelect = ["category", "subcategory", "software", "pricingControl", "pricingType", "pricingTier", "quickbooks"].includes(def.k);
  return (
    <div className={"field" + (def.span ? " col-span-3" : "")}>
      <label>{def.label}</label>
      {isSelect ? (
        <select className="ctrl" value={value || ""} onChange={(e) => onChange(def.k, e.target.value)}
                style={value ? null : { color: "var(--rd-text-subtle)" }}>
          <option value="">{def.placeholder || "Select…"}</option>
          {value && <option value={value}>{value}</option>}
        </select>
      ) : (
        <input className="ctrl" type="text" value={value || ""} placeholder={def.placeholder || ""}
               style={def.mono ? { fontFamily: "var(--rd-font-mono)" } : null}
               onChange={(e) => onChange(def.k, e.target.value)} />
      )}
    </div>
  );
}

function FieldGrid({ fields, onChange }) {
  return (
    <div className="field-grid">
      {FIELD_DEFS.map((d) => (
        <Field key={d.k} def={d} value={fields[d.k]} onChange={onChange} />
      ))}
    </div>
  );
}

function SubTitle({ children }) {
  return (
    <div className="subsection-title">
      <span className="eyebrow">{children}</span>
      <span className="rule"></span>
    </div>
  );
}

/* ─────────────────────────── Variation node ─────────────────────────── */
function VariationNode({ v, productName, index, open, onToggle, onChange, onDelete, markDirty }) {
  const setField = (k, val) => { onChange({ ...v, fields: { ...v.fields, [k]: val } }); markDirty(); };
  return (
    <div className="var-wrap">
      <div className={"node variation" + (open ? " open" : "")}>
        <div className="node-head" onClick={onToggle}>
          <Ic.Chevron className="node-chev" />
          <div className="node-title">
            <span className="nm">{v.fields.partName}</span>
            <span className="sku">SKU {v.fields.sku} · {v.code}</span>
          </div>
          <span className="grow"></span>
          {v.commission && <Chip tone={v.commission.tone}>{v.commission.label}</Chip>}
          <div className="node-actions" onClick={(e) => e.stopPropagation()}>
            <button className="act-btn danger" title="Delete variation" onClick={onDelete}><Ic.Trash /></button>
          </div>
        </div>
        {open && (
          <div className="node-body">
            <div className="node-body-inner fade-in">
              <FieldGrid fields={v.fields} onChange={setField} />
              <SubTitle>Downloadable Files</SubTitle>
              <div className="dl-empty">
                <Ic.Files />
                <span>No files attached to this variation.</span>
                <button className="btn-add" style={{ width: "auto", marginTop: 8, padding: "11px 16px" }}><Ic.Plus /> Upload file</button>
              </div>
              <SubTitle>Designer Commission</SubTitle>
              <div className="field-grid">
                <div className="field"><label>Designer</label><input className="ctrl" defaultValue="Vladislav K." onChange={markDirty} /></div>
                <div className="field"><label>Commission Split %</label><input className="ctrl" type="text" defaultValue="50" onChange={markDirty} style={{ fontFamily: "var(--rd-font-mono)" }} /></div>
                <div className="field"><label>Total Split %</label><input className="ctrl" type="text" defaultValue="50" onChange={markDirty} style={{ fontFamily: "var(--rd-font-mono)" }} /></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Product node ─────────────────────────── */
function ProductNode({ p, open, onToggle, onChange, onDelete, markDirty, index }) {
  const [openVars, setOpenVars] = useState({});
  const setField = (k, val) => { onChange({ ...p, fields: { ...p.fields, [k]: val } }); markDirty(); };
  const setVar = (nv) => { onChange({ ...p, variations: p.variations.map((x) => x.id === nv.id ? nv : x) }); };
  const delVar = (id) => { onChange({ ...p, variations: p.variations.filter((x) => x.id !== id) }); markDirty(); };
  const addVar = () => {
    const nid = "v" + Date.now();
    const nv = { id: nid, code: p.code, commission: null, fields: { partName: "New Variation", category: p.fields.category, subcategory: "", sku: "", software: p.fields.software, quickbooks: "", pricingControl: p.fields.pricingControl, pricingType: p.fields.pricingType, pricingTier: p.fields.pricingTier } };
    onChange({ ...p, variations: [...p.variations, nv] });
    setOpenVars((s) => ({ ...s, [nid]: true })); markDirty();
  };

  return (
    <div className={"node product" + (open ? " open" : "")}>
      <div className="node-head" onClick={onToggle}>
        <Ic.Chevron className="node-chev" />
        <div className="node-title">
          <span className="nm">{p.fields.partName}</span>
          <span className="sku">SKU {p.fields.sku} · {p.code} · {p.variations.length} variation{p.variations.length === 1 ? "" : "s"}</span>
        </div>
        <span className="grow"></span>
        {!p.active && <Chip tone="navy">Inactive</Chip>}
        {p.commission && <Chip tone={p.commission.tone}>{p.commission.label}</Chip>}
        <div className="node-actions" onClick={(e) => e.stopPropagation()}>
          <button className="act-btn danger" title="Delete product" onClick={onDelete}><Ic.Trash /></button>
        </div>
      </div>
      {open && (
        <div className="node-body">
          <div className="node-body-inner fade-in">
            <div className="detail-toolbar">
              <Toggle on={p.active} label="Active" onChange={(v) => { onChange({ ...p, active: v }); markDirty(); }} />
              <Toggle on={p.activationKey} label="Activation key" onChange={(v) => { onChange({ ...p, activationKey: v }); markDirty(); }} />
              <span className="tt-type">
                Product Type
                <select className="ctrl" value={p.productType} onChange={(e) => { onChange({ ...p, productType: e.target.value }); markDirty(); }}>
                  <option>Variable</option><option>Fixed</option><option>Bundle</option>
                </select>
              </span>
            </div>

            <FieldGrid fields={p.fields} onChange={setField} />

            <div className="field col-span-3" style={{ marginTop: 16 }}>
              <label>Product Description</label>
              <textarea className="ctrl" value={p.description} onChange={(e) => { onChange({ ...p, description: e.target.value }); markDirty(); }} placeholder="Describe this product…"></textarea>
            </div>

            <SubTitle>Product Variations · {p.variations.length}</SubTitle>
            {p.variations.length === 0 ? (
              <div className="empty" style={{ marginBottom: 14 }}>No variations yet. Add one to offer alternate parts, tiers, or formats.</div>
            ) : (
              <div className="var-list">
                {p.variations.map((v, idx) => (
                  <VariationNode key={v.id} v={v} productName={p.fields.partName} index={idx}
                    open={!!openVars[v.id]} onToggle={() => setOpenVars((s) => ({ ...s, [v.id]: !s[v.id] }))}
                    onChange={setVar} onDelete={() => delVar(v.id)} markDirty={markDirty} />
                ))}
              </div>
            )}
            <div className="add-row" style={{ marginTop: 14 }}>
              <button className="btn-add" onClick={addVar}><Ic.Plus /> Add variation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Tabs content ─────────────────────────── */
function DescriptionMedia({ markDirty }) {
  return (
    <div className="fade-in" style={{ padding: "22px" }}>
      <div className="field col-span-3">
        <label>Orchestration Description</label>
        <textarea className="ctrl" style={{ minHeight: 140 }} onChange={markDirty}
          defaultValue="A full orchestral arrangement of Aida, scored for 12 pieces. Includes brass, strings, and percussion stems." />
      </div>
      <SubTitle>Media</SubTitle>
      <div className="dl-empty">
        <Ic.Image />
        <span>No additional media uploaded.</span>
        <button className="btn-add" style={{ width: "auto", marginTop: 4 }}><Ic.Plus /> Upload media</button>
      </div>
    </div>
  );
}

function LicensingCompany({ markDirty }) {
  return (
    <div className="fade-in" style={{ padding: "22px" }}>
      <div className="field-grid">
        <div className="field"><label>Company Name</label><input className="ctrl" defaultValue="Verdi Editions Ltd." onChange={markDirty} /></div>
        <div className="field"><label>License Type</label>
          <select className="ctrl" defaultValue="Perpetual" onChange={markDirty}><option>Perpetual</option><option>Annual</option><option>Per-performance</option></select></div>
        <div className="field"><label>Territory</label><input className="ctrl" defaultValue="Worldwide" onChange={markDirty} /></div>
        <div className="field"><label>Contact Email</label><input className="ctrl" defaultValue="rights@verdi-editions.com" onChange={markDirty} /></div>
        <div className="field"><label>Royalty %</label><input className="ctrl" defaultValue="12" style={{ fontFamily: "var(--rd-font-mono)" }} onChange={markDirty} /></div>
        <div className="field"><label>Contract ID</label><input className="ctrl" defaultValue="LIC-2026-0042" style={{ fontFamily: "var(--rd-font-mono)" }} onChange={markDirty} /></div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Right rail cards ─────────────────────────── */
function RailCard({ title, icon, action, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={"rail-card" + (open ? "" : " collapsed")}>
      <div className="rail-card-head" onClick={() => setOpen((o) => !o)}>
        {icon && <span className="hd-ic">{icon}</span>}
        <h3>{title}</h3>
        <span className="grow"></span>
        {action && <span onClick={(e) => e.stopPropagation()}>{action}</span>}
        <Ic.ChevronDown className="chev" />
      </div>
      <div className="rail-card-body">{children}</div>
    </div>
  );
}

/* ─────────────────────────── Overview (identity + meta + art) ─────────────────────────── */
const STATUS_TONES = { Published: "blue", Draft: "amber", Scheduled: "green", Archived: "navy" };
const VIS_TONES = { Public: "navy", Private: "amber", Unlisted: "navy" };

function InlineStatus({ label, value, options, tones, markDirty }) {
  const [val, setVal] = useState(value);
  const tone = tones[val] || "navy";
  return (
    <div className="field">
      <label>{label}</label>
      <div className={"select-chip sc-" + tone}>
        <span className="sc-dot"></span>
        <select className="ctrl" value={val} onChange={(e) => { setVal(e.target.value); markDirty(); }}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    </div>
  );
}

function OverviewCard({ markDirty }) {
  return (
    <div className="card overview">
      <div className="card-head-lg">
        <span className="hd-ic"><Ic.Box /></span>
        <div>
          <h2 className="block-title">Show &amp; Orchestration</h2>
          <div className="block-sub">Identity, status &amp; cover for this orchestration</div>
        </div>
        <span className="grow"></span>
        <div className="ov-stamp">Created <b>{ORCH.created}</b><br />Updated <b>{ORCH.modified}</b></div>
      </div>

      <div className="ov-top">
        <div className="ov-art">
          <image-slot id="orch-art" class="ov-art-slot" shape="rounded" radius="10" placeholder="Drop cover art"></image-slot>
          <div className="art-actions">
            <a className="replace">Replace</a>
            <span className="vsep">|</span>
            <a className="del">Delete</a>
          </div>
        </div>

        <div className="ov-fields">
          <div className="field-grid">
            <div className="field">
              <label>Show Name</label>
              <input className="ctrl" type="text" defaultValue="Aida" onChange={markDirty} />
            </div>
            <div className="field">
              <label>Orchestration Name</label>
              <input className="ctrl" defaultValue="23524642444" style={{ fontFamily: "var(--rd-font-mono)" }} onChange={markDirty} />
            </div>
            <div className="field">
              <label>Number of Pieces</label>
              <input className="ctrl" type="number" defaultValue="12" onChange={markDirty} />
            </div>
          </div>

          <div className="field-grid">
            <InlineStatus label="Status" value={ORCH.status} options={["Published", "Draft", "Scheduled", "Archived"]} tones={STATUS_TONES} markDirty={markDirty} />
            <InlineStatus label="Visibility" value={ORCH.visibility} options={["Public", "Private", "Unlisted"]} tones={VIS_TONES} markDirty={markDirty} />
            <div className="field">
              <label>Permalink</label>
              <div className="input-affix">
                <span className="affix-lead"><Ic.Link /></span>
                <input className="ctrl" defaultValue={ORCH.permalink} onChange={markDirty} />
                <span className="affix-actions">
                  <button type="button" title="Copy link"><Ic.Copy /></button>
                  <button type="button" title="Open"><Ic.External /></button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotesCard({ markDirty }) {
  const [notes, setNotes] = useState([
    { who: "Oksana E.", color: "#DC2237", when: "Jun 6", body: "Confirmed brass stems with the licensor — good to publish." },
  ]);
  const [draft, setDraft] = useState("");
  const add = () => {
    if (!draft.trim()) return;
    setNotes((n) => [{ who: "You", color: "#10123B", when: "Just now", body: draft.trim() }, ...n]);
    setDraft("");
  };
  return (
    <RailCard title="Notes" icon={<Ic.Chat />} action={<Chip tone="navy">{notes.length}</Chip>}>
      <div className="note-list">
        {notes.map((n, i) => (
          <div className="note-item" key={i}>
            <div className="meta"><span className="av" style={{ background: n.color }}>{n.who[0]}</span><b>{n.who}</b> · {n.when}</div>
            <div className="body">{n.body}</div>
          </div>
        ))}
      </div>
      <textarea className="ctrl note-input" placeholder="Write a note…" value={draft} onChange={(e) => setDraft(e.target.value)}></textarea>
      <button className="btn-add-note" onClick={add} disabled={!draft.trim()}>Add note</button>
    </RailCard>
  );
}

function ActivityCard() {
  const [showAll, setShowAll] = useState(false);
  const items = showAll ? ACTIVITY : ACTIVITY.slice(0, 3);
  return (
    <RailCard title="Activity Log" icon={<Ic.Clock />}>
      <div className="log">
        {items.map((a, i) => (
          <div className="log-item" key={i}>
            <div className="log-rail">
              <span className={"log-dot" + (a.accent ? " accent" : "")}></span>
              <span className="log-line"></span>
            </div>
            <div className="log-content">
              <div className="log-when">{a.when}<span className="who"><span className="av" style={{ background: a.color, width: 18, height: 18, fontSize: 9 }}>{a.who[0]}</span>{a.who}</span></div>
              <div className="log-msg">{a.msg}</div>
            </div>
          </div>
        ))}
      </div>
      {ACTIVITY.length > 3 && (
        <button className="log-more" onClick={() => setShowAll((s) => !s)}>{showAll ? "Show less" : `Show all ${ACTIVITY.length} events`}</button>
      )}
    </RailCard>
  );
}

/* ─────────────────────────── App ─────────────────────────── */
function App() {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState(initialProducts);
  const [openProds, setOpenProds] = useState({ p1: true });
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState("");
  const markDirty = useCallback(() => setDirty(true), []);
  const toastRef = useRef(null);

  const flashToast = (msg) => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(""), 2600);
  };

  const setProduct = (np) => setProducts((ps) => ps.map((x) => x.id === np.id ? np : x));
  const delProduct = (id) => { setProducts((ps) => ps.filter((x) => x.id !== id)); markDirty(); };
  const addProduct = () => {
    const nid = "p" + Date.now();
    const np = { id: nid, code: "00000000000", active: true, activationKey: false, productType: "Variable", commission: { label: "Commission Split Empty", tone: "red" }, fields: { partName: "New Product", category: "", subcategory: "", sku: "", software: "", quickbooks: "", pricingControl: "", pricingType: "", pricingTier: "" }, description: "", variations: [] };
    setProducts((ps) => [...ps, np]);
    setOpenProds((s) => ({ ...s, [nid]: true })); markDirty();
  };

  const onUpdate = () => { setDirty(false); flashToast("Changes published"); };
  const onCancel = () => { setProducts(initialProducts); setDirty(false); flashToast("Changes discarded"); };

  const totalVariations = products.reduce((a, p) => a + p.variations.length, 0);

  return (
    <div className="shell">
      {/* Icon rail */}
      <nav className="railnav">
        <div className="rail-logo">
          <svg viewBox="0 0 32 32" fill="none"><rect x="3" y="9" width="26" height="14" rx="2" fill="var(--rd-accent)"/><rect x="3" y="20" width="26" height="3" rx="1.5" fill="var(--rd-navy-800)"/></svg>
        </div>
        <button className="rail-btn active" title="Orchestrations"><Ic.Box /></button>
        <button className="rail-btn" title="Orders"><Ic.Cart /></button>
        <button className="rail-btn" title="Catalog"><Ic.Book /></button>
        <button className="rail-btn" title="Settings"><Ic.Gear /></button>
        <span className="rail-spacer"></span>
        <div className="rail-avatar"><Ic.User /></div>
      </nav>

      {/* App column */}
      <div className="app">
        <header className="topbar">
          <span className="brand">Orchestrations</span>
          <span className="grow"></span>
          <div className="topbar-user">
            <div className="n">Oksana Edit · RapidDev</div>
            <div className="e">oksana+customer+admin@rapidevelopers.com</div>
          </div>
          <button className="btn-logout">Log out</button>
        </header>

        {/* Sticky page header */}
        <div className="pagehead">
          <div className="pagehead-inner">
            <div>
              <div className="crumbs">
                <a href="#">Orchestrations</a><Ic.Chevron /><a href="#">{ORCH.showName}</a><Ic.Chevron /><span>Edit</span>
              </div>
              <h1>{ORCH.showName} <span className="id">#{ORCH.orchName}</span></h1>
            </div>
            <span className="grow"></span>
            <div className="head-actions">
              <span className={"dirty-pill" + (dirty ? " show" : "")}><span className="dot"></span>Unsaved changes</span>
              <button className="btn btn-ghost" onClick={onCancel} disabled={!dirty}>Cancel</button>
              <button className="btn btn-primary" onClick={onUpdate} disabled={!dirty}><Ic.Save /> Update</button>
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="workspace">
          {/* Main column */}
          <div>
            {/* Unified overview: identity + metadata + cover art */}
            <OverviewCard markDirty={markDirty} />

            {/* Tabbed card */}
            <div className="card">
              <div className="tabs">
                <button className={"tab" + (tab === "desc" ? " active" : "")} onClick={() => setTab("desc")}>Description &amp; Media</button>
                <button className={"tab" + (tab === "license" ? " active" : "")} onClick={() => setTab("license")}>Licensing Company</button>
                <button className={"tab" + (tab === "products" ? " active" : "")} onClick={() => setTab("products")}>Linked Products <span className="count">{products.length}</span></button>
              </div>

              {tab === "desc" && <DescriptionMedia markDirty={markDirty} />}
              {tab === "license" && <LicensingCompany markDirty={markDirty} />}
              {tab === "products" && (
                <div className="card-body fade-in" style={{ padding: "20px 22px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 13.5, color: "var(--rd-text-muted)" }}>
                      <b style={{ color: "var(--rd-navy-800)" }}>{products.length}</b> products · <b style={{ color: "var(--rd-navy-800)" }}>{totalVariations}</b> variations
                    </span>
                    <span className="grow" style={{ flex: 1 }}></span>
                    <button className="btn-add" style={{ width: "auto", padding: "11px 16px" }} onClick={addProduct}><Ic.Plus /> Add product</button>
                  </div>
                  <div className="plist">
                    {products.map((p, i) => (
                      <ProductNode key={p.id} p={p} index={i}
                        open={!!openProds[p.id]} onToggle={() => setOpenProds((s) => ({ ...s, [p.id]: !s[p.id] }))}
                        onChange={setProduct} onDelete={() => delProduct(p.id)} markDirty={markDirty} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right rail */}
          <aside className="rail-col">
            <NotesCard markDirty={markDirty} />
            <ActivityCard />
          </aside>
        </div>
      </div>

      <div className={"toast" + (toast ? " show" : "")}><Ic.Check />{toast}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
