import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Briefcase, SlidersHorizontal, ChevronRight, Clock, X, ChevronDown } from "lucide-react";
import EmployeeLayout from "../../../layouts/EmployeeLayout";
import useEmployeeDashboard from "../../../hooks/useEmployeeDashboard";
import { getJobs, getCategories } from "../../../api/jobs";

const PAGE_SIZE = 9;
const JOB_TYPES = ["FULL_TIME","PART_TIME","CONTRACT","INTERNSHIP","FREELANCE"];
const EXP_LEVELS = ["ENTRY","JUNIOR","MID","SENIOR","LEAD"];

function freshnessLabel(postedAt) {
  if (!postedAt) return { label: '', color: '#9CA3AF' };
  const d = Math.floor((Date.now() - new Date(postedAt).getTime()) / 86400000);
  if (d === 0) return { label: 'Today',       color: '#22C55E' };
  if (d === 1) return { label: 'Yesterday',   color: '#84CC16' };
  if (d <= 7)  return { label: `${d}d ago`,   color: '#F59E0B' };
  return            { label: `${d}d ago`,   color: '#EF4444' };
}

function JobCard({ job }) {
  const navigate = useNavigate();
  const fresh = freshnessLabel(job.postedAt);
  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      style={{ background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:16, overflow:'hidden', cursor:'pointer', transition:'all 0.2s', display:'flex', flexDirection:'column' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#1A5C2E'; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(26,92,46,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
    >
      <div style={{ padding:'18px 18px 12px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'#E8F5EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#1A5C2E', flexShrink:0, overflow:'hidden' }}>
            {job.logo ? <img src={job.logo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : job.company?.charAt(0) || 'K'}
          </div>
          <span style={{ fontSize:10, fontWeight:700, color: fresh.color, background: fresh.color + '18', padding:'3px 8px', borderRadius:20 }}>● {fresh.label}</span>
        </div>
        <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:'0 0 3px', lineHeight:1.3 }}>{job.title}</h3>
        <p style={{ fontSize:12, color:'#6B7280', margin:'0 0 10px' }}>{job.company}</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, fontSize:11, color:'#6B7280', marginBottom:10 }}>
          {job.location && <span style={{ display:'flex', alignItems:'center', gap:3 }}><MapPin size={10}/>{job.location}</span>}
          {job.salary   && <span>💰 {job.salary}</span>}
        </div>
        {job.type && (
          <span style={{ fontSize:11, fontWeight:700, color:'#1A5C2E', background:'#E8F5EE', padding:'3px 9px', borderRadius:6 }}>
            {job.type.replace('_',' ')}
          </span>
        )}
      </div>
      <div style={{ marginTop:'auto', padding:'10px 18px', borderTop:'1px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11, color:'#9CA3AF' }}>{job.applications ?? 0} applicants</span>
        <span style={{ fontSize:12, fontWeight:700, color:'#1A5C2E', display:'flex', alignItems:'center', gap:3 }}>View <ChevronRight size={11}/></span>
      </div>
    </div>
  );
}

export default function BrowseJobsPage() {
  const { profile, completion, handlePhotoChange } = useEmployeeDashboard();
  const [jobs,        setJobs]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [categories,  setCategories]  = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search,    setSearch]    = useState("");
  const [location,  setLocation]  = useState("");
  const [type,      setType]      = useState("");
  const [category,  setCategory]  = useState("");
  const [expLevel,  setExpLevel]  = useState("");
  const [salaryMin, setSalaryMin] = useState("");

  // Load categories
  useEffect(() => {
    getCategories().then(data => {
      if (Array.isArray(data)) setCategories(data.slice(0, 20));
    }).catch(() => {});
  }, []);

  const fetchJobs = useCallback((p = 1, opts = {}) => {
    setLoading(true);
    const params = {
      page: p, size: PAGE_SIZE,
      search:   (opts.search   ?? search)   || undefined,
      location: (opts.location ?? location) || undefined,
      type:     (opts.type     ?? type)      || undefined,
      category: (opts.category ?? category)  || undefined,
    };
    getJobs(params)
      .then(res => { setJobs(res.data || []); setTotal(res.total || 0); setTotalPages(res.totalPages || 1); setPage(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, location, type, category]);

  useEffect(() => { fetchJobs(1); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchJobs(1); };

  const clearFilters = () => {
    setSearch(""); setLocation(""); setType(""); setCategory(""); setExpLevel(""); setSalaryMin("");
    fetchJobs(1, { search:'', location:'', type:'', category:'' });
  };

  const hasActiveFilters = search || location || type || category || expLevel || salaryMin;

  return (
    <EmployeeLayout profile={profile} completion={completion} onPhotoChange={handlePhotoChange}>
      <div className="ds-page-header">
        <div>
          <h1 className="ds-page-title">Browse Jobs</h1>
          <p className="ds-page-sub">{total.toLocaleString()} opportunities available</p>
        </div>
        {hasActiveFilters && (
          <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={clearFilters}>
            <X size={13}/> Clear filters
          </button>
        )}
      </div>

      {/* Search + Filter bar */}
      <form className="ds-card" style={{ padding:'16px 20px' }} onSubmit={handleSearch}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom: showFilters ? 14 : 0 }}>
          <div className="ds-search" style={{ flex:'2 1 200px' }}>
            <Search size={14} className="ds-search-icon"/>
            <input placeholder="Job title, keywords, company…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="ds-search" style={{ flex:'1 1 150px' }}>
            <MapPin size={14} className="ds-search-icon"/>
            <input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setShowFilters(v => !v)} style={{ display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}>
            <SlidersHorizontal size={13}/> Filters
            {hasActiveFilters && <span style={{ width:6, height:6, borderRadius:'50%', background:'#F97316', display:'inline-block' }}/>}
            <ChevronDown size={12} style={{ transform: showFilters ? 'rotate(180deg)' : '', transition:'transform 0.2s' }}/>
          </button>
          <button type="submit" className="ds-btn ds-btn-primary" style={{ flexShrink:0 }}>Search</button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10, paddingTop:14, borderTop:'1px solid #F3F4F6' }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.6px', display:'block', marginBottom:5 }}>Job Type</label>
              <select className="ds-status-select" style={{ width:'100%', padding:'9px 12px' }} value={type} onChange={e => setType(e.target.value)}>
                <option value="">All Types</option>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.6px', display:'block', marginBottom:5 }}>Category</label>
              <select className="ds-status-select" style={{ width:'100%', padding:'9px 12px' }} value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.6px', display:'block', marginBottom:5 }}>Experience</label>
              <select className="ds-status-select" style={{ width:'100%', padding:'9px 12px' }} value={expLevel} onChange={e => setExpLevel(e.target.value)}>
                <option value="">All Levels</option>
                {EXP_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.6px', display:'block', marginBottom:5 }}>Min Salary (XAF)</label>
              <input
                type="number" placeholder="e.g. 500000" value={salaryMin} onChange={e => setSalaryMin(e.target.value)}
                style={{ width:'100%', border:'1.5px solid #E5E7EB', borderRadius:10, padding:'9px 12px', fontSize:13, fontFamily:'inherit', outline:'none', color:'#111827', boxSizing:'border-box' }}
              />
            </div>
          </div>
        )}
      </form>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {[
            search    && { label: `"${search}"`,  clear: () => { setSearch('');    fetchJobs(1, { search:'', location, type, category }); } },
            location  && { label: `📍 ${location}`, clear: () => { setLocation(''); fetchJobs(1, { search, location:'', type, category }); } },
            type      && { label: type.replace('_',' '), clear: () => { setType('');   fetchJobs(1, { search, location, type:'', category }); } },
            category  && { label: `🏷 ${category}`, clear: () => { setCategory(''); fetchJobs(1, { search, location, type, category:'' }); } },
          ].filter(Boolean).map(chip => (
            <span key={chip.label} style={{ display:'flex', alignItems:'center', gap:5, background:'#E8F5EE', color:'#1A5C2E', border:'1px solid rgba(26,92,46,0.25)', borderRadius:20, padding:'4px 10px', fontSize:12, fontWeight:600 }}>
              {chip.label}
              <button onClick={chip.clear} style={{ background:'none', border:'none', cursor:'pointer', color:'#1A5C2E', padding:0, lineHeight:1 }}><X size={12}/></button>
            </span>
          ))}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
          <div style={{ width:32, height:32, border:'3px solid #E5E7EB', borderTopColor:'#1A5C2E', borderRadius:'50%', animation:'ds-spin 0.8s linear infinite' }} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="ds-card">
          <div className="ds-empty">
            <div className="ds-empty-icon"><Briefcase size={28}/></div>
            <p className="ds-empty-title">No jobs found</p>
            <p className="ds-empty-sub">Try adjusting your search or filters.</p>
            {hasActiveFilters && <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={clearFilters}><X size={12}/> Clear filters</button>}
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:16 }}>
          {jobs.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginTop:8 }}>
          <button className="ds-btn ds-btn-ghost ds-btn-sm" disabled={page === 1} onClick={() => fetchJobs(page - 1)}>← Prev</button>
          <div style={{ display:'flex', gap:4 }}>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i+1 : page <= 3 ? i+1 : page >= totalPages-2 ? totalPages-4+i : page-2+i;
              return (
                <button key={p} onClick={() => fetchJobs(p)} className="ds-btn ds-btn-sm"
                  style={{ background: p === page ? 'var(--ds-accent)' : '#fff', color: p === page ? '#fff' : '#374151', border:'1.5px solid #E5E7EB', minWidth:36 }}>
                  {p}
                </button>
              );
            })}
          </div>
          <button className="ds-btn ds-btn-ghost ds-btn-sm" disabled={page === totalPages} onClick={() => fetchJobs(page + 1)}>Next →</button>
        </div>
      )}
    </EmployeeLayout>
  );
}