import React from 'react';
import {
  Calendar, Clock, Video, Phone, MapPin,
  CheckCircle2, XCircle, AlertCircle, ExternalLink, Navigation
} from 'lucide-react';

/**
 * InterviewCard
 *
 * Renders a single interview for both job seekers and employers.
 * Backend InterviewType enum: VIDEO | PHONE | IN_PERSON
 * Backend InterviewResult enum: PASSED | FAILED | NO_SHOW
 *
 * - VIDEO   → shows Google Meet "Join" button with real/generated link
 * - PHONE   → shows phone details card
 * - IN_PERSON → shows physical location card with Google Maps directions link
 */
export default function InterviewCard({ interview, onCancel, onRecordResult, isEmployer = false }) {
  const date = new Date(interview.scheduledAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  const isPast = date < new Date();

  const getStatusStyle = () => {
    if (interview.result === 'PASSED')  return { bg: '#F0FDF4', text: '#166534', border: '#86EFAC', icon: <CheckCircle2 size={13} /> };
    if (interview.result === 'FAILED')  return { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5', icon: <XCircle size={13} /> };
    if (interview.result === 'NO_SHOW') return { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', icon: <AlertCircle size={13} /> };
    if (interview.pending || !isPast)   return { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', icon: <Clock size={13} /> };
    return { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB', icon: <AlertCircle size={13} /> };
  };

  const getTypeDisplay = () => {
    switch (interview.type) {
      case 'VIDEO':     return { icon: <Video size={13} />,  label: 'Video Call',  color: '#1565c0' };
      case 'PHONE':     return { icon: <Phone size={13} />,  label: 'Phone Call',  color: '#2e7d32' };
      case 'IN_PERSON': return { icon: <MapPin size={13} />, label: 'On-site',     color: '#b45309' };
      default:          return { icon: <Video size={13} />,  label: interview.type || 'Interview', color: '#6B7280' };
    }
  };

  const statusStyle = getStatusStyle();
  const typeDisplay = getTypeDisplay();

  const statusLabel = interview.result
    ? interview.result
    : (interview.pending || !isPast) ? 'UPCOMING' : 'COMPLETED';

  // Build Google Maps directions URL from a physical address
  const mapsUrl = interview.type === 'IN_PERSON' && interview.meetingLink
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(interview.meetingLink)}`
    : null;

  return (
    <div className="kora-interview-card">
      {/* ── Header ── */}
      <div className="kora-ic-header">
        <div className="kora-ic-badge" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}>
          {statusStyle.icon}
          <span>{statusLabel}</span>
        </div>
        <div className="kora-ic-type" style={{ color: typeDisplay.color }}>
          {typeDisplay.icon}
          <span>{typeDisplay.label}</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="kora-ic-body">
        <h3 className="kora-ic-job">
          {interview.jobPostingId ? `Job #${interview.jobPostingId}` : 'Interview Session'}
        </h3>
        {interview.platform && (
          <p className="kora-ic-company">{interview.platform}</p>
        )}

        <div className="kora-ic-meta">
          <div className="kora-ic-meta-item">
            <Calendar size={13} />
            <span>{formattedDate}</span>
          </div>
          <div className="kora-ic-meta-item">
            <Clock size={13} />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* ── VIDEO: Google Meet join button ── */}
        {interview.type === 'VIDEO' && interview.meetingLink && (
          <a
            href={interview.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="kora-ic-action-link kora-ic-link-video"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <rect width="24" height="24" rx="4" fill="#1a73e8" />
              <path d="M5 8h8a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V9a1 1 0 011-1z" fill="white"/>
              <path d="M14 10.5l4-2.5v8l-4-2.5v-3z" fill="white"/>
            </svg>
            Join Google Meet
            <ExternalLink size={12} style={{ opacity: 0.7 }} />
          </a>
        )}

        {/* ── PHONE: call details ── */}
        {interview.type === 'PHONE' && (
          <div className="kora-ic-info-card kora-ic-info-phone">
            <Phone size={14} style={{ color: '#2e7d32', flexShrink: 0 }} />
            <div>
              <div className="kora-ic-info-label">Phone Interview</div>
              <div className="kora-ic-info-sub">
                {interview.meetingLink || 'The employer will call you at your registered number.'}
              </div>
            </div>
          </div>
        )}

        {/* ── IN_PERSON: physical location + Google Maps link ── */}
        {interview.type === 'IN_PERSON' && interview.meetingLink && (
          <div className="kora-ic-info-card kora-ic-info-location">
            <MapPin size={14} style={{ color: '#b45309', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="kora-ic-info-label">Interview Location</div>
              <div className="kora-ic-info-address">{interview.meetingLink}</div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kora-ic-maps-link"
                >
                  <Navigation size={11} />
                  Get directions on Google Maps
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="kora-ic-footer">
        {isEmployer && (interview.pending || !isPast) && onRecordResult && (
          <button className="kora-ic-btn primary" onClick={() => onRecordResult(interview)}>
            Record Result
          </button>
        )}
        {!interview.result && !isPast && onCancel && (
          <button className="kora-ic-btn danger" onClick={() => onCancel(interview.id)}>
            Cancel
          </button>
        )}
      </div>

      <style>{`
        .kora-interview-card {
          background: #fff;
          border: 1.5px solid #E5E7EB;
          border-radius: 16px;
          padding: 20px;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .kora-interview-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.09);
          border-color: #d1d5db;
        }
        .kora-ic-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .kora-ic-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .kora-ic-type {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
        }
        .kora-ic-body { display: flex; flex-direction: column; gap: 8px; }
        .kora-ic-job {
          font-size: 15px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .kora-ic-company { font-size: 12px; color: #6B7280; margin: 0; }
        .kora-ic-meta { display: flex; gap: 14px; }
        .kora-ic-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          color: #4B5563;
        }

        /* Action links */
        .kora-ic-action-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .kora-ic-link-video {
          background: #1a73e8;
          color: #fff;
          justify-content: center;
        }
        .kora-ic-link-video:hover { background: #1557b0; }

        /* Info cards for PHONE and IN_PERSON */
        .kora-ic-info-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid;
        }
        .kora-ic-info-phone {
          background: #f0fdf4;
          border-color: #86efac;
        }
        .kora-ic-info-location {
          background: #fffbeb;
          border-color: #fcd34d;
        }
        .kora-ic-info-label {
          font-size: 11px;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 3px;
        }
        .kora-ic-info-sub {
          font-size: 12.5px;
          color: #4B5563;
          line-height: 1.5;
        }
        .kora-ic-info-address {
          font-size: 12.5px;
          color: #78350f;
          font-weight: 500;
          line-height: 1.5;
        }
        .kora-ic-maps-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #1a73e8;
          font-size: 11.5px;
          font-weight: 600;
          text-decoration: none;
          margin-top: 6px;
        }
        .kora-ic-maps-link:hover { text-decoration: underline; }

        .kora-ic-footer {
          display: flex;
          gap: 8px;
          margin-top: auto;
        }
        .kora-ic-btn {
          flex: 1;
          padding: 9px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .kora-ic-btn.primary { background: #F97316; color: white; }
        .kora-ic-btn.primary:hover { background: #EA580C; }
        .kora-ic-btn.danger { background: #FEF2F2; color: #991B1B; border: 1px solid #fca5a5; }
        .kora-ic-btn.danger:hover { background: #FEE2E2; }
      `}</style>
    </div>
  );
}