import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Briefcase, DollarSign, Clock, Bookmark, BookmarkCheck,
  ArrowRight, Star, Zap,
} from 'lucide-react';
import { saveJob } from '../../api/jobs';

/**
 * JobCard — unified, variant-aware professional job card
 *
 * Props:
 *  job           {object}   — job data
 *  variant       {"full"|"compact"}  — "full" for the public /jobs page,
 *                             "compact" for dashboard "Jobs For You"
 *  onSaveToggle  {fn}       — optional callback after save/unsave
 *  onApply       {fn}       — optional override for apply action
 *  onViewDetails {fn}       — optional override for view-details action
 *  onCompanyClick {fn}      — optional company name click handler
 */
export default function JobCard({
  job,
  variant = 'full',
  onSaveToggle,
  onApply,
  onViewDetails,
  onCompanyClick,
}) {
  const navigate = useNavigate();
  const [saved, setSaved]           = useState(job.saved || false);
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError]   = useState(false);

  /* ── Helpers ─────────────────────────────────────────── */
  const daysAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    return `${days}d ago`;
  };

  const typeColor = (type) => {
    if (!type) return { bg: '#F3F4F6', text: '#6B7280' };
    const t = type.toLowerCase();
    if (t.includes('remote'))    return { bg: '#EFF6FF', text: '#1D4ED8' };
    if (t.includes('full'))      return { bg: '#ECFDF5', text: '#065F46' };
    if (t.includes('part'))      return { bg: '#FFF7ED', text: '#C2410C' };
    if (t.includes('contract'))  return { bg: '#FAF5FF', text: '#6B21A8' };
    if (t.includes('intern'))    return { bg: '#FEF3C7', text: '#92400E' };
    return { bg: '#F3F4F6', text: '#374151' };
  };

  /* ── Handlers ────────────────────────────────────────── */
  const handleSave = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (savePending) return;
    const prev = saved;
    setSaved(!saved);
    setSavePending(true);
    setSaveError(false);
    try {
      await saveJob(job.id);
      onSaveToggle?.(job.id, !prev);
    } catch {
      setSaved(prev);
      setSaveError(true);
    } finally {
      setSavePending(false);
    }
  };

  const handleViewDetails = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    onViewDetails ? onViewDetails(job) : navigate(`/jobs/${job.id}`);
  };

  const handleApply = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (job.applied) return;
    onApply ? onApply(job) : navigate(`/jobs/${job.id}/apply`);
  };

  const tc = typeColor(job.type);

  /* ══════════════════════════════════════════════════════
     COMPACT variant  (dashboard "Jobs For You" grid)
     ══════════════════════════════════════════════════════ */
  if (variant === 'compact') {
    return (
      <Link
        to={`/jobs/${job.id}`}
        className="ujc-compact"
        aria-label={`${job.title} at ${job.company}`}
      >
        {/* Header row */}
        <div className="ujc-compact-header">
          <div className="ujc-logo" aria-hidden="true">
            {job.logo
              ? <img src={job.logo} alt="" loading="lazy" />
              : <span>{job.company?.charAt(0)?.toUpperCase()}</span>}
          </div>
          {job.type && (
            <span className="ujc-type-badge" style={{ background: tc.bg, color: tc.text }}>
              {job.type}
            </span>
          )}
        </div>

        {/* Title + company */}
        <h3 className="ujc-compact-title">{job.title}</h3>
        <p className="ujc-compact-company">{job.company}</p>

        {/* Meta */}
        <div className="ujc-meta-row">
          {job.location && (
            <span className="ujc-meta-item">
              <MapPin size={11} aria-hidden="true" /> {job.location}
            </span>
          )}
          {job.salary && (
            <span className="ujc-meta-item">
              <DollarSign size={11} aria-hidden="true" /> {job.salary}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="ujc-compact-footer">
          <span className="ujc-posted">
            <Clock size={10} aria-hidden="true" /> {daysAgo(job.postedAt)}
          </span>
          <span className="ujc-compact-cta">
            Apply <ArrowRight size={11} aria-hidden="true" />
          </span>
        </div>
      </Link>
    );
  }

  /* ══════════════════════════════════════════════════════
     FULL variant  (public /jobs page)
     ══════════════════════════════════════════════════════ */
  return (
    <article
      className="ujc-card"
      onClick={handleViewDetails}
      role="button"
      tabIndex={0}
      aria-label={`${job.title} at ${job.company}. Click to view details.`}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleViewDetails(e)}
    >
      {/* ── Card header ───────────────────────────────── */}
      <div className="ujc-header">
        <div className="ujc-logo ujc-logo--lg" aria-hidden="true">
          {job.logo
            ? <img src={job.logo} alt={`${job.company} logo`} />
            : <span>{job.company?.charAt(0)?.toUpperCase()}</span>}
        </div>

        <div className="ujc-meta">
          <div className="ujc-title-row">
            {job.type && (
              <span className="ujc-type-badge" style={{ background: tc.bg, color: tc.text }}>
                {job.type}
              </span>
            )}
            {job.featured && (
              <span className="ujc-featured-badge">
                <Star size={9} /> Featured
              </span>
            )}
            {job.urgent && (
              <span className="ujc-urgent-badge">
                <Zap size={9} /> Urgent
              </span>
            )}
          </div>
          <h3 className="ujc-title">{job.title}</h3>
          <p
            className="ujc-company"
            onClick={(e) => {
              if (onCompanyClick) { e.stopPropagation(); onCompanyClick(job.company); }
            }}
            style={onCompanyClick ? { cursor: 'pointer' } : {}}
            aria-label={onCompanyClick ? `View ${job.company}` : undefined}
          >
            {job.company}
          </p>
        </div>

        <button
          className={`ujc-save-btn${saved ? ' ujc-save-btn--saved' : ''}`}
          onClick={handleSave}
          aria-label={saved ? `Unsave ${job.title}` : `Save ${job.title}`}
          aria-pressed={saved}
          disabled={savePending}
        >
          {saved
            ? <BookmarkCheck size={16} aria-hidden="true" />
            : <Bookmark size={16} aria-hidden="true" />}
        </button>
      </div>

      {/* ── Details row ───────────────────────────────── */}
      <div className="ujc-details">
        <span className="ujc-detail-item" aria-label={`Location: ${job.location}`}>
          <MapPin size={13} aria-hidden="true" /> {job.location}
        </span>
        <span className="ujc-detail-item" aria-label={`Job type: ${job.type}`}>
          <Briefcase size={13} aria-hidden="true" /> {job.type}
        </span>
        {job.salary && (
          <span className="ujc-detail-item" aria-label={`Salary: ${job.salary}`}>
            <DollarSign size={13} aria-hidden="true" /> {job.salary}
          </span>
        )}
      </div>

      {/* ── Description ──────────────────────────────── */}
      {job.description && (
        <p className="ujc-description">{job.description}</p>
      )}

      {/* ── Tags ─────────────────────────────────────── */}
      {job.tags?.length > 0 && (
        <div className="ujc-tags" aria-label="Skills required">
          {job.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="ujc-tag">{tag}</span>
          ))}
          {job.tags.length > 4 && (
            <span className="ujc-tag ujc-tag--more">+{job.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* ── Footer ───────────────────────────────────── */}
      <div className="ujc-footer">
        <span className="ujc-posted">
          <Clock size={11} aria-hidden="true" /> {daysAgo(job.postedAt)}
        </span>
        <div className="ujc-actions">
          <button
            className="ujc-btn ujc-btn--outline"
            onClick={(e) => { e.stopPropagation(); handleViewDetails(e); }}
            aria-label={`View details for ${job.title}`}
          >
            Details
          </button>
          <button
            className={`ujc-btn ujc-btn--primary${job.applied ? ' ujc-btn--applied' : ''}`}
            onClick={handleApply}
            disabled={job.applied}
            aria-label={job.applied ? `Already applied to ${job.title}` : `Apply to ${job.title}`}
          >
            {job.applied ? '✓ Applied' : 'Apply Now'}
          </button>
        </div>
      </div>

      {saveError && (
        <p className="ujc-save-error" role="alert">Could not save job. Try again.</p>
      )}
    </article>
  );
}