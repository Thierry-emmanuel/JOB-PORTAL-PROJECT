/**
 * ServerWakeupBanner.jsx
 * ──────────────────────────────────────────────────────────────────────
 * A slim, non-intrusive top banner that appears whenever the API client
 * detects that the Render.com backend is cold-starting.
 *
 * It listens to three custom DOM events dispatched by api/client.js:
 *   • kora:server-waking  — a retry attempt is in progress
 *   • kora:server-alive   — a request finally succeeded (dismiss banner)
 *   • kora:server-down    — all retries exhausted (show "please refresh")
 *
 * Renders above everything else (z-index 2000) with a slide-down animation.
 */
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, X } from 'lucide-react';

export default function ServerWakeupBanner() {
  const [state, setState] = useState('idle');   // 'idle' | 'waking' | 'down'
  const [attempt, setAttempt] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onWaking = (e) => {
      setDismissed(false);
      setState('waking');
      setAttempt(e.detail?.attempt ?? 1);
      setMaxAttempts(e.detail?.maxAttempts ?? 3);
    };

    const onAlive = () => {
      // Brief "connected" flash before hiding
      setState('idle');
      setAttempt(0);
    };

    const onDown = () => {
      setState('down');
    };

    window.addEventListener('kora:server-waking', onWaking);
    window.addEventListener('kora:server-alive',  onAlive);
    window.addEventListener('kora:server-down',   onDown);

    return () => {
      window.removeEventListener('kora:server-waking', onWaking);
      window.removeEventListener('kora:server-alive',  onAlive);
      window.removeEventListener('kora:server-down',   onDown);
    };
  }, []);

  if (state === 'idle' || dismissed) return null;

  const isDown   = state === 'down';
  const dotCount = attempt; // show 1-3 dots based on attempt

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 20px',
        background: isDown
          ? 'linear-gradient(90deg, #991b1b, #b91c1c)'
          : 'linear-gradient(90deg, #1A5C2E, #166534)',
        color: '#fff',
        fontSize: 13,
        fontFamily: 'var(--kora-font, Poppins, sans-serif)',
        fontWeight: 500,
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        animation: 'kora-banner-slide 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <style>{`
        @keyframes kora-banner-slide {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes kora-banner-spin {
          to { transform: rotate(360deg); }
        }
        .kora-banner-spin { animation: kora-banner-spin 1s linear infinite; }
        @media (max-width: 480px) {
          .kora-banner-detail { display: none !important; }
        }
      `}</style>

      {/* Left: icon + message */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        {isDown ? (
          <WifiOff size={16} style={{ flexShrink: 0 }} />
        ) : (
          <RefreshCw size={15} className="kora-banner-spin" style={{ flexShrink: 0 }} />
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isDown ? (
            <>Server unreachable — please check your connection and <strong>refresh</strong>.</>
          ) : (
            <>
              Server is starting up, please wait
              {'.'.repeat(dotCount)}
              <span className="kora-banner-detail" style={{ opacity: 0.75, marginLeft: 8 }}>
                (retry {attempt}/{maxAttempts})
              </span>
            </>
          )}
        </span>
      </div>

      {/* Right: action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {isDown && (
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 6,
              border: '1.5px solid rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff', fontSize: 12.5, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.15s',
              fontFamily: 'inherit',
            }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
            transition: 'color 0.15s',
          }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
