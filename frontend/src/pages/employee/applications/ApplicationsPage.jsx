import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Clock, ChevronRight, AlertCircle, RefreshCw, Eye, X, CheckCircle } from "lucide-react";
import EmployeeLayout from "../../../layouts/EmployeeLayout";
import useEmployeeDashboard from "../../../hooks/useEmployeeDashboard";
import { useAuth } from "../../../context/AuthContext";
import { getUserApplications, getJob } from "../../../api/jobs";

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

/* ─── Application Detail Drawer ─────────────────────────────── */
function AppDetailDrawer({ app, onClose }) {
  const navigate = useNavigate();
  const [job, setJob]         = useState(null);
  const [jobLoading, setJobLoading] = useState(true);

  useEffect(() => {
    if (!app?.jobPostingId) { setJobLoading(false); return; }
    getJob(app.jobPostingId)
      .then(setJob)
      .catch(() => setJob(null))
      .finally(() => setJobLoading(false));
  }, [app?.jobPostingId]);

  if (!app) return null;

  return (
    <>
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:1000 }} onClick={onClose} />
      <div style={{
        position:"fixed", top:0, right:0, bottom:0, width:"min(480px, 100vw)",
        background:"#fff", zIndex:1001, boxShadow:"-4px 0 32px rgba(0,0,0,0.15)",
        display:"flex", flexDirection:"column", animation:"drawer-in 0.28s ease",
      }}>
        {/* Header */}
        <div style={{ padding:"20px 24px", borderBottom:"1px solid #F3F4F6", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:700, color:"#111827", margin:0 }}>Application Details</h2>
            <p style={{ fontSize:12, color:"#6B7280", margin:"3px 0 0" }}>Job #{app.jobPostingId}</p>
          </div>
          <button onClick={onClose} style={{ background:"#F3F4F6", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
          {/* Status */}
          <div style={{ background:"#F9FAFB", borderRadius:12, padding:"16px", marginBottom:20 }}>
            <p style={{ fontSize:11, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:8 }}>Application Status</p>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <Badge status={app.status} />
              <span style={{ fontSize:12, color:"#6B7280" }}>Applied {formatDate(app.appliedAt)}</span>
            </div>
          </div>

          {/* Job info */}
          {jobLoading ? (
            <div style={{ textAlign:"center", padding:"32px 0" }}>
              <div style={{ width:24, height:24, border:"3px solid #E5E7EB", borderTopColor:"var(--ds-accent)", borderRadius:"50%", animation:"ds-spin 0.8s linear infinite", margin:"0 auto" }} />
            </div>
          ) : job ? (
            <div style={{ border:"1.5px solid #E5E7EB", borderRadius:12, overflow:"hidden", marginBottom:20 }}>
              <div style={{ padding:"16px 20px", background:"#F9FAFB", borderBottom:"1px solid #E5E7EB" }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:"#111827", margin:"0 0 4px" }}>{job.title}</h3>
                <p style={{ fontSize:13, color:"#6B7280", margin:0 }}>{job.company}</p>
              </div>
              <div style={{ padding:"16px 20px", display:"flex", flexWrap:"wrap", gap:10 }}>
                {job.location && <span style={{ fontSize:12, color:"#374151" }}>📍 {job.location}</span>}
                {job.type     && <span style={{ fontSize:12, color:"#374151" }}>💼 {job.type}</span>}
                {job.salary   && <span style={{ fontSize:12, color:"#374151" }}>💰 {job.salary}</span>}
              </div>
              {job.description && (
                <div style={{ padding:"0 20px 16px" }}>
                  <p style={{ fontSize:12, color:"#6B7280", lineHeight:1.6 }}>{job.description.slice(0, 300)}{job.description.length > 300 ? '…' : ''}</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background:"#FEF2F2", borderRadius:12, padding:"14px 18px", marginBottom:20, fontSize:13, color:"#991B1B" }}>
              Could not load job details.
            </div>
          )}

          {/* Application data */}
          <div style={{ background:"#F9FAFB", borderRadius:12, padding:"16px", marginBottom:20 }}>
            <p style={{ fontSize:11, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:12 }}>Your Application</p>
            <div style={{ display:"grid", gap:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, color:"#6B7280" }}>Expected Salary</span>
                <span style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{app.expectedSalary ? `${Number(app.expectedSalary).toLocaleString()} XAF` : "Not specified"}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, color:"#6B7280" }}>Applied On</span>
                <span style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{formatDate(app.appliedAt)}</span>
              </div>
            </div>
            {app.coverLetter && (
              <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid #E5E7EB" }}>
                <p style={{ fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:6 }}>COVER LETTER</p>
                <p style={{ fontSize:13, color:"#374151", lineHeight:1.6 }}>{app.coverLetter}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"16px 24px", borderTop:"1px solid #F3F4F6", display:"flex", gap:10, flexShrink:0 }}>
          <button onClick={onClose} style={{ flex:1, background:"#F3F4F6", border:"none", borderRadius:10, padding:"11px", fontSize:14, fontWeight:600, cursor:"pointer", color:"#374151" }}>Close</button>
          <button onClick={() => { navigate(`/jobs/${app.jobPostingId}`); onClose(); }} style={{ flex:1, background:"var(--ds-accent)", border:"none", borderRadius:10, padding:"11px", fontSize:14, fontWeight:700, cursor:"pointer", color:"#fff" }}>
            View Job <ChevronRight size={14} style={{verticalAlign:'middle'}}/>
          </button>
        </div>
      </div>
      <style>{`@keyframes drawer-in { from { transform: translateX(100%); } to { transform: none; } }`}</style>
    </>
  );
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { profile, completion, handlePhotoChange } = useEmployeeDashboard();
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState("ALL");
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    getUserApplications(user.id)
      .then(res => setApps(Array.isArray(res) ? res : []))
      .catch(() => setError("Could not load your applications."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(load, [load]);

  const TABS = ["ALL","APPLIED","SHORTLISTED","HIRED","REJECTED"];
  const visible = filter === "ALL" ? apps : apps.filter(a => a.status === filter);

  return (
    <EmployeeLayout profile={profile} completion={completion} onPhotoChange={handlePhotoChange} appsBadge={apps.filter(a => a.status === "APPLIED").length}>
      {selected && <AppDetailDrawer app={selected} onClose={() => setSelected(null)} />}

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
            {t === "ALL" ? `All (${apps.length})` : `${t[0]+t.slice(1).toLowerCase()} (${apps.filter(a => a.status === t).length})`}
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
            <Link to="/employee/jobs" className="ds-btn ds-btn-primary" style={{ marginTop:4 }}>Browse Jobs <ChevronRight size={13} /></Link>
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
                  <p style={{ fontWeight:700, color:"#111827", fontSize:13, margin:"0 0 2px" }}>Job #{app.jobPostingId}</p>
                  {app.appliedAt && <p style={{ fontSize:11, color:"#9CA3AF", margin:0, display:"flex", alignItems:"center", gap:3 }}><Clock size={10}/> Applied {formatDate(app.appliedAt)}</p>}
                </div>
                <span><Badge status={app.status} /></span>
                <span style={{ fontSize:13, color:"#374151" }}>{app.expectedSalary ? `${Number(app.expectedSalary).toLocaleString()} XAF` : "—"}</span>
                <span className="ds-app-date"><Clock size={10}/> {formatDate(app.appliedAt)}</span>
                <button
                  className="ds-btn ds-btn-ghost ds-btn-sm"
                  style={{ flexShrink:0, display:"flex", alignItems:"center", gap:4 }}
                  onClick={() => setSelected(app)}
                  title="View application details"
                >
                  <Eye size={12}/> Details
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </EmployeeLayout>
  );
}