/**
 * Modal.jsx — Shared Modal Component
 * ─────────────────────────────────────────────────────────────────────
 * Accessible, portal-ready centered modal used across all dashboards.
 *
 * Issues fixed
 * ────────────
 * 1. Z-index: overlay is now z-index 9000 (above sidebars at 50,
 *    sticky headers at 25-30, toasts at 9999 — correct stacking order).
 * 2. Backdrop: blur + dim correctly applied; click-outside closes modal.
 * 3. Mobile: max-height accounts for safe-area-inset; uses dvh where
 *    supported so the address bar doesn't crop it.
 * 4. Scroll-lock: body overflow hidden when open, restored on close.
 * 5. Animation: scale-in on open, no jank on close.
 * 6. Size variants: 'sm' | 'md' (default) | 'lg' | 'xl' | 'full'.
 *
 * Regression prevention
 * ─────────────────────
 * • API is a strict superset of the previous version — callers that
 *   only pass (open, title, children, onClose) continue to work.
 * • className on kora-modal-overlay and kora-modal remain the same so
 *   existing CSS overrides in profile.css are still respected.
 * ─────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/* ── Size map ────────────────────────────────────────────────────── */
const SIZE = {
  sm:   'min(380px, 94vw)',
  md:   'min(480px, 94vw)',
  lg:   'min(640px, 94vw)',
  xl:   'min(800px, 94vw)',
  full: 'min(1100px, 96vw)',
};

/* ── Inline-style overrides (avoid shipping a new CSS file just for
       z-index fixes; merges cleanly with existing profile.css rules) ── */
const overlayStyle = {
  position:       'fixed',
  inset:          0,
  background:     'rgba(11,43,38,0.52)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  zIndex:         9000,          /* above all dashboard chrome           */
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  padding:        'max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))',
  animation:      'kora-fade-in 0.18s ease',
  overflowY:      'auto',        /* fallback for very tall modals        */
};

const dialogStyle = (width) => ({
  background:    '#fff',
  borderRadius:  '16px',
  boxShadow:     '0 24px 64px rgba(0,0,0,0.22)',
  width,
  maxHeight:     'min(90dvh, 90vh)',  /* dvh collapses mobile browser bars */
  display:       'flex',
  flexDirection: 'column',
  animation:     'kora-modal-in 0.22s cubic-bezier(.4,0,.2,1)',
  overflow:      'hidden',
  position:      'relative',
  flexShrink:    0,
});

/* ═════════════════════════════════════════════════════════════════════
   Modal
   ═════════════════════════════════════════════════════════════════════ */
export default function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  danger    = false,
  size      = 'md',           /* 'sm' | 'md' | 'lg' | 'xl' | 'full'   */
  width,                       /* explicit override (legacy prop)        */
  noPadBody = false,           /* strip default body padding when needed */
}) {
  /* Scroll-lock */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  /* Keyboard close */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /* Focus trap — move focus into dialog on open */
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const firstFocusable = dialogRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();
  }, [open]);

  if (!open) return null;

  /* Resolve width: explicit > size lookup > fallback */
  const resolvedWidth = width || SIZE[size] || SIZE.md;

  /* Close on backdrop click (only when the click target IS the overlay) */
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      className="kora-modal-overlay"
      style={overlayStyle}
      onClick={handleOverlayClick}
      role="presentation"
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        className="kora-modal"
        style={dialogStyle(resolvedWidth)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kora-modal-title"
        onClick={(e) => e.stopPropagation()} /* prevent bubbling to overlay */
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div
          className="kora-modal-header"
          style={{
            background: danger ? '#DC2626' : 'var(--kora-primary, #1A5C2E)',
          }}
        >
          <h2 id="kora-modal-title">{title}</h2>
          <button
            type="button"
            className="kora-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div
          className="kora-modal-body"
          style={noPadBody ? { padding: 0, overflow: 'auto', flex: 1 } : undefined}
        >
          {children}
        </div>

        {/* ── Footer (optional) ──────────────────────────────────── */}
        {footer && (
          <div className="kora-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}