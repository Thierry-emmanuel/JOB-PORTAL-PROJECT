/**
 * CMSPanel.jsx
 * ─────────────────────────────────────────────────────────────────
 * Ultra-responsive Hero + FAQ CMS for Kora Admin Dashboard.
 *
 * Drop-in replacement that wires into the existing pattern:
 *   {tab === 'hero' && <HeroEditor showToast={showToast}/>}
 *   {tab === 'cms'  && <CMSTab    showToast={showToast}/>}
 *
 * Dependencies already used in the project:
 *   lucide-react, framer-motion (AnimatePresence / motion)
 *   API helpers: fetchAdminHero, saveHeroConfig, resetHeroConfig
 *                fetchFAQs, createFAQ, updateFAQ, deleteFAQ
 *                fetchCategories, createCategory, deleteCategory
 *                fetchSkills, createSkill, deleteSkill
 *
 * Requires the companion CSS file: hero-faq-cms.css  (see below)
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, FileText, Hash, Award, Image,
  Type, AlignLeft, Globe, Sliders, Eye, EyeOff, RefreshCw,
  GripVertical, ArrowUp, ArrowDown, Check, AlertCircle,
  HelpCircle, Layers, Sparkles, Palette, Monitor, RotateCcw,
  Search, Filter, Info,
} from 'lucide-react';
import {
  fetchAdminHero, saveHeroConfig, resetHeroConfig,
  fetchFAQs, createFAQ, updateFAQ, deleteFAQ,
  fetchCategories, createCategory, deleteCategory,
  fetchSkills, createSkill, deleteSkill,
} from '../../api/admin';
import './hero-faq-cms.css';

/* ════════════════════════════════════════════════════════════════
   SHARED MICRO-COMPONENTS
   ════════════════════════════════════════════════════════════════ */

function Spinner() {
  return (
    <div className="cms-spinner-wrap">
      <div className="cms-spinner" />
      <span>Loading…</span>
    </div>
  );
}

function EmptyState({ icon: Icon = HelpCircle, msg = 'Nothing here yet.' }) {
  return (
    <div className="cms-empty">
      <Icon size={32} strokeWidth={1.4} />
      <p>{msg}</p>
    </div>
  );
}

function FieldLabel({ label, hint }) {
  const [show, setShow] = useState(false);
  return (
    <div className="cms-field-label-row">
      <label className="cms-label">{label}</label>
      {hint && (
        <span className="cms-hint-wrap" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
          <Info size={12} />
          {show && <span className="cms-tooltip">{hint}</span>}
        </span>
      )}
    </div>
  );
}

function Field({ label, hint, children, className = '' }) {
  return (
    <div className={`cms-field ${className}`}>
      <FieldLabel label={label} hint={hint} />
      {children}
    </div>
  );
}

function Toggle({ value, onChange, label, size = 'md' }) {
  return (
    <button
      type="button"
      className={`cms-toggle ${value ? 'on' : ''} ${size}`}
      onClick={() => onChange(!value)}
      aria-pressed={value}
    >
      {value
        ? <ToggleRight size={size === 'sm' ? 20 : 24} />
        : <ToggleLeft  size={size === 'sm' ? 20 : 24} />}
      {label && <span>{label}</span>}
    </button>
  );
}

function StatusBadge({ active }) {
  return (
    <span className={`cms-status-badge ${active ? 'active' : 'inactive'}`}>
      {active ? <Check size={10} /> : <X size={10} />}
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

/* Collapsible accordion section */
function Section({ icon: Icon, title, badge, children, defaultOpen = true, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`cms-section ${className}`}>
      <button className="cms-section-head" onClick={() => setOpen(o => !o)} type="button">
        <span className="cms-section-icon"><Icon size={15} /></span>
        <span className="cms-section-title">{title}</span>
        {badge != null && <span className="cms-section-badge">{badge}</span>}
        <span className="cms-section-chevron">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="cms-section-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Card wrapper with sticky header */
function PanelCard({ title, icon: Icon, actions, children }) {
  return (
    <div className="cms-panel-card">
      <div className="cms-panel-head">
        <h2 className="cms-panel-title">
          {Icon && <Icon size={16} />}
          {title}
        </h2>
        {actions && <div className="cms-panel-actions">{actions}</div>}
      </div>
      <div className="cms-panel-body">{children}</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   HERO EDITOR  (replaces HeroEditor.jsx)
   ════════════════════════════════════════════════════════════════ */

const GRADIENT_PRESETS = [
  { name: 'Midnight', from: '#1a1438', to: '#1e3a5f' },
  { name: 'Royal',    from: '#1e1b4b', to: '#312e81' },
  { name: 'Forest',   from: '#052e16', to: '#064e3b' },
  { name: 'Ember',    from: '#431407', to: '#7c2d12' },
  { name: 'Slate',    from: '#0f172a', to: '#1e293b' },
  { name: 'Ocean',    from: '#0c4a6e', to: '#164e63' },
  { name: 'Dusk',     from: '#2e1065', to: '#4a044e' },
  { name: 'Sahara',   from: '#451a03', to: '#92400e' },
];

const TRANSITION_OPTS = [
  { value: 'fade',  label: 'Fade',  desc: 'Smooth cross-dissolve' },
  { value: 'slide', label: 'Slide', desc: 'Pan left / right' },
  { value: 'zoom',  label: 'Zoom',  desc: 'Ken-Burns zoom' },
];

const LAYOUT_OPTS = [
  { value: 'center', label: 'Centered' },
  { value: 'left',   label: 'Left-align' },
  { value: 'split',  label: 'Split' },
];

const INTERVAL_OPTS = [3000, 4000, 5000, 6000, 8000];

const TEXT_ANIM_OPTS = [
  { value: 'none',    label: 'None' },
  { value: 'fadeIn',  label: 'Fade in' },
  { value: 'fadeUp',  label: 'Fade up' },
  { value: 'slideUp', label: 'Slide up' },
  { value: 'zoomIn',  label: 'Zoom in' },
];

const emptySlide = () => ({
  url: '', alt: '', credit: '', position: 'center center', overlay: 0.4,
  _key: Math.random().toString(36).slice(2),
});

const HERO_STEPS = [
  { key: 'content',  label: 'Text content',  icon: Type },
  { key: 'slides',   label: 'Background',    icon: Image },
  { key: 'style',    label: 'Appearance',    icon: Palette },
  { key: 'playback', label: 'Slideshow',     icon: Sliders },
];

export function HeroEditor({ showToast }) {
  const [cfg, setCfg]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [dirty, setDirty]     = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [previewTab, setPreviewTab] = useState('desktop');
  const [activeStep, setActiveStep] = useState('content');
  const [panelMode, setPanelMode]   = useState('edit');
  const previewRef = useRef(null);
  const configRef  = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminHero()
      .then(d => { setCfg(d); setDirty(false); })
      .catch(() => showToast('Failed to load hero config.', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(load, [load]);

  const upd = (path, val) => {
    setCfg(prev => {
      const next = { ...prev };
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = val;
      return next;
    });
    setDirty(true);
  };

  const updSlide = (idx, key, val) => {
    const slides = [...(cfg.slides || [])];
    slides[idx] = { ...slides[idx], [key]: val };
    upd('slides', slides);
  };

  const addSlide = () => {
    upd('slides', [...(cfg.slides || []), emptySlide()]);
  };

  const removeSlide = (idx) => {
    upd('slides', (cfg.slides || []).filter((_, i) => i !== idx));
  };

  const moveSlide = (idx, dir) => {
    const slides = [...(cfg.slides || [])];
    const swap = idx + dir;
    if (swap < 0 || swap >= slides.length) return;
    [slides[idx], slides[swap]] = [slides[swap], slides[idx]];
    upd('slides', slides);
  };

  const scrollToPreview = () => {
    setPanelMode('preview');
    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const scrollToEdit = () => {
    setPanelMode('edit');
    configRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveHeroConfig(cfg);
      showToast('Hero configuration saved!');
      setDirty(false);
      setSavedAt(new Date());
    } catch {
      showToast('Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!window.confirm('Reset to defaults?')) return;
    try {
      const d = await resetHeroConfig();
      setCfg(d);
      setDirty(false);
      showToast('Reset to defaults.');
    } catch {
      showToast('Reset failed.', 'error');
    }
  };

  if (loading) return <Spinner />;
  if (!cfg) return <EmptyState icon={AlertCircle} msg="Could not load hero configuration." />;

  return (
    <div className={`cms-hero-root cms-hero-root--${panelMode}`}>
      <div className="cms-hero-intro">
        <h3>Homepage Hero Editor</h3>
        <p>
          Customize what visitors see first on Kora. Edit headlines and calls-to-action in <strong>Text content</strong>,
          swap background images under <strong>Background</strong>, tune colors in <strong>Appearance</strong>, then
          preview before saving. Changes go live on the public homepage immediately after save.
        </p>
      </div>
      {/* ── Action toolbar ─────────────────────── */}
      <div className="cms-save-bar cms-hero-toolbar">
        <div className="cms-save-bar-left">
          <Sparkles size={15} />
          <span>Hero Section Manager</span>
          {dirty && <span className="cms-unsaved-pill">Unsaved changes</span>}
          {!dirty && savedAt && <span className="cms-saved-pill"><Check size={10}/> Saved</span>}
        </div>
        <div className="cms-hero-mode-tabs">
          <button
            type="button"
            className={`cms-hero-mode-btn${panelMode === 'edit' ? ' active' : ''}`}
            onClick={scrollToEdit}
          >
            <Edit2 size={13}/> Edit
          </button>
          <button
            type="button"
            className={`cms-hero-mode-btn${panelMode === 'preview' ? ' active' : ''}`}
            onClick={scrollToPreview}
          >
            <Eye size={13}/> Preview
          </button>
        </div>
        <div className="cms-save-bar-right">
          <button type="button" className="cms-btn ghost sm" onClick={load} title="Reload from server"><RefreshCw size={13}/></button>
          <button type="button" className="cms-btn ghost sm" onClick={reset}><RotateCcw size={13}/> Reset</button>
          <button type="button" className="cms-btn primary sm" onClick={save} disabled={saving || !dirty}>
            <Save size={13}/> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Step navigation ─────────────────────── */}
      <div className="cms-hero-steps">
        {HERO_STEPS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`cms-hero-step${activeStep === key ? ' active' : ''}`}
            onClick={() => { setActiveStep(key); setPanelMode('edit'); }}
          >
            <Icon size={14}/>
            {label}
          </button>
        ))}
      </div>

      {/* ── Two-column layout: config + preview ─ */}
      <div className="cms-hero-cols">

        {/* LEFT — configuration panels */}
        <div ref={configRef} className={`cms-hero-config cms-scroll-pane${panelMode === 'preview' ? ' dimmed' : ''}`}>

          {activeStep === 'content' && (
            <PanelCard title="Text content" icon={Type}>
              <Field label="Headline" hint="Main hero heading displayed prominently">
                <input className="cms-input" value={cfg.headline ?? ''} onChange={e => upd('headline', e.target.value)} placeholder="Find your dream job today" />
              </Field>
              <Field label="Sub-headline">
                <input className="cms-input" value={cfg.subHeadline ?? ''} onChange={e => upd('subHeadline', e.target.value)} placeholder="Connecting talent with opportunity…" />
              </Field>
              <Field label="Body text">
                <textarea className="cms-textarea" rows={3} value={cfg.body ?? ''} onChange={e => upd('body', e.target.value)} placeholder="Supporting description…" />
              </Field>
              <div className="cms-field-row">
                <Field label="CTA button label">
                  <input className="cms-input" value={cfg.ctaLabel ?? ''} onChange={e => upd('ctaLabel', e.target.value)} placeholder="Get started" />
                </Field>
                <Field label="CTA URL">
                  <input className="cms-input" value={cfg.ctaUrl ?? ''} onChange={e => upd('ctaUrl', e.target.value)} placeholder="/jobs" />
                </Field>
              </div>
              <Field label="Secondary CTA label">
                <input className="cms-input" value={cfg.ctaSecondaryLabel ?? ''} onChange={e => upd('ctaSecondaryLabel', e.target.value)} placeholder="Browse employers" />
              </Field>
            </PanelCard>
          )}

          {activeStep === 'slides' && (
            <PanelCard title="Background slides" icon={Image} actions={<span className="cms-section-badge">{(cfg.slides || []).length}</span>}>
              <p className="cms-step-hint">Add image URLs for rotating backgrounds. Drag order with the arrow buttons on each slide.</p>
              <AnimatePresence>
                {(cfg.slides || []).map((slide, idx) => (
                  <SlideCard
                    key={slide._key || idx}
                    slide={slide}
                    index={idx}
                    total={(cfg.slides || []).length}
                    onChange={s => { const arr = [...cfg.slides]; arr[idx] = s; upd('slides', arr); }}
                    onRemove={() => removeSlide(idx)}
                    onMove={dir => moveSlide(idx, dir)}
                  />
                ))}
              </AnimatePresence>
              <button type="button" className="cms-btn dashed w-full mt-2" onClick={addSlide}>
                <Plus size={14}/> Add slide
              </button>
            </PanelCard>
          )}

          {activeStep === 'style' && (
            <PanelCard title="Appearance & layout" icon={Palette}>
              <div className="cms-field-row">
                <Field label="Layout">
                  <select className="cms-select" value={cfg.layout ?? 'center'} onChange={e => upd('layout', e.target.value)}>
                    {LAYOUT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Text animation">
                  <select className="cms-select" value={cfg.textAnimation ?? 'fadeUp'} onChange={e => upd('textAnimation', e.target.value)}>
                    {TEXT_ANIM_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Gradient presets">
                <div className="cms-gradient-grid">
                  {GRADIENT_PRESETS.map(p => (
                    <button
                      key={p.name}
                      type="button"
                      className={`cms-gradient-swatch${cfg.gradientFrom === p.from ? ' active' : ''}`}
                      style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                      title={p.name}
                      onClick={() => { upd('gradientFrom', p.from); upd('gradientTo', p.to); }}
                    >
                      <span className="cms-swatch-label">{p.name}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <div className="cms-field-row">
                <Field label="Gradient from">
                  <div className="cms-color-row">
                    <input type="color" className="cms-color-input" value={cfg.gradientFrom ?? '#1a1438'} onChange={e => upd('gradientFrom', e.target.value)} />
                    <input className="cms-input" value={cfg.gradientFrom ?? ''} onChange={e => upd('gradientFrom', e.target.value)} />
                  </div>
                </Field>
                <Field label="Gradient to">
                  <div className="cms-color-row">
                    <input type="color" className="cms-color-input" value={cfg.gradientTo ?? '#1e3a5f'} onChange={e => upd('gradientTo', e.target.value)} />
                    <input className="cms-input" value={cfg.gradientTo ?? ''} onChange={e => upd('gradientTo', e.target.value)} />
                  </div>
                </Field>
              </div>
            </PanelCard>
          )}

          {activeStep === 'playback' && (
            <PanelCard title="Slideshow settings" icon={Sliders}>
              <div className="cms-toggle-group">
                <Toggle value={cfg.autoplay ?? true}    onChange={v => upd('autoplay', v)}    label="Autoplay" />
                <Toggle value={cfg.showDots ?? true}    onChange={v => upd('showDots', v)}    label="Show dots" />
                <Toggle value={cfg.showArrows ?? true}  onChange={v => upd('showArrows', v)}  label="Show arrows" />
                <Toggle value={cfg.showStats ?? false}  onChange={v => upd('showStats', v)}   label="Show stats bar" />
              </div>
              <div className="cms-field-row">
                <Field label="Transition effect">
                  <select className="cms-select" value={cfg.transition ?? 'fade'} onChange={e => upd('transition', e.target.value)}>
                    {TRANSITION_OPTS.map(o => <option key={o.value} value={o.value}>{o.label} — {o.desc}</option>)}
                  </select>
                </Field>
                <Field label="Interval">
                  <select className="cms-select" value={cfg.interval ?? 5000} onChange={e => upd('interval', Number(e.target.value))}>
                    {INTERVAL_OPTS.map(v => <option key={v} value={v}>{v / 1000}s</option>)}
                  </select>
                </Field>
              </div>
            </PanelCard>
          )}

        </div>

        {/* RIGHT — live preview */}
        <div ref={previewRef} className={`cms-hero-preview-pane cms-scroll-pane${panelMode === 'edit' ? ' dimmed' : ''}`}>
          <div className="cms-preview-head">
            <span className="cms-preview-label"><Eye size={13}/> Live preview</span>
            <div className="cms-preview-tabs">
              {['desktop', 'mobile'].map(t => (
                <button key={t} type="button" className={`cms-preview-tab${previewTab === t ? ' active' : ''}`} onClick={() => setPreviewTab(t)}>
                  <Monitor size={12} />
                  {t}
                </button>
              ))}
            </div>
          </div>
          <HeroPreview cfg={cfg} mode={previewTab} />
          <p className="cms-preview-footnote">Changes appear instantly. Click <strong>Save</strong> to publish to the homepage.</p>
        </div>

      </div>
    </div>
  );
}

/* ── Slide card (hero editor) ─────────────────────────── */
function SlideCard({ slide, index, total, onChange, onRemove, onMove }) {
  const [open, setOpen] = useState(true);
  const upd = (key, val) => onChange({ ...slide, [key]: val });

  return (
    <motion.div
      layout
      className="cms-slide-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18 }}
    >
      <div className="cms-slide-head">
        <GripVertical size={14} className="cms-slide-grip" />
        <span className="cms-slide-num">Slide {index + 1}</span>
        {slide.url && (
          <img src={slide.url} alt="" className="cms-slide-thumb" onError={e => { e.currentTarget.style.display = 'none'; }} />
        )}
        <div className="cms-slide-head-acts">
          <button type="button" className="cms-icon-btn" onClick={() => onMove(-1)} disabled={index === 0} title="Move up"><ArrowUp size={12}/></button>
          <button type="button" className="cms-icon-btn" onClick={() => onMove(1)}  disabled={index === total - 1} title="Move down"><ArrowDown size={12}/></button>
          <button type="button" className="cms-icon-btn" onClick={() => setOpen(o => !o)}>{open ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}</button>
          <button type="button" className="cms-icon-btn danger" onClick={onRemove}><Trash2 size={12}/></button>
        </div>
      </div>
      {open && (
        <div className="cms-slide-body">
          <Field label="Image URL" hint="Direct link to the background image (HTTPS)">
            <input className="cms-input" value={slide.url} onChange={e => upd('url', e.target.value)} placeholder="https://…" />
          </Field>
          <div className="cms-field-row">
            <Field label="Alt text">
              <input className="cms-input" value={slide.alt} onChange={e => upd('alt', e.target.value)} placeholder="Describe the image" />
            </Field>
            <Field label="Credit">
              <input className="cms-input" value={slide.credit} onChange={e => upd('credit', e.target.value)} placeholder="© Photographer" />
            </Field>
          </div>
          <Field label={`Overlay opacity: ${Math.round((slide.overlay ?? 0.4) * 100)}%`}>
            <input
              type="range" min="0" max="1" step="0.05"
              className="cms-range"
              value={slide.overlay ?? 0.4}
              onChange={e => upd('overlay', parseFloat(e.target.value))}
            />
          </Field>
        </div>
      )}
    </motion.div>
  );
}

/* ── Hero mini-preview ────────────────────────────────── */
function HeroPreview({ cfg, mode }) {
  const slide = (cfg.slides || [])[0] || {};
  const gradFrom = cfg.gradientFrom || '#1a1438';
  const gradTo   = cfg.gradientTo   || '#1e3a5f';
  const overlay  = slide.overlay ?? 0.4;

  return (
    <div className={`cms-hero-preview-frame ${mode}`}>
      <div
        className="cms-hero-preview-bg"
        style={{
          backgroundImage: slide.url
            ? `linear-gradient(rgba(0,0,0,${overlay}),rgba(0,0,0,${overlay})), url(${slide.url})`
            : `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
          backgroundSize: 'cover',
          backgroundPosition: slide.position || 'center',
        }}
      >
        <div className={`cms-hero-preview-content layout-${cfg.layout || 'center'}`}>
          {cfg.showStats && (
            <div className="cms-hero-preview-stats">
              <span>12k+ Jobs</span><span>•</span><span>4k+ Companies</span>
            </div>
          )}
          <h2 className="cms-hero-preview-h">{cfg.headline || 'Find your dream job'}</h2>
          <p className="cms-hero-preview-p">{cfg.subHeadline || 'Connecting talent with opportunity'}</p>
          <div className="cms-hero-preview-ctas">
            {cfg.ctaLabel && <span className="cms-hero-cta-primary">{cfg.ctaLabel}</span>}
            {cfg.ctaSecondaryLabel && <span className="cms-hero-cta-secondary">{cfg.ctaSecondaryLabel}</span>}
          </div>
        </div>
        {cfg.showDots && (
          <div className="cms-hero-preview-dots">
            {(cfg.slides || [{ _key: 'x' }]).map((s, i) => (
              <span key={s._key || i} className={`cms-hero-dot${i === 0 ? ' active' : ''}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CMS TAB  (FAQs + Categories + Skills)
   ════════════════════════════════════════════════════════════════ */

export function CMSTab({ showToast }) {
  const [sub, setSub] = useState('faqs');
  const tabs = [
    { key: 'faqs',       label: 'FAQs',            icon: HelpCircle },
    { key: 'categories', label: 'Job categories',  icon: Hash       },
    { key: 'skills',     label: 'Platform skills', icon: Award      },
  ];

  return (
    <div className="cms-tab-root">
      <div className="cms-sub-tabs">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" className={`cms-sub-tab${sub === key ? ' active' : ''}`} onClick={() => setSub(key)}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={sub}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {sub === 'faqs'       && <FAQManager showToast={showToast} />}
          {sub === 'categories' && <CategoryManager showToast={showToast} />}
          {sub === 'skills'     && <SkillManager showToast={showToast} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── FAQ Manager ─────────────────────────────────────── */
function FAQManager({ showToast }) {
  const [faqs,    setFaqs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // FAQ object or null
  const [form,    setForm]    = useState({ question: '', answer: '', isActive: true });
  const [showForm, setShowForm] = useState(false);
  const [search,   setSearch]  = useState('');
  const [filter,   setFilter]  = useState('all'); // all | active | inactive
  const formRef = useRef(null);

  const load = () => {
    setLoading(true);
    fetchFAQs()
      .then(setFaqs)
      .catch(() => showToast('Failed to load FAQs.', 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setForm({ question: '', answer: '', isActive: true });
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  };

  const openEdit = (faq) => {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer, isActive: faq.isActive });
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  };

  const close = () => { setShowForm(false); setEditing(null); };

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      showToast('Question and answer are required.', 'error');
      return;
    }
    try {
      if (editing) { await updateFAQ(editing.id, form); showToast('FAQ updated.'); }
      else         { await createFAQ(form);              showToast('FAQ created.'); }
      close(); load();
    } catch { showToast('Save failed.', 'error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try { await deleteFAQ(id); showToast('FAQ deleted.'); load(); }
    catch { showToast('Delete failed.', 'error'); }
  };

  const filtered = faqs.filter(f => {
    const matchSearch = f.question.toLowerCase().includes(search.toLowerCase()) ||
                        f.answer.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' ? f.isActive : !f.isActive);
    return matchSearch && matchFilter;
  });

  return (
    <PanelCard
      title="FAQs"
      icon={HelpCircle}
      actions={
        <button className="cms-btn primary sm" onClick={openNew}>
          <Plus size={13}/> New FAQ
        </button>
      }
    >
      {/* Inline form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            ref={formRef}
            key="faq-form"
            className="cms-form-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="cms-form-inner">
              <div className="cms-form-title">
                {editing ? <><Edit2 size={14}/> Edit FAQ</> : <><Plus size={14}/> New FAQ</>}
              </div>
              <Field label="Question *">
                <input
                  className="cms-input"
                  value={form.question}
                  onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  placeholder="e.g. How do I apply for a job?"
                  autoFocus
                />
              </Field>
              <Field label="Answer *">
                <textarea
                  className="cms-textarea"
                  value={form.answer}
                  onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                  rows={4}
                  placeholder="Write a clear, concise answer…"
                />
              </Field>
              <div className="cms-form-footer">
                <Toggle
                  value={form.isActive}
                  onChange={v => setForm(f => ({ ...f, isActive: v }))}
                  label="Publish immediately"
                  size="sm"
                />
                <div className="cms-form-btns">
                  <button className="cms-btn ghost sm" onClick={close}><X size={13}/> Cancel</button>
                  <button className="cms-btn primary sm" onClick={save}><Save size={13}/> {editing ? 'Update' : 'Create'}</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + filter bar */}
      <div className="cms-list-toolbar">
        <div className="cms-search-wrap">
          <Search size={13} className="cms-search-icon" />
          <input
            className="cms-search-input"
            placeholder="Search FAQs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="cms-search-clear" onClick={() => setSearch('')}><X size={11}/></button>}
        </div>
        <div className="cms-filter-chips">
          {[['all','All'],['active','Active'],['inactive','Inactive']].map(([k,l]) => (
            <button key={k} type="button" className={`cms-chip${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="cms-faq-list cms-scroll-pane">
          {filtered.length === 0
            ? <EmptyState icon={HelpCircle} msg={search ? 'No FAQs match your search.' : 'No FAQs yet. Create the first one!'} />
            : filtered.map(f => (
              <motion.div
                key={f.id}
                className={`cms-faq-item${!f.isActive ? ' inactive' : ''}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="cms-faq-item-left">
                  <div className="cms-faq-q">{f.question}</div>
                  <div className="cms-faq-a">{f.answer}</div>
                  <StatusBadge active={f.isActive} />
                </div>
                <div className="cms-faq-item-right">
                  <button className="cms-icon-btn edit" onClick={() => openEdit(f)} title="Edit"><Edit2 size={13}/></button>
                  <button className="cms-icon-btn danger" onClick={() => del(f.id)} title="Delete"><Trash2 size={13}/></button>
                </div>
              </motion.div>
            ))
          }
        </div>
      )}

      {!loading && faqs.length > 0 && (
        <div className="cms-list-footer">{filtered.length} of {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''}</div>
      )}
    </PanelCard>
  );
}

/* ── Category Manager ────────────────────────────────── */
function CategoryManager({ showToast }) {
  const [cats,    setCats]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({ name: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const [search,   setSearch]  = useState('');

  const load = () => {
    setLoading(true);
    fetchCategories()
      .then(setCats)
      .catch(() => showToast('Failed to load categories.', 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    if (!form.name.trim()) { showToast('Name is required.', 'error'); return; }
    try { await createCategory(form); showToast('Category created.'); setShowForm(false); setForm({ name: '', description: '' }); load(); }
    catch { showToast('Failed.', 'error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try { await deleteCategory(id); showToast('Category deleted.'); load(); }
    catch { showToast('Failed.', 'error'); }
  };

  const filtered = cats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <PanelCard
      title="Job categories"
      icon={Hash}
      actions={
        <button className="cms-btn primary sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? <><X size={13}/> Cancel</> : <><Plus size={13}/> New category</>}
        </button>
      }
    >
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="cms-form-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="cms-form-inner">
              <div className="cms-form-title"><Hash size={14}/> New category</div>
              <div className="cms-field-row">
                <Field label="Name *">
                  <input className="cms-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Engineering" autoFocus />
                </Field>
                <Field label="Description">
                  <input className="cms-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
                </Field>
              </div>
              <div className="cms-form-footer">
                <span />
                <div className="cms-form-btns">
                  <button className="cms-btn ghost sm" onClick={() => setShowForm(false)}><X size={13}/> Cancel</button>
                  <button className="cms-btn primary sm" onClick={save}><Save size={13}/> Create</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="cms-list-toolbar">
        <div className="cms-search-wrap">
          <Search size={13} className="cms-search-icon" />
          <input className="cms-search-input" placeholder="Search categories…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="cms-search-clear" onClick={() => setSearch('')}><X size={11}/></button>}
        </div>
        <span className="cms-count-pill">{filtered.length} categories</span>
      </div>

      {loading ? <Spinner /> : (
        <div className="cms-cat-grid cms-scroll-pane">
          {filtered.length === 0
            ? <EmptyState icon={Hash} msg="No categories yet." />
            : filtered.map(c => (
              <motion.div key={c.id} className="cms-cat-item" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="cms-cat-icon"><Hash size={14}/></div>
                <div className="cms-cat-body">
                  <strong>{c.name}</strong>
                  {c.description && <span>{c.description}</span>}
                </div>
                <button className="cms-icon-btn danger" onClick={() => del(c.id)} title="Delete"><Trash2 size={12}/></button>
              </motion.div>
            ))
          }
        </div>
      )}
    </PanelCard>
  );
}

/* ── Skill Manager ───────────────────────────────────── */
function SkillManager({ showToast }) {
  const [skills,  setSkills]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [name,    setName]    = useState('');
  const [search,  setSearch]  = useState('');
  const inputRef = useRef(null);

  const load = () => {
    setLoading(true);
    fetchSkills()
      .then(setSkills)
      .catch(() => showToast('Failed to load skills.', 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    if (!name.trim()) return;
    try { await createSkill({ name }); showToast('Skill added.'); setName(''); load(); }
    catch { showToast('Failed.', 'error'); }
  };

  const del = async (id) => {
    try { await deleteSkill(id); showToast('Skill removed.'); load(); }
    catch { showToast('Failed.', 'error'); }
  };

  const filtered = skills.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <PanelCard title="Platform skills" icon={Award}>
      <div className="cms-skill-add-row">
        <div className="cms-search-wrap flex-1">
          <Award size={13} className="cms-search-icon" />
          <input
            ref={inputRef}
            className="cms-search-input"
            placeholder="Type a skill name and press Enter…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
          />
        </div>
        <button className="cms-btn primary sm" onClick={save} disabled={!name.trim()}>
          <Plus size={13}/> Add
        </button>
      </div>

      <div className="cms-list-toolbar" style={{ marginTop: 8 }}>
        <div className="cms-search-wrap">
          <Search size={13} className="cms-search-icon" />
          <input className="cms-search-input" placeholder="Filter skills…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="cms-search-clear" onClick={() => setSearch('')}><X size={11}/></button>}
        </div>
        <span className="cms-count-pill">{filtered.length} skills</span>
      </div>

      {loading ? <Spinner /> : (
        <div className="cms-skill-chips cms-scroll-pane">
          {filtered.length === 0
            ? <EmptyState icon={Award} msg="No skills yet. Add the first one!" />
            : filtered.map(s => (
              <motion.div
                key={s.id}
                className="cms-skill-chip"
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span>{s.name}</span>
                <button type="button" className="cms-chip-del" onClick={() => del(s.id)}><X size={10}/></button>
              </motion.div>
            ))
          }
        </div>
      )}
    </PanelCard>
  );
}