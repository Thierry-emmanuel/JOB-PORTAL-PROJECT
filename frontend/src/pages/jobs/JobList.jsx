import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getJobs } from '../../api/jobs';
import JobCard from '../../components/jobs/JobCard';
import JobFilters from '../../components/jobs/JobFilters';
import Pagination from '../../components/jobs/Pagination';
import CompanyModal from '../../components/jobs/CompanyModal';
import '../../styles/job-list.css';

const DEFAULT_FILTERS = { search: '', location: '', type: '', page: 1, limit: 6 };

/**
 * JobList
 * Searchable, filterable, paginated list of job postings.
 */
export default function JobList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null); // for CompanyModal
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || '',
    type: searchParams.get('type') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 6,
  });

  // ── Fetch jobs ─────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getJobs(params);
      setJobs(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      setError('Failed to load jobs. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(filters);
    // Sync URL params
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.location) params.location = filters.location;
    if (filters.type) params.type = filters.type;
    if (filters.page > 1) params.page = filters.page;
    setSearchParams(params, { replace: true });
  }, [filters, fetchJobs, setSearchParams]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFiltersChange = (newFilters) => setFilters(newFilters);

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handlePageChange = (p) => setFilters((f) => ({ ...f, page: p }));

  const handleSaveToggle = (jobId, newSavedState) => {
    setJobs((prev) =>
      prev.map((j) => j.id === jobId ? { ...j, saved: newSavedState } : j)
    );
  };

  const handleApply = (job) => {
    navigate(`/jobs/${job.id}/apply`);
  };

  const handleViewDetails = (job) => {
    setSelectedJob(job);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="jl-page">
      {/* Header */}
      <header className="jl-header">
        <div className="jl-header-inner">
          <button
            className="jl-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ← Back
          </button>
          <div>
            <h1 className="jl-title">Find Your Next Role</h1>
            <p className="jl-subtitle">
              {total > 0 ? `${total} jobs available` : 'Explore opportunities'}
            </p>
          </div>
        </div>
      </header>

      <div className="jl-container">
        {/* Filters */}
        <JobFilters
          filters={filters}
          onChange={handleFiltersChange}
          onReset={handleReset}
        />

        {/* Status bar */}
        <div className="jl-status-bar" aria-live="polite" aria-atomic="true">
          {!loading && (
            <p className="jl-result-count">
              {total === 0 ? 'No jobs found' : `Showing ${jobs.length} of ${total} jobs`}
              {filters.search && <> for "<strong>{filters.search}</strong>"</>}
            </p>
          )}
          {loading && <p className="jl-loading-text">Loading jobs…</p>}
        </div>

        {/* Error */}
        {error && (
          <div className="jl-error" role="alert">
            {error}
            <button onClick={() => fetchJobs(filters)} className="jl-retry-btn">Retry</button>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && jobs.length === 0 ? (
          <div className="jl-empty">
            <span aria-hidden="true" className="jl-empty-icon">🔍</span>
            <h2>No jobs match your search</h2>
            <p>Try adjusting your filters or search terms.</p>
            <button className="jl-btn jl-btn--primary" onClick={handleReset}>
              Clear Filters
            </button>
          </div>
        ) : (
          <section aria-label="Job listings" aria-busy={loading}>
            <div className={`jl-grid ${loading ? 'jl-grid--loading' : ''}`}>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="jl-skeleton" aria-hidden="true" />
                  ))
                : jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onSaveToggle={handleSaveToggle}
                      onApply={handleApply}
                      onViewDetails={handleViewDetails}
                    />
                  ))
              }
            </div>
          </section>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Pagination
            page={filters.page}
            totalPages={totalPages}
            onChange={handlePageChange}
          />
        )}
      </div>

      {/* Company / Job Details Modal */}
      {selectedJob && (
        <CompanyModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={handleApply}
        />
      )}
    </div>
  );
}