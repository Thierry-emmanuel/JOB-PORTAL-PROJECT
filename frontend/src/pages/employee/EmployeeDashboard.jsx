import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserApplications, getUserInterviews } from '../../api/jobs';
import '../../styles/employee-dashboard.css';

/**
 * EmployeeDashboard
 * Main landing page for job seekers after login.
 * Shows summary stats, upcoming interviews, tasks, and quick links.
 */
export default function EmployeeDashboard() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Derive user name from localStorage or default
  const userName = localStorage.getItem('userName') || 'there';

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [appsRes, intRes] = await Promise.all([
          getUserApplications(),
          getUserInterviews(),
        ]);
        setApplications(appsRes.data || []);
        setInterviews(intRes.data || []);
      } catch (e) {
        setError('Failed to load dashboard data.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalApplied = applications.length;
  const interviewing = applications.filter(a => a.status === 'Interview Scheduled').length;
  const offers = applications.filter(a => a.status === 'Offer Received').length;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const addToCalendar = (interview) => {
    // Google Calendar deep-link
    const title = encodeURIComponent(`Interview: ${interview.jobTitle} at ${interview.company}`);
    const start = encodeURIComponent(interview.date.replace(/-/g, '') + 'T' + interview.time.replace(/[^0-9]/g, '').slice(0, 4) + '00');
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${start}`, '_blank');
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const statusBadge = (status) => {
    const map = {
      'Under Review': 'badge-warning',
      'Interview Scheduled': 'badge-info',
      'Offer Received': 'badge-success',
      'Rejected': 'badge-danger',
    };
    return <span className={`ed-badge ${map[status] || 'badge-default'}`}>{status}</span>;
  };

  const navItems = [
    { label: 'Dashboard', icon: '⊞', to: '/employee/dashboard', active: true },
    { label: 'My Applications', icon: '📋', to: '/employee/applications' },
    { label: 'Interview Schedule', icon: '📅', to: '/employee/interviews' },
    { label: 'Find Jobs', icon: '🔍', to: '/jobs' },
    { label: 'My Profile', icon: '👤', to: '/profile' },
  ];

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="ed-loading-screen" aria-busy="true" aria-label="Loading dashboard">
        <div className="ed-spinner" />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className={`ed-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* ── Sidebar ── */}
      <aside className="ed-sidebar" aria-label="Main navigation">
        <div className="ed-sidebar-header">
          <div className="ed-logo">
            <span className="ed-logo-icon">K</span>
            <span className="ed-logo-text">KoraHR</span>
          </div>
          <button
            className="ed-sidebar-toggle"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '‹' : '›'}
          </button>
        </div>

        <nav>
          <p className="ed-nav-label">Main</p>
          <ul className="ed-nav-list">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={`ed-nav-item ${item.active ? 'ed-nav-item--active' : ''}`}
                >
                  <span className="ed-nav-icon" aria-hidden="true">{item.icon}</span>
                  <span className="ed-nav-label-text">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="ed-nav-label">Others</p>
          <ul className="ed-nav-list">
            <li>
              <Link to="/settings" className="ed-nav-item">
                <span className="ed-nav-icon" aria-hidden="true">⚙️</span>
                <span className="ed-nav-label-text">Settings</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="ed-sidebar-footer">
          <div className="ed-user-chip">
            <div className="ed-avatar" aria-hidden="true">{userName.charAt(0).toUpperCase()}</div>
            <div className="ed-user-info">
              <span className="ed-user-name">{userName}</span>
              <span className="ed-user-role">Job Seeker</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="ed-main">
        {/* Top bar */}
        <header className="ed-topbar">
          <div className="ed-topbar-search">
            <span className="ed-search-icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              placeholder="Search anything…"
              className="ed-search-input"
              aria-label="Search"
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/jobs?search=${e.target.value}`)}
            />
          </div>
          <div className="ed-topbar-right">
            <button className="ed-icon-btn" aria-label="Notifications">🔔</button>
            <div className="ed-avatar" aria-hidden="true">{userName.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className="ed-content">
          {/* Welcome */}
          <section className="ed-welcome" aria-labelledby="welcome-heading">
            <h1 id="welcome-heading" className="ed-welcome-title">
              Welcome back, <span className="ed-highlight">{userName}</span>!
            </h1>
            <p className="ed-welcome-sub">Manage and track your job applications</p>
          </section>

          {/* Stats row */}
          <section className="ed-stats" aria-label="Application statistics">
            <div className="ed-stat-card">
              <div className="ed-stat-icon ed-stat-icon--orange" aria-hidden="true">📄</div>
              <div>
                <p className="ed-stat-label">Jobs Applied</p>
                <p className="ed-stat-value">{totalApplied}</p>
              </div>
            </div>
            <div className="ed-stat-card">
              <div className="ed-stat-icon ed-stat-icon--purple" aria-hidden="true">💬</div>
              <div>
                <p className="ed-stat-label">Interviewing</p>
                <p className="ed-stat-value">{interviewing}</p>
              </div>
            </div>
            <div className="ed-stat-card">
              <div className="ed-stat-icon ed-stat-icon--green" aria-hidden="true">🏢</div>
              <div>
                <p className="ed-stat-label">Job Offers</p>
                <p className="ed-stat-value">{offers}</p>
              </div>
            </div>
          </section>

          {/* Error banner */}
          {error && (
            <div className="ed-error-banner" role="alert">{error}</div>
          )}

          {/* Main grid */}
          <div className="ed-grid">
            {/* ── Upcoming Interviews ── */}
            <section className="ed-card ed-interviews" aria-labelledby="interviews-heading">
              <h2 id="interviews-heading" className="ed-card-title">Upcoming Interviews</h2>

              {interviews.length === 0 ? (
                <div className="ed-empty">
                  <span aria-hidden="true">📅</span>
                  <p>No upcoming interviews scheduled.</p>
                  <Link to="/jobs" className="ed-link-btn">Browse Jobs</Link>
                </div>
              ) : (
                <ul className="ed-interview-list">
                  {interviews.map((iv) => (
                    <li key={iv.id} className="ed-interview-item">
                      <div className="ed-interview-date" aria-label={`Date: ${formatDate(iv.date)}`}>
                        <span className="ed-date-day">{new Date(iv.date).getDate()}</span>
                        <span className="ed-date-month">
                          {new Date(iv.date).toLocaleString('en-US', { month: 'short' })}
                        </span>
                      </div>
                      <div className="ed-interview-info">
                        <div className="ed-interview-header">
                          <strong>{iv.jobTitle}</strong>
                          <span className={`ed-type-badge ${iv.type === 'Video' ? 'type-video' : 'type-person'}`}>
                            {iv.type}
                          </span>
                        </div>
                        <p className="ed-interview-time">{iv.time} · {iv.company}</p>
                        <div className="ed-interview-actions">
                          <button
                            className="ed-btn ed-btn--outline"
                            onClick={() => addToCalendar(iv)}
                            aria-label={`Add ${iv.jobTitle} interview to calendar`}
                          >
                            Add to Calendar
                          </button>
                          {iv.meetLink ? (
                            <a
                              href={iv.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ed-btn ed-btn--primary"
                            >
                              Join Now
                            </a>
                          ) : (
                            <button className="ed-btn ed-btn--outline">Reschedule</button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── Quick Links ── */}
            <section className="ed-card ed-quicklinks" aria-labelledby="quicklinks-heading">
              <h2 id="quicklinks-heading" className="ed-card-title">Quick Links</h2>
              <ul className="ed-quicklinks-list">
                {[
                  { label: 'View My Profile', icon: '👤', to: '/profile' },
                  { label: 'Upload CV', icon: '📎', to: '/profile#cv' },
                  { label: 'Browse Jobs', icon: '🔍', to: '/jobs' },
                  { label: 'My Applications', icon: '📋', to: '/employee/applications' },
                  { label: 'Saved Jobs', icon: '🔖', to: '/jobs?saved=true' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="ed-quicklink-item">
                      <span aria-hidden="true">{link.icon}</span>
                      {link.label}
                      <span className="ed-arrow" aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* ── Applications Table ── */}
          <section className="ed-card ed-applications-table" aria-labelledby="apps-heading">
            <div className="ed-card-header">
              <h2 id="apps-heading" className="ed-card-title">My Applications</h2>
              <Link to="/jobs" className="ed-view-all">View all jobs →</Link>
            </div>

            {applications.length === 0 ? (
              <div className="ed-empty">
                <span aria-hidden="true">📋</span>
                <p>You haven't applied to any jobs yet.</p>
                <Link to="/jobs" className="ed-link-btn">Find Jobs</Link>
              </div>
            ) : (
              <div className="ed-table-wrapper" role="region" aria-label="Applications table" tabIndex={0}>
                <table className="ed-table">
                  <thead>
                    <tr>
                      <th scope="col">Position</th>
                      <th scope="col">Company</th>
                      <th scope="col">Applied</th>
                      <th scope="col">Status</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td>{app.jobTitle}</td>
                        <td>{app.company}</td>
                        <td>{formatDate(app.appliedAt)}</td>
                        <td>{statusBadge(app.status)}</td>
                        <td>
                          <Link to={`/jobs/${app.jobId}`} className="ed-table-link">
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}