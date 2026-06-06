/**
 * HeroEditor.jsx
 * ─────────────────────────────────────────────────────────────────
 * Full admin hero configuration editor.
 * Connects to GET/PUT /api/admin/hero.
 * Shows a live preview panel that mirrors exactly what the homepage renders.
 * ─────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlignLeft, ArrowLeft, ArrowRight, BarChart3, Camera, CheckCircle, ChevronDown, ChevronUp, Clock, Eye, EyeOff, GripVertical, Image, Info, Layers, Link, Monitor, Palette, Pause, Play, Plus, RefreshCw, RotateCcw, Save, Sliders, Smartphone, Sparkles, ToggleLeft, ToggleRight, Trash2, Type, Upload, Wind, X, Zap } from 'lucide-react';
import { fetchAdminHero, saveHeroConfig, resetHeroConfig } from '../../api/hero';
import '../../styles/hero-editor.css';

/* ── Colour presets ──────────────────────────────────────────── */
const GRADIENT_PRESETS = [
  { name: 'Midnight',    from: '#1a1438', to: '#1e3a5f' },
  { name: 'Royal',       from: '#1e1b4b', to: '#312e81' },
  { name: 'Forest',      from: '#052e16', to: '#064e3b' },
  { name: 'Ember',       from: '#431407', to: '#7c2d12' },
  { name: 'Slate',       from: '#0f172a', to: '#1e293b' },
  { name: 'Ocean',       from: '#0c4a6e', to: '#164e63' },
  { name: 'Dusk',        from: '#2e1065', to: '#4a044e' },
  { name: 'Sahara',      from: '#451a03', to: '#92400e' },
];

const TRANSITION_OPTIONS = [
  { value: 'fade',  label: 'Fade',       desc: 'Smooth cross-dissolve' },
  { value: 'slide', label: 'Slide',      desc: 'Pan left / right' },
  { value: 'zoom',  label: 'Zoom',       desc: 'Subtle Ken-Burns zoom' },
];

const LAYOUT_OPTIONS = [
  { value: 'center', label: 'Centered',    desc: 'Content centred on hero' },
  { value: 'left',   label: 'Left-align',  desc: 'Content flush left' },
  { value: 'split',  label: 'Split',       desc: 'Text left, media right' },
];

const INTERVAL_OPTIONS = [
  { value: 3000,  label: '3 s' },
  { value: 4000,  label: '4 s' },
  { value: 5000,  label: '5 s' },
  { value: 6000,  label: '6 s' },
  { value: 8000,  label: '8 s' },
];

const TEXT_ANIMATION_OPTIONS = [
  { value: 'none',    label: 'None',     desc: 'Text appears instantly' },
  { value: 'fadeIn',  label: 'Fade In',  desc: 'Opacity fade from 0→1' },
  { value: 'fadeUp',  label: 'Fade Up',  desc: 'Slides up while fading in' },
  { value: 'slideUp', label: 'Slide Up', desc: 'Dramatic upward entrance' },
  { value: 'zoomIn',  label: 'Zoom In',  desc: 'Scales up from center' },
];

/* ── Empty slide template ────────────────────────────────────── */
const emptySlide = () => ({
  url: '', alt: '', credit: '', position: 'center center', overlay: 0.0,
  _key: Math.random().toString(36).slice(2),
});

/* ── Section accordion wrapper ───────────────────────────────── */
function Section({ icon, title, badge, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="he-section">
      <button className="he-section-head" onClick={() => setOpen(o => !o)}>
        <span className="he-section-icon">{icon}</span>
        <span className="he-section-title">{title}</span>
        {badge && <span className="he-section-badge">{badge}</span>}
        <span className="he-section-chevron">
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
            <div className="he-section-body">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Small UI atoms ──────────────────────────────────────────── */
function Field({ label, hint, children }) {
  return (
    <div className="he-field">
      <div className="he-field-label-row">
        <label className="he-label">{label}</label>
        {hint && <span className="he-hint"><Info size={11} />{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <button
      className={`he-toggle-btn${value ? ' on' : ''}`}
      onClick={() => onChange(!value)}
      type="button"
      aria-pressed={value}
    >
      {value
        ? <ToggleRight size={26} className="he-toggle-icon on" />
        : <ToggleLeft  size={26} className="he-toggle-icon" />}
      <span>{label}</span>
    </button>
  );
}

function Input({ value, onChange, placeholder, type = 'text', ...rest }) {
  return (
    <input
      className="he-input"
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      {...rest}
    />
  );
}

function Textarea({ value, onChange, rows = 3, placeholder }) {
  return (
    <textarea
      className="he-textarea"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
    />
  );
}

/* ── Drag-sortable slide card ────────────────────────────────── */
function SlideCard({ slide, index, total, onChange, onRemove, onMove }) {
  const [collapsed, setCollapsed] = useState(false);
  const [urlValid, setUrlValid] = useState(true);
  const upd = (key, val) => onChange({ ...slide, [key]: val });

  const POSITION_OPTIONS = [
    'center center', 'center top', 'center bottom',
    'left center', 'right center', 'left top', 'right top',
  ];

  const handleUrlBlur = () => {
    if (!slide.url) { setUrlValid(true); return; }
    const img = new window.Image();
    img.onload  = () => setUrlValid(true);
    img.onerror = () => setUrlValid(false);
    img.src = slide.url;
  };

  return (
    <motion.div
      layout
      className="he-slide-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
    >
      <div className="he-slide-card-head">
        <span className="he-slide-grip"><GripVertical size={14} /></span>
        <span className="he-slide-num">Slide {index + 1}</span>
        {slide.url && (
          <img
            src={slide.url}
            alt=""
            className="he-slide-thumb"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div className="he-slide-head-actions">
          <button
            className="he-icon-sm"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            title="Move left"
          ><ArrowLeft size={12} /></button>
          <button
            className="he-icon-sm"
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            title="Move right"
          ><ArrowRight size={12} /></button>
          <button
            className="he-icon-sm"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >{collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}</button>
          <button
            className="he-icon-sm danger"
            onClick={() => onRemove(index)}
            title="Remove slide"
          ><Trash2 size={12} /></button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="he-slide-card-body">
              <Field label="Image URL" hint="Unsplash, Cloudinary, or your CDN">
                <Input
                  value={slide.url}
                  onChange={v => { upd('url', v); setUrlValid(true); }}
                  onBlur={handleUrlBlur}
                  placeholder="https://images.unsplash.com/…?w=1600&q=80"
                />
                {!urlValid && (
                  <div className="he-url-warn">
                    <AlertCircle size={12} /> Image could not be loaded — double-check the URL.
                  </div>
                )}
              </Field>

              <div className="he-field-row">
                <Field label="Alt text">
                  <Input
                    value={slide.alt}
                    onChange={v => upd('alt', v)}
                    placeholder="Professionals collaborating"
                  />
                </Field>
                <Field label="Photo credit">
                  <Input
                    value={slide.credit}
                    onChange={v => upd('credit', v)}
                    placeholder="Unsplash / John Doe"
                  />
                </Field>
              </div>

              <Field label="Focus point" hint="Controls which part of the image is most visible">
                <div className="he-radio-row">
                  {POSITION_OPTIONS.map(pos => (
                    <label
                      key={pos}
                      className={`he-radio-chip${slide.position === pos ? ' active' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`pos-${slide._key ?? index}`}
                        checked={slide.position === pos}
                        onChange={() => upd('position', pos)}
                      />
                      {pos}
                    </label>
                  ))}
                </div>
              </Field>

              <Field
                label={`Per-slide overlay — ${Math.round((slide.overlay ?? 0) * 100)}%`}
                hint="Adds extra darkening on top of the global overlay"
              >
                <input
                  type="range"
                  className="he-range"
                  min={0} max={0.6} step={0.01}
                  value={slide.overlay ?? 0}
                  onChange={e => upd('overlay', parseFloat(e.target.value))}
                />
                <div className="he-range-labels">
                  <span>None</span><span>+60% darker</span>
                </div>
              </Field>

              {slide.url && (
                <div className="he-slide-preview-strip">
                  <img
                    src={slide.url}
                    alt={slide.alt}
                    style={{ objectPosition: slide.position }}
                    onError={e => { e.currentTarget.parentElement.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Mini hero preview (right panel) ────────────────────────── */
function MiniPreview({ config, viewMode }) {
  const [idx, setIdx] = useState(0);
  const slides = config.slides ?? [];
  const hasSlides = slides.length > 0 && config.backgroundType === 'slideshow';

  useEffect(() => {
    if (!hasSlides) return;
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 2500);
    return () => clearInterval(t);
  }, [hasSlides, slides.length]);

  const bg = (() => {
    if (hasSlides && slides[idx]?.url) {
      return {
        backgroundImage: `url(${slides[idx].url})`,
        backgroundSize: 'cover',
        backgroundPosition: slides[idx].position ?? 'center',
      };
    }
    if (config.backgroundType === 'image' && config.backgroundImageUrl) {
      return {
        backgroundImage: `url(${config.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {
      background: `linear-gradient(145deg, ${config.gradientFrom ?? '#1a1438'} 0%, ${config.gradientTo ?? '#1e3a5f'} 100%)`,
    };
  })();

  const dark = config.textColor === 'dark';
  const isCenter = config.layout === 'center';

  return (
    <div className={`he-preview-frame${viewMode === 'mobile' ? ' mobile' : ''}`}>
      <div className="he-preview-screen" style={bg}>
        {/* global overlay */}
        <div className="he-preview-overlay" style={{ opacity: config.overlayOpacity ?? 0.55 }} />
        {/* per-slide overlay */}
        {hasSlides && (slides[idx]?.overlay ?? 0) > 0 && (
          <div className="he-preview-overlay" style={{ opacity: slides[idx].overlay }} />
        )}

        <div className={`he-preview-content${isCenter ? ' center' : ''} ${dark ? 'dark' : 'light'}`}>
          {config.badgeText && (
            <div className="he-preview-badge">{config.badgeText}</div>
          )}
          <h3 className="he-preview-headline">
            {config.headline || 'Your Headline Here'}
          </h3>
          {config.subheadline && (
            <p className="he-preview-sub">{config.subheadline}</p>
          )}
          <div className="he-preview-ctas">
            {config.ctaPrimary && (
              <span className="he-preview-cta-p">{config.ctaPrimary}</span>
            )}
            {config.ctaSecondary && (
              <span className="he-preview-cta-s">{config.ctaSecondary}</span>
            )}
          </div>
          {config.statsVisible && (
            <div className="he-preview-stats">
              <span>{config.statJobsLabel ?? 'Jobs'}</span>
              <span>{config.statCompaniesLabel ?? 'Companies'}</span>
              <span>{config.statSeekersLabel ?? 'Seekers'}</span>
            </div>
          )}
        </div>

        {/* Slide dots */}
        {hasSlides && slides.length > 1 && (
          <div className="he-preview-dots">
            {slides.map((_, i) => (
              <div key={i} className={`he-preview-dot${i === idx ? ' active' : ''}`} />
            ))}
          </div>
        )}

        {/* Progress bar */}
        {hasSlides && (
          <div className="he-preview-progress">
            <motion.div
              key={idx}
              className="he-preview-progress-bar"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2.5, ease: 'linear' }}
              style={{ transformOrigin: 'left' }}
            />
          </div>
        )}

        {/* Motion badges */}
        <div className="he-preview-motion-tags">
          {config.kenBurnsEffect && hasSlides && (
            <span className="he-motion-tag"><Sparkles size={8} /> Ken Burns</span>
          )}
          {config.autoplayPause && (
            <span className="he-motion-tag"><Pause size={8} /> Pause on hover</span>
          )}
          {config.textAnimation && config.textAnimation !== 'none' && (
            <span className="he-motion-tag"><Wind size={8} /> {config.textAnimation}</span>
          )}
        </div>
      </div>

      {/* Browser chrome decoration */}
      <div className="he-preview-chrome">
        <div className="he-chrome-dots">
          <span /><span /><span />
        </div>
        <div className="he-chrome-bar">korajobs.cm</div>
      </div>
    </div>
  );
}

/* ── Normalise API response ───────────────────────────────── */
const normalise = (data) => {
  if (!data) return null;
  return {
    ...data,
    slides: (data.slides ?? []).map((s, i) => ({
      ...s,
      overlay: s.overlay ?? 0,
      _key: s._key ?? `${i}-${Math.random().toString(36).slice(2)}`,
    })),
  };
};

/* ── Build a clean PUT payload (only Request DTO fields) ──── */
const buildPayload = (config) => {
  const {
    headline, subheadline, ctaPrimary, ctaPrimaryUrl,
    ctaSecondary, ctaSecondaryUrl, badgeText,
    backgroundType, gradientFrom, gradientTo, backgroundImageUrl,
    slides: rawSlides, slideIntervalMs, slideTransition,
    statsVisible, statsDynamic, statJobsLabel, statCompaniesLabel, statSeekersLabel,
    layout, overlayOpacity, textColor, isActive,
    kenBurnsEffect, autoplayPause, textAnimation,
  } = config;

  return {
    headline, subheadline, ctaPrimary, ctaPrimaryUrl,
    ctaSecondary, ctaSecondaryUrl, badgeText,
    backgroundType, gradientFrom, gradientTo, backgroundImageUrl,
    slides: (rawSlides ?? []).map(({ _key, ...s }) => s),
    slideIntervalMs, slideTransition,
    statsVisible, statsDynamic, statJobsLabel, statCompaniesLabel, statSeekersLabel,
    layout, overlayOpacity, textColor, isActive,
    kenBurnsEffect, autoplayPause, textAnimation,
  };
};

/* ══════════════════════════════════════════════════════════════════
   MAIN EDITOR
   ══════════════════════════════════════════════════════════════════ */
export default function HeroEditor({ showToast }) {
  const [config, setConfig]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [dirty, setDirty]     = useState(false);
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [previewFull, setPreviewFull] = useState(false);
  const savedRef = useRef(null);

  /* ── Load ─────────────────────────────────────────────────── */
  useEffect(() => {
    fetchAdminHero()
      .then(data => { setConfig(normalise(data)); })
      .catch(() => showToast('Could not load hero config.', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  /* ── Generic field updater ────────────────────────────────── */
  const upd = useCallback((key, val) => {
    setConfig(c => ({ ...c, [key]: val }));
    setDirty(true);
  }, []);

  /* ── Slide helpers ────────────────────────────────────────── */
  const addSlide = () => {
    upd('slides', [...(config.slides ?? []), emptySlide()]);
  };

  const updateSlide = (idx, slide) => {
    const next = [...config.slides];
    next[idx] = slide;
    upd('slides', next);
  };

  const removeSlide = (idx) => {
    upd('slides', config.slides.filter((_, i) => i !== idx));
  };

  const moveSlide = (idx, dir) => {
    const arr = [...config.slides];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    upd('slides', arr);
  };

  /* ── Save — uses explicit payload to avoid sending response-only fields ── */
  const save = async () => {
    setSaving(true);
    try {
      const payload = buildPayload(config);
      const saved = await saveHeroConfig(payload);
      setConfig(normalise(saved));
      setDirty(false);
      showToast('Hero section saved and live!');
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = typeof err?.response?.data === 'object'
        ? err?.response?.data?.message
        : err?.response?.data;
      const userMsg =
        status === 403 ? 'Access denied — admin role required.' :
        status === 401 ? 'Session expired — please log in again.' :
        status === 400 ? `Validation error: ${serverMsg ?? 'check your inputs.'}` :
        serverMsg && !serverMsg.includes('unexpected') ? serverMsg :
        'Save failed. Check your connection and try again.';
      showToast(userMsg, 'error');
      console.error('[HeroEditor] save error:', err?.response?.status, err?.response?.data ?? err?.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Reset ────────────────────────────────────────────────── */
  const reset = async () => {
    if (!window.confirm('Reset hero to platform defaults? This cannot be undone.')) return;
    setSaving(true);
    try {
      const data = await resetHeroConfig();
      setConfig(normalise(data));
      setDirty(false);
      showToast('Hero reset to defaults.');
    } catch (err) {
      console.error('[HeroEditor] reset error:', err);
      showToast('Reset failed. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="he-loading">
        <div className="he-spinner" />
        <span>Loading hero configuration…</span>
      </div>
    );
  }

  if (!config) return null;

  const slides = config.slides ?? [];
  const isSlideshow = config.backgroundType === 'slideshow';

  return (
    <div className="he-root">
      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="he-topbar">
        <div className="he-topbar-left">
          <h2 className="he-topbar-title">Hero Section Editor</h2>
          {dirty && (
            <motion.span
              className="he-dirty-badge"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Unsaved changes
            </motion.span>
          )}
          {config.updatedAt && (
            <span className="he-last-saved">
              Last saved: {new Date(config.updatedAt).toLocaleString()}
              {config.updatedBy && ` by ${config.updatedBy}`}
            </span>
          )}
        </div>
        <div className="he-topbar-right">
          {/* Preview mode toggle */}
          <div className="he-view-toggle">
            <button
              className={`he-view-btn${viewMode === 'desktop' ? ' active' : ''}`}
              onClick={() => setViewMode('desktop')}
              title="Desktop preview"
            ><Monitor size={14} /></button>
            <button
              className={`he-view-btn${viewMode === 'mobile' ? ' active' : ''}`}
              onClick={() => setViewMode('mobile')}
              title="Mobile preview"
            ><Smartphone size={14} /></button>
          </div>

          <button
            className="he-btn ghost"
            onClick={() => setPreviewFull(p => !p)}
            title="Toggle full preview"
          >
            {previewFull ? <EyeOff size={14} /> : <Eye size={14} />}
            {previewFull ? 'Hide Preview' : 'Full Preview'}
          </button>

          <button className="he-btn ghost" onClick={reset} disabled={saving}>
            <RotateCcw size={14} /> Reset
          </button>

          <button className="he-btn primary" onClick={save} disabled={saving} ref={savedRef}>
            {saving
              ? <><RefreshCw size={14} className="he-spin-icon" /> Saving…</>
              : <><Save size={14} /> Save &amp; Publish</>}
          </button>
        </div>
      </div>

      {/* ── Full-screen preview overlay ───────────────────────── */}
      <AnimatePresence>
        {previewFull && (
          <motion.div
            className="he-fullpreview-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewFull(false)}
          >
            <div className="he-fullpreview-inner" onClick={e => e.stopPropagation()}>
              <button className="he-fullpreview-close" onClick={() => setPreviewFull(false)}>
                Close Preview <X size={16} style={{display:"inline-block",verticalAlign:"middle"}} />
              </button>
              <MiniPreview config={config} viewMode={viewMode} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main layout: form | preview ───────────────────────── */}
      <div className="he-body">

        {/* ════════ LEFT — FORM ════════ */}
        <div className="he-form-col">

          {/* 1. Content */}
          <Section icon={<Type size={15} />} title="Content" defaultOpen>

            <Field label="Headline" hint="Keep it under 60 chars for best display">
              <Textarea
                value={config.headline}
                onChange={v => upd('headline', v)}
                rows={2}
                placeholder="Find Your Dream Job in Cameroon"
              />
            </Field>

            <Field label="Sub-headline" hint="Supporting sentence — 1–2 lines ideal">
              <Textarea
                value={config.subheadline}
                onChange={v => upd('subheadline', v)}
                rows={2}
                placeholder="Connecting top talent with leading employers…"
              />
            </Field>

            <Field label="Badge text" hint="Shown in the pill above the headline">
              <Input
                value={config.badgeText}
                onChange={v => upd('badgeText', v)}
                placeholder="1,200+ jobs available now"
              />
            </Field>

            <div className="he-field-row">
              <Field label="Primary CTA label">
                <Input
                  value={config.ctaPrimary}
                  onChange={v => upd('ctaPrimary', v)}
                  placeholder="Browse Jobs"
                />
              </Field>
              <Field label="Primary CTA URL">
                <Input
                  value={config.ctaPrimaryUrl}
                  onChange={v => upd('ctaPrimaryUrl', v)}
                  placeholder="/jobs"
                />
              </Field>
            </div>

            <div className="he-field-row">
              <Field label="Secondary CTA label">
                <Input
                  value={config.ctaSecondary}
                  onChange={v => upd('ctaSecondary', v)}
                  placeholder="Post a Job"
                />
              </Field>
              <Field label="Secondary CTA URL">
                <Input
                  value={config.ctaSecondaryUrl}
                  onChange={v => upd('ctaSecondaryUrl', v)}
                  placeholder="/register"
                />
              </Field>
            </div>
          </Section>

          {/* 2. Background */}
          <Section icon={<Image size={15} />} title="Background" defaultOpen>
            {/* Type selector */}
            <Field label="Background type">
              <div className="he-type-cards">
                {[
                  { value: 'gradient',  label: 'Gradient',      icon: <Palette size={18} />, desc: 'Colour gradient' },
                  { value: 'image',     label: 'Single image',  icon: <Camera  size={18} />, desc: 'One static photo' },
                  { value: 'slideshow', label: 'Slideshow',     icon: <Layers  size={18} />, desc: 'Auto-rotating slides' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`he-type-card${config.backgroundType === opt.value ? ' active' : ''}`}
                    onClick={() => upd('backgroundType', opt.value)}
                    type="button"
                  >
                    <span className="he-type-card-icon">{opt.icon}</span>
                    <strong>{opt.label}</strong>
                    <span>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </Field>

            {/* Gradient options */}
            <AnimatePresence>
              {config.backgroundType === 'gradient' && (
                <motion.div key="grad" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Field label="Gradient presets">
                    <div className="he-gradient-presets">
                      {GRADIENT_PRESETS.map(p => (
                        <button
                          key={p.name}
                          className={`he-grad-swatch${config.gradientFrom === p.from && config.gradientTo === p.to ? ' active' : ''}`}
                          style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                          onClick={() => { upd('gradientFrom', p.from); upd('gradientTo', p.to); setDirty(true); }}
                          title={p.name}
                        >
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="he-field-row">
                    <Field label="From colour">
                      <div className="he-color-row">
                        <input type="color" className="he-color-picker" value={config.gradientFrom ?? '#1a1438'} onChange={e => upd('gradientFrom', e.target.value)} />
                        <Input value={config.gradientFrom} onChange={v => upd('gradientFrom', v)} placeholder="#1a1438" />
                      </div>
                    </Field>
                    <Field label="To colour">
                      <div className="he-color-row">
                        <input type="color" className="he-color-picker" value={config.gradientTo ?? '#1e3a5f'} onChange={e => upd('gradientTo', e.target.value)} />
                        <Input value={config.gradientTo} onChange={v => upd('gradientTo', v)} placeholder="#1e3a5f" />
                      </div>
                    </Field>
                  </div>
                </motion.div>
              )}

              {/* Single image */}
              {config.backgroundType === 'image' && (
                <motion.div key="img" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Field label="Image URL" hint="Use a high-res photo (1600px+) for best results">
                    <Input
                      value={config.backgroundImageUrl}
                      onChange={v => upd('backgroundImageUrl', v)}
                      placeholder="https://images.unsplash.com/…?w=1600&q=80"
                    />
                  </Field>
                  {config.backgroundImageUrl && (
                    <div className="he-single-img-preview">
                      <img
                        src={config.backgroundImageUrl}
                        alt="Background preview"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <Field label="Image focus point">
                    <div className="he-radio-row">
                      {['center center','center top','center bottom','left center','right center'].map(pos => (
                        <label key={pos} className={`he-radio-chip${(config.backgroundPosition ?? 'center center') === pos ? ' active' : ''}`}>
                          <input type="radio" checked={(config.backgroundPosition ?? 'center center') === pos} onChange={() => upd('backgroundPosition', pos)} />
                          {pos}
                        </label>
                      ))}
                    </div>
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>

          {/* 3. Slideshow */}
          <Section
            icon={<Layers size={15} />}
            title="Slideshow"
            badge={isSlideshow ? `${slides.length} slides` : 'inactive'}
            defaultOpen={isSlideshow}
          >
            {!isSlideshow && (
              <div className="he-inactive-notice">
                <Info size={14} /> Switch background type to <strong>Slideshow</strong> to enable.
              </div>
            )}

            {isSlideshow && (
              <>
                {/* Transition & speed */}
                <div className="he-field-row">
                  <Field label="Transition effect">
                    <div className="he-segmented">
                      {TRANSITION_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          className={`he-seg-btn${config.slideTransition === opt.value ? ' active' : ''}`}
                          onClick={() => upd('slideTransition', opt.value)}
                          title={opt.desc}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Auto-advance interval" hint="Time per slide">
                    <div className="he-segmented">
                      {INTERVAL_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          className={`he-seg-btn${config.slideIntervalMs === opt.value ? ' active' : ''}`}
                          onClick={() => upd('slideIntervalMs', opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                {/* Slide list */}
                <div className="he-slides-wrap">
                  <AnimatePresence>
                    {slides.map((slide, i) => (
                      <SlideCard
                        key={slide._key ?? i}
                        slide={slide}
                        index={i}
                        total={slides.length}
                        onChange={s => updateSlide(i, s)}
                        onRemove={removeSlide}
                        onMove={moveSlide}
                      />
                    ))}
                  </AnimatePresence>

                  <button className="he-add-slide-btn" onClick={addSlide}>
                    <Plus size={14} /> Add slide
                  </button>

                  {slides.length === 0 && (
                    <div className="he-no-slides">
                      No slides yet. Click <strong>Add slide</strong> to begin.
                    </div>
                  )}
                </div>
              </>
            )}
          </Section>

          {/* 4. Motion & Animations */}
          <Section icon={<Wind size={15} />} title="Motion &amp; Animations" defaultOpen={false}>

            <Field label="Text entry animation" hint="How the hero headline and sub-text animate in on page load">
              <div className="he-anim-cards">
                {TEXT_ANIMATION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`he-anim-card${config.textAnimation === opt.value ? ' active' : ''}`}
                    onClick={() => upd('textAnimation', opt.value)}
                    type="button"
                  >
                    <strong>{opt.label}</strong>
                    <span>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </Field>

            <div className="he-motion-toggles">
              <Toggle
                value={config.kenBurnsEffect ?? true}
                onChange={v => upd('kenBurnsEffect', v)}
                label="Ken Burns effect — subtle zoom on slideshow images"
              />
              <Toggle
                value={config.autoplayPause ?? true}
                onChange={v => upd('autoplayPause', v)}
                label="Pause slideshow when user hovers over hero"
              />
            </div>

            {config.backgroundType !== 'slideshow' && (config.kenBurnsEffect) && (
              <div className="he-dynamic-note">
                <Info size={13} />
                Ken Burns effect applies to <strong>Slideshow</strong> mode only.
                Switch the background type to see it in action.
              </div>
            )}
          </Section>

          {/* 5. Stats bar */}
          <Section icon={<BarChart3 size={15} />} title="Stats Bar" defaultOpen>
            <Toggle
              value={config.statsVisible}
              onChange={v => upd('statsVisible', v)}
              label="Show stats bar on hero"
            />

            {config.statsVisible && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="he-stats-config"
              >
                <Toggle
                  value={config.statsDynamic}
                  onChange={v => upd('statsDynamic', v)}
                  label="Live counts from database (recommended)"
                />

                <div className="he-stats-labels">
                  <Field label="Jobs stat label">
                    <Input value={config.statJobsLabel} onChange={v => upd('statJobsLabel', v)} placeholder="Active Jobs" />
                  </Field>
                  <Field label="Companies stat label">
                    <Input value={config.statCompaniesLabel} onChange={v => upd('statCompaniesLabel', v)} placeholder="Companies" />
                  </Field>
                  <Field label="Seekers stat label">
                    <Input value={config.statSeekersLabel} onChange={v => upd('statSeekersLabel', v)} placeholder="Job Seekers" />
                  </Field>
                </div>

                {config.statsDynamic && (
                  <div className="he-dynamic-note">
                    <CheckCircle size={13} />
                    Stats will reflect real-time counts: active jobs, companies, and registered seekers from the database.
                  </div>
                )}
              </motion.div>
            )}
          </Section>

          {/* 6. Layout & appearance */}
          <Section icon={<Sliders size={15} />} title="Layout &amp; Appearance" defaultOpen={false}>

            <Field label="Content layout">
              <div className="he-type-cards compact">
                {LAYOUT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`he-type-card${config.layout === opt.value ? ' active' : ''}`}
                    onClick={() => upd('layout', opt.value)}
                    type="button"
                  >
                    <strong>{opt.label}</strong>
                    <span>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Text colour scheme">
              <div className="he-segmented">
                {['light', 'dark'].map(v => (
                  <button
                    key={v}
                    className={`he-seg-btn${config.textColor === v ? ' active' : ''}`}
                    onClick={() => upd('textColor', v)}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </Field>

            <Field
              label={`Background overlay opacity — ${Math.round((config.overlayOpacity ?? 0.55) * 100)}%`}
              hint="Higher = more text-readable, lower = more image-visible"
            >
              <input
                type="range"
                className="he-range"
                min={0} max={1} step={0.01}
                value={config.overlayOpacity ?? 0.55}
                onChange={e => upd('overlayOpacity', parseFloat(e.target.value))}
              />
              <div className="he-range-labels">
                <span>Transparent</span>
                <span>Opaque</span>
              </div>
            </Field>

            <Field label="Hero visibility">
              <Toggle
                value={config.isActive}
                onChange={v => upd('isActive', v)}
                label={config.isActive ? 'Hero is visible on homepage' : 'Hero is hidden from homepage'}
              />
            </Field>
          </Section>
        </div>

        {/* ════════ RIGHT — LIVE PREVIEW ════════ */}
        <div className="he-preview-col">
          <div className="he-preview-sticky">
            <div className="he-preview-label">
              <Eye size={13} />
              Live Preview
              <span className="he-preview-mode-tag">{viewMode}</span>
            </div>
            <MiniPreview config={config} viewMode={viewMode} />
            <div className="he-preview-tip">
              <Info size={11} />
              Preview updates instantly. Save to publish to the homepage.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}