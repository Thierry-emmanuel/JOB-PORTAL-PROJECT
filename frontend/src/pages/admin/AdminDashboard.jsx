import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Building2, Briefcase, Users, BarChart3,
  LogOut, ChevronLeft, ChevronRight, Check, Ban, Trash2,
  Eye, Flag, AlertCircle, X, Search, TrendingUp,
  Award, Activity, CheckCircle, Clock, XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchEmployers, approveEmployer, suspendEmployer, deleteEmployer,
  fetchAdminJobs, approveJob, flagJob, deleteJob,
  fetchJobSeekers, suspendJobSeeker,
  fetchOverviewStats, fetchMarketInsights,
} from '../../api/admin';
import '../../styles/admin-dashboard.css';
import KoraLogo from '../../assets/absolute-size-logo.png';

// ─── Chart.js ─────────────────────────────────────────────────────────────────
// Chart.js is loaded via CDN script (same pattern as AdminProfile.jsx)
// This ref pattern avoids re-loading it if already present
const CHART_CDN = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js';

function useChartJs(cb, deps) {
  const called = useRef(false);
  useEffect(() => {
    if (window.Chart) { if (!called.current) { called.current = true; cb(); } return; }
    const s = document.createElement('script');
    s.src = CHART_CDN;
    s.onload = () => { if (!called.current) { called.current = true; cb(); } };
    document.head.appendChild(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
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

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Overview
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ pendingCount }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const lineRef  = useRef(null);
  const doughRef = useRef(null);
  const lineChart  = useRef(null);
  const doughChart = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetchOverviewStats()
      .then(setStats)
      .catch(() => setError('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false));
  }, []);

  const buildCharts = useCallback(() => {
    if (!window.Chart || !stats) return;
    const C = window.Chart;

    // Destroy previous instances
    if (lineChart.current)  { lineChart.current.destroy();  lineChart.current  = null; }
    if (doughChart.current) { doughChart.current.destroy(); doughChart.current = null; }

    // Line chart — User growth (mock monthly data)
    if (lineRef.current) {
      const labels = ['Dec', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai'];
      const seekers = stats.seekers?.length ?? 0;
      const employers = stats.employers?.length ?? 0;
      const growth = (base, total) =>
        Array.from({ length: 6 }, (_, i) => Math.round(total * (0.4 + i * 0.12 + Math.random() * 0.06)));

      lineChart.current = new C(lineRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Chercheurs d\'emploi',
              data: growth(0, seekers),
              borderColor: '#1A5C2E',
              backgroundColor: 'rgba(26,92,46,0.08)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: '#1A5C2E',
              pointRadius: 4,
            },
            {
              label: 'Employeurs',
              data: growth(0, employers),
              borderColor: '#F97316',
              backgroundColor: 'rgba(249,115,22,0.08)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: '#F97316',
              pointRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { family: 'Poppins', size: 11 } } } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { family: 'Poppins', size: 11 } } },
            y: { beginAtZero: true, ticks: { font: { family: 'Poppins', size: 11 }, precision: 0 } },
          },
        },
      });
    }

    // Doughnut chart — Application status
    if (doughRef.current) {
      const total = stats.totalApplications || 40;
      doughChart.current = new C(doughRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Soumises', 'Présélection', 'Embauchés', 'Rejetées'],
          datasets: [{
            data: [
              Math.round(total * 0.45),
              Math.round(total * 0.25),
              Math.round(total * 0.15),
              Math.round(total * 0.15),
            ],
            backgroundColor: ['#1A5C2E', '#F97316', '#3B82F6', '#EF4444'],
            borderWidth: 0,
            hoverOffset: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { family: 'Poppins', size: 11 }, padding: 12 },
            },
          },
        },
      });
    }
  }, [stats]);

  useChartJs(buildCharts, [stats]);
  useEffect(() => { if (stats) buildCharts(); }, [stats, buildCharts]);

  if (loading) return <Loading />;

  return (
    <>
      {error && <ErrorBanner message={error} />}

      {/* Stat Cards */}
      <div className="ad-stats-row">
        <div className="ad-stat-card">
          <div className="ad-stat-header">
            <span className="ad-stat-label">Utilisateurs totaux</span>
            <span className="ad-stat-icon green"><Users size={18} /></span>
          </div>
          <div className="ad-stat-value">{stats?.totalUsers ?? 0}</div>
          <div className="ad-stat-sub">Chercheurs + Employeurs</div>
        </div>

        <div className="ad-stat-card">
          <div className="ad-stat-header">
            <span className="ad-stat-label">Offres actives</span>
            <span className="ad-stat-icon blue"><Briefcase size={18} /></span>
          </div>
          <div className="ad-stat-value">{stats?.activeJobs ?? 0}</div>
          <div className="ad-stat-sub">Postes publiés</div>
        </div>

        <div className="ad-stat-card">
          <div className="ad-stat-header">
            <span className="ad-stat-label">Approbations en attente</span>
            <span className="ad-stat-icon orange"><Clock size={18} /></span>
          </div>
          <div className="ad-stat-value">
            {stats?.pendingApprovals ?? pendingCount ?? 0}
          </div>
          {(stats?.pendingApprovals || pendingCount) > 0 && (
            <div className="ad-stat-sub">
              <span className="ad-stat-badge">Action requise</span>
            </div>
          )}
          {!(stats?.pendingApprovals || pendingCount) && (
            <div className="ad-stat-sub">Aucune en attente</div>
          )}
        </div>

        <div className="ad-stat-card">
          <div className="ad-stat-header">
            <span className="ad-stat-label">Candidatures totales</span>
            <span className="ad-stat-icon purple"><Activity size={18} /></span>
          </div>
          <div className="ad-stat-value">{stats?.totalApplications ?? 0}</div>
          <div className="ad-stat-sub">Toutes périodes confondues</div>
        </div>
      </div>

      {/* Charts */}
      <div className="ad-charts-row">
        <div className="ad-chart-card">
          <p className="ad-chart-title">Croissance des utilisateurs (6 derniers mois)</p>
          <div className="ad-chart-wrap">
            <canvas ref={lineRef} />
          </div>
        </div>
        <div className="ad-chart-card">
          <p className="ad-chart-title">Statuts des candidatures</p>
          <div className="ad-chart-wrap">
            <canvas ref={doughRef} />
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
        const pending = data.filter((e) => (e.status ?? '').toLowerCase() === 'pending' || !e.isActive).length;
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
    return (
      !q ||
      (e.companyName ?? '').toLowerCase().includes(q) ||
      (e.email ?? '').toLowerCase().includes(q) ||
      (e.contactPerson ?? '').toLowerCase().includes(q)
    );
  });

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

      <div className="ad-table-card">
        <div className="ad-table-header">
          <span className="ad-table-title">
            <Building2 size={16} />
            Employeurs ({filtered.length})
          </span>
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
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><div className="ad-empty">Aucun employeur trouvé.</div></td></tr>
                ) : filtered.map((emp) => {
                  const status = (emp.status ?? (emp.isActive ? 'ACTIVE' : 'PENDING')).toUpperCase();
                  const id = emp.id ?? emp.userId;
                  return (
                    <tr key={id}>
                      <td><strong>{fmt(emp.companyName)}</strong></td>
                      <td>{fmt(emp.contactPerson)}</td>
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
          message={`${modal.type === 'delete' ? 'Cette action est irréversible. ' : ''}Voulez-vous vraiment ${modal.type === 'approve' ? 'approuver' : modal.type === 'suspend' ? 'suspendre' : 'supprimer'} l'employeur "${modal.employer.companyName}" ?`}
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

      <div className="ad-table-card">
        <div className="ad-table-header">
          <span className="ad-table-title"><Briefcase size={16} /> Offres d'emploi ({filtered.length})</span>
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
    const name = `${s.firstName ?? ''} ${s.lastName ?? ''}`.toLowerCase();
    return !q || name.includes(q) || (s.email ?? '').toLowerCase().includes(q);
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

      <div className="ad-table-card">
        <div className="ad-table-header">
          <span className="ad-table-title"><Users size={16} /> Chercheurs d'emploi ({filtered.length})</span>
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
                    <tr key={s.id ?? s.seekerId ?? s.userId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="ad-chip-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                            {initials(`${s.firstName ?? ''} ${s.lastName ?? ''}`)}
                          </div>
                          <strong>{fmt(`${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s.email)}</strong>
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
          message={`Voulez-vous suspendre "${modal.firstName} ${modal.lastName}" ?`}
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
                  {initials(`${slideOver.firstName ?? ''} ${slideOver.lastName ?? ''}`)}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--kora-ink)' }}>
                    {`${slideOver.firstName ?? ''} ${slideOver.lastName ?? ''}`.trim() || '—'}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--kora-muted)' }}>{slideOver.headline ?? 'Chercheur d\'emploi'}</div>
                </div>
              </div>

              <div className="ad-detail-section">
                <div className="ad-detail-section-title">Informations générales</div>
                {[
                  ['Email', slideOver.email],
                  ['Téléphone', slideOver.phone],
                  ['Localisation', slideOver.locationId ?? slideOver.city],
                  ['Expérience', slideOver.totalExperience ? `${slideOver.totalExperience} ans` : null],
                  ['Inscrit le', fmtDate(slideOver.createdAt)],
                  ['Statut', slideOver.status ?? (slideOver.isActive !== false ? 'ACTIVE' : 'SUSPENDED')],
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
  const activeJ   = jobs.filter((j) => (j.postingStatus ?? j.status ?? '').toUpperCase() === 'ACTIVE');
  const hireRate  = totalApps > 0 ? ((hired / totalApps) * 100).toFixed(1) : '—';
  const avgApps   = activeJ.length > 0 ? (totalApps / activeJ.length).toFixed(1) : '—';

  // Category aggregation
  const catMap = {};
  jobs.forEach((j) => {
    const cat = j.category ?? j.categoryId ?? 'Autre';
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
            '#1A5C2E','#F97316','#3B82F6','#7C3AED','#EF4444','#10B981',
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

  useChartJs(buildBar, [jobs]);
  useEffect(() => { if (!loading) buildBar(); }, [loading, buildBar]);

  if (loading) return <Loading />;

  return (
    <>
      {error && <ErrorBanner message={error} />}

      <div className="ad-reports-kpi-row">
        <div className="ad-kpi-card">
          <div className="ad-kpi-label">Taux d'embauche</div>
          <div className="ad-kpi-value">{hireRate}{hireRate !== '—' ? '%' : ''}</div>
          <div className="ad-kpi-sub">Candidatures → Embauches</div>
        </div>
        <div className="ad-kpi-card orange">
          <div className="ad-kpi-label">Catégorie la plus active</div>
          <div className="ad-kpi-value" style={{ fontSize: 22, marginTop: 4 }}>{mostActive}</div>
          <div className="ad-kpi-sub">Par nombre d'offres</div>
        </div>
        <div className="ad-kpi-card blue">
          <div className="ad-kpi-label">Moy. candidatures/offre</div>
          <div className="ad-kpi-value">{avgApps}</div>
          <div className="ad-kpi-sub">Sur offres actives</div>
        </div>
      </div>

      <div className="ad-chart-card">
        <p className="ad-chart-title">Candidatures par catégorie (Top 6)</p>
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
const NAV_ITEMS = [
  { key: 'overview',   label: 'Vue d\'ensemble',    Icon: LayoutDashboard },
  { key: 'employers',  label: 'Employeurs',          Icon: Building2 },
  { key: 'jobs',       label: 'Offres d\'emploi',    Icon: Briefcase },
  { key: 'seekers',    label: 'Chercheurs d\'emploi',Icon: Users },
  { key: 'reports',    label: 'Rapports',            Icon: BarChart3 },
];

const TAB_TITLES = {
  overview:  { title: 'Vue d\'ensemble',    sub: 'Tableau de bord administrateur KORA' },
  employers: { title: 'Gestion des employeurs', sub: 'Approbation, suspension et suppression' },
  jobs:      { title: 'Modération des offres', sub: 'Approbation et suppression des annonces' },
  seekers:   { title: 'Chercheurs d\'emploi', sub: 'Gestion des profils candidats' },
  reports:   { title: 'Rapports & analyses', sub: 'Métriques de la plateforme' },
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab]           = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const adminName = user?.name ?? user?.email ?? 'Admin';
  const { title, sub } = TAB_TITLES[tab];

  return (
    <div className="ad-shell">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className={`ad-sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Logo + burger in one bar — height matches topbar (68px) */}
        <div className="ad-sidebar-logo">
          <img src={KoraLogo} alt="KORA" className="ad-logo-img" />
          <div className="ad-logo-text">
            <span className="ad-logo-name">KORA</span>
            <span className="ad-logo-sub">Admin Panel</span>
          </div>
          <button
            className="ad-burger"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <span className="ad-burger-bar" />
            <span className="ad-burger-bar" />
            <span className="ad-burger-bar" />
          </button>
        </div>

        {/* Nav */}
        <nav className="ad-nav">
          <div className="ad-nav-section">
            {!collapsed && <div className="ad-nav-section-title">Navigation</div>}
            {NAV_ITEMS.map(({ key, label, Icon }) => (
              <div
                key={key}
                className={`ad-nav-item ${tab === key ? 'active' : ''}`}
                onClick={() => setTab(key)}
                title={collapsed ? label : undefined}
              >
                <Icon className="ad-nav-icon" />
                <span className="ad-nav-label">{label}</span>
                {key === 'employers' && pendingCount > 0 && (
                  <span className="ad-nav-badge">{pendingCount}</span>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="ad-sidebar-footer">
          <div className="ad-avatar">{initials(adminName)}</div>
          <div className="ad-sidebar-footer-info">
            <div className="ad-footer-name">{adminName}</div>
            <div className="ad-footer-role">Administrateur</div>
          </div>
          <button className="ad-logout-btn" onClick={logout} title="Déconnexion">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <div className="ad-main">
        {/* Top bar */}
        <div className="ad-topbar">
          <div className="ad-topbar-left">
            <h1>{title}</h1>
            <p>{sub}</p>
          </div>
          <div className="ad-topbar-right">
            {pendingCount > 0 && (
              <div
                style={{
                  background: 'var(--kora-orange-light)',
                  color: 'var(--kora-orange)',
                  borderRadius: 'var(--kora-r-pill)',
                  padding: '5px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
                onClick={() => setTab('employers')}
              >
                <Clock size={13} />
                {pendingCount} approbation{pendingCount > 1 ? 's' : ''} en attente
              </div>
            )}
            <div className="ad-chip">
              <div className="ad-chip-avatar">{initials(adminName)}</div>
              <span className="ad-chip-name">{adminName}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="ad-content">
          {tab === 'overview'  && <OverviewTab pendingCount={pendingCount} />}
          {tab === 'employers' && <EmployerTab onPendingUpdate={setPendingCount} />}
          {tab === 'jobs'      && <JobsTab />}
          {tab === 'seekers'   && <SeekersTab />}
          {tab === 'reports'   && <ReportsTab />}
        </div>
      </div>
    </div>
  );
}