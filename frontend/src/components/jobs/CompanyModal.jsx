import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Calendar, Check, DollarSign, MapPin, X } from 'lucide-react';

/**
 * CompanyModal
 * Accessible modal dialog showing full job and company details.
 * @param {{ job: object|null, onClose: function, onApply: function }} props
 */
export default function CompanyModal({ job, onClose, onApply }) {
  const modalRef = useRef(null);
  const navigate = useNavigate();

  // Focus trap & close on Escape
  useEffect(() => {
    if (!job) return;

    const previouslyFocused = document.activeElement;
    modalRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      // Simple focus trap
      if (e.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll(
          'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, [job, onClose]);

  if (!job) return null;

  const handleApply = () => {
    onClose();
    onApply ? onApply(job) : navigate(`/jobs/${job.id}/apply`);
  };

  return (
    <div
      className="cm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cm-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="cm-modal"
        ref={modalRef}
        tabIndex={-1}
        role="document"
      >
        {/* Close */}
        <button
          className="cm-close"
          onClick={onClose}
          aria-label="Close job details"
        >
          <X size={16} style={{display:"inline-block",verticalAlign:"middle"}} />
        </button>

        {/* Company header */}
        <div className="cm-header">
          <div className="cm-logo" aria-hidden="true">
            {job.logo
              ? <img src={job.logo} alt={`${job.company} logo`} />
              : <span>{job.company.charAt(0)}</span>
            }
          </div>
          <div>
            <h2 id="cm-title" className="cm-job-title">{job.title}</h2>
            <p className="cm-company">{job.company}</p>
          </div>
        </div>

        {/* Quick facts */}
        <div className="cm-facts">
          <div className="cm-fact"><span aria-hidden="true"><MapPin size={16} style={{display:"inline-block",verticalAlign:"middle"}} /></span> {job.location}</div>
          <div className="cm-fact"><span aria-hidden="true"><Briefcase size={16} style={{display:"inline-block",verticalAlign:"middle"}} /></span> {job.type}</div>
          {job.salary && <div className="cm-fact"><span aria-hidden="true"><DollarSign size={16} style={{display:"inline-block",verticalAlign:"middle"}} /></span> {job.salary}</div>}
          <div className="cm-fact"><span aria-hidden="true"><Calendar size={16} style={{display:"inline-block",verticalAlign:"middle"}} /></span> Posted {new Date(job.postedAt).toLocaleDateString()}</div>
        </div>

        {/* Tags */}
        <div className="cm-tags" aria-label="Required skills">
          {job.tags?.map((tag) => <span key={tag} className="cm-tag">{tag}</span>)}
        </div>

        {/* Description */}
        <section aria-labelledby="cm-desc-heading">
          <h3 id="cm-desc-heading" className="cm-section-title">About the Role</h3>
          <p className="cm-description">{job.description}</p>
        </section>

        {/* Company info */}
        {job.companyInfo && (
          <section aria-labelledby="cm-company-heading">
            <h3 id="cm-company-heading" className="cm-section-title">About {job.company}</h3>
            <dl className="cm-company-details">
              <div className="cm-dd-row">
                <dt>Industry</dt>
                <dd>{job.companyInfo.industry}</dd>
              </div>
              <div className="cm-dd-row">
                <dt>Company size</dt>
                <dd>{job.companyInfo.size} employees</dd>
              </div>
              {job.companyInfo.website && (
                <div className="cm-dd-row">
                  <dt>Website</dt>
                  <dd>
                    <a
                      href={job.companyInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cm-link"
                    >
                      {job.companyInfo.website}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {/* Actions */}
        <div className="cm-actions">
          <button className="cm-btn cm-btn--outline" onClick={onClose}>
            Close
          </button>
          <button
            className={`cm-btn cm-btn--primary ${job.applied ? 'cm-btn--applied' : ''}`}
            onClick={handleApply}
            disabled={job.applied}
            aria-label={job.applied ? 'Already applied' : `Apply to ${job.title}`}
          >
            {job.applied ? '<Check size={16} style={{display:"inline-block",verticalAlign:"middle"}} /> Already Applied' : 'Apply Now'}
          </button>
        </div>
      </div>
    </div>
  );
}