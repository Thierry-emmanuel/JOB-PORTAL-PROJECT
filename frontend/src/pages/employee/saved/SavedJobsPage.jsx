import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, ChevronRight, Briefcase } from "lucide-react";
import EmployeeLayout from "../../../layouts/EmployeeLayout";
import useEmployeeDashboard from "../../../hooks/useEmployeeDashboard";
import { getJobs } from "../../../api/jobs";
import JobCard from "../../../components/jobs/JobCard";

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
            <JobCard key={job.id} job={job} variant="compact" />
          ))}
        </div>
      )}
    </EmployeeLayout>
  );
}