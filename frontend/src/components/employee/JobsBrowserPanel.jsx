/**
 * JobsBrowserPanel.jsx
 * ─────────────────────────────────────────────────────────────
 * Inline job browser that lives INSIDE the employee dashboard.
 * No route change — fetched from DB, filtered client-side,
 * paginated. Slides in when user clicks "Browse Jobs".
 * ─────────────────────────────────────────────────────────────
 */
import { memo, useId } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Search, MapPin, SlidersHorizontal, X, Briefcase,
  ChevronLeft, ChevronRight, ArrowRight, RefreshCw,
  AlertCircle, Clock, Building2, Tag,
} from 'lucide-react';
import '../styles/jobs-browser-panel.css';

/* ─── Job type options ──────────────────────────────────── */
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];

/* ─── Single job card ───────────────────────────────────── */
const JobCard = memo(function JobCard({ job }) {
  const initials = job.company?.slice(0, 2).toUpperCase() || '??';
  const posted   = job.postedAt
    ? new Date(job.postedAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })
    : null;

  return (
    <article className="jbp-card">
      {/* Logo */}
      <div className="jbp-card-logo" aria-hidden="true">
        {job.logo
          ? <img src={job.logo} alt={`${job.company} logo`} loading="lazy" />
          : <span>{initials}</span>}
      </div>

      {/* Header */}
      <div className="jbp-card-header">
        <h3 className="jbp-card-title">{job.title}</h3>
        {job.type && <span className="jbp-card-type">{job.type}</span>}
      </div>

      {/* Company & meta */}
      <p className="jbp-card-company">
        <Building2 size={12} aria-hidden="true" /> {job.company}
      </p>
      <div className="jbp-card-meta">
        {job.location && (
          <span><MapPin size={11} aria-hidden="true" /> {job.location}</span>
        )}
        {job.salary && (
          <span><span aria-hidden="true">💰</span> {job.salary}</span>
        )}
        {posted && (
          <span><Clock size={11} aria-hidden="true" /> {posted}</span>
        )}
      </div>

      {/* Tags */}
      {job.tags?.length > 0 && (
        <div className="jbp-card-tags">
          {job.tags.slice(0, 3).map(t => (
            <span key={t} className="jbp-tag">
              <Tag size={9} aria-hidden="true" /> {t}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <Link
        to={`/jobs/${job.id}`}
        className="jbp-card-cta"
        aria-label={`View ${job.title} at ${job.company}`}
      >
        View & Apply <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </article>
  );
});
JobCard.propTypes = { job: PropTypes.object.isRequired };

/* ─── Skeleton ──────────────────────────────────────────── */
const JobCardSkeleton = memo(function JobCardSkeleton() {
  return (
    <div className="jbp-card jbp-card--skeleton" aria-hidden="true">
      <div className="jbp-sk jbp-sk-logo" />
      <div className="jbp-sk jbp-sk-title" />
      <div className="jbp-sk jbp-sk-company" />
      <div className="jbp-sk jbp-sk-meta" />
      <div className="jbp-sk jbp-sk-tags" />
      <div className="jbp-sk jbp-sk-btn" />
    </div>
  );
});

/* ─── Pagination ────────────────────────────────────────── */
const Pagination = memo(function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  // Show max 5 page buttons around current
  const visible = pages.filter(p =>
    p === 1 || p === total || Math.abs(p - current) <= 2
  );

  return (
    <nav className="jbp-pagination" aria-label="Job listing pages">
      <button
        className="jbp-page-btn"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={15} />
      </button>

      {visible.map((p, i) => {
        const prev = visible[i - 1];
        return (
          <span key={p} className="jbp-page-group">
            {prev && p - prev > 1 && (
              <span className="jbp-page-ellipsis">…</span>
            )}
            <button
              className={`jbp-page-btn ${p === current ? 'jbp-page-btn--active' : ''}`}
              onClick={() => onChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === current ? 'page' : undefined}
            >
              {p}
            </button>
          </span>
        );
      })}

      <button
        className="jbp-page-btn"
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        aria-label="Next page"
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  );
});
Pagination.propTypes = {
  current:  PropTypes.number.isRequired,
  total:    PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

/* ════════════════════════════════════════════════════════════
   JobsBrowserPanel — main export
   ════════════════════════════════════════════════════════════ */
export default function JobsBrowserPanel({
  onBack,
  allJobsLoading,
  allJobsError,
  retryAllJobs,
  paginatedJobs,
  filteredJobs,
  totalJobPages,
  jobSearch,
  setJobSearch,
  jobFilters,
  setJobFilters,
  jobPage,
  setJobPage,
}) {
  const searchId   = useId();
  const typeId     = useId();
  const locationId = useId();

  const handleTypeChange = (type) =>
    setJobFilters(prev => ({ ...prev, type: prev.type === type ? '' : type }));

  const clearSearch = () => {
    setJobSearch('');
    setJobFilters({ type: '', location: '' });
  };

  const hasFilters = jobSearch || jobFilters.type || jobFilters.location;

  return (
    <div className="jbp-root">

      {/* ── Top bar ────────────────────────────────────────── */}
      <div className="jbp-topbar">
        <button
          className="jbp-back-btn"
          onClick={onBack}
          aria-label="Back to dashboard"
        >
          <ChevronLeft size={17} /> Dashboard
        </button>
        <div className="jbp-topbar-right">
          <span className="jbp-results-count" aria-live="polite">
            {allJobsLoading
              ? 'Loading…'
              : `${filteredJobs.length} job${filteredJobs.length !== 1 ? 's' : ''} found`}
          </span>
        </div>
      </div>

      {/* ── Search + filters ──────────────────────────────── */}
      <div className="jbp-filters">
        {/* Search input */}
        <div className="jbp-search-wrap">
          <Search size={16} className="jbp-search-icon" aria-hidden="true" />
          <input
            id={searchId}
            type="search"
            className="jbp-search-input"
            placeholder="Search by title, company, skill…"
            value={jobSearch}
            onChange={e => setJobSearch(e.target.value)}
            aria-label="Search jobs"
          />
          {jobSearch && (
            <button
              className="jbp-search-clear"
              onClick={() => setJobSearch('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Location filter */}
        <div className="jbp-filter-group">
          <label htmlFor={locationId} className="sr-only">Filter by location</label>
          <MapPin size={14} className="jbp-filter-icon" aria-hidden="true" />
          <input
            id={locationId}
            type="text"
            className="jbp-filter-input"
            placeholder="Location…"
            value={jobFilters.location}
            onChange={e => setJobFilters(prev => ({ ...prev, location: e.target.value }))}
          />
        </div>

        {/* Clear all */}
        {hasFilters && (
          <button className="jbp-clear-all" onClick={clearSearch}>
            <X size={13} /> Clear all
          </button>
        )}
      </div>

      {/* ── Job type chips ─────────────────────────────────── */}
      <div className="jbp-type-chips" role="group" aria-label="Filter by job type">
        <SlidersHorizontal size={13} className="jbp-chips-icon" aria-hidden="true" />
        {JOB_TYPES.map(type => (
          <button
            key={type}
            className={`jbp-chip ${jobFilters.type === type ? 'jbp-chip--active' : ''}`}
            onClick={() => handleTypeChange(type)}
            aria-pressed={jobFilters.type === type}
          >
            {type}
          </button>
        ))}
      </div>

      {/* ── Content area ──────────────────────────────────── */}
      {allJobsLoading && (
        <div className="jbp-grid" aria-busy="true" aria-label="Loading jobs">
          {Array.from({ length: 9 }, (_, i) => <JobCardSkeleton key={i} />)}
        </div>
      )}

      {allJobsError && !allJobsLoading && (
        <div className="jbp-error" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <span>{allJobsError}</span>
          <button className="jbp-retry-btn" onClick={retryAllJobs}>
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {!allJobsLoading && !allJobsError && filteredJobs.length === 0 && (
        <div className="jbp-empty" role="status">
          <div className="jbp-empty-icon" aria-hidden="true">
            <Briefcase size={30} strokeWidth={1.5} />
          </div>
          <p className="jbp-empty-title">No jobs match your search</p>
          <p className="jbp-empty-sub">Try different keywords or clear your filters.</p>
          <button className="jbp-empty-cta" onClick={clearSearch}>
            Clear filters
          </button>
        </div>
      )}

      {!allJobsLoading && !allJobsError && paginatedJobs.length > 0 && (
        <>
          <div className="jbp-grid">
            {paginatedJobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
          <Pagination
            current={jobPage}
            total={totalJobPages}
            onChange={setJobPage}
          />
        </>
      )}
    </div>
  );
}

JobsBrowserPanel.propTypes = {
  onBack:          PropTypes.func.isRequired,
  allJobsLoading:  PropTypes.bool.isRequired,
  allJobsError:    PropTypes.string,
  retryAllJobs:    PropTypes.func.isRequired,
  paginatedJobs:   PropTypes.array.isRequired,
  filteredJobs:    PropTypes.array.isRequired,
  totalJobPages:   PropTypes.number.isRequired,
  jobSearch:       PropTypes.string.isRequired,
  setJobSearch:    PropTypes.func.isRequired,
  jobFilters:      PropTypes.object.isRequired,
  setJobFilters:   PropTypes.func.isRequired,
  jobPage:         PropTypes.number.isRequired,
  setJobPage:      PropTypes.func.isRequired,
};
