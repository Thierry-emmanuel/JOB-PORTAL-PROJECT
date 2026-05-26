import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Clock, ChevronRight, AlertCircle, RefreshCw, Eye } from "lucide-react";
import EmployeeLayout from "../../../layouts/EmployeeLayout";
import useEmployeeDashboard from "../../../hooks/useEmployeeDashboard";
import { useAuth } from "../../../context/AuthContext";
import { getUserApplications } from "../../../api/jobs";

const STATUS_STYLE = {
  APPLIED:     { bg:"#EFF6FF", color:"#1E40AF", dot:"#3B82F6", label:"Applied"     },
  SHORTLISTED: { bg:"#FAF5FF", color:"#6B21A8", dot:"#A855F7", label:"Shortlisted" },
  REJECTED:    { bg:"#FEF2F2", color:"#991B1B", dot:"#EF4444", label:"Rejected"    },
  HIRED:       { bg:"#ECFDF5", color:"#065F46", dot:"#10B981", label:"Hired"       },
};

function Badge({ status }) {
  const s = STATUS_STYLE[status] || { bg:"#F3F4F6", color:"#374151", dot:"#9CA3AF", label: status };
  return (
    <span className="ds-badge" style={{ background: s.bg, color: s.color }}>
      <span className="ds-badge-dot" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { profile, completion, handlePhotoChange } = useEmployeeDashboard();
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState("ALL");

  const load = () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    getUserApplications(user.id)
      .then(res => setApps(Array.isArray(res) ? res : []))
      .catch(() => setError("Could not load your applications."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [user?.id]);

  const TABS = ["ALL","APPLIED","SHORTLISTED","HIRED","REJECTED"];
  const visible = filter === "ALL" ? apps : apps.filter(a => a.status === filter);

  return (
    <EmployeeLayout profile={profile} completion={completion} onPhotoChange={handlePhotoChange} appsBadge={apps.filter(a => a.status === "APPLIED").length}>
      <div className="ds-page-header">
        <div>
          <h1 className="ds-page-title">My Applications</h1>
          <p className="ds-page-sub">{apps.length} total application{apps.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="ds-btn ds-btn-ghost" onClick={load}><RefreshCw size={13} /> Refresh</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className="ds-btn ds-btn-sm"
            style={{ background: filter === t ? "var(--ds-accent)" : "#fff", color: filter === t ? "#fff" : "#374151", border: "1.5px solid #E5E7EB" }}
          >
            {t === "ALL" ? `All (${apps.length})` : `${t[0] + t.slice(1).toLowerCase()} (${apps.filter(a => a.status === t).length})`}
          </button>
        ))}
      </div>

      <div className="ds-card">
        {loading && (
          <div style={{ padding:"60px 0", display:"flex", justifyContent:"center" }}>
            <div style={{ width:28, height:28, border:"3px solid #E5E7EB", borderTopColor:"var(--ds-accent)", borderRadius:"50%", animation:"ds-spin 0.8s linear infinite" }} />
          </div>
        )}

        {error && (
          <div className="ds-empty" style={{ background:"#FEF2F2", borderRadius:12, margin:16 }}>
            <AlertCircle size={18} color="#DC2626" />
            <p className="ds-empty-title" style={{ color:"#DC2626" }}>{error}</p>
            <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={load}><RefreshCw size={12} /> Retry</button>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="ds-empty">
            <div className="ds-empty-icon"><Briefcase size={24} /></div>
            <p className="ds-empty-title">No applications {filter !== "ALL" ? `with status "${filter}"` : "yet"}</p>
            <p className="ds-empty-sub">Start applying to jobs that match your profile.</p>
            <Link to="/jobs" className="ds-btn ds-btn-primary" style={{ marginTop:4 }}>Browse Jobs <ChevronRight size={13} /></Link>
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <>
            <div className="ds-table-head" style={{ gridTemplateColumns:"2fr 1fr 1fr 1fr auto" }}>
              <span>Job</span><span>Status</span><span>Expected Salary</span><span>Applied</span><span />
            </div>
            {visible.map(app => (
              <div key={app.id} className="ds-table-row" style={{ gridTemplateColumns:"2fr 1fr 1fr 1fr auto" }}>
                <div>
                  <Link to={`/jobs/${app.jobPostingId}`} style={{ fontWeight:700, color:"#111827", fontSize:13, textDecoration:"none" }}>
                    Job #{app.jobPostingId}
                  </Link>
                  {app.appliedAt && <p style={{ fontSize:11, color:"#9CA3AF", margin:"2px 0 0", display:"flex", alignItems:"center", gap:3 }}><Clock size={10} /> Applied {formatDate(app.appliedAt)}</p>}
                </div>
                <span><Badge status={app.status} /></span>
                <span style={{ fontSize:13, color:"#374151" }}>{app.expectedSalary ? `${Number(app.expectedSalary).toLocaleString()} XAF` : "—"}</span>
                <span className="ds-app-date"><Clock size={10} /> {formatDate(app.appliedAt)}</span>
                <Link to={`/jobs/${app.jobPostingId}`} className="ds-btn ds-btn-ghost ds-btn-sm" style={{ flexShrink:0 }}><Eye size={12} /></Link>
              </div>
            ))}
          </>
        )}
      </div>
    </EmployeeLayout>
  );
}