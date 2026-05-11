import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs } from '../../api/jobs';
import KoraNav from '../../components/KoraNav';          // ← added
import JobCard from '../../components/jobs/JobCard';
import JobFilters from '../../components/jobs/JobFilters';
import Pagination from '../../components/jobs/Pagination';
import CompanyModal from '../../components/jobs/CompanyModal';
import '../../styles/job-list.css';

const PAGE_SIZE = 6;

export default function JobList() {
  const navigate = useNavigate();

  const [jobs,        setJobs]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const [filters, setFilters] = useState({
    search:   '',
    location: '',
    type:     '',
  });

  const [selectedCompany, setSelectedCompany] = useState(null);

  /* ── Fetch ──────────────────────────────────────────────── */
  const fetchJobs = useCallback(
    async (pageNum, activeFilters) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getJobs({
          page:  pageNum,
          limit: PAGE_SIZE,
          ...activeFilters,
        });
        setJobs(res.data || []);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages ?? 1);
      } catch {
        setError('Failed to load jobs. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchJobs(page, filters);
  }, [fetchJobs, page, filters]);

  /* ── Handlers ───────────────────────────────────────────── */
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleRetry = () => fetchJobs(page, filters);

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="jl-page">
      {/* ── Top nav (mirrors KoraHome navbar exactly) ── */}
      <KoraNav />

      {/* ── Green gradient header ───────────────────── */}
      <header className="jl-header">
        <div className="jl-header-inner">
          <button
            className="jl-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ← Back
          </button>
          <h1 className="jl-title">Find Your Next Role</h1>
          <p className="jl-subtitle">
            {loading
              ? 'Loading opportunities…'
              : `${total.toLocaleString()} job${total !== 1 ? 's' : ''} available right now`}
          </p>
        </div>
      </header>

      {/* ── Main content ────────────────────────────── */}
      <main className="jl-container" id="main-content">
        {/* Filters */}
        <JobFilters filters={filters} onChange={handleFilterChange} />

        {/* Status bar */}
        <div className="jl-status-bar" aria-live="polite" aria-atomic="true">
          {loading ? (
            <p className="jl-loading-text">Loading jobs…</p>
          ) : !error && total > 0 ? (
            <p className="jl-result-count">
              Showing{' '}
              <strong>
                {Math.min(jobs.length, total)} of {total}
              </strong>{' '}
              {filters.search ? `jobs for "${filters.search}"` : 'jobs'}
            </p>
          ) : null}
        </div>

        {/* Error */}
        {error && (
          <div className="jl-error" role="alert">
            <span aria-hidden="true">⚠️</span>
            {error}
            <button className="jl-retry-btn" onClick={handleRetry}>
              Retry
            </button>
          </div>
        )}

        {/* Grid */}
        {!error && (
          <div
            className={`jl-grid${loading ? ' jl-grid--loading' : ''}`}
            aria-label="Job listings"
          >
            {loading
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div key={i} className="jl-skeleton" aria-hidden="true" />
                ))
              : jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onCompanyClick={() => setSelectedCompany(job.company)}
                  />
                ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && jobs.length === 0 && (
          <div className="jl-empty" role="status">
            <span className="jl-empty-icon" aria-hidden="true">🔍</span>
            <h2>No jobs match your search</h2>
            <p>Try adjusting your filters or search terms.</p>
            <button
              className="jl-btn jl-btn--primary"
              onClick={() => handleFilterChange({ search: '', location: '', type: '' })}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </main>

      {/* Company modal */}
      {selectedCompany && (
        <CompanyModal
          companyName={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
}
