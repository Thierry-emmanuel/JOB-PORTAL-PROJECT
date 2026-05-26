import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Users, Eye, Star, Bell, X,
  Plus, ChevronRight, Clock, ArrowUp, ArrowDown,
  AlertTriangle, Search, TrendingUp, Edit2,
  RefreshCw, Video, MapPin, CheckCircle, AlertCircle,
} from 'lucide-react';
import { useEmployerDashboard } from '../hooks/useEmployerDashboard';
import InterviewScheduler from '../components/employer/InterviewScheduler';
import EmployerSidebar from '../components/employer/EmployerSidebar';
import '../styles/dashboard-shell.css';

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

/* ════════════════════════════════════════════════════════
   EmployerDashboard
   ════════════════════════════════════════════════════════ */
export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { toasts, add: addToast, remove: removeToast } = useToast();
  const [search,          setSearch]          = useState('');
  const [mobileOpen,      setMobileOpen]      = useState(false);
  const [schedulerTarget, setSchedulerTarget] = useState(null);

  const {
    employer, stats, applications, jobPostings,
    notifications, unreadCount,
    loading, error, refreshing,
    refresh, markNotificationRead, markAllRead,
    updateApplicationStatus, updateJobPostingStatus, deleteJobPosting,
  } = useEmployerDashboard();

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
                  { icon: <Plus size={20} />,      label: 'Post New Job',         color: '#1A5C2E', bg: '#E8F5EE', action: () => navigate('/employer/post-job')    },
                  { icon: <Users size={20} />,     label: 'Review Applications',  color: '#E07B39', bg: '#FFF3EA', action: () => navigate('/employer/jobs')         },
                  { icon: <Video size={20} />,     label: 'Schedule Interview',   color: '#1565C0', bg: '#EFF6FF', action: () => {
                      const s = applications.find(a => a.status === 'SHORTLISTED');
                      if (s) setSchedulerTarget(s);
                      else addToast('No shortlisted applicant', 'Shortlist a candidate first to schedule an interview.', 'error');
                    }
                  },
                  { icon: <Edit2 size={20} />,     label: 'Edit Company Profile', color: '#10B981', bg: '#ECFDF5', action: () => navigate('/profile/employer')      },
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
                      <div key={app.id} className="ds-app-row">
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
                              onClick={() => setSchedulerTarget(app)}
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
                        <div className="ds-job-stats">
                          <span><Users size={11} /> {job.applications} applicants</span>
                          <span><Eye   size={11} /> {job.views} views</span>
                        </div>
                        <div className="ds-job-progress">
                          <div className="ds-job-progress-fill" style={{ width: `${Math.min((job.applications / 20) * 100, 100)}%` }} />
                        </div>
                        <div className="ds-job-actions">
                          <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => navigate('/employer/jobs')}>
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
      <style>{`@keyframes ds-slide-in { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
    </div>
  );
}