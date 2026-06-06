import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Users, Eye, Star, Bell, X,
  Plus, ChevronRight, Clock, ArrowUp, ArrowDown,
  AlertTriangle, AlertCircle, Search, TrendingUp, Edit2,
  RefreshCw, Video, MapPin, CheckCircle,
  Mail, Phone, ExternalLink, FileText, Check, Calendar as CalendarIcon, ClipboardList,
  Home, Globe, BarChart2
} from 'lucide-react';
import { useEmployerDashboard } from '../hooks/useEmployerDashboard';
import InterviewScheduler from '../components/employer/InterviewScheduler';
import EmployerSidebar from '../components/employer/EmployerSidebar';
import '../styles/dashboard-shell.css';
import '../styles/ManageJobs.css';

/* ─── Toast notification ──────────────────────────────────── */
function Toast({ toasts, remove }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position:'fixed', top:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex', alignItems:'flex-start', gap:10,
          background: t.type === 'error' ? '#FEF2F2' : t.type === 'success' ? '#ECFDF5' : '#EFF6FF',
          border: `1.5px solid ${t.type === 'error' ? '#FCA5A5' : t.type === 'success' ? '#6EE7B7' : '#BFDBFE'}`,
          borderRadius:12, padding:'12px 16px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)',
          minWidth:280, maxWidth:380, animation:'ds-slide-in 0.3s ease',
        }}>
          {t.type === 'error' ? <AlertCircle size={16} color="#DC2626" style={{flexShrink:0,marginTop:1}}/> : <CheckCircle size={16} color="#10B981" style={{flexShrink:0,marginTop:1}}/>}
          <div style={{flex:1}}>
            <p style={{fontSize:13,fontWeight:600,color: t.type==='error' ? '#991B1B' : '#065F46',margin:'0 0 2px'}}>{t.title}</p>
            {t.body && <p style={{fontSize:12,color:'#6B7280',margin:0}}>{t.body}</p>}
          </div>
          <button onClick={() => remove(t.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',padding:0,flexShrink:0}}><X size={14}/></button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((title, body='', type='success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, title, body, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, add, remove };
}

/* ── Status helpers ───────────────────────────────────── */
const STATUS_CLASS = {
  APPLIED:     'applied',
  SHORTLISTED: 'shortlisted',
  REJECTED:    'rejected',
  HIRED:       'hired',
};

function StatusSelect({ status, appId, onUpdate }) {
  return (
    <select
      className={`ds-status-select ${STATUS_CLASS[status] || ''}`}
      value={status}
      onChange={e => onUpdate(appId, e.target.value)}
      onClick={e => e.stopPropagation()}
    >
      <option value="APPLIED">Applied</option>
      <option value="SHORTLISTED">Shortlisted</option>
      <option value="REJECTED">Rejected</option>
      <option value="HIRED">Hired</option>
    </select>
  );
}

/* ── Skeleton ─────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ padding: '18px 20px', borderBottom: '1px solid #F9FAFB', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div className="ds-skeleton" style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="ds-skeleton ds-skeleton-text w-50" />
        <div className="ds-skeleton ds-skeleton-text w-75" />
      </div>
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────── */
function StatCard({ icon, label, value, change, color }) {
  const pos = change >= 0;
  return (
    <div className="ds-stat-card" style={{ '--ds-accent': color, '--ds-accent-light': color + '15' }}>
      <div className="ds-stat-icon" style={{ background: color + '18', color }}>
        {icon}
      </div>
      <div className="ds-stat-body">
        <p className="ds-stat-label">{label}</p>
        <p className="ds-stat-value">{value}</p>
        <div className={`ds-stat-change ${pos ? 'up' : 'down'}`}>
          {pos ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
          <span>{Math.abs(change)} this week</span>
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLE = {
  APPLIED:              { bg: '#EFF6FF', color: '#1E40AF', dot: '#3B82F6' },
  SHORTLISTED:          { bg: '#FAF5FF', color: '#6B21A8', dot: '#A855F7' },
  INTERVIEW_SCHEDULED:  { bg: '#FFF7ED', color: '#C2410C', dot: '#F97316' },
  HIRED:                { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  REJECTED:             { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
};

function StatusBadge({ status, map = STATUS_STYLE }) {
  const s = map[status] || { bg:'#F3F4F6', color:'#374151', dot:'#9CA3AF' };
  return (
    <span className="mj-badge" style={{ background: s.bg, color: s.color }}>
      <span className="mj-badge-dot" style={{ background: s.dot }}/>
      {status?.replace(/_/g,' ')}
    </span>
  );
}

function Avatar({ name, size = 36, color = '#1A5C2E' }) {
  const initials = (name||'?').split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('');
  return (
    <div className="mj-avatar" style={{ width:size, height:size, fontSize:size*0.36, background:`${color}18`, color }}>
      {initials}
    </div>
  );
}

const fmtDate = d => !d ? '—' : new Date(d).toLocaleDateString('fr-CM', { day:'2-digit', month:'short', year:'numeric' });
const fmtSalary = v => v ? `${Number(v).toLocaleString()} XAF` : '—';

/* ════════════════════════════════════════════════════════
   EmployerDashboard
   ════════════════════════════════════════════════════════ */
export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { toasts, add: addToast, remove: removeToast } = useToast();
  const [search,          setSearch]          = useState('');
  const [mobileOpen,      setMobileOpen]      = useState(false);
  const [schedulerTarget, setSchedulerTarget] = useState(null);

  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);

  const {
    employer, stats, applications, jobPostings,
    notifications, unreadCount,
    loading, error, refreshing,
    refresh, markNotificationRead, markAllRead,
    updateApplicationStatus, updateJobPostingStatus, deleteJobPosting,
    updateApplicationReview,
    incrementJobViews,
    incrementJobApps,
  } = useEmployerDashboard();



  const filteredApplicants = applications.filter(
    app => selectedJobForApplicants && app.jobPostingId === selectedJobForApplicants.id
  );

  const filtered = applications.filter(a =>
    a.applicant.toLowerCase().includes(search.toLowerCase()) ||
    a.job.toLowerCase().includes(search.toLowerCase())
  );

  const firstName = employer?.contactName ? employer.contactName.split(' ')[0] : 'there';

  // Wrapped actions that show toasts instead of alerts
  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      addToast('Status updated', `Application moved to ${newStatus}`, 'success');
    } catch {
      addToast('Update failed', 'Could not update application status.', 'error');
    }
  };

  const handleJobClose = async (jobId) => {
    try {
      await updateJobPostingStatus(jobId, 'EXPIRED');
      addToast('Job closed', 'The job posting has been closed.', 'success');
    } catch {
      addToast('Action failed', 'Could not close this job posting.', 'error');
    }
  };

  const handleJobPublish = async (jobId) => {
    try {
      await updateJobPostingStatus(jobId, 'ACTIVE');
      addToast('Job published', 'The job posting is now active.', 'success');
    } catch {
      addToast('Action failed', 'Could not publish this job posting.', 'error');
    }
  };

  const handleJobDelete = async (jobId) => {
    try {
      await deleteJobPosting(jobId);
      addToast('Job deleted', 'The job posting was removed.', 'success');
    } catch {
      addToast('Delete failed', 'Could not delete this job posting.', 'error');
    }
  };

  /* Error screen */
  if (error) return (
    <div className="ds-root employer">
      <div className="ds-body">
        <aside className="ds-sidebar"><EmployerSidebar employer={employer} loading={loading} stats={stats} /></aside>
        <main className="ds-main">
          <div className="ds-error">
            <div className="ds-error-icon"><AlertTriangle size={26} /></div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Dashboard failed to load</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>{error}</p>
            <button className="ds-btn ds-btn-primary" onClick={refresh}><RefreshCw size={13} /> Try Again</button>
          </div>
        </main>
      </div>
    </div>
  );

  return (
    <div className="ds-root employer">
      <Toast toasts={toasts} remove={removeToast} />

      {/* InterviewScheduler modal */}
      {schedulerTarget && (
        <InterviewScheduler
          application={schedulerTarget}
          onClose={() => setSchedulerTarget(null)}
          onScheduled={() => {
            handleUpdateStatus(schedulerTarget.id, 'SHORTLISTED');
            addToast('Interview scheduled!', `Invitation sent to ${schedulerTarget.applicant}`, 'success');
            setTimeout(() => setSchedulerTarget(null), 2500);
          }}
        />
      )}

      {/* Mobile */}
      {mobileOpen && <div className="ds-mobile-overlay" onClick={() => setMobileOpen(false)} />}

      <div className="ds-body">
        {/* ════ SIDEBAR ════ */}
        <aside className={`ds-sidebar${mobileOpen ? ' ds-sidebar--mobile-open' : ''}`}>
          <button className="ds-mobile-close" onClick={() => setMobileOpen(false)}><X size={16} /></button>
          <EmployerSidebar employer={employer} loading={loading} stats={stats} />
        </aside>

        {/* ════ MAIN ════ */}
        <main className="ds-main">

          {/* ── Hero ── */}
          <div className="ds-hero">
            <div className="ds-hero-text">
              <h1 className="ds-hero-title">Welcome back, {loading ? '…' : firstName} 👋</h1>
              <p className="ds-hero-sub">Here's what's happening with your job postings today.</p>
            </div>
            <div className="ds-hero-cta" style={{ display: 'flex', gap: 8 }}>
              <button
                className="ds-btn ds-btn-ghost ds-btn-icon"
                onClick={refresh} disabled={refreshing}
                title="Refresh"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
              >
                <RefreshCw size={15} className={refreshing ? 'ds-spin' : ''} />
              </button>
              <button className="ds-btn" onClick={() => navigate('/employer/post-job')}
                style={{ background: '#fff', color: 'var(--ds-accent)', fontWeight: 700 }}
              >
                <Plus size={14} /> Post New Job
              </button>
            </div>
          </div>

          {/* ── Quick Actions ── (placed at top, below hero) */}
          <div className="ds-card">
            <div className="ds-card-header">
              <h2 className="ds-card-title">
                <div className="ds-card-title-icon"><TrendingUp size={15} /></div>
                Quick Actions
              </h2>
            </div>
            <div className="ds-card-body">
              <div className="ds-quick-grid">
                {[
                  { icon: <Plus size={20} />,      label: 'Post New Job',         color: 'var(--ds-accent)', bg: 'var(--ds-accent-light)', action: () => navigate('/employer/post-job')    },
                  { icon: <Users size={20} />,     label: 'Review Applications',  color: '#E07B39', bg: '#FFF3EA', action: () => navigate('/employer/jobs')         },
                  { icon: <Video size={20} />,     label: 'Schedule Interview',   color: '#1565C0', bg: '#EFF6FF', action: () => {
                      const s = applications.find(a => a.status === 'SHORTLISTED');
                      if (s) setSchedulerTarget(s);
                      else addToast('No shortlisted applicant', 'Shortlist a candidate first to schedule an interview.', 'error');
                    }
                  },
                  { icon: <Edit2 size={20} />,     label: 'Company Profile',      color: '#10B981', bg: '#ECFDF5', action: () => navigate('/profile/employer')      },
                  { icon: <Globe size={20} />,     label: 'Browse Jobs',          color: '#2563EB', bg: '#DBEAF8', action: () => navigate('/jobs')                  },
                  { icon: <BarChart2 size={20} />,  label: 'Market Insights',     color: '#7C3AED', bg: '#F3E8FF', action: () => navigate('/employer/insights')         },
                  { icon: <Home size={20} />,      label: 'Go to Homepage',       color: '#0D9488', bg: '#CCFBF1', action: () => navigate('/')                      },
                ].map(({ icon, label, color, bg, action }) => (
                  <button key={label} className="ds-quick-btn" onClick={action}>
                    <div className="ds-quick-icon" style={{ background: bg, color }}>{icon}</div>
                    <span className="ds-quick-label">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="ds-stats-grid">
            {loading ? (
              [1,2,3,4].map(i => (
                <div key={i} className="ds-stat-card">
                  <div className="ds-skeleton" style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="ds-skeleton ds-skeleton-text w-50" />
                    <div className="ds-skeleton ds-skeleton-text w-75" style={{ height: 24, marginTop: 6 }} />
                  </div>
                </div>
              ))
            ) : (
              <>
                <StatCard icon={<Briefcase size={20} />} label="Active Jobs"    value={stats.activeJobs}        change={stats.activeJobsChange}        color="#1A5C2E" />
                <StatCard icon={<Users    size={20} />} label="Applications"    value={stats.totalApplications} change={stats.totalApplicationsChange} color="#E07B39" />
                <StatCard icon={<Eye      size={20} />} label="Profile Views"   value={stats.totalViews}        change={stats.totalViewsChange}        color="#3B82F6" />
                <StatCard icon={<Star     size={20} />} label="Hired"           value={stats.hired}             change={stats.hiredChange}             color="#10B981" />
              </>
            )}
          </div>

          {/* ── Two column row ── */}
          <div className="ds-two-col">

            {/* Applications */}
            <div className="ds-card" style={{ minHeight: 400 }}>
              <div className="ds-card-header">
                <h2 className="ds-card-title">
                  <div className="ds-card-title-icon"><Users size={15} /></div>
                  Recent Applications
                </h2>
                <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => navigate('/employer/jobs')}>
                  View all <ChevronRight size={13} />
                </button>
              </div>

              <div style={{ padding: '12px 20px' }}>
                <div className="ds-search">
                  <Search size={14} className="ds-search-icon" />
                  <input
                    placeholder="Search applicants or jobs…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div>
                {loading
                  ? [1,2,3].map(i => <SkeletonCard key={i} />)
                  : filtered.length === 0
                  ? (
                    <div className="ds-empty">
                      <div className="ds-empty-icon"><Users size={22} /></div>
                      <p className="ds-empty-title">No applications found</p>
                      <p className="ds-empty-sub">Applications will appear here once candidates apply.</p>
                    </div>
                  )
                  : filtered.map(app => {
                    const av = app.applicant.split(' ').map(w => w[0]).slice(0, 2).join('');
                    return (
                      <div 
                        key={app.id} 
                        className="ds-app-row" 
                        style={{ cursor: 'pointer', hover: { background: '#f8fafc' } }}
                        onClick={() => navigate(`/applications/${app.id}`)}
                      >
                        <div className="ds-app-avatar">{av}</div>
                        <div className="ds-app-info">
                          <p className="ds-app-name">{app.applicant}</p>
                          <p className="ds-app-job"><Briefcase size={10} /> {app.job}</p>
                        </div>
                        <div className="ds-app-actions">
                          <StatusSelect status={app.status} appId={app.id} onUpdate={handleUpdateStatus} />
                          {app.status === 'SHORTLISTED' && (
                            <button
                              className="ds-btn ds-btn-sm"
                              style={{ background: '#EFF6FF', color: '#1E40AF', border: '1.5px solid #BFDBFE' }}
                              onClick={(e) => { e.stopPropagation(); setSchedulerTarget(app); }}
                              title="Schedule Interview"
                            >
                              <Video size={11} /> Schedule
                            </button>
                          )}
                        </div>
                        <span className="ds-app-date"><Clock size={10} /> {app.date}</span>
                      </div>
                    );
                  })
                }
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Active Jobs */}
              <div className="ds-card">
                <div className="ds-card-header">
                  <h2 className="ds-card-title">
                    <div className="ds-card-title-icon"><Briefcase size={15} /></div>
                    Active Jobs
                  </h2>
                  <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => navigate('/employer/jobs')}>
                    View all <ChevronRight size={13} />
                  </button>
                </div>
                <div>
                  {loading
                    ? [1,2].map(i => (
                      <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid #F9FAFB' }}>
                        <div className="ds-skeleton ds-skeleton-text w-75" style={{ height: 13 }} />
                        <div className="ds-skeleton ds-skeleton-text w-40" />
                      </div>
                    ))
                    : jobPostings.length === 0
                    ? (
                      <div className="ds-empty">
                        <div className="ds-empty-icon"><Briefcase size={20} /></div>
                        <p className="ds-empty-title">No active jobs</p>
                      </div>
                    )
                    : jobPostings.map(job => (
                      <div key={job.id} className="ds-job-card">
                        <div className="ds-job-card-top">
                          <div>
                            <p className="ds-job-title">{job.title}</p>
                            <div className="ds-job-meta">
                              <span className="ds-job-type">{job.type}</span>
                              {job.location && (
                                <span style={{ fontSize: 10.5, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <MapPin size={10} /> {job.location}
                                </span>
                              )}
                              <span className={`ds-job-days${job.daysLeft <= 14 ? ' urgent' : ''}`}>
                                <Clock size={10} /> {job.daysLeft}d left
                              </span>
                            </div>
                          </div>
                          <span className={`ds-badge ${job.status === 'ACTIVE' ? 'active' : ''}`}>{job.status}</span>
                        </div>
                        <div className="ds-job-stats" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Users size={11} /> {job.applications} applicants
                            <button
                              onClick={(e) => { e.stopPropagation(); incrementJobApps(job.id); }}
                              className="ds-btn ds-btn-ghost"
                              style={{
                                padding: '2px 6px',
                                fontSize: '10px',
                                height: '20px',
                                minWidth: 'auto',
                                background: '#f3f4f6',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #e5e7eb',
                                color: '#374151',
                                fontWeight: 700,
                              }}
                              title="Simulate/Increment applications (+1)"
                            >
                              +1 App
                            </button>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Eye size={11} /> {job.views} views
                            <button
                              onClick={(e) => { e.stopPropagation(); incrementJobViews(job.id); }}
                              className="ds-btn ds-btn-ghost"
                              style={{
                                padding: '2px 6px',
                                fontSize: '10px',
                                height: '20px',
                                minWidth: 'auto',
                                background: '#f3f4f6',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #e5e7eb',
                                color: '#374151',
                                fontWeight: 700,
                              }}
                              title="Increment views (+1)"
                            >
                              +1 View
                            </button>
                          </span>
                        </div>
                        <div className="ds-job-progress">
                          <div className="ds-job-progress-fill" style={{ width: `${Math.min((job.applications / 20) * 100, 100)}%` }} />
                        </div>
                        <div className="ds-job-actions">
                          <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setSelectedJobForApplicants(job)}>
                            <Users size={11} /> Applicants
                          </button>
                          <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => navigate('/employer/jobs')}>
                            <Edit2 size={11} /> Edit
                          </button>
                          {job.status === 'ACTIVE' ? (
                            <button className="ds-btn ds-btn-danger ds-btn-sm" onClick={() => handleJobClose(job.id)}>
                              <X size={11} /> Close
                            </button>
                          ) : (
                            <button className="ds-btn ds-btn-sm" style={{ background:'#ECFDF5', color:'#065F46', border:'1.5px solid #6EE7B7' }} onClick={() => handleJobPublish(job.id)}>
                              Publish
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Notifications */}
              <div className="ds-card">
                <div className="ds-card-header">
                  <h2 className="ds-card-title">
                    <div className="ds-card-title-icon"><Bell size={15} /></div>
                    Notifications
                    {unreadCount > 0 && <span className="ds-nav-badge" style={{ marginLeft: 6 }}>{unreadCount}</span>}
                  </h2>
                  {unreadCount > 0 && (
                    <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={markAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div>
                  {notifications.length === 0
                    ? (
                      <div className="ds-empty">
                        <div className="ds-empty-icon"><Bell size={20} /></div>
                        <p className="ds-empty-title">No notifications</p>
                      </div>
                    )
                    : notifications.map(n => (
                      <div key={n.id} className={`ds-notif-item${!n.read ? ' unread' : ''}`} onClick={() => markNotificationRead(n.id)}>
                        <div className="ds-notif-dot" />
                        <div>
                          <p className="ds-notif-text">{n.text}</p>
                          <p className="ds-notif-time"><Clock size={10} /> {n.time}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>


      {/* ── Candidates list drawer for specific active job ── */}
      {selectedJobForApplicants && (
        <>
          <div className="mj-drawer-overlay" onClick={() => setSelectedJobForApplicants(null)} />
          <div className="mj-drawer">
            <div className="mj-drawer-header">
              <div className="mj-drawer-title-area">
                <h2>Candidates List</h2>
                <p>{selectedJobForApplicants.title} · {filteredApplicants.length} applications</p>
              </div>
              <button className="mj-drawer-close" onClick={() => setSelectedJobForApplicants(null)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="mj-drawer-body">
              {filteredApplicants.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                  <Users size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>No applicants yet</p>
                  <p style={{ fontSize: 12.5, marginTop: 4, color: "#94a3b8" }}>
                    No candidates have applied for this position yet.
                  </p>
                </div>
              ) : (
                filteredApplicants.map((app) => (
                  <div key={app.id} className="mj-app-card">
                    <div className="mj-app-card-header">
                      <div className="mj-app-candidate-info">
                        <div className="mj-app-avatar">
                          {app.avatar ? (
                            <img src={app.avatar} alt={app.applicant} />
                          ) : (
                            app.applicant.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="mj-app-name">{app.applicant}</h3>
                          <div className="mj-app-meta-row">
                            <span className="mj-app-meta-item"><Mail size={12} /> {app.email || "No email"}</span>
                            {app.phone && <span className="mj-app-meta-item"><Phone size={12} /> {app.phone}</span>}
                            {app.city && <span className="mj-app-meta-item"><MapPin size={12} /> {app.city}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <span className={`mj-app-badge ${app.status.toLowerCase()}`}>
                        {app.status}
                      </span>
                    </div>

                    {app.expectedSalary && (
                      <div>
                        <div className="mj-app-section-title">Expected Salary</div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--kora-primary)" }}>
                          ${app.expectedSalary.toLocaleString()} USD
                        </div>
                      </div>
                    )}

                    {app.profileSummary && (
                      <div>
                        <div className="mj-app-section-title">Candidate Summary</div>
                        <div className="mj-app-detail-block">{app.profileSummary}</div>
                      </div>
                    )}

                    {app.coverLetter && (
                      <div>
                        <div className="mj-app-section-title">Cover Letter</div>
                        <div className="mj-app-detail-block" style={{ fontStyle: "italic", whiteSpace: "pre-wrap" }}>
                          "{app.coverLetter}"
                        </div>
                      </div>
                    )}

                    {app.skills?.length > 0 && (
                      <div>
                        <div className="mj-app-section-title">Skills</div>
                        <div className="mj-app-skills">
                          {app.skills.map((skill) => (
                            <span key={skill} className="mj-app-skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mj-app-actions">
                      {/* View complete application page */}
                      <button
                        className="mj-drawer-btn primary"
                        onClick={() => {
                          setSelectedJobForApplicants(null);
                          navigate(`/applications/${app.id}`);
                        }}
                        title="View complete application details page"
                      >
                        <ClipboardList size={14} /> View Details <ArrowUpRight size={11} />
                      </button>

                      {/* View CV Resume */}
                      {app.cvUrl ? (
                        <a
                          href={app.cvUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mj-drawer-btn secondary"
                          title="View resume in new tab"
                        >
                          <FileText size={14} /> Resume <ExternalLink size={11} />
                        </a>
                      ) : (
                        <button className="mj-drawer-btn secondary" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                          <FileText size={14} /> No Resume
                        </button>
                      )}

                      {/* Status transitions */}
                      {app.status === "APPLIED" && (
                        <>
                          <button
                            className="mj-drawer-btn success"
                            onClick={() => updateApplicationStatus(app.id, "SHORTLISTED")}
                          >
                            <Check size={14} /> Shortlist
                          </button>
                          <button
                            className="mj-drawer-btn danger"
                            onClick={() => updateApplicationStatus(app.id, "REJECTED")}
                          >
                            <X size={14} /> Reject
                          </button>
                        </>
                      )}

                      {app.status === "SHORTLISTED" && (
                        <>
                          <button
                            className="mj-drawer-btn primary"
                            onClick={() => setSchedulerTarget(app)}
                          >
                            <CalendarIcon size={14} /> Schedule Interview
                          </button>
                          <button
                            className="mj-drawer-btn danger"
                            onClick={() => updateApplicationStatus(app.id, "REJECTED")}
                          >
                            <X size={14} /> Reject
                          </button>
                        </>
                      )}

                      {app.status === "REJECTED" && (
                        <button
                          className="mj-drawer-btn neutral"
                          onClick={() => updateApplicationStatus(app.id, "APPLIED")}
                        >
                          Reconsider
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        /* ── Applications sliding drawer ── */
        .mj-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          z-index: 900;
          transition: opacity 0.3s ease;
        }

        .mj-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 550px;
          max-width: 100vw;
          background: #ffffff;
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
          z-index: 950;
          display: flex;
          flex-direction: column;
          transform: translateX(0);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          animation: mj-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes mj-slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .mj-drawer-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
        }

        .mj-drawer-title-area h2 {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px;
        }

        .mj-drawer-title-area p {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .mj-drawer-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mj-drawer-close:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #94a3b8;
        }

        .mj-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .mj-app-card {
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: all 0.2s;
        }

        .mj-app-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }

        .mj-app-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .mj-app-candidate-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mj-app-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #f1f5f9;
          color: #1a5c2e;
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1.5px solid #e2e8f0;
        }

        .mj-app-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .mj-app-name {
          font-size: 14.5px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 3px;
        }

        .mj-app-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 11.5px;
          color: #64748b;
        }

        .mj-app-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .mj-app-badge {
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .mj-app-badge.applied, .mj-app-badge.pending { background: #fef3c7; color: #d97706; }
        .mj-app-badge.shortlisted { background: #dcfce7; color: #15803d; }
        .mj-app-badge.rejected { background: #fee2e2; color: #dc2626; }

        .mj-app-section-title {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 6px;
        }

        .mj-app-detail-block {
          font-size: 13px;
          color: #334155;
          background: #f8fafc;
          border-radius: 8px;
          padding: 12px 14px;
          line-height: 1.5;
        }

        .mj-app-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .mj-app-skill-tag {
          background: #f1f5f9;
          color: #475569;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .mj-app-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
          flex-wrap: wrap;
        }

        .mj-drawer-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
        }

        .mj-drawer-btn.primary {
          background: #1a5c2e;
          color: #ffffff;
        }
        .mj-drawer-btn.primary:hover {
          background: #0d3d1f;
        }

        .mj-drawer-btn.secondary {
          background: #ffffff;
          color: #334155;
          border-color: #cbd5e1;
        }
        .mj-drawer-btn.secondary:hover {
          background: #f1f5f9;
        }

        .mj-drawer-btn.success {
          background: #dcfce7;
          color: #166534;
          border-color: #bbf7d0;
        }
        .mj-drawer-btn.success:hover {
          background: #bbf7d0;
        }

        .mj-drawer-btn.danger {
          background: #fee2e2;
          color: #991b1b;
          border-color: #fecaca;
        }
        .mj-drawer-btn.danger:hover {
          background: #fecaca;
        }

        .mj-drawer-btn.neutral {
          background: #f8fafc;
          color: #475569;
          border-color: #cbd5e1;
        }
        .mj-drawer-btn.neutral:hover {
          background: #f1f5f9;
        }
      `}</style>
    </div>
  );
}