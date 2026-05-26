import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Briefcase, SlidersHorizontal, ChevronRight, Clock, ExternalLink } from "lucide-react";
import EmployeeLayout from "../../../layouts/EmployeeLayout";
import useEmployeeDashboard from "../../../hooks/useEmployeeDashboard";
import { getJobs } from "../../../api/jobs";

const PAGE_SIZE = 9;

function JobCard({ job }) {
  const navigate = useNavigate();
  return (
    <div className="ds-card" style={{ padding:0, overflow:"hidden", cursor:"pointer", transition:"box-shadow 0.18s, transform 0.18s" }}
      onClick={() => navigate(`/jobs/${job.id}`)}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 28px rgba(0,0,0,0.09)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
    >
      <div style={{ padding:"16px 18px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
          <div className="ds-mini-job-logo" style={{ width:40, height:40, borderRadius:10 }}>
            {job.logo ? <img src={job.logo} alt="" loading="lazy" /> : <span style={{ fontSize:16, fontWeight:800 }}>{job.company?.charAt(0) || "K"}</span>}
          </div>
          <span className="ds-job-type">{job.type}</span>
        </div>
        <h3 style={{ fontSize:14, fontWeight:700, color:"#111827", margin:"0 0 3px", lineHeight:1.3 }}>{job.title}</h3>
        <p style={{ fontSize:12, color:"#6B7280", margin:"0 0 10px" }}>{job.company}</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:10, fontSize:11, color:"#6B7280", marginBottom:12 }}>
          {job.location && <span style={{ display:"flex", alignItems:"center", gap:3 }}><MapPin size={10} />{job.location}</span>}
          {job.salary   && <span>{job.salary}</span>}
          {job.postedAt && <span style={{ display:"flex", alignItems:"center", gap:3 }}><Clock size={10} />{new Date(job.postedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}</span>}
        </div>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {job.tags?.slice(0,3).map(t => <span key={t} className="ds-job-type" style={{ fontSize:10.5 }}>{t}</span>)}
        </div>
      </div>
      <div style={{ padding:"10px 18px", borderTop:"1px solid #F3F4F6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:11, color:"#9CA3AF" }}>{job.applications ?? 0} applicants</span>
        <span style={{ fontSize:12, fontWeight:700, color:"var(--ds-accent)", display:"flex", alignItems:"center", gap:3 }}>Apply <ChevronRight size={11} /></span>
      </div>
    </div>
  );
}

export default function BrowseJobsPage() {
  const { profile, completion, handlePhotoChange } = useEmployeeDashboard();
  const [jobs,       setJobs]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [location,   setLocation]   = useState("");
  const [type,       setType]       = useState("");

  const fetchJobs = useCallback((p = 1, s = search, l = location, t = type) => {
    setLoading(true);
    getJobs({ page: p, size: PAGE_SIZE, search: s || undefined, location: l || undefined, type: t || undefined })
      .then(res => { setJobs(res.data || []); setTotal(res.total || 0); setTotalPages(res.totalPages || 1); setPage(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchJobs(1); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchJobs(1, search, location, type); };

  return (
    <EmployeeLayout profile={profile} completion={completion} onPhotoChange={handlePhotoChange}>
      <div className="ds-page-header">
        <div>
          <h1 className="ds-page-title">Browse Jobs</h1>
          <p className="ds-page-sub">{total.toLocaleString()} opportunities available</p>
        </div>
        <Link to="/jobs" className="ds-btn ds-btn-ghost" target="_blank"><ExternalLink size={13} /> Full Job Board</Link>
      </div>

      {/* Search bar */}
      <form className="ds-card" style={{ padding:"16px 20px", display:"flex", gap:10, flexWrap:"wrap" }} onSubmit={handleSearch}>
        <div className="ds-search" style={{ flex:"2 1 200px" }}>
          <Search size={14} className="ds-search-icon" />
          <input placeholder="Job title, keywords…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="ds-search" style={{ flex:"1 1 160px" }}>
          <MapPin size={14} className="ds-search-icon" />
          <input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <select className="ds-status-select" style={{ flex:"1 1 140px", padding:"10px 28px 10px 12px" }} value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          {["FULL_TIME","PART_TIME","CONTRACT","INTERNSHIP","FREELANCE"].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="submit" className="ds-btn ds-btn-primary"><SlidersHorizontal size={13} /> Search</button>
      </form>

      {/* Results */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
          <div style={{ width:28, height:28, border:"3px solid #E5E7EB", borderTopColor:"var(--ds-accent)", borderRadius:"50%", animation:"ds-spin 0.8s linear infinite" }} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="ds-card">
          <div className="ds-empty">
            <div className="ds-empty-icon"><Briefcase size={24} /></div>
            <p className="ds-empty-title">No jobs found</p>
            <p className="ds-empty-sub">Try adjusting your search filters.</p>
          </div>
        </div>
      ) : (
        <div className="ds-mini-jobs-grid" style={{ gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))" }}>
          {jobs.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:8 }}>
          {page > 1 && <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => fetchJobs(page - 1)}>← Prev</button>}
          <span style={{ display:"flex", alignItems:"center", fontSize:13, color:"#6B7280", padding:"0 10px" }}>Page {page} of {totalPages}</span>
          {page < totalPages && <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => fetchJobs(page + 1)}>Next →</button>}
        </div>
      )}
    </EmployeeLayout>
  );
}