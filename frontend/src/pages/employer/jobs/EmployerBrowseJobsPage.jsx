import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import EmployerSidebar from '../../../components/employer/EmployerSidebar';
import { useEmployerDashboard } from '../../../hooks/useEmployerDashboard';
import { getJobs, getCategories } from '../../../api/jobs';
import JobCard from '../../../components/jobs/JobCard';
import DashboardPagination from '../../../components/shared/DashboardPagination';
import '../../../styles/dashboard-shell.css';

const PAGE_SIZE = 9;
const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'];
const EXP_LEVELS = ['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD'];

export default function EmployerBrowseJobsPage() {
  const { employer, stats, loading } = useEmployerDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [expLevel, setExpLevel] = useState('');
  const [salaryMin, setSalaryMin] = useState('');

  useEffect(() => {
    getCategories()
      .then((data) => { if (Array.isArray(data)) setCategories(data.slice(0, 20)); })
      .catch(() => {});
  }, []);

  const fetchJobs = useCallback((p = 1, opts = {}) => {
    setListLoading(true);
    const params = {
      page: p,
      size: PAGE_SIZE,
      search: (opts.search ?? search) || undefined,
      location: (opts.location ?? location) || undefined,
      type: (opts.type ?? type) || undefined,
      category: (opts.category ?? category) || undefined,
      experienceLevel: (opts.experienceLevel ?? expLevel) || undefined,
      salaryMin: (opts.salaryMin ?? salaryMin) || undefined,
    };
    getJobs(params)
      .then((res) => {
        setJobs(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        setPage(p);
      })
      .catch(() => { setJobs([]); setTotal(0); })
      .finally(() => setListLoading(false));
  }, [search, location, type, category, expLevel, salaryMin]);

  useEffect(() => { fetchJobs(1); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchJobs(1); };
  const clearFilters = () => {
    setSearch(''); setLocation(''); setType(''); setCategory(''); setExpLevel(''); setSalaryMin('');
    fetchJobs(1, { search: '', location: '', type: '', category: '', experienceLevel: '', salaryMin: '' });
  };
  const hasActiveFilters = search || location || type || category || expLevel || salaryMin;

  return (
    <div className="ds-root employer">
      {mobileOpen && <div className="ds-mobile-overlay" onClick={() => setMobileOpen(false)} />}
      <div className="ds-body">
        <aside className={`ds-sidebar${mobileOpen ? ' ds-sidebar--mobile-open' : ''}`}>
          <EmployerSidebar employer={employer} loading={loading} stats={stats} />
        </aside>
        <main className="ds-main">
          <div className="ds-page-header">
            <div>
              <h1 className="ds-page-title">Browse Jobs</h1>
              <p className="ds-page-sub">{total.toLocaleString()} open roles on the market</p>
            </div>
            {hasActiveFilters && (
              <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={clearFilters}>
                <X size={13} /> Clear filters
              </button>
            )}
          </div>

          <form className="ds-card" style={{ padding: '16px 20px' }} onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: showFilters ? 14 : 0 }}>
              <div className="ds-search" style={{ flex: '2 1 200px' }}>
                <Search size={14} className="ds-search-icon" />
                <input placeholder="Job title, keywords, company…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="ds-search" style={{ flex: '1 1 150px' }}>
                <MapPin size={14} className="ds-search-icon" />
                <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setShowFilters((v) => !v)}>
                <SlidersHorizontal size={13} /> Filters
                <ChevronDown size={12} style={{ transform: showFilters ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
              </button>
              <button type="submit" className="ds-btn ds-btn-primary">Search</button>
            </div>
            {showFilters && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, paddingTop: 14, borderTop: '1px solid #F3F4F6' }}>
                <select className="ds-status-select" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">All Types</option>
                  {JOB_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
                <select className="ds-status-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map((c) => <option key={c.id || c.name} value={c.id}>{c.name}</option>)}
                </select>
                <select className="ds-status-select" value={expLevel} onChange={(e) => setExpLevel(e.target.value)}>
                  <option value="">Experience</option>
                  {EXP_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <input className="ds-status-select" placeholder="Min salary (XAF)" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
              </div>
            )}
          </form>

          {listLoading ? (
            <div className="ds-loading-inline"><div className="ds-spinner" /><span>Loading jobs…</span></div>
          ) : jobs.length === 0 ? (
            <div className="ds-empty-state"><p>No jobs match your search.</p></div>
          ) : (
            <>
              <div className="ds-job-grid" style={{ marginTop: 16 }}>
                {jobs.map((job) => <JobCard key={job.id} job={job} />)}
              </div>
              <DashboardPagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={PAGE_SIZE}
                onChange={(p) => fetchJobs(p)}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
