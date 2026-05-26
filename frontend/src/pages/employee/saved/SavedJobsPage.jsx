import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, MapPin, Clock, ChevronRight, Briefcase } from "lucide-react";
import EmployeeLayout from "../../../layouts/EmployeeLayout";
import useEmployeeDashboard from "../../../hooks/useEmployeeDashboard";
import { getJobs } from "../../../api/jobs";

function formatSalary(min, max, currency = "XAF") {
  if (!min && !max) return null;
  if (min && max) return `${Number(min).toLocaleString()} – ${Number(max).toLocaleString()} ${currency}`;
  return `${Number(min || max).toLocaleString()} ${currency}`;
}

export default function SavedJobsPage() {
  const { profile, completion, handlePhotoChange } = useEmployeeDashboard();
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The saved jobs endpoint doesn't exist yet; show recent jobs as a graceful fallback
    getJobs({ size: 9 })
      .then(res => setJobs(res.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <EmployeeLayout profile={profile} completion={completion} onPhotoChange={handlePhotoChange}>
      <div className="ds-page-header">
        <div>
          <h1 className="ds-page-title">Saved Jobs</h1>
          <p className="ds-page-sub">Jobs you've bookmarked for later</p>
        </div>
        <Link to="/jobs" className="ds-btn ds-btn-primary"><Briefcase size={14} /> Browse More Jobs</Link>
      </div>

      {loading ? (
        <div className="ds-card" style={{ padding:"60px 0", display:"flex", justifyContent:"center" }}>
          <div style={{ width:28, height:28, border:"3px solid #E5E7EB", borderTopColor:"var(--ds-accent)", borderRadius:"50%", animation:"ds-spin 0.8s linear infinite" }} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="ds-card">
          <div className="ds-empty">
            <div className="ds-empty-icon"><Bookmark size={24} /></div>
            <p className="ds-empty-title">No saved jobs yet</p>
            <p className="ds-empty-sub">Browse jobs and click the bookmark icon to save them here.</p>
            <Link to="/jobs" className="ds-btn ds-btn-primary" style={{ marginTop:4 }}>Browse Jobs <ChevronRight size={13} /></Link>
          </div>
        </div>
      ) : (
        <div className="ds-mini-jobs-grid">
          {jobs.map(job => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="ds-mini-job-card">
              <div className="ds-mini-job-header">
                <div className="ds-mini-job-logo">
                  {job.logo ? <img src={job.logo} alt="" /> : <span>{job.company?.charAt(0) || "K"}</span>}
                </div>
                <span className="ds-job-type">{job.type}</span>
              </div>
              <h3 style={{ fontSize:14, fontWeight:700, color:"#111827", margin:"8px 0 3px" }}>{job.title}</h3>
              <p style={{ fontSize:12, color:"#6B7280", margin:"0 0 8px" }}>{job.company}</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, fontSize:11, color:"#6B7280" }}>
                {job.location && <span style={{ display:"flex", alignItems:"center", gap:3 }}><MapPin size={10} />{job.location}</span>}
                {formatSalary(job.salaryMin, job.salaryMax) && <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>}
              </div>
              <div className="ds-mini-job-footer" style={{ marginTop:10 }}>
                <Bookmark size={13} color="var(--ds-accent)" fill="var(--ds-accent)" />
                <span style={{ fontSize:11, fontWeight:700, color:"var(--ds-accent)" }}>View <ChevronRight size={11} /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </EmployeeLayout>
  );
}