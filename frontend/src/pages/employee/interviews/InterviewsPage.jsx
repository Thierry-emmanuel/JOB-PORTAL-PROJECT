import { useEffect, useState } from "react";
import { CalendarCheck, Video, Phone, MapPin, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import EmployeeLayout from "../../../layouts/EmployeeLayout";
import useEmployeeDashboard from "../../../hooks/useEmployeeDashboard";
import { useAuth } from "../../../context/AuthContext";
import { getInterviewsBySeeker, cancelInterview } from "../../../api/interviews";

function typeDisplay(type) {
  switch (type) {
    case "VIDEO":     return { icon: <Video size={14} />,   label: "Video Call" };
    case "PHONE":     return { icon: <Phone size={14} />,   label: "Phone Call" };
    case "IN_PERSON": return { icon: <MapPin size={14} />,  label: "On-site"    };
    default:          return { icon: <Video size={14} />,   label: type || "Interview" };
  }
}

function statusStyle(iv) {
  if (iv.result === "PASSED")  return { bg:"#ECFDF5", color:"#065F46", icon:<CheckCircle2 size={13} />, label:"Passed"    };
  if (iv.result === "FAILED")  return { bg:"#FEF2F2", color:"#991B1B", icon:<XCircle size={13} />,     label:"Failed"    };
  if (iv.result === "NO_SHOW") return { bg:"#FFF7ED", color:"#C2410C", icon:<AlertCircle size={13} />, label:"No Show"   };
  if (iv.pending)              return { bg:"#EFF6FF", color:"#1E40AF", icon:<Clock size={13} />,       label:"Upcoming"  };
  return                              { bg:"#F9FAFB", color:"#374151", icon:<CalendarCheck size={13} />,label:"Completed" };
}

export default function InterviewsPage() {
  const { user } = useAuth();
  const { profile, completion, handlePhotoChange } = useEmployeeDashboard();
  const [interviews, setInterviews] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const load = () => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    getInterviewsBySeeker(user.id)
      .then(res => setInterviews(Array.isArray(res) ? res : []))
      .catch(() => setError("Could not load your interviews."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [user?.id]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this interview?")) return;
    try { await cancelInterview(id); setInterviews(p => p.filter(iv => iv.id !== id)); }
    catch { alert("Failed to cancel. Please try again."); }
  };

  const upcoming   = interviews.filter(iv => iv.pending && !iv.result);
  const past       = interviews.filter(iv => !iv.pending || iv.result);

  const Group = ({ title, items }) => items.length === 0 ? null : (
    <div>
      <h3 style={{ fontSize:13, fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:"0.6px", margin:"0 0 12px" }}>{title}</h3>
      <div className="ds-interview-grid">
        {items.map(iv => {
          const ss = statusStyle(iv);
          const td = typeDisplay(iv.type);
          const date = iv.scheduledAt ? new Date(iv.scheduledAt) : null;
          return (
            <div key={iv.id} className="ds-card" style={{ padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <span className="ds-badge" style={{ background:ss.bg, color:ss.color }}>{ss.icon} {ss.label}</span>
                <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#6B7280" }}>{td.icon} {td.label}</span>
              </div>
              <h4 style={{ fontSize:15, fontWeight:700, margin:"0 0 3px" }}>Job #{iv.jobPostingId || "—"}</h4>
              {iv.platform && <p style={{ fontSize:12, color:"#6B7280", margin:"0 0 10px" }}>{iv.platform}</p>}
              {date && (
                <div style={{ display:"flex", gap:14, fontSize:12, color:"#4B5563", marginBottom:12 }}>
                  <span style={{ display:"flex", alignItems:"center", gap:5 }}><CalendarCheck size={12} />{date.toLocaleDateString("en-GB",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})}</span>
                  <span style={{ display:"flex", alignItems:"center", gap:5 }}><Clock size={12} />{date.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</span>
                </div>
              )}
              {iv.meetingLink && (
                <a href={iv.meetingLink} target="_blank" rel="noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:6, background:"var(--ds-accent)", color:"#fff", padding:"9px 12px", borderRadius:10, textDecoration:"none", fontSize:13, fontWeight:600, justifyContent:"center", marginBottom:10 }}>
                  <Video size={13} /> Join Meeting
                </a>
              )}
              {iv.pending && !iv.result && (
                <button onClick={() => handleCancel(iv.id)}
                  style={{ width:"100%", padding:"7px", border:"1.5px solid #FECACA", borderRadius:8, background:"#FEF2F2", color:"#DC2626", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  Cancel Interview
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <EmployeeLayout profile={profile} completion={completion} onPhotoChange={handlePhotoChange}>
      <div className="ds-page-header">
        <div>
          <h1 className="ds-page-title">My Interviews</h1>
          <p className="ds-page-sub">{upcoming.length} upcoming · {past.length} past</p>
        </div>
      </div>

      {loading && (
        <div style={{ display:"flex", justifyContent:"center", padding:"80px 0" }}>
          <div style={{ width:28, height:28, border:"3px solid #E5E7EB", borderTopColor:"var(--ds-accent)", borderRadius:"50%", animation:"ds-spin 0.8s linear infinite" }} />
        </div>
      )}
      {error && (
        <div className="ds-error"><div className="ds-error-icon"><AlertCircle size={24} /></div><p style={{ fontWeight:700 }}>{error}</p></div>
      )}
      {!loading && !error && interviews.length === 0 && (
        <div className="ds-card">
          <div className="ds-empty">
            <div className="ds-empty-icon"><CalendarCheck size={24} /></div>
            <p className="ds-empty-title">No interviews scheduled yet</p>
            <p className="ds-empty-sub">Interview invitations from employers will appear here.</p>
          </div>
        </div>
      )}
      {!loading && !error && interviews.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
          <Group title="Upcoming" items={upcoming} />
          <Group title="Past Interviews" items={past} />
        </div>
      )}
    </EmployeeLayout>
  );
}