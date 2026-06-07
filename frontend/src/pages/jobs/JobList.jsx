import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getJobs } from '../../api/jobs';

import JobCard from '../../components/jobs/JobCard';
import JobFilters from '../../components/jobs/JobFilters';
import Pagination from '../../components/jobs/Pagination';
import CompanyModal from '../../components/jobs/CompanyModal';
import '../../styles/job-list.css';

const PAGE_SIZE = 6;

export default function JobList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const getQueryParam = (param) => {
    return new URLSearchParams(location.search).get(param) || '';
  };

  const [jobs,        setJobs]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const [filters, setFilters] = useState({
    search:   getQueryParam('search'),
    location: getQueryParam('location'),
    type:     getQueryParam('type'),
  });

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Sync filters if URL changes (e.g. user navigates here with new query params)
  useEffect(() => {
    const nextSearch = getQueryParam('search');
    const nextLoc = getQueryParam('location');
    const nextType = getQueryParam('type');
    const current = filtersRef.current;
    if (nextSearch !== current.search || nextLoc !== current.location || nextType !== current.type) {
      setFilters({
        search:   nextSearch,
        location: nextLoc,
        type:     nextType,
      });
      setPage(1);
    }
  }, [location.search]);

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
        setError(t('jobs.error_load_jobs'));
      } finally {
        setLoading(false);
      }
    },
    [t]
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
      {/* ── Green gradient header ───────────────────── */}
      <header className="jl-header">
        <div className="jl-header-inner">
          <button
            className="jl-back-btn"
            onClick={() => navigate(-1)}
            aria-label={t('common.go_back')}
          >
            {t('common.back')}
          </button>
          <h1 className="jl-title">{t('jobs.find_next_role')}</h1>
          <p className="jl-subtitle">
            {loading
              ? t('jobs.loading_opportunities')
              : t('jobs.jobs_available', { count: total, total: total.toLocaleString() })}
          </p>
        </div>
      </header>

      {/* ── Main content ────────────────────────────── */}
      <main className="jl-container" id="main-content">
        {/* Filters */}
        <JobFilters 
          filters={filters} 
          onChange={handleFilterChange} 
          onReset={() => handleFilterChange({ search: '', location: '', type: '' })}
        />

        {/* Status bar */}
        <div className="jl-status-bar" aria-live="polite" aria-atomic="true">
          {loading ? (
            <p className="jl-loading-text">{t('jobs.loading_jobs')}</p>
          ) : !error && total > 0 ? (
            <p className="jl-result-count">
              {t('jobs.showing')}{' '}
              <strong>
                {Math.min(jobs.length, total)} {t('common.of')} {total}
              </strong>{' '}
              {filters.search
                ? t('jobs.jobs_for_search', { query: filters.search })
                : t('jobs.jobs')}
            </p>
          ) : null}
        </div>

        {/* Error */}
        {error && (
          <div className="jl-error" role="alert">
            <span aria-hidden="true">⚠️</span>
            {error}
            <button className="jl-retry-btn" onClick={handleRetry}>
              {t('common.retry')}
            </button>
          </div>
        )}

        {/* Grid */}
        {!error && (
          <div
            className={`jl-grid${loading ? ' jl-grid--loading' : ''}`}
            aria-label={t('jobs.job_listings')}
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
            <h2>{t('jobs.no_jobs_match')}</h2>
            <p>{t('jobs.adjust_filters')}</p>
            <button
              className="jl-btn jl-btn--primary"
              onClick={() => handleFilterChange({ search: '', location: '', type: '' })}
            >
              {t('jobs.clear_filters')}
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
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