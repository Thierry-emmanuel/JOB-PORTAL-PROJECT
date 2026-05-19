import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Building2, Briefcase, Users, BarChart3,
  LogOut, ChevronLeft, ChevronRight, Check, Ban, Trash2,
  Eye, Flag, AlertCircle, X, Search, TrendingUp,
  Award, Activity, CheckCircle, Clock, XCircle, Shield, Camera
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
import '../../styles/profile.css';
import '../../styles/admin-profile.css';
import koraLogo from '../../assets/absolute-size-logo.png';

// ─── Chart.js Helper Hook ──────────────────────────────────────────────────
function useChart(canvasRef, config, deps) {
  useEffect(() => {
    if (!canvasRef.current || typeof window === "undefined") return;
    let chart;
    const init = () => {
      if (!window.Chart) return;
      if (chart) chart.destroy();
      chart = new window.Chart(canvasRef.current, config());
    };
    if (window.Chart) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js";
      script.onload = init;
      document.head.appendChild(script);
    }
    return () => { if (chart) chart.destroy(); };
  }, deps);
}

// ─── Chart Components ───────────────────────────────────────────────────────
function UserGrowthChart({ data }) {
  const ref = useRef();
  useChart(ref, () => ({
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Job Seekers",
          data: data.jobSeekers,
          borderColor: "#7c3aed",
          backgroundColor: "rgba(124,58,237,0.08)",
          borderWidth: 2.5,
          pointBackgroundColor: "#7c3aed",
          pointRadius: 4,
          tension: 0.4,
          fill: true,
        },
        {
          label: "Employers",
          data: data.employers,
          borderColor: "#F97316",
          backgroundColor: "rgba(249,115,22,0.08)",
          borderWidth: 2.5,
          pointBackgroundColor: "#F97316",
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
        legend: { position: "top", labels: { font: { family: "Poppins", size: 12 }, boxWidth: 14, padding: 16 } },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        x: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { family: "Poppins" } } },
        y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { family: "Poppins" } } },
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
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Applications",
        data: values,
        backgroundColor: ["#7c3aed","#1a4a42","#F97316","#f5a05a","#b5c4c1","#3a5550"],
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
        x: { grid: { display: false }, ticks: { font: { family: "Poppins", size: 11 } } },
        y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { family: "Poppins" } } },
      },
    },
  }), [data]);
  return <canvas ref={ref} />;
}

function ApplicationStatusChart({ data }) {
  const ref = useRef();
  useChart(ref, () => ({
    type: "doughnut",
    data: {
      labels: Object.keys(data || {}),
      datasets: [{
        data: Object.values(data || {}),
        backgroundColor: ["#7c3aed","#F97316","#22c55e","#ef4444"],
        borderWidth: 3,
        borderColor: "#ffffff",
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: {
          position: "right",
          labels: { font: { family: "Poppins", size: 12 }, boxWidth: 14, padding: 14 },
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
    type: "pie",
    data: {
      labels: ["Active", "Expired", "Deleted"],
      datasets: [{
        data: [active, expired, deleted],
        backgroundColor: ["#7c3aed","#f59e0b","#ef4444"],
        borderWidth: 3,
        borderColor: "#ffffff",
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { font: { family: "Poppins", size: 12 }, boxWidth: 14, padding: 14 },
        },
      },
    },
  }), [active, expired, deleted]);
  return <canvas ref={ref} />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

const fmt = (v) => (v == null ? '—' : v);

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-CM', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

function StatusBadge({ status }) {
  const s = (status ?? '').toLowerCase();
  const map = {
    active: 'active', pending: 'pending', suspended: 'suspended',
    deleted: 'deleted', draft: 'draft', expired: 'expired',
    hired: 'hired', applied: 'active', shortlisted: 'pending', rejected: 'suspended',
  };
  return <span className={`ad-badge ${map[s] ?? 'draft'}`}>{status ?? '—'}</span>;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`ad-toast ${type === 'error' ? 'error' : ''}`}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}

// ─── Confirmation Modal ───────────────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel, danger = true, children }) {
  return (
    <div className="ad-modal-overlay" onClick={onCancel}>
      <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        {children}
        <div className="ad-modal-actions">
          <button onClick={onCancel}>Annuler</button>
          <button className={danger ? 'ad-btn-danger' : 'ad-btn-approve'} onClick={onConfirm}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Loading / Error ──────────────────────────────────────────────────────────
function Loading() {
  return (
    <div className="ad-spinner-wrap">
      <div className="ad-spinner" />
      <span>Chargement…</span>
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="ad-error-banner">
      <AlertCircle size={16} />
      {message}
    </div>
  );
}

// ─── Stat Card (from Employee Dashboard) ──────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Overview
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ pendingCount }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchOverviewStats()
      .then(setStats)
      .catch(() => setError('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorBanner message={error} />;
  if (!stats) return null;

  return (
    <>
      {/* ── KPI Cards ── */}
      <div className="ed-stats-row" style={{ marginBottom: '28px' }}>
        <StatCard label="Utilisateurs" value={stats.totalUsers?.toLocaleString() ?? 0} icon={<Users size={20} />} accent="#7c3aed" />
        <StatCard label="Chercheurs" value={stats.totalJobSeekers?.toLocaleString() ?? 0} icon={<Users size={20} />} accent="#1a4a42" />
        <StatCard label="Employeurs" value={stats.totalEmployers?.toLocaleString() ?? 0} icon={<Building2 size={20} />} accent="#F97316" />
        <StatCard label="Offres actives" value={stats.activeJobs?.toLocaleString() ?? 0} icon={<Briefcase size={20} />} accent="#7c3aed" />
        <StatCard label="Candidatures" value={stats.totalApplications?.toLocaleString() ?? 0} icon={<BarChart3 size={20} />} accent="#1a4a42" />
        <StatCard label="Taux d'embauche" value={`${stats.hireRate ?? 0}%`} icon={<CheckCircle size={20} />} accent="#22c55e" />
      </div>

      {/* Row 1: User Growth + Applications by Category */}
      <div className="kora-charts-row" style={{ marginBottom: '20px' }}>
        <div className="kora-chart-card">
          <div className="kora-chart-header">
            <TrendingUp size={16} />
            <h3>Croissance des utilisateurs (6 derniers mois)</h3>
          </div>
          <div className="kora-chart-area">
            {stats.usersOverTime ? (
              <UserGrowthChart data={stats.usersOverTime} />
            ) : (
              <div className="ad-empty">Aucune donnée disponible.</div>
            )}
          </div>
        </div>

        <div className="kora-chart-card">
          <div className="kora-chart-header">
            <BarChart3 size={16} />
            <h3>Candidatures par catégorie</h3>
          </div>
          <div className="kora-chart-area">
            {stats.applicationsByCategory && Object.keys(stats.applicationsByCategory).length > 0 ? (
              <ApplicationsByCategoryChart data={stats.applicationsByCategory} />
            ) : (
              <div className="ad-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Aucune candidature enregistrée.</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Application Status + Job Status */}
      <div className="kora-charts-row">
        <div className="kora-chart-card">
          <div className="kora-chart-header">
            <BarChart3 size={16} />
            <h3>Répartition des statuts de candidature</h3>
          </div>
          <div className="kora-chart-area">
            {stats.applicationStatusBreakdown && Object.keys(stats.applicationStatusBreakdown).length > 0 ? (
              <ApplicationStatusChart data={stats.applicationStatusBreakdown} />
            ) : (
              <div className="ad-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Aucun statut de candidature disponible.</div>
            )}
          </div>
        </div>

        <div className="kora-chart-card">
          <div className="kora-chart-header">
            <Briefcase size={16} />
            <h3>Offres d'emploi par statut</h3>
          </div>
          <div className="kora-chart-area">
            <JobStatusChart
              active={stats.activeJobs}
              expired={stats.expiredJobs}
              deleted={stats.deletedJobs}
            />
          </div>
          <div className="kora-hire-rate-callout" style={{ marginTop: '15px' }}>
            <span>Taux de conversion candidature-à-embauche</span>
            <strong>{stats.hireRate}%</strong>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Employer Management
// ═══════════════════════════════════════════════════════════════════════════════
function EmployerTab({ onPendingUpdate }) {
  const [employers, setEmployers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState(null); // { type, employer }
  const [toast, setToast]   = useState(null);

  const load = useCallback((f) => {
    setLoading(true);
    setError('');
    fetchEmployers(f)
      .then((data) => {
        setEmployers(data);
        // Employer uses isApproved (boolean) for approval state, isActive for suspension
        const pending = data.filter((e) => e.isApproved === false).length;
        onPendingUpdate?.(pending);
      })
      .catch(() => setError('Impossible de charger les employeurs.'))
      .finally(() => setLoading(false));
  }, [onPendingUpdate]);

  useEffect(() => { load(filter); }, [filter, load]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); };

  const handleAction = async () => {
    const { type, employer } = modal;
    setModal(null);
    try {
      if (type === 'approve')  await approveEmployer(employer.id ?? employer.userId);
      if (type === 'suspend')  await suspendEmployer(employer.id ?? employer.userId);
      if (type === 'delete')   await deleteEmployer(employer.id ?? employer.userId);
      showToast(`Employeur ${type === 'approve' ? 'approuvé' : type === 'suspend' ? 'suspendu' : 'supprimé'} avec succès.`);
      load(filter);
    } catch {
      showToast('Une erreur est survenue.', 'error');
    }
  };

  const tabs = [
    { key: 'all',      label: 'Tous' },
    { key: 'pending',  label: 'En attente' },
    { key: 'approved', label: 'Approuvés' },
    { key: 'suspended',label: 'Suspendus' },
  ];

  const filtered = employers.filter((e) => {
    const q = search.toLowerCase();
    // Employer extends User: name is in fullName, no companyName field
    return (
      !q ||
      (e.fullName ?? '').toLowerCase().includes(q) ||
      (e.email ?? '').toLowerCase().includes(q) ||
      (e.jobTitle ?? '').toLowerCase().includes(q) ||
      (e.city ?? '').toLowerCase().includes(q)
    );
  });

  // For 'suspended' filter, handle client-side since backend only has /approved and /pending
  const displayList = filter === 'suspended'
    ? filtered.filter((e) => e.isActive === false)
    : filtered;

  return (
    <>
      {error && <ErrorBanner message={error} />}
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* Filter + search */}
      <div className="ad-filter-bar">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`ad-filter-tab ${filter === t.key ? 'active' : ''}`}
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
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="ed-section">
        <div className="ed-section-header">
          <h2 className="ed-section-title">
            <Building2 size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
            Employeurs ({filtered.length})
          </h2>
        </div>

        {loading ? <Loading /> : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Statut</th>
                  <th>Inscrit le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayList.length === 0 ? (
                  <tr><td colSpan={6}><div className="ad-empty">Aucun employeur trouvé.</div></td></tr>
                ) : displayList.map((emp) => {
                  // Employer: isApproved=false → PENDING, isActive=false → SUSPENDED, otherwise ACTIVE
                  const status = emp.isApproved === false ? 'PENDING'
                    : emp.isActive === false ? 'SUSPENDED'
                    : 'ACTIVE';
                  const id = emp.id;
                  return (
                    <tr key={id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="ad-chip-avatar" style={{ width: 30, height: 30, fontSize: 12, background: '#7c3aed', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                            {(emp.fullName ?? '?')[0].toUpperCase()}
                          </div>
                          <strong>{fmt(emp.fullName)}</strong>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--kora-muted)' }}>{fmt(emp.jobTitle)}</td>
                      <td style={{ color: 'var(--kora-muted)', fontSize: 12 }}>{fmt(emp.email)}</td>
                      <td><StatusBadge status={status} /></td>
                      <td style={{ fontSize: 12 }}>{fmtDate(emp.createdAt)}</td>
                      <td>
                        <div className="ad-actions">
                          {status === 'PENDING' && (
                            <button
                              className="ad-btn ad-btn-approve"
                              onClick={() => setModal({ type: 'approve', employer: emp })}
                            >
                              <Check size={12} /> Approuver
                            </button>
                          )}
                          {status === 'ACTIVE' && (
                            <button
                              className="ad-btn ad-btn-suspend"
                              onClick={() => setModal({ type: 'suspend', employer: emp })}
                            >
                              <Ban size={12} /> Suspendre
                            </button>
                          )}
                          {status === 'SUSPENDED' && (
                            <button
                              className="ad-btn ad-btn-approve"
                              onClick={() => setModal({ type: 'approve', employer: emp })}
                            >
                              <Check size={12} /> Réactiver
                            </button>
                          )}
                          <button
                            className="ad-btn ad-btn-danger"
                            onClick={() => setModal({ type: 'delete', employer: emp })}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <ConfirmModal
          title={modal.type === 'approve' ? 'Approuver cet employeur ?' : modal.type === 'suspend' ? 'Suspendre cet employeur ?' : 'Supprimer cet employeur ?'}
          message={`${modal.type === 'delete' ? 'Cette action est irréversible. ' : ''}Voulez-vous vraiment ${modal.type === 'approve' ? 'approuver' : modal.type === 'suspend' ? 'suspendre' : 'supprimer'} l'employeur "${modal.employer.fullName}" ?`}
          danger={modal.type !== 'approve'}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Job Moderation
// ═══════════════════════════════════════════════════════════════════════════════
function JobsTab() {
  const [jobs, setJobs] = useState([]);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [modal, setModal]         = useState(null);
  const [flagReason, setFlagReason] = useState('');
  const [toast, setToast]         = useState(null);
  const [search, setSearch]       = useState('');

  const load = useCallback((f, p) => {
    setLoading(true);
    setError('');
    fetchAdminJobs({ status: f, page: p, size: 20 })
      .then((data) => {
        const content = Array.isArray(data) ? data : data.content ?? [];
        setJobs(content);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => setError('Impossible de charger les offres.'))
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
      showToast(`Offre ${type === 'approve' ? 'approuvée' : type === 'flag' ? 'signalée' : 'supprimée'}.`);
      load(filter, page);
    } catch {
      showToast('Une erreur est survenue.', 'error');
    }
    setFlagReason('');
  };

  const tabs = [
    { key: '', label: 'Toutes' },
    { key: 'ACTIVE',  label: 'Actives' },
    { key: 'DRAFT',   label: 'Brouillon' },
    { key: 'EXPIRED', label: 'Expirées' },
    { key: 'DELETED', label: 'Supprimées' },
  ];

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    return !q || (j.title ?? '').toLowerCase().includes(q) || (j.companyName ?? '').toLowerCase().includes(q);
  });

  return (
    <>
      {error && <ErrorBanner message={error} />}
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="ad-filter-bar">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`ad-filter-tab ${filter === t.key ? 'active' : ''}`}
            onClick={() => { setFilter(t.key); setPage(0); }}
          >
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div className="ad-search-wrap">
          <Search className="ad-search-icon" size={14} />
          <input className="ad-search" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="ed-section">
        <div className="ed-section-header">
          <h2 className="ed-section-title">
            <Briefcase size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> 
            Offres d'emploi ({filtered.length})
          </h2>
        </div>

        {loading ? <Loading /> : (
          <>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Employeur</th>
                    <th>Catégorie</th>
                    <th>Statut</th>
                    <th>Publié le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6}><div className="ad-empty">Aucune offre trouvée.</div></td></tr>
                  ) : filtered.map((job) => {
                    const id = job.id ?? job.jobId;
                    const status = (job.postingStatus ?? job.status ?? 'DRAFT').toUpperCase();
                    return (
                      <tr key={id}>
                        <td><strong style={{ fontSize: 13 }}>{fmt(job.title)}</strong></td>
                        <td style={{ fontSize: 12 }}>{fmt(job.companyName ?? job.employerName)}</td>
                        <td style={{ fontSize: 12, color: 'var(--kora-muted)' }}>{fmt(job.categoryId ?? job.category)}</td>
                        <td><StatusBadge status={status} /></td>
                        <td style={{ fontSize: 12 }}>{fmtDate(job.createdAt ?? job.postedAt)}</td>
                        <td>
                          <div className="ad-actions">
                            {status !== 'ACTIVE' && (
                              <button className="ad-btn ad-btn-approve" onClick={() => setModal({ type: 'approve', job })}>
                                <Check size={12} /> Approuver
                              </button>
                            )}
                            {status === 'ACTIVE' && (
                              <button className="ad-btn ad-btn-flag" onClick={() => { setFlagReason(''); setModal({ type: 'flag', job }); }}>
                                <Flag size={12} /> Signaler
                              </button>
                            )}
                            <button className="ad-btn ad-btn-danger" onClick={() => setModal({ type: 'delete', job })}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="ad-pagination">
                <span className="ad-pagination-info">
                  Page {page + 1} sur {totalPages}
                </span>
                <div className="ad-pagination-controls">
                  <button className="ad-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                    <button
                      key={i}
                      className={`ad-page-btn ${i === page ? 'active' : ''}`}
                      onClick={() => setPage(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button className="ad-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {modal && modal.type === 'flag' && (
        <ConfirmModal
          title="Signaler cette offre ?"
          message={`Passer l'offre "${modal.job.title}" en brouillon. Indiquez la raison :`}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
          danger
        >
          <textarea
            className="ad-textarea"
            placeholder="Raison du signalement…"
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
          />
        </ConfirmModal>
      )}

      {modal && modal.type !== 'flag' && (
        <ConfirmModal
          title={modal.type === 'approve' ? 'Approuver cette offre ?' : 'Supprimer cette offre ?'}
          message={`Voulez-vous vraiment ${modal.type === 'approve' ? 'approuver' : 'supprimer définitivement'} l'offre "${modal.job.title}" ?`}
          danger={modal.type === 'delete'}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — User Management (Job Seekers)
// ═══════════════════════════════════════════════════════════════════════════════
function SeekersTab() {
  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(null);
  const [toast, setToast]     = useState(null);
  const [slideOver, setSlideOver] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchJobSeekers()
      .then(setSeekers)
      .catch(() => setError('Impossible de charger les chercheurs d\'emploi.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSuspend = async () => {
    const s = modal;
    setModal(null);
    try {
      await suspendJobSeeker(s.id ?? s.seekerId ?? s.userId);
      setSeekers((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: 'SUSPENDED', isActive: false } : x)));
      setToast({ msg: 'Chercheur suspendu avec succès.', type: 'success' });
    } catch {
      setToast({ msg: 'Erreur lors de la suspension.', type: 'error' });
    }
  };

  const filtered = seekers.filter((s) => {
    const q = search.toLowerCase();
    // JobSeeker extends User: name is in fullName
    return !q || (s.fullName ?? '').toLowerCase().includes(q) || (s.email ?? '').toLowerCase().includes(q);
  });

  return (
    <>
      {error && <ErrorBanner message={error} />}
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="ad-filter-bar">
        <div className="ad-search-wrap">
          <Search className="ad-search-icon" size={14} />
          <input className="ad-search" placeholder="Rechercher par nom ou email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="ed-section">
        <div className="ed-section-header">
          <h2 className="ed-section-title">
            <Users size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} /> 
            Chercheurs d'emploi ({filtered.length})
          </h2>
        </div>

        {loading ? <Loading /> : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Compétences</th>
                  <th>Statut</th>
                  <th>Inscrit le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><div className="ad-empty">Aucun résultat.</div></td></tr>
                ) : filtered.map((s) => {
                  const status = s.status ?? (s.isActive === false ? 'SUSPENDED' : 'ACTIVE');
                  const skills = Array.isArray(s.keywords) ? s.keywords : [];
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="ad-chip-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                            {initials(s.fullName ?? s.email ?? '')}
                          </div>
                          <strong>{fmt(s.fullName || s.email)}</strong>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--kora-muted)' }}>{fmt(s.email)}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxWidth: 200 }}>
                          {skills.slice(0, 3).map((sk) => <span key={sk} className="ad-skill-chip">{sk}</span>)}
                          {skills.length > 3 && <span className="ad-skill-chip">+{skills.length - 3}</span>}
                          {skills.length === 0 && <span style={{ color: 'var(--kora-muted)', fontSize: 12 }}>—</span>}
                        </div>
                      </td>
                      <td><StatusBadge status={status} /></td>
                      <td style={{ fontSize: 12 }}>{fmtDate(s.createdAt)}</td>
                      <td>
                        <div className="ad-actions">
                          <button className="ad-btn ad-btn-view" onClick={() => setSlideOver(s)}>
                            <Eye size={12} /> Profil
                          </button>
                          {status.toUpperCase() !== 'SUSPENDED' && (
                            <button className="ad-btn ad-btn-suspend" onClick={() => setModal(s)}>
                              <Ban size={12} /> Suspendre
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm suspend modal */}
      {modal && (
        <ConfirmModal
          title="Suspendre ce chercheur ?"
          message={`Voulez-vous suspendre "${modal.fullName ?? modal.email}" ?`}
          danger
          onConfirm={handleSuspend}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Slide-over profile panel */}
      {slideOver && (
        <>
          <div className="ad-slideover-overlay" onClick={() => setSlideOver(null)} />
          <div className="ad-slideover">
            <div className="ad-slideover-header">
              <h3>Profil du chercheur</h3>
              <button className="ad-slideover-close" onClick={() => setSlideOver(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="ad-slideover-body">
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: 'var(--kora-green)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 800,
                }}>
                  {initials(slideOver.fullName ?? slideOver.email ?? '')}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--kora-ink)' }}>
                    {slideOver.fullName || '—'}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--kora-muted)' }}>{slideOver.profileSummary ?? 'Chercheur d\'emploi'}</div>
                </div>
              </div>{/* end avatar+name flex row */}

              <div className="ad-detail-section">
                <div className="ad-detail-section-title">Informations générales</div>
                {[
                  ['Email', slideOver.email],
                  ['Téléphone', slideOver.phone],
                  ['Ville', slideOver.city],
                  ['Région', slideOver.region],
                  ['Inscrit le', fmtDate(slideOver.createdAt)],
                  ['Statut', slideOver.isActive === false ? 'SUSPENDED' : 'ACTIVE'],
                  ['Ouvert au travail', slideOver.isOpenToWork ? 'Oui' : 'Non'],
                  ['LinkedIn', slideOver.linkedInUrl],
                  ['Portfolio', slideOver.portfolioUrl],
                ].map(([k, v]) => (
                  <div key={k} className="ad-detail-row">
                    <span className="key">{k}</span>
                    <span className="val">{fmt(v)}</span>
                  </div>
                ))}
              </div>

              {(slideOver.keywords?.length > 0 || slideOver.skills?.length > 0) && (
                <div className="ad-detail-section">
                  <div className="ad-detail-section-title">Compétences</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(slideOver.keywords ?? slideOver.skills ?? []).map((sk) => (
                      <span key={sk} className="ad-skill-chip">{sk}</span>
                    ))}
                  </div>
                </div>
              )}

              {slideOver.degree && (
                <div className="ad-detail-section">
                  <div className="ad-detail-section-title">Formation</div>
                  <div className="ad-detail-row">
                    <span className="key">Diplôme</span>
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

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5 — Platform Reports
// ═══════════════════════════════════════════════════════════════════════════════
function ReportsTab() {
  const [jobs, setJobs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const barRef = useRef(null);
  const barChart = useRef(null);

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
      .catch(() => setError('Impossible de charger les rapports.'))
      .finally(() => setLoading(false));
  }, []);

  // Compute metrics
  const totalApps = jobs.reduce((acc, j) => acc + (j.applicationCount ?? 0), 0);
  const hired     = jobs.reduce((acc, j) => acc + (j.hiredCount ?? 0), 0);
  // JobListingSummary has status (PostingStatus enum) not postingStatus
  const activeJ   = jobs.filter((j) => (j.status ?? '').toString().toUpperCase() === 'ACTIVE');
  const hireRate  = totalApps > 0 ? ((hired / totalApps) * 100).toFixed(1) : '—';
  const avgApps   = activeJ.length > 0 ? (totalApps / activeJ.length).toFixed(1) : '—';

  // Category aggregation — JobListingSummary has 'categoryName' field
  const catMap = {};
  jobs.forEach((j) => {
    const cat = j.categoryName ?? j.category ?? j.categoryId ?? 'Autre';
    catMap[cat] = (catMap[cat] ?? 0) + (j.applicationCount ?? 1);
  });
  const topCats = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const mostActive = topCats[0]?.[0] ?? '—';

  // Bar chart
  const buildBar = useCallback(() => {
    if (!window.Chart || !barRef.current || topCats.length === 0) return;
    if (barChart.current) { barChart.current.destroy(); barChart.current = null; }
    barChart.current = new window.Chart(barRef.current, {
      type: 'bar',
      data: {
        labels: topCats.map(([k]) => k),
        datasets: [{
          label: 'Candidatures',
          data: topCats.map(([, v]) => v),
          backgroundColor: [
            '#7c3aed','#F97316','#3B82F6','#7C3AED','#EF4444','#10B981',
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
          x: { beginAtZero: true, ticks: { font: { family: 'Poppins', size: 11 }, precision: 0 } },
          y: { ticks: { font: { family: 'Poppins', size: 11 } } },
        },
      },
    });
  }, [topCats]);

  useChart(barRef, () => ({
    type: 'bar',
    data: {
      labels: topCats.map(([k]) => k),
      datasets: [{
        label: 'Candidatures',
        data: topCats.map(([, v]) => v),
        backgroundColor: [
          '#7c3aed','#F97316','#3B82F6','#7C3AED','#EF4444','#10B981',
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
        x: { beginAtZero: true, ticks: { font: { family: 'Poppins', size: 11 }, precision: 0 } },
        y: { ticks: { font: { family: 'Poppins', size: 11 } } },
      },
    },
  }), [topCats]);

  if (loading) return <Loading />;

  return (
    <>
      {error && <ErrorBanner message={error} />}

      <div className="ed-stats-row" style={{ marginBottom: '28px' }}>
        <StatCard label="Taux d'embauche" value={`${hireRate}${hireRate !== '—' ? '%' : ''}`} icon={<CheckCircle size={20} />} accent="#22c55e" delta="Candidatures → Embauches" />
        <StatCard label="Catégorie active" value={mostActive} icon={<Activity size={20} />} accent="#F97316" delta="Par nombre d'offres" />
        <StatCard label="Moy. candidatures" value={avgApps} icon={<TrendingUp size={20} />} accent="#3B82F6" delta="Par offre active" />
      </div>

      <div className="ed-section">
        <div className="ed-section-header">
          <h2 className="ed-section-title">Candidatures par catégorie (Top 6)</h2>
        </div>
        <div className="ad-chart-wrap" style={{ height: 260 }}>
          {topCats.length > 0 ? (
            <canvas ref={barRef} />
          ) : (
            <div className="ad-empty" style={{ paddingTop: 24 }}>
              Aucune donnée de catégorie disponible pour le moment.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT — AdminDashboard
// ═══════════════════════════════════════════════════════════════════════════════
const TAB_TITLES = {
  overview:  { title: 'Vue d\'ensemble',    sub: 'Tableau de bord administrateur KORA' },
  employers: { title: 'Gestion des employeurs', sub: 'Approbation, suspension et suppression' },
  jobs:      { title: 'Modération des offres', sub: 'Approbation et suppression des annonces' },
  seekers:   { title: 'Chercheurs d\'emploi', sub: 'Gestion des profils candidats' },
  reports:   { title: 'Rapports & analyses', sub: 'Métriques de la plateforme' },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab]           = useState('overview');
  const [pendingCount, setPendingCount] = useState(0);

  const { title, sub } = TAB_TITLES[tab] || TAB_TITLES.overview;

  const firstName  = user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Admin';

  return (
    <div className="ed-root admin">
      <KoraNav />
      <div className="ed-body">
        
        {/* ════════ SIDEBAR ════════ */}
        <aside className="ed-sidebar kora-sidebar kora-admin-sidebar">
          <AdminSidebar activeTab={tab} setActiveTab={setTab} />
        </aside>

        {/* ════════ MAIN CONTENT ════════ */}
        <main className="ed-main">
          
          {/* Welcome */}
          <div className="ed-welcome">
            <div>
              <h1 className="ed-welcome-title">
                {title}
              </h1>
              <p className="ed-welcome-sub">
                {sub}
              </p>
            </div>
          </div>

          {/* Content Route */}
          <div className="ad-content" style={{ padding: 0 }}>
            {tab === 'overview'  && <OverviewTab pendingCount={pendingCount} />}
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