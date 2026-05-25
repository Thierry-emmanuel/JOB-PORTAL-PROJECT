import React from 'react';
import { Calendar, Clock, Video, Phone, MapPin, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

/**
 * InterviewCard
 *
 * Renders a single interview. Accepts InterviewResponse objects as returned
 * by the backend (GET /api/v1/interviews/...).
 *
 * Backend InterviewType enum: VIDEO | PHONE | IN_PERSON
 * Backend InterviewResult enum: PASSED | FAILED | NO_SHOW
 *
 * Fix: type check was comparing against stale 'VIRTUAL'/'IN_PERSON' values.
 *      Now uses the real enum: VIDEO / PHONE / IN_PERSON.
 *      Removed references to interview.jobTitle and interview.companyName
 *      which do not exist in InterviewResponse — the card now shows the
 *      job posting ID link and platform/meeting details that ARE present.
 */
export default function InterviewCard({ interview, onCancel, onRecordResult, isEmployer = false }) {
  const date = new Date(interview.scheduledAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  const getStatusStyle = () => {
    if (interview.result === 'PASSED') return { bg: '#F0FDF4', text: '#166534', icon: <CheckCircle2 size={14} /> };
    if (interview.result === 'FAILED') return { bg: '#FEF2F2', text: '#991B1B', icon: <XCircle size={14} /> };
    if (interview.result === 'NO_SHOW') return { bg: '#FFF7ED', text: '#C2410C', icon: <AlertCircle size={14} /> };
    if (interview.pending) return { bg: '#EFF6FF', text: '#1E40AF', icon: <Clock size={14} /> };
    return { bg: '#F9FAFB', text: '#374151', icon: <AlertCircle size={14} /> };
  };

  // Map InterviewType enum → icon + label
  const getTypeDisplay = () => {
    switch (interview.type) {
      case 'VIDEO':     return { icon: <Video size={14} />,  label: 'Video Call' };
      case 'PHONE':     return { icon: <Phone size={14} />,  label: 'Phone Call' };
      case 'IN_PERSON': return { icon: <MapPin size={14} />, label: 'On-site'   };
      default:          return { icon: <Video size={14} />,  label: interview.type || 'Interview' };
    }
  };

  const statusStyle = getStatusStyle();
  const typeDisplay = getTypeDisplay();

  const statusLabel = interview.result
    ? interview.result
    : interview.pending
    ? 'UPCOMING'
    : 'COMPLETED';

  return (
    <div className="kora-interview-card">
      <div className="kora-ic-header">
        <div className="kora-ic-badge" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}>
          {statusStyle.icon}
          <span>{statusLabel}</span>
        </div>
        <div className="kora-ic-type">
          {typeDisplay.icon}
          <span>{typeDisplay.label}</span>
        </div>
      </div>

      <div className="kora-ic-body">
        <h3 className="kora-ic-job">
          {interview.jobPostingId ? `Job #${interview.jobPostingId}` : 'Interview Session'}
        </h3>
        {interview.platform && (
          <p className="kora-ic-company">{interview.platform}</p>
        )}

        <div className="kora-ic-meta">
          <div className="kora-ic-meta-item">
            <Calendar size={14} />
            <span>{formattedDate}</span>
          </div>
          <div className="kora-ic-meta-item">
            <Clock size={14} />
            <span>{formattedTime}</span>
          </div>
        </div>

        {interview.meetingLink && (
          <a
            href={interview.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="kora-ic-link"
          >
            <Video size={14} />
            Join via {interview.platform || 'Meeting Link'}
          </a>
        )}
      </div>

      <div className="kora-ic-footer">
        {isEmployer && interview.pending && onRecordResult && (
          <button className="kora-ic-btn primary" onClick={() => onRecordResult(interview)}>
            Record Result
          </button>
        )}
        {!interview.completed && onCancel && (
          <button className="kora-ic-btn danger" onClick={() => onCancel(interview.id)}>
            Cancel
          </button>
        )}
      </div>

      <style>{`
        .kora-interview-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(229, 231, 235, 0.5);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .kora-interview-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border-color: rgba(26, 92, 46, 0.2);
        }
        .kora-ic-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .kora-ic-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .kora-ic-type {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #6B7280;
          font-size: 11px;
          font-weight: 500;
        }
        .kora-ic-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .kora-ic-job {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .kora-ic-company {
          font-size: 13px;
          color: #6B7280;
          margin: 0 0 8px 0;
        }
        .kora-ic-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }
        .kora-ic-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #4B5563;
        }
        .kora-ic-link {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #1A5C2E;
          color: white;
          padding: 10px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          justify-content: center;
          transition: background 0.2s;
        }
        .kora-ic-link:hover { background: #0D3D1F; }
        .kora-ic-footer {
          display: flex;
          gap: 8px;
          margin-top: auto;
        }
        .kora-ic-btn {
          flex: 1;
          padding: 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .kora-ic-btn.primary { background: #F97316; color: white; }
        .kora-ic-btn.primary:hover { background: #EA580C; }
        .kora-ic-btn.danger { background: #FEF2F2; color: #991B1B; }
        .kora-ic-btn.danger:hover { background: #FEE2E2; }
      `}</style>
    </div>
  );
}