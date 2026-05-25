import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2, Briefcase, Users, BarChart3,
  ChevronLeft, ChevronRight, Check, Ban, Trash2,
  Eye, Flag, AlertCircle, X, Search, TrendingUp,
  Activity, CheckCircle, Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchEmployers, approveEmployer, suspendEmployer, deleteEmployer,
  fetchAdminJobs, approveJob, flagJob, deleteJob,
  fetchJobSeekers, suspendJobSeeker,
  fetchOverviewStats, fetchMarketInsights,
} from '../../api/admin';
import KoraNav from '../../components/KoraNav';
import AdminSidebar from '../../components/admin/AdminSidebar';
import '../../styles/employee-dashboard.css';
import '../../styles/admin-dashboard.css';

/* ═══════════════════════════════════════════════════════════════════════════
   CHART HOOK
   ═══════════════════════════════════════════════════════════════════════════ */
function useChart(canvasRef, configFn, deps) {
  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return;
    let chart;
    const init = () => {
      if (!window.Chart) return;
      if (chart) chart.destroy();
      chart = new window.Chart(canvasRef.current, configFn());
    };
    if (window.Chart) {
      init();
    } else {
      const s = document.createElement('script');
      s.src =
        'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js';
      s.onload = init;
      document.head.appendChild(s);
    }
    return () => { if (chart) chart.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* shared Chart.js palette / font */
const FONT = 'Poppins';
const COLORS = {
  purple:  '#7c3aed',
  green:   '#1a4a42',
  orange:  '#F97316',
  amber:   '#f5a05a',
  slate:   '#b5c4c1',
  teal:    '#3a5550',
  blue:    '#3B82F6',
  success: '#22c55e',
  danger:  '#ef4444',
};

/* ── Chart Components ─────────────────────────────────────────────────────── */
function UserGrowthChart({ data }) {
  const ref = useRef();
  useChart(ref, () => ({
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Job Seekers',
          data: data.jobSeekers,
          borderColor: COLORS.purple,
          backgroundColor: 'rgba(124,58,237,0.08)',
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.purple,
          pointRadius: 4,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Employers',
          data: data.employers,
          borderColor: COLORS.orange,
          backgroundColor: 'rgba(249,115,22,0.08)',
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.orange,
          pointRadius: 4,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: FONT, size: 12 }, boxWidth: 14, padding: 16 },
        },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { family: FONT } } },
        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { family: FONT } } },
      },
    },
  }), [data]);
  return <canvas ref={ref} />;
}

function ApplicationsByCategoryChart({ data }) {
  const ref = useRef();
  const labels = Object.keys(data || {});
  const values = Object.values(data || {});
  useChart(ref, () => ({
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Applications',
        data: values,
        backgroundColor: [
          COLORS.purple, COLORS.green, COLORS.orange,
          COLORS.amber,  COLORS.slate,  COLORS.teal,
        ],
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} applications` } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: FONT, size: 11 } } },
        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { family: FONT } } },
      },
    },
  }), [data]);
  return <canvas ref={ref} />;
}

function ApplicationStatusChart({ data }) {
  const ref = useRef();
  useChart(ref, () => ({
    type: 'doughnut',
    data: {
      labels: Object.keys(data || {}),
      datasets: [{
        data: Object.values(data || {}),
        backgroundColor: [COLORS.purple, COLORS.orange, COLORS.success, COLORS.danger],
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { family: FONT, size: 12 }, boxWidth: 14, padding: 14 },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
            },
          },
        },
      },
    },
  }), [data]);
  return <canvas ref={ref} />;
}

function JobStatusChart({ active, expired, deleted }) {
  const ref = useRef();
  useChart(ref, () => ({
    type: 'pie',
    data: {
      labels: ['Active', 'Expired', 'Deleted'],
      datasets: [{
        data: [active, expired, deleted],
        backgroundColor: [COLORS.purple, '#f59e0b', COLORS.danger],
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { family: FONT, size: 12 }, boxWidth: 14, padding: 14 },
        },
      },
    },
  }), [active, expired, deleted]);
  return <canvas ref={ref} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED UI PRIMITIVES
   ═══════════════════════════════════════════════════════════════════════════ */
const fmtInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

const fmt = (v) => (v == null ? '—' : v);

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-CM', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return d;
  }
};

/* Status badge — uses ad-badge + semantic modifier from design system */
function StatusBadge({ status }) {
  const s = (status ?? '').toLowerCase();
  const MAP = {
    active: 'active', pending: 'pending', suspended: 'suspended',
    deleted: 'deleted', draft: 'draft', expired: 'expired',
    hired: 'hired', applied: 'active', shortlisted: 'pending',
    rejected: 'suspended',
  };
  return (
    <span className={`ad-badge ${MAP[s] ?? 'draft'}`}>
      {status ?? '—'}
    </span>
  );
}

/* Toast notification */
function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`ad-toast${type === 'error' ? ' error' : ''}`}>
      {type === 'success'
        ? <CheckCircle size={16} />
        : <AlertCircle size={16} />}
      {message}
    </div>
  );
}

/* Confirmation modal */
function ConfirmModal({ title, message, onConfirm, onCancel, danger = true, children }) {
  const { t } = useTranslation();
  return (
    <div className="ad-modal-overlay" onClick={onCancel}>
      <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        {children}
        <div className="ad-modal-actions">
          <button onClick={onCancel}>{t('common.cancel')}</button>
          <button
            className={danger ? 'ad-btn ad-btn-danger' : 'ad-btn ad-btn-approve'}
            onClick={onConfirm}
          >
            {t('admin.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Loading spinner */
function Loading() {
  const { t } = useTranslation();
  return (
    <div className="ad-spinner-wrap">
      <div className="ad-spinner" />
      <span>{t('common.loading')}</span>
    </div>
  );
}

/* Error banner */
function ErrorBanner({ message }) {
  return (
    <div className="ad-error-banner">
      <AlertCircle size={15} />
      {message}
    </div>
  );
}

/* KPI Stat Card — uses ed-stat-* vocabulary from employee-dashboard.css */
function StatCard({ icon, value, label, delta, accent }) {
  return (
    <div className="ed-stat-card">
      <div
        className="ed-stat-icon"
        style={{ background: `${accent}18`, color: accent }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="ed-stat-body">
        <div className="ed-stat-value">{value}</div>
        <div className="ed-stat-label">{label}</div>
        {delta && <div className="ed-stat-delta">{delta}</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 1 — Overview
   ═══════════════════════════════════════════════════════════════════════════ */
function OverviewTab() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchOverviewStats()
      .then(setStats)
      .catch(() => setError(t('admin.load_stats_error')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error)   return <ErrorBanner message={error} />;
  if (!stats)  return null;

  return (
    <>
      {/* ── KPI Cards ── */}
      <div className="ed-stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
        <StatCard
          label={t('admin.total_users')}
          value={stats.totalUsers?.toLocaleString() ?? 0}
          icon={<Users size={20} />}
          accent={COLORS.purple}
        />
        <StatCard
          label={t('admin.active_seekers')}
          value={stats.totalJobSeekers?.toLocaleString() ?? 0}
          icon={<Users size={20} />}
          accent={COLORS.green}
        />
        <StatCard
          label={t('admin.active_employers')}
          value={stats.totalEmployers?.toLocaleString() ?? 0}
          icon={<Building2 size={20} />}
          accent={COLORS.orange}
        />
        <StatCard
          label={t('employer.active_jobs')}
          value={stats.activeJobs?.toLocaleString() ?? 0}
          icon={<Briefcase size={20} />}
          accent={COLORS.purple}
        />
        <StatCard
          label={t('employer.total_applications')}
          value={stats.totalApplications?.toLocaleString() ?? 0}
          icon={<BarChart3 size={20} />}
          accent={COLORS.teal}
        />
        <StatCard
          label={t('admin.hire_rate')}
          value={`${stats.hireRate ?? 0}%`}
          icon={<CheckCircle size={20} />}
          accent={COLORS.success}
        />
      </div>

      {/* ── Row 1: User Growth + Applications by Category ── */}
      <div className="kora-charts-row">
        <div className="kora-chart-card">
          <div className="kora-chart-header">
            <TrendingUp size={15} />
            <h3>{t('admin.user_growth')}</h3>
          </div>
          <div className="kora-chart-area">
            {stats.usersOverTime ? (
              <UserGrowthChart data={stats.usersOverTime} />
            ) : (
              <div className="ad-empty">{t('admin.no_data')}</div>
            )}
          </div>
        </div>

        <div className="kora-chart-card">
          <div className="kora-chart-header">
            <BarChart3 size={15} />
            <h3>{t('admin.apps_by_category')}</h3>
          </div>
          <div className="kora-chart-area">
            {stats.applicationsByCategory &&
            Object.keys(stats.applicationsByCategory).length > 0 ? (
              <ApplicationsByCategoryChart data={stats.applicationsByCategory} />
            ) : (
              <div className="ad-empty">{t('admin.no_application_data')}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: Application Status + Job Status ── */}
      <div className="kora-charts-row">
        <div className="kora-chart-card">
          <div className="kora-chart-header">
            <BarChart3 size={15} />
            <h3>{t('admin.app_status_breakdown')}</h3>
          </div>
          <div className="kora-chart-area">
            {stats.applicationStatusBreakdown &&
            Object.keys(stats.applicationStatusBreakdown).length > 0 ? (
              <ApplicationStatusChart data={stats.applicationStatusBreakdown} />
            ) : (
              <div className="ad-empty">{t('admin.no_status_data')}</div>
            )}
          </div>
        </div>

        <div className="kora-chart-card">
          <div className="kora-chart-header">
            <Briefcase size={15} />
            <h3>{t('admin.jobs_by_status')}</h3>
          </div>
          <div className="kora-chart-area">
            <JobStatusChart
              active={stats.activeJobs}
              expired={stats.expiredJobs}
              deleted={stats.deletedJobs}
            />
          </div>
          <div className="kora-hire-rate-callout" style={{ marginTop: 16 }}>
            <span>{t('admin.hire_conversion_rate')}</span>
            <strong>{stats.hireRate}%</strong>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 2 — Employer Management
   ═══════════════════════════════════════════════════════════════════════════ */
function EmployerTab({ onPendingUpdate }) {
  const { t } = useTranslation();
  const [employers, setEmployers] = useState([]);
  const [filter, setFilter]       = useState('all');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null);
  const [toast, setToast]         = useState(null);

  const load = useCallback((f) => {
    setLoading(true);
    setError('');
    fetchEmployers(f)
      .then((data) => {
        setEmployers(data);
        const pending = data.filter((e) => e.isApproved === false).length;
        onPendingUpdate?.(pending);
      })
      .catch(() => setError(t('admin.load_employers_error')))
      .finally(() => setLoading(false));
  }, [onPendingUpdate]);

  useEffect(() => { load(filter); }, [filter, load]);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const handleAction = async () => {
    const { type, employer } = modal;
    setModal(null);
    try {
      const id = employer.id ?? employer.userId;
      if (type === 'approve') await approveEmployer(id);
      if (type === 'suspend') await suspendEmployer(id);
      if (type === 'delete')  await deleteEmployer(id);
      showToast(
        type === 'approve' ? t('admin.employer_approved') : type === 'suspend' ? t('admin.employer_suspended') : t('admin.employer_deleted')
      );
      load(filter);
    } catch {
      showToast(t('admin.action_error'), 'error');
    }
  };

  const TABS = [
    { key: 'all',       label: t('admin.tab_all') },
    { key: 'pending',   label: t('admin.tab_pending') },
    { key: 'approved',  label: t('admin.tab_approved') },
    { key: 'suspended', label: t('admin.tab_suspended') },
  ];

  const filtered = employers.filter((e) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (e.fullName ?? '').toLowerCase().includes(q) ||
      (e.email ?? '').toLowerCase().includes(q) ||
      (e.jobTitle ?? '').toLowerCase().includes(q) ||
      (e.city ?? '').toLowerCase().includes(q)
    );
  });

  const displayList =
    filter === 'suspended'
      ? filtered.filter((e) => e.isActive === false)
      : filtered;

  return (
    <>
      {error  && <ErrorBanner message={error} />}
      {toast  && (
        <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}

      {/* Filter bar */}
      <div className="ad-filter-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`ad-filter-tab${filter === t.key ? ' active' : ''}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div className="ad-search-wrap">
          <Search className="ad-search-icon" size={14} />
          <input
            className="ad-search"
            placeholder={t('admin.search_employers')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table section */}
      <div className="ed-section">
        <div className="ed-section-header">
          <h2 className="ed-section-title">
            <Building2 size={16} />
            {t('admin.employers_title')}
            <span style={{ fontWeight: 400, color: 'var(--kora-muted)', marginLeft: 6 }}>
              ({displayList.length})
            </span>
          </h2>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>{t('admin.col_company')}</th>
                  <th>{t('admin.col_contact_role')}</th>
                  <th>{t('auth.email')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('admin.col_registered')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {displayList.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="ad-empty">{t('admin.no_employers_found')}</div>
                    </td>
                  </tr>
                ) : (
                  displayList.map((emp) => {
                    const status =
                      emp.isApproved === false
                        ? 'PENDING'
                        : emp.isActive === false
                        ? 'SUSPENDED'
                        : 'ACTIVE';
                    return (
                      <tr key={emp.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="ad-chip-avatar">
                              {(emp.fullName ?? '?')[0].toUpperCase()}
                            </div>
                            <strong style={{ fontSize: 13 }}>
                              {fmt(emp.fullName)}
                            </strong>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--kora-muted)' }}>
                          {fmt(emp.jobTitle)}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--kora-muted)' }}>
                          {fmt(emp.email)}
                        </td>
                        <td><StatusBadge status={status} /></td>
                        <td style={{ fontSize: 12 }}>{fmtDate(emp.createdAt)}</td>
                        <td>
                          <div className="ad-actions">
                            {status === 'PENDING' && (
                              <button
                                className="ad-btn ad-btn-approve"
                                onClick={() => setModal({ type: 'approve', employer: emp })}
                              >
                                <Check size={12} /> {t('admin.approve')}
                              </button>
                            )}
                            {status === 'ACTIVE' && (
                              <button
                                className="ad-btn ad-btn-suspend"
                                onClick={() => setModal({ type: 'suspend', employer: emp })}
                              >
                                <Ban size={12} /> {t('admin.suspend')}
                              </button>
                            )}
                            {status === 'SUSPENDED' && (
                              <button
                                className="ad-btn ad-btn-approve"
                                onClick={() => setModal({ type: 'approve', employer: emp })}
                              >
                                <Check size={12} /> {t('admin.reactivate')}
                              </button>
                            )}
                            <button
                              className="ad-btn ad-btn-danger"
                              onClick={() => setModal({ type: 'delete', employer: emp })}
                              aria-label="Delete employer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {modal && (
        <ConfirmModal
          title={
            modal.type === 'approve'
              ? t('admin.confirm_approve_employer')
              : modal.type === 'suspend'
              ? t('admin.confirm_suspend_employer')
              : t('admin.confirm_delete_employer')
          }
          message={
            modal.type === 'delete'
              ? `${t('admin.irreversible')} ${t('admin.confirm_action_msg', { name: modal.employer.fullName })}`
              : t('admin.confirm_action_msg', { name: modal.employer.fullName })
          }
          danger={modal.type !== 'approve'}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 3 — Job Moderation
   ═══════════════════════════════════════════════════════════════════════════ */
function JobsTab() {
  const { t } = useTranslation();
  const [jobs, setJobs]               = useState([]);
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [filter, setFilter]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [modal, setModal]             = useState(null);
  const [flagReason, setFlagReason]   = useState('');
  const [toast, setToast]             = useState(null);
  const [search, setSearch]           = useState('');

  const load = useCallback((f, p) => {
    setLoading(true);
    setError('');
    fetchAdminJobs({ status: f, page: p, size: 20 })
      .then((data) => {
        const content = Array.isArray(data) ? data : data.content ?? [];
        setJobs(content);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => setError(t('admin.load_jobs_error')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(filter, page); }, [filter, page, load]);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const handleAction = async () => {
    const { type, job } = modal;
    const id = job.id ?? job.jobId;
    setModal(null);
    try {
      if (type === 'approve') await approveJob(id);
      if (type === 'flag')    await flagJob(id, flagReason);
      if (type === 'delete')  await deleteJob(id);
      showToast(
        type === 'approve' ? t('admin.job_approved') : type === 'flag' ? t('admin.job_flagged') : t('admin.job_deleted')
      );
      load(filter, page);
    } catch {
      showToast(t('admin.action_error'), 'error');
    }
    setFlagReason('');
  };

  const TABS = [
    { key: '',        label: t('admin.tab_all') },
    { key: 'ACTIVE',  label: t('admin.tab_active') },
    { key: 'DRAFT',   label: t('admin.tab_draft') },
    { key: 'EXPIRED', label: t('admin.tab_expired') },
    { key: 'DELETED', label: t('admin.tab_deleted') },
  ];

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (j.title ?? '').toLowerCase().includes(q) ||
      (j.companyName ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      {error && <ErrorBanner message={error} />}
      {toast && (
        <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}

      {/* Filter bar */}
      <div className="ad-filter-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`ad-filter-tab${filter === t.key ? ' active' : ''}`}
            onClick={() => { setFilter(t.key); setPage(0); }}
          >
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div className="ad-search-wrap">
          <Search className="ad-search-icon" size={14} />
          <input
            className="ad-search"
            placeholder={t('admin.search_jobs')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table section */}
      <div className="ed-section">
        <div className="ed-section-header">
          <h2 className="ed-section-title">
            <Briefcase size={16} />
            {t('admin.job_listings')}
            <span style={{ fontWeight: 400, color: 'var(--kora-muted)', marginLeft: 6 }}>
              ({filtered.length})
            </span>
          </h2>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>{t('admin.col_title')}</th>
                    <th>{t('admin.col_employer')}</th>
                    <th>{t('employer.category')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('admin.col_posted')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="ad-empty">{t('admin.no_jobs_found')}</div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((job) => {
                      const id     = job.id ?? job.jobId;
                      const status = (
                        job.postingStatus ?? job.status ?? 'DRAFT'
                      ).toUpperCase();
                      return (
                        <tr key={id}>
                          <td>
                            <strong style={{ fontSize: 13 }}>
                              {fmt(job.title)}
                            </strong>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--kora-muted)' }}>
                            {fmt(job.companyName ?? job.employerName)}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--kora-muted)' }}>
                            {fmt(job.categoryId ?? job.category)}
                          </td>
                          <td><StatusBadge status={status} /></td>
                          <td style={{ fontSize: 12 }}>
                            {fmtDate(job.createdAt ?? job.postedAt)}
                          </td>
                          <td>
                            <div className="ad-actions">
                              {status !== 'ACTIVE' && (
                                <button
                                  className="ad-btn ad-btn-approve"
                                  onClick={() => setModal({ type: 'approve', job })}
                                >
                                  <Check size={12} /> {t('admin.approve')}
                                </button>
                              )}
                              {status === 'ACTIVE' && (
                                <button
                                  className="ad-btn ad-btn-flag"
                                  onClick={() => {
                                    setFlagReason('');
                                    setModal({ type: 'flag', job });
                                  }}
                                >
                                  <Flag size={12} /> {t('admin.flag')}
                                </button>
                              )}
                              <button
                                className="ad-btn ad-btn-danger"
                                onClick={() => setModal({ type: 'delete', job })}
                                aria-label="Delete job"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="ad-pagination">
                <span className="ad-pagination-info">
                  {t('admin.page_of', { current: page + 1, total: totalPages })}
                </span>
                <div className="ad-pagination-controls">
                  <button
                    className="ad-page-btn"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from(
                    { length: Math.min(totalPages, 7) },
                    (_, i) => (
                      <button
                        key={i}
                        className={`ad-page-btn${i === page ? ' active' : ''}`}
                        onClick={() => setPage(i)}
                        aria-label={`Go to page ${i + 1}`}
                      >
                        {i + 1}
                      </button>
                    )
                  )}
                  <button
                    className="ad-page-btn"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Flag modal */}
      {modal?.type === 'flag' && (
        <ConfirmModal
          title={t('admin.flag_job_title')}
          message={t('admin.flag_job_msg', { title: modal.job.title })}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
          danger
        >
          <textarea
            className="ad-textarea"
            placeholder={t('admin.flag_reason_placeholder')}
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
          />
        </ConfirmModal>
      )}

      {/* Approve / Delete modal */}
      {modal && modal.type !== 'flag' && (
        <ConfirmModal
          title={
            modal.type === 'approve'
              ? t('admin.confirm_approve_job')
              : t('admin.confirm_delete_job')
          }
          message={t('admin.confirm_action_msg', { name: modal.job.title })}
          danger={modal.type === 'delete'}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 4 — Job Seekers
   ═══════════════════════════════════════════════════════════════════════════ */
function SeekersTab() {
  const { t } = useTranslation();
  const [seekers, setSeekers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null);
  const [toast, setToast]         = useState(null);
  const [slideOver, setSlideOver] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchJobSeekers()
      .then(setSeekers)
      .catch(() => setError(t('admin.load_seekers_error')))
      .finally(() => setLoading(false));
  }, []);

  const handleSuspend = async () => {
    const s = modal;
    setModal(null);
    try {
      await suspendJobSeeker(s.id ?? s.seekerId ?? s.userId);
      setSeekers((prev) =>
        prev.map((x) =>
          x.id === s.id ? { ...x, status: 'SUSPENDED', isActive: false } : x
        )
      );
      setToast({ msg: t('admin.seeker_suspended'), type: 'success' });
    } catch {
      setToast({ msg: t('admin.action_error'), type: 'error' });
    }
  };

  const filtered = seekers.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (s.fullName ?? '').toLowerCase().includes(q) ||
      (s.email ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      {error && <ErrorBanner message={error} />}
      {toast && (
        <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}

      {/* Search bar only */}
      <div className="ad-filter-bar">
        <div className="ad-search-wrap">
          <Search className="ad-search-icon" size={14} />
          <input
            className="ad-search"
            placeholder={t('admin.search_seekers')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table section */}
      <div className="ed-section">
        <div className="ed-section-header">
          <h2 className="ed-section-title">
            <Users size={16} />
            {t('admin.job_seekers_title')}
            <span style={{ fontWeight: 400, color: 'var(--kora-muted)', marginLeft: 6 }}>
              ({filtered.length})
            </span>
          </h2>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>{t('admin.col_name')}</th>
                  <th>{t('auth.email')}</th>
                  <th>{t('admin.col_skills')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('admin.col_registered')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="ad-empty">{t('admin.no_results')}</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const status =
                      s.status ?? (s.isActive === false ? 'SUSPENDED' : 'ACTIVE');
                    const skills = Array.isArray(s.keywords) ? s.keywords : [];
                    return (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="ad-chip-avatar">
                              {fmtInitials(s.fullName ?? s.email ?? '')}
                            </div>
                            <strong style={{ fontSize: 13 }}>
                              {fmt(s.fullName || s.email)}
                            </strong>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--kora-muted)' }}>
                          {fmt(s.email)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxWidth: 200 }}>
                            {skills.slice(0, 3).map((sk) => (
                              <span key={sk} className="ad-skill-chip">{sk}</span>
                            ))}
                            {skills.length > 3 && (
                              <span className="ad-skill-chip">+{skills.length - 3}</span>
                            )}
                            {skills.length === 0 && (
                              <span style={{ color: 'var(--kora-muted)', fontSize: 12 }}>—</span>
                            )}
                          </div>
                        </td>
                        <td><StatusBadge status={status} /></td>
                        <td style={{ fontSize: 12 }}>{fmtDate(s.createdAt)}</td>
                        <td>
                          <div className="ad-actions">
                            <button
                              className="ad-btn ad-btn-view"
                              onClick={() => setSlideOver(s)}
                            >
                              <Eye size={12} /> {t('admin.profile')}
                            </button>
                            {status.toUpperCase() !== 'SUSPENDED' && (
                              <button
                                className="ad-btn ad-btn-suspend"
                                onClick={() => setModal(s)}
                              >
                                <Ban size={12} /> {t('admin.suspend')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suspend confirm */}
      {modal && (
        <ConfirmModal
          title={t('admin.confirm_suspend_seeker')}
          message={t('admin.confirm_action_msg', { name: modal.fullName ?? modal.email })}
          danger
          onConfirm={handleSuspend}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Slide-over profile panel */}
      {slideOver && (
        <>
          <div
            className="ad-slideover-overlay"
            onClick={() => setSlideOver(null)}
          />
          <div className="ad-slideover" role="dialog" aria-label={t('admin.job_seeker_profile')}>
            <div className="ad-slideover-header">
              <h3>{t('admin.job_seeker_profile')}</h3>
              <button
                className="ad-slideover-close"
                onClick={() => setSlideOver(null)}
                aria-label="Close panel"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ad-slideover-body">
              {/* Avatar + name */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginBottom: 28,
                  paddingBottom: 20,
                  borderBottom: '1px solid var(--kora-border)',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'var(--kora-green)',
                    color: 'var(--kora-white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {fmtInitials(slideOver.fullName ?? slideOver.email ?? '')}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--kora-ink)',
                      marginBottom: 3,
                    }}
                  >
                    {slideOver.fullName || '—'}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--kora-muted)' }}>
                    {slideOver.profileSummary ?? t('admin.job_seeker')}
                  </div>
                </div>
              </div>

              {/* General info */}
              <div className="ad-detail-section">
                <div className="ad-detail-section-title">{t('admin.general_information')}</div>
                {[
                  ['Email',        slideOver.email],
                  ['Phone',        slideOver.phone],
                  ['City',         slideOver.city],
                  ['Region',       slideOver.region],
                  ['Registered',   fmtDate(slideOver.createdAt)],
                  ['Status',       slideOver.isActive === false ? 'SUSPENDED' : 'ACTIVE'],
                  ['Open to Work', slideOver.isOpenToWork ? 'Yes' : 'No'],
                  ['LinkedIn',     slideOver.linkedInUrl],
                  ['Portfolio',    slideOver.portfolioUrl],
                ].map(([k, v]) => (
                  <div key={k} className="ad-detail-row">
                    <span className="key">{k}</span>
                    <span className="val">{fmt(v)}</span>
                  </div>
                ))}
              </div>

              {/* Skills */}
              {(slideOver.keywords?.length > 0 || slideOver.skills?.length > 0) && (
                <div className="ad-detail-section">
                  <div className="ad-detail-section-title">{t('admin.col_skills')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(slideOver.keywords ?? slideOver.skills ?? []).map((sk) => (
                      <span key={sk} className="ad-skill-chip">{sk}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {slideOver.degree && (
                <div className="ad-detail-section">
                  <div className="ad-detail-section-title">{t('admin.education')}</div>
                  <div className="ad-detail-row">
                    <span className="key">{t('admin.degree')}</span>
                    <span className="val">{slideOver.degree}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 5 — Reports
   ═══════════════════════════════════════════════════════════════════════════ */
function ReportsTab() {
  const { t } = useTranslation();
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const barRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      fetchAdminJobs({ size: 200 }),
      fetchMarketInsights(),
    ])
      .then(([jobsRes]) => {
        const data = jobsRes.status === 'fulfilled' ? jobsRes.value : {};
        const content = Array.isArray(data) ? data : data.content ?? [];
        setJobs(content);
      })
      .catch(() => setError(t('admin.load_reports_error')))
      .finally(() => setLoading(false));
  }, []);

  /* Derived metrics */
  const totalApps = jobs.reduce((a, j) => a + (j.applicationCount ?? 0), 0);
  const hired     = jobs.reduce((a, j) => a + (j.hiredCount ?? 0), 0);
  const activeJ   = jobs.filter(
    (j) => (j.status ?? '').toString().toUpperCase() === 'ACTIVE'
  );
  const hireRate  = totalApps > 0 ? ((hired / totalApps) * 100).toFixed(1) : '—';
  const avgApps   = activeJ.length > 0
    ? (totalApps / activeJ.length).toFixed(1)
    : '—';

  /* Category aggregation */
  const catMap = {};
  jobs.forEach((j) => {
    const cat = j.categoryName ?? j.category ?? j.categoryId ?? 'Other';
    catMap[cat] = (catMap[cat] ?? 0) + (j.applicationCount ?? 1);
  });
  const topCats = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const mostActive = topCats[0]?.[0] ?? '—';

  /* Bar chart */
  useChart(barRef, () => ({
    type: 'bar',
    data: {
      labels: topCats.map(([k]) => k),
      datasets: [{
        label: 'Applications',
        data: topCats.map(([, v]) => v),
        backgroundColor: [
          COLORS.purple, COLORS.orange, COLORS.blue,
          COLORS.teal,   COLORS.danger,  COLORS.success,
        ],
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { font: { family: FONT, size: 11 }, precision: 0 },
        },
        y: { ticks: { font: { family: FONT, size: 11 } } },
      },
    },
  }), [topCats]);

  if (loading) return <Loading />;

  return (
    <>
      {error && <ErrorBanner message={error} />}

      {/* KPI row */}
      <div className="ed-stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
        <StatCard
          label={t('admin.hire_rate')}
          value={`${hireRate}${hireRate !== '—' ? '%' : ''}`}
          icon={<CheckCircle size={20} />}
          accent={COLORS.success}
          delta={t('admin.apps_to_hires')}
        />
        <StatCard
          label={t('admin.top_category')}
          value={mostActive}
          icon={<Activity size={20} />}
          accent={COLORS.orange}
          delta={t('admin.by_postings')}
        />
        <StatCard
          label={t('admin.avg_applications')}
          value={avgApps}
          icon={<TrendingUp size={20} />}
          accent={COLORS.blue}
          delta={t('admin.per_active_job')}
        />
      </div>

      {/* Bar chart section */}
      <div className="ed-section">
        <div className="ed-section-header">
          <h2 className="ed-section-title">
            {t('admin.apps_by_category_top6')}
          </h2>
        </div>
        <div className="ad-chart-wrap" style={{ height: 260 }}>
          {topCats.length > 0 ? (
            <canvas ref={barRef} />
          ) : (
            <div className="ad-empty">
              {t('admin.no_category_data')}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT — AdminDashboard
   ═══════════════════════════════════════════════════════════════════════════ */
// TAB_META is now resolved dynamically inside the component using t()

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab]               = useState('overview');
  const [pendingCount, setPendingCount] = useState(0);

  const TAB_META = {
    overview:  { title: t('admin.tab_overview'),   sub: t('admin.tab_overview_sub') },
    employers: { title: t('admin.tab_employers'),  sub: t('admin.tab_employers_sub') },
    jobs:      { title: t('admin.tab_jobs'),       sub: t('admin.tab_jobs_sub') },
    seekers:   { title: t('admin.tab_seekers'),    sub: t('admin.tab_seekers_sub') },
    reports:   { title: t('admin.tab_reports'),    sub: t('admin.tab_reports_sub') },
  };
  const { title, sub } = TAB_META[tab] ?? TAB_META.overview;

  return (
    <div className="ed-root admin">
      <KoraNav />

      <div className="ed-body">
        {/* ═══ SIDEBAR ═══ */}
        <aside className="ed-sidebar kora-sidebar kora-admin-sidebar">
          <AdminSidebar activeTab={tab} setActiveTab={setTab} />
        </aside>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="ed-main">
          {/* Page header */}
          <div className="ed-welcome">
            <div>
              <h1 className="ed-welcome-title">{title}</h1>
              <p className="ed-welcome-sub">{sub}</p>
            </div>
            {/* Admin identity badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--kora-green)',
                background: 'var(--kora-green-light)',
                padding: '6px 14px',
                borderRadius: 'var(--kora-r-pill)',
                border: '1px solid rgba(124,58,237,0.15)',
                flexShrink: 0,
              }}
            >
              <Shield size={13} />
              {user?.fullName?.split(' ')[0] ?? t('admin.admin_label')} · {t('admin.super_admin')}
            </div>
          </div>

          {/* Tab content */}
          <div className="ad-content">
            {tab === 'overview'  && <OverviewTab />}
            {tab === 'employers' && <EmployerTab onPendingUpdate={setPendingCount} />}
            {tab === 'jobs'      && <JobsTab />}
            {tab === 'seekers'   && <SeekersTab />}
            {tab === 'reports'   && <ReportsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}