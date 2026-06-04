/**
 * InterviewsPage.jsx — Employee interview tracker
 * Full redesign: upcoming/past split, join meeting, cancel, countdown timer
 */
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck, Video, Phone, MapPin, Clock,
  CheckCircle2, XCircle, AlertCircle, RefreshCw,
  ExternalLink, Navigation, CalendarX, Inbox,
  ChevronRight, Bell, Copy, Check,
} from 'lucide-react';
import EmployeeLayout from '../../../layouts/EmployeeLayout';
import useEmployeeDashboard from '../../../hooks/useEmployeeDashboard';
import { useAuth } from '../../../context/AuthContext';
import { getInterviewsBySeeker, cancelInterview } from '../../../api/interviews';
import '../../../styles/employee-dashboard.css';
import '../../../styles/interviews.css';

/* ─── Helpers ────────────────────────────────────────────── */
const fmtDate = d => !d ? '—' : new Date(d).toLocaleDateString('fr-CM', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
const fmtTime = d => !d ? '' : new Date(d).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

function countdown(scheduledAt) {
  const diff = new Date(scheduledAt) - new Date();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 48) return `In ${Math.floor(h/24)} days`;
  if (h >= 1)  return `In ${h}h ${m}m`;
  return `In ${m} minutes`;
}

/* ─── Type display config ────────────────────────────────── */
function typeConfig(type) {
  switch (type) {
    case 'VIDEO':     return { icon:<Video size={15}/>,  label:'Video Call', color:'#1d4ed8', bg:'#eff6ff' };
    case 'PHONE':     return { icon:<Phone size={15}/>,  label:'Phone Call', color:'#065f46', bg:'#ecfdf5' };
    case 'IN_PERSON': return { icon:<MapPin size={15}/>, label:'On-site',    color:'#92400e', bg:'#fffbeb' };
    default:          return { icon:<Video size={15}/>,  label:'Interview',  color:'#374151', bg:'#f3f4f6' };
  }
}

function statusConfig(iv) {
  const isPast = iv.scheduledAt && new Date(iv.scheduledAt) < new Date();
  if (iv.result === 'PASSED')  return { bg:'#ecfdf5', color:'#065f46', label:'Passed ✓',   ring:'#86efac' };
  if (iv.result === 'FAILED')  return { bg:'#fef2f2', color:'#991b1b', label:'Not Passed', ring:'#fca5a5' };
  if (iv.result === 'NO_SHOW') return { bg:'#fff7ed', color:'#c2410c', label:'No Show',    ring:'#fed7aa' };
  if (!isPast)                 return { bg:'#eff6ff', color:'#1e40af', label:'Upcoming',   ring:'#bfdbfe' };
  return                              { bg:'#f9fafb', color:'#374151', label:'Completed',  ring:'#e5e7eb' };
}

/* ─── Single interview card ──────────────────────────────── */
function InterviewCard({ iv, onCancel }) {
  const [copied, setCopied] = useState(false);
  const tc = typeConfig(iv.type);
  const sc = statusConfig(iv);
  const isPast     = iv.scheduledAt && new Date(iv.scheduledAt) < new Date();
  const isUpcoming = !isPast && !iv.result;
  const cd         = isUpcoming ? countdown(iv.scheduledAt) : null;

  // For IN_PERSON: build Google Maps URL
  const mapsUrl = iv.type === 'IN_PERSON' && iv.meetingLink
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(iv.meetingLink)}`
    : null;

  const copyLink = async () => {
    if (!iv.meetingLink) return;
    await navigator.clipboard.writeText(iv.meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`iv-card${isUpcoming ? ' iv-card--upcoming' : ''}`}
         style={{ borderColor: isUpcoming ? tc.color + '44' : undefined }}>

      {/* Top row */}
      <div className="iv-card-top">
        <div className="iv-card-type-badge" style={{ background: tc.bg, color: tc.color }}>
          {tc.icon} {tc.label}
        </div>
        <div className="iv-status-badge" style={{ background: sc.bg, color: sc.color, border:`1px solid ${sc.ring}` }}>
          {sc.label}
        </div>
      </div>

      {/* Job title */}
      <div className="iv-card-job">
        <h3>
          {iv.jobTitle || (iv.jobPostingId ? `Job #${iv.jobPostingId}` : 'Interview Session')}
        </h3>
        {iv.companyName && <p className="iv-card-company">{iv.companyName}</p>}
        {iv.platform    && <p className="iv-card-platform">{iv.platform}</p>}
      </div>

      {/* Date/time */}
      {iv.scheduledAt && (
        <div className="iv-card-datetime">
          <div className="iv-datetime-item">
            <CalendarCheck size={12}/>
            <span>{fmtDate(iv.scheduledAt)}</span>
          </div>
          <div className="iv-datetime-item">
            <Clock size={12}/>
            <span>{fmtTime(iv.scheduledAt)}</span>
          </div>
          {cd && (
            <div className="iv-countdown">
              <Bell size={11}/> {cd}
            </div>
          )}
        </div>
      )}

      {/* Type-specific action area */}
      {iv.type === 'VIDEO' && iv.meetingLink && (
        <div className="iv-action-section">
          <a
            href={iv.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="iv-join-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
              <rect width="24" height="24" rx="4" fill="#1a73e8"/>
              <path d="M5 8h8a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V9a1 1 0 011-1z" fill="white"/>
              <path d="M14 10.5l4-2.5v8l-4-2.5v-3z" fill="white"/>
            </svg>
            Join Google Meet
            <ExternalLink size={11}/>
          </a>
          <button className={`iv-copy-btn${copied?' copied':''}`} onClick={copyLink} title="Copy link">
            {copied ? <Check size={12}/> : <Copy size={12}/>}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      )}

      {iv.type === 'PHONE' && (
        <div className="iv-info-card iv-info-card--phone">
          <Phone size={14} style={{color:'#065f46', flexShrink:0}}/>
          <div>
            <p className="iv-info-label">Phone Interview</p>
            <p className="iv-info-sub">
              {iv.meetingLink || 'The employer will call you at your registered number.'}
            </p>
          </div>
        </div>
      )}

      {iv.type === 'IN_PERSON' && iv.meetingLink && (
        <div className="iv-info-card iv-info-card--location">
          <MapPin size={14} style={{color:'#92400e', flexShrink:0}}/>
          <div style={{flex:1}}>
            <p className="iv-info-label">Interview Location</p>
            <p className="iv-info-address">{iv.meetingLink}</p>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="iv-maps-link">
                <Navigation size={10}/> Get directions
              </a>
            )}
          </div>
        </div>
      )}

      {/* Feedback / notes */}
      {iv.feedback && (
        <div className="iv-feedback">
          <p className="iv-info-label">Interviewer Feedback</p>
          <p className="iv-feedback-text">"{iv.feedback}"</p>
        </div>
      )}

      {/* Cancel button (upcoming only) */}
      {isUpcoming && onCancel && (
        <button className="iv-cancel-btn" onClick={() => onCancel(iv.id)}>
          <CalendarX size={12}/> Cancel Interview
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function InterviewsPage() {
  const { user } = useAuth();
  const { profile, completion, handlePhotoChange } = useEmployeeDashboard();

  const [interviews, setInterviews] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const load = useCallback(() => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    getInterviewsBySeeker(user.id)
      .then(res => setInterviews(Array.isArray(res) ? res : []))
      .catch(() => setError('Could not load your interviews.'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = useCallback(async (id) => {
    if (!window.confirm('Cancel this interview? The employer will be notified.')) return;
    try {
      await cancelInterview(id);
      setInterviews(prev => prev.filter(iv => iv.id !== id));
    } catch {
      alert('Failed to cancel. Please try again.');
    }
  }, []);

  /* Split upcoming vs past */
  const upcoming = interviews.filter(iv => {
    const isPast = iv.scheduledAt && new Date(iv.scheduledAt) < new Date();
    return !isPast && !iv.result;
  });
  const past = interviews.filter(iv => {
    const isPast = iv.scheduledAt && new Date(iv.scheduledAt) < new Date();
    return isPast || iv.result;
  });

  return (
    <EmployeeLayout profile={profile} completion={completion} onPhotoChange={handlePhotoChange}>

      {/* Page header */}
      <div className="ds-page-header">
        <div>
          <h1 className="ds-page-title">My Interviews</h1>
          <p className="ds-page-sub">
            {upcoming.length} upcoming · {past.length} completed
          </p>
        </div>
        <button className="ds-btn ds-btn-ghost" onClick={load}>
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="apps-loading"><div className="apps-spinner"/><span>Loading interviews…</span></div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="apps-error">
          <AlertCircle size={18}/><p>{error}</p>
          <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={load}>
            <RefreshCw size={12}/> Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && interviews.length === 0 && (
        <div className="apps-empty">
          <div className="apps-empty-icon"><CalendarCheck size={36}/></div>
          <h3>No interviews scheduled yet</h3>
          <p>When an employer invites you to an interview, it will appear here.</p>
          <Link to="/employee/applications" className="ds-btn ds-btn-primary" style={{marginTop:4}}>
            View Applications <ChevronRight size={13}/>
          </Link>
        </div>
      )}

      {/* Upcoming */}
      {!loading && !error && upcoming.length > 0 && (
        <section className="iv-section">
          <div className="iv-section-head">
            <Bell size={14} className="iv-section-icon"/>
            <h2>Upcoming Interviews</h2>
            <span className="iv-section-count">{upcoming.length}</span>
          </div>
          <div className="iv-grid">
            {upcoming.map(iv => (
              <InterviewCard key={iv.id} iv={iv} onCancel={handleCancel}/>
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {!loading && !error && past.length > 0 && (
        <section className="iv-section">
          <div className="iv-section-head">
            <Clock size={14} className="iv-section-icon iv-section-icon--muted"/>
            <h2 className="iv-section-head-muted">Past Interviews</h2>
            <span className="iv-section-count">{past.length}</span>
          </div>
          <div className="iv-grid">
            {past.map(iv => (
              <InterviewCard key={iv.id} iv={iv} onCancel={null}/>
            ))}
          </div>
        </section>
      )}
    </EmployeeLayout>
  );
}