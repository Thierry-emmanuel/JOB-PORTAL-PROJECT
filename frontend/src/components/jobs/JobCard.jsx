import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveJob } from '../../api/jobs';

/**
 * JobCard
 * @param {{ job: object, onSaveToggle: function, onApply: function, onViewDetails: function }} props
 */
export default function JobCard({ job, onSaveToggle, onApply, onViewDetails }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(job.saved || false);
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const handleSave = async (e) => {
    e.stopPropagation();
    if (savePending) return;

    // Optimistic update
    const previousSaved = saved;
    setSaved(!saved);
    setSavePending(true);
    setSaveError(false);

    try {
      await saveJob(job.id);
      onSaveToggle?.(job.id, !previousSaved);
    } catch (err) {
      // Rollback on failure
      setSaved(previousSaved);
      setSaveError(true);
      console.error('Failed to save job:', err);
    } finally {
      setSavePending(false);
    }
  };

  const handleApply = (e) => {
    e.stopPropagation();
    if (job.applied) return;
    onApply ? onApply(job) : navigate(`/jobs/${job.id}/apply`);
  };

  const handleViewDetails = () => {
    onViewDetails ? onViewDetails(job) : navigate(`/jobs/${job.id}`);
  };

  const daysAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  return (
    <article
      className="jc-card"
      onClick={handleViewDetails}
      role="button"
      tabIndex={0}
      aria-label={`${job.title} at ${job.company}. Click to view details.`}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleViewDetails()}
    >
      {/* Header */}
      <div className="jc-header">
        <div className="jc-company-logo" aria-hidden="true">
          {job.logo
            ? <img src={job.logo} alt={`${job.company} logo`} />
            : <span>{job.company.charAt(0)}</span>
          }
        </div>
        <div className="jc-meta">
          <h3 className="jc-title">{job.title}</h3>
          <p className="jc-company">{job.company}</p>
        </div>
        <button
          className={`jc-save-btn ${saved ? 'jc-save-btn--saved' : ''}`}
          onClick={handleSave}
          aria-label={saved ? `Unsave ${job.title}` : `Save ${job.title}`}
          aria-pressed={saved}
          disabled={savePending}
        >
          {savePending ? '…' : saved ? '🔖' : '🏷️'}
        </button>
      </div>

      {/* Details */}
      <div className="jc-details">
        <span className="jc-detail-item" aria-label={`Location: ${job.location}`}>
          <span aria-hidden="true">📍</span> {job.location}
        </span>
        <span className="jc-detail-item" aria-label={`Job type: ${job.type}`}>
          <span aria-hidden="true">💼</span> {job.type}
        </span>
        {job.salary && (
          <span className="jc-detail-item" aria-label={`Salary: ${job.salary}`}>
            <span aria-hidden="true">💰</span> {job.salary}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="jc-description">{job.description}</p>

      {/* Tags */}
      <div className="jc-tags" aria-label="Skills required">
        {job.tags?.map((tag) => (
          <span key={tag} className="jc-tag">{tag}</span>
        ))}
      </div>

      {/* Footer */}
      <div className="jc-footer">
        <span className="jc-posted" aria-label={`Posted ${daysAgo(job.postedAt)}`}>
          {daysAgo(job.postedAt)}
        </span>
        <div className="jc-actions">
          <button
            className="jc-btn jc-btn--outline"
            onClick={(e) => { e.stopPropagation(); handleViewDetails(); }}
            aria-label={`View details for ${job.title}`}
          >
            Details
          </button>
          <button
            className={`jc-btn jc-btn--primary ${job.applied ? 'jc-btn--applied' : ''}`}
            onClick={handleApply}
            disabled={job.applied}
            aria-label={job.applied ? `Already applied to ${job.title}` : `Apply to ${job.title}`}
          >
            {job.applied ? '✓ Applied' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Save error */}
      {saveError && (
        <p className="jc-save-error" role="alert">Could not save job. Try again.</p>
      )}
    </article>
  );
}