import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible centered modal — shared across dashboards.
 */
export default function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  danger = false,
  width = 'min(440px, 92vw)',
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="kora-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()} role="presentation">
      <div
        className="kora-modal"
        style={{ width, maxHeight: '90vh', overflow: 'auto' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kora-modal-title"
      >
        <div className="kora-modal-header">
          <h2 id="kora-modal-title">{title}</h2>
          <button type="button" className="kora-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="kora-modal-body">{children}</div>
        {footer && <div className="kora-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
