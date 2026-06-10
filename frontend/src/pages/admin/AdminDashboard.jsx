/**
 * AdminDashboard.jsx — PART 2 PATCH
 * ─────────────────────────────────────────────────────────────────────
 * This is the complete, corrected AdminDashboard.jsx.
 *
 * Changes in this revision
 * ─────────────────────────
 * 1. BANNER LOGIC: `showWelcome` is now ONLY true when tab === 'overview'.
 *    All sub-navigation tabs (users, reports, employers, etc.) never show
 *    the welcome hero banner. The `PageHead` component enforces this.
 *
 * 2. ADMIN HERO REDESIGN: The overview welcome banner has been elevated
 *    to a premium, presentation-ready hero with:
 *    • Live time-aware greeting with role badge pill
 *    • Three live KPI inline chips (Users · Jobs · Applications)
 *    • Decorative animated geometry (pure CSS)
 *    • High-contrast gradient with refined typography
 *
 * 3. MODAL AUDIT: All `adm-overlay / adm-modal` confirm dialogs now use
 *    the correct z-index (9000), escape-key close, and scroll-lock.
 *
 * 4. UX UNIFICATION: Color tokens, typography, and card layouts match
 *    the Employee and Employer dashboards via shared CSS variable names.
 *
 * Regression prevention
 * ─────────────────────
 * • Every existing tab component (OverviewTab, UsersTab, …) is preserved
 *   exactly — only PageHead and the banner JSX/CSS block change.
 * • API calls, state shape, and routing logic are unchanged.
 * • `showToast` pattern is unchanged.
 * ─────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Building2, Briefcase, Users, BarChart3, ChevronLeft, ChevronRight,
  Check, Ban, Trash2, Eye, Flag, AlertCircle, X, Search, TrendingUp,
  Activity, CheckCircle, Shield, Plus, Edit2, Bell, Save, RefreshCw,
  Globe, Image, Type, AlignLeft, ToggleLeft, ToggleRight, Send,
  MessageSquare, Mail, Phone, Calendar, ClipboardList, CalendarClock,
  Award, FileText, ShieldCheck, Upload, Download, Filter, SortDesc,
  Sliders, Hash, Layers, Menu, Zap, Star,
} from 'lucide-react';
import koraLogo from '../../assets/absolute-size-logo.png';
import { useAuth } from '../../context/AuthContext';
import {
  fetchEmployers, approveEmployer, suspendEmployer, deleteEmployer,
  fetchAdminJobs, approveJob, flagJob, deleteJob,
  fetchJobSeekers, suspendJobSeeker,
  fetchOverviewStats, fetchMarketInsights,
  fetchAllApplications, updateApplicationStatus,
  fetchAdminUsers, toggleUserStatus,
  fetchUserById, createAdminUser, updateAdminUser, hardDeleteUser,
  fetchCategories, createCategory, deleteCategory,
  fetchSkills, createSkill, deleteSkill,
  fetchFAQs, createFAQ, updateFAQ, deleteFAQ,
  broadcastNotification,
} from '../../api/admin';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { HeroEditor, CMSTab } from './CMSPanel';
import '../../styles/admin-dashboard.css';
import '../../styles/dashboard-shell.css';
/* ═══════════════════════════════════════════════════════════════════
   CHART UTILITIES
   ═══════════════════════════════════════════════════════════════════ */
function useChart(ref, configFn, deps) {
  useEffect(() => {
    if (!ref.current) return;
    let chart;
    const build = () => {
      if (!window.Chart) return;
      const existing = window.Chart.getChart(ref.current);
      if (existing) existing.destroy();
      if (chart) chart.destroy();
      chart = new window.Chart(ref.current, configFn());
    };
    if (window.Chart) { build(); }
    else {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js';
      s.onload = build;
      document.head.appendChild(s);
    }
    return () => {
      if (chart) { chart.destroy(); chart = null; }
      if (ref.current && window.Chart) {
        const lingering = window.Chart.getChart(ref.current);
        if (lingering) lingering.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const FONT = 'Sora, sans-serif';
const C = {
  purple: '#7c3aed', green: '#059669', orange: '#f97316',
  blue: '#3b82f6', teal: '#0d9488', rose: '#e11d48',
  amber: '#d97706', sky: '#0ea5e9', slate: '#64748b',
};

function LineChart({ labels, datasets }) {
  const ref = useRef();
  useChart(ref, () => ({
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { family: FONT, size: 12 }, boxWidth: 12 } }, tooltip: { mode: 'index', intersect: false } },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { family: FONT, size: 11 } } },
        y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { family: FONT, size: 11 } } },
      },
    },
  }), [labels, datasets]);
  return <canvas ref={ref} />;
}

function DoughnutChart({ labels, values, colors }) {
  const ref = useRef();
  useChart(ref, () => ({
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors, borderWidth: 3, borderColor: '#fff', hoverOffset: 6 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: {
        legend: { position: 'right', labels: { font: { family: FONT, size: 12 }, boxWidth: 12, padding: 12 } },
        tooltip: { callbacks: { label: (ctx) => { const t = ctx.dataset.data.reduce((a,b)=>a+b,0); return ` ${ctx.label}: ${ctx.parsed} (${((ctx.parsed/t)*100).toFixed(1)}%)`; } } },
      },
    },
  }), [labels, values, colors]);
  return <canvas ref={ref} />;
}

function BarChart({ labels, values, horizontal = false }) {
  const ref = useRef();
  useChart(ref, () => ({
    type: 'bar',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: [C.purple,C.orange,C.blue,C.teal,C.rose,C.amber], borderRadius: 6, borderSkipped: false }],
    },
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: !horizontal }, ticks: { font: { family: FONT, size: 11 } } },
        y: { grid: { display: horizontal }, ticks: { font: { family: FONT, size: 11 } }, beginAtZero: true },
      },
    },
  }), [labels, values, horizontal]);
  return <canvas ref={ref} />;
}

/* ═══════════════════════════════════════════════════════════════════
   SHARED UI ATOMS
   ═══════════════════════════════════════════════════════════════════ */
const fmt     = v => v == null ? '—' : v;
const fmtNum  = v => v == null ? '—' : Number(v).toLocaleString();
const fmtDate = d => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-CM', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};
const initials = (name = '') => name.split(' ').slice(0,2).map(w => w[0]?.toUpperCase()??'').join('') || '?';

function Badge({ status }) {
  const s = (status??'').toLowerCase();
  const map = { active:'active', pending:'pending', suspended:'suspended', deleted:'deleted',
    draft:'draft', expired:'expired', hired:'hired', applied:'applied',
    shortlisted:'pending', rejected:'suspended', inactive:'suspended' };
  return <span className={`adm-badge ${map[s]??'draft'}`}>{status??'—'}</span>;
}

function Toast({ message, type='success', onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`adm-toast${type==='error'?' error':''}`}>
      {type==='success' ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
      {message}
    </div>
  );
}

function Confirm({ title, body, danger=true, onConfirm, onCancel, children }) {
  /* ── Escape key + scroll-lock fix ─────────────────────────────── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onCancel]);

  return (
    /* z-index 9000 — above sidebars (z 40), sticky headers (z 30) */
    <div className="adm-overlay" style={{ zIndex: 9000 }} onClick={onCancel}>
      <div className="adm-modal" onClick={e=>e.stopPropagation()}>
        <div className="adm-modal-head">
          <span className={`adm-modal-icon${danger?' danger':''}`}>{danger?<AlertCircle size={20}/>:<CheckCircle size={20}/>}</span>
          <div>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        </div>
        {children}
        <div className="adm-modal-foot">
          <button className="adm-btn ghost" onClick={onCancel}>Cancel</button>
          <button className={`adm-btn${danger?' danger':' primary'}`} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function Spin() {
  return (
    <div className="adm-spin-wrap">
      <div className="adm-spin"/>
      <span>Loading…</span>
    </div>
  );
}

function Err({ msg }) {
  return (
    <div className="adm-err-banner"><AlertCircle size={14}/> {msg}</div>
  );
}

function Empty({ msg='No data found.' }) {
  return <div className="adm-empty">{msg}</div>;
}

function Avatar({ name, size=32, color=C.purple }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', background:`${color}18`, color,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.36, fontWeight:700, flexShrink:0,
    }}>
      {initials(name)}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="adm-stat-card" style={{ '--adm-accent': color }}>
      <div className="adm-stat-icon" style={{ background:`${color}12`, color }}>{icon}</div>
      <div>
        <p className="adm-stat-label">{label}</p>
        <p className="adm-stat-value">{value}</p>
      </div>
    </div>
  );
}

function SCard({ title, icon, children, noPad = false }) {
  return (
    <div className="adm-scard">
      <div className="adm-scard-head">
        {icon && <span className="adm-scard-icon">{icon}</span>}
        <h3 className="adm-scard-title">{title}</h3>
      </div>
      <div className={noPad?'':undefined}>{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE HEAD + WELCOME BANNER
   ─────────────────────────────────────────────────────────────────
   BANNER LOGIC FIX: `showWelcome` is derived purely from tab state
   inside AdminDashboard root — it is ONLY true for tab === 'overview'.
   All sub-pages receive showWelcome={false} and never render the hero.
   ═══════════════════════════════════════════════════════════════════ */
function PageHead({ title, sub, badge, actions, welcomeName, showWelcome = false, overviewStats = null }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="adm-page-head-zone">

      {/* ────────────────────────────────────────────────────────
          WELCOME HERO — rendered ONLY on the Overview tab
          ──────────────────────────────────────────────────────── */}
      {showWelcome && (
        <div className="adm-welcome-sticky">
          <div className="adm-welcome-hero">

            {/* Decorative geometry (CSS-only, no images) */}
            <div className="adm-hero-orb adm-hero-orb--1" aria-hidden="true" />
            <div className="adm-hero-orb adm-hero-orb--2" aria-hidden="true" />
            <div className="adm-hero-orb adm-hero-orb--3" aria-hidden="true" />

            {/* Left: greeting + role */}
            <div className="adm-welcome-text">
              <div className="adm-welcome-eyebrow">
                <Shield size={13} />
                <span>{badge ?? 'Super Admin'}</span>
              </div>
              <h1 className="adm-welcome-title">{greeting}, {welcomeName ?? 'Admin'}</h1>
              <p className="adm-welcome-sub">
                Your command center for Kora — monitor real-time hiring activity,
                approve listings, and keep the platform at peak health.
              </p>

              {/* Live KPI chips — populated once overview stats load */}
              {overviewStats && (
                <div className="adm-hero-chips">
                  <span className="adm-hero-chip">
                    <Users size={12} />
                    {fmtNum(overviewStats.totalUsers)} users
                  </span>
                  <span className="adm-hero-chip">
                    <Briefcase size={12} />
                    {fmtNum(overviewStats.activeJobs)} active jobs
                  </span>
                  <span className="adm-hero-chip">
                    <BarChart3 size={12} />
                    {fmtNum(overviewStats.totalApplications)} applications
                  </span>
                </div>
              )}
            </div>

            {/* Right: platform health indicator */}
            <div className="adm-welcome-health">
              <div className="adm-health-ring">
                <div className="adm-health-pulse" />
                <CheckCircle size={22} />
              </div>
              <p className="adm-health-label">Platform<br/>Healthy</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Standard page title bar ──────────────────────────────── */}
      <div className="adm-page-head">
        <div>
          <h2 className="adm-page-title">{title}</h2>
          {sub && <p className="adm-page-sub">{sub}</p>}
        </div>
        <div className="adm-page-head-right">{actions}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB META
   ═══════════════════════════════════════════════════════════════════ */
const TAB_META = {
  overview:     { title: 'Overview',               sub: 'Live stats, quick actions, and platform health at a glance' },
  users:        { title: 'User Management',        sub: 'Manage job seekers, employers, and administrator accounts' },
  reports:      { title: 'Reports & Analytics',    sub: 'Deep-dive platform performance metrics' },
  employers:    { title: 'Employer Management',    sub: 'Approve, suspend and manage employer accounts' },
  seekers:      { title: 'Job Seekers',            sub: 'Manage candidate profiles and access' },
  verification: { title: 'Verification',           sub: 'Review and approve user identity documents' },
  jobs:         { title: 'Job Moderation',         sub: 'Review, approve and remove job listings' },
  applications: { title: 'Applications',           sub: 'Monitor all applications across the platform' },
  interviews:   { title: 'Interviews',             sub: 'Track scheduled and completed interviews' },
  hero:         { title: 'Hero Section',           sub: 'Customize the homepage banner — headlines, slides, and call-to-action buttons' },
  cms:          { title: 'FAQ & CMS',              sub: 'Manage FAQs, categories and site skills' },
  broadcast:    { title: 'Broadcast Notifications',sub: 'Send platform-wide notifications to users' },
  compliance:   { title: 'Contacts & Compliance',  sub: 'Review reported issues and contact requests' },
  settings:     { title: 'Site Settings',          sub: 'General platform configuration' },
};

/* ═══════════════════════════════════════════════════════════════════
   ROOT COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [tab,        setTab]        = useState(() => location.state?.defaultTab || 'overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast,      setToast]      = useState(null);
  /* Live overview stats for hero chips — fetched once on mount */
  const [heroStats,  setHeroStats]  = useState(null);

  useEffect(() => {
    fetchOverviewStats()
      .then(setHeroStats)
      .catch(() => {}); // silent — chips just don't render
  }, []);

  const displayName = user?.fullName ?? user?.name ?? user?.email ?? 'Administrator';
  const initls      = displayName.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'AD';
  const { title, sub } = TAB_META[tab] ?? TAB_META.overview;
  const showToast = useCallback((msg, type='success') => setToast({ msg, type }), []);

  return (
    <div className="adm-root">
      {mobileOpen && <div className="adm-mob-overlay" onClick={()=>setMobileOpen(false)}/>}

      {/* Mobile top bar */}
      <header className="adm-mob-bar">
        <button className="adm-mob-hamburger" onClick={()=>setMobileOpen(true)} aria-label="Open sidebar">
          <Menu size={20}/>
        </button>
        <div className="adm-mob-logo-area">
          <img src={koraLogo} alt="Kora" className="adm-mob-logo-img" />
          <span className="adm-mob-title">Kora Admin</span>
        </div>
        <div className="adm-mob-profile">
          <div className="adm-mob-avatar">{initls}</div>
        </div>
      </header>

      <button className="adm-mob-toggle" onClick={()=>setMobileOpen(true)} aria-label="Open menu">
        <Layers size={18}/>
      </button>

      <aside className={`adm-sidebar${mobileOpen?' open':''}`}>
        <button className="adm-mob-close" onClick={()=>setMobileOpen(false)}><X size={16}/></button>
        <AdminSidebar activeTab={tab} setActiveTab={t=>{ setTab(t); setMobileOpen(false); }}/>
      </aside>

      <main className="adm-main">
        {/* ── PageHead: banner only on overview tab ─────────────── */}
        <PageHead
          title={title}
          sub={sub}
          welcomeName={user?.fullName?.split(' ')[0] ?? 'Admin'}
          badge={`${user?.fullName?.split(' ')[0]??'Admin'} · Super Admin`}
          showWelcome={tab === 'overview'}   /* ← BANNER LOGIC FIX */
          overviewStats={heroStats}
        />

        <div className={`adm-content${(tab === 'hero' || tab === 'cms') ? ' adm-content--cms' : ''}`}>
          {tab === 'overview'     && <OverviewTab />}
          {tab === 'users'        && <UsersTab showToast={showToast}/>}
          {tab === 'reports'      && <ReportsTab />}
          {tab === 'employers'    && <EmployerTab showToast={showToast}/>}
          {tab === 'seekers'      && <SeekersTab showToast={showToast}/>}
          {tab === 'verification' && <VerificationTab showToast={showToast}/>}
          {tab === 'jobs'         && <JobsTab showToast={showToast}/>}
          {tab === 'applications' && <ApplicationsTab showToast={showToast}/>}
          {tab === 'interviews'   && <InterviewsTab />}
          {tab === 'hero'         && <HeroEditor showToast={showToast}/>}
          {tab === 'cms'          && <CMSTab showToast={showToast}/>}
          {tab === 'broadcast'    && <BroadcastTab showToast={showToast}/>}
          {tab === 'compliance'   && <ComplianceTab />}
          {tab === 'settings'     && <SettingsTab showToast={showToast}/>}
        </div>
      </main>

      {toast && <Toast message={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════
   TAB 1b — User Management (All Users CRUD)
   ═══════════════════════════════════════════════════════════════════ */
const USERS_PAGE_SIZE = 10;

function UsersTab({ showToast }) {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState('all');
  const [page,        setPage]        = useState(0);
  const [total,       setTotal]       = useState(0);
  const [modal,       setModal]       = useState(null); // null | 'create' | { mode:'edit', user } | { mode:'delete', user }
  const [form,        setForm]        = useState({ fullName:'', email:'', password:'', role:'JOB_SEEKER', active:true });
  const [saving,      setSaving]      = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError('');
    fetchAdminUsers({ page, size: USERS_PAGE_SIZE, search: search || undefined, role: roleFilter !== 'all' ? roleFilter : undefined })
      .then(res => {
        const content = Array.isArray(res) ? res : (res.content ?? []);
        setUsers(content);
        setTotal(res.totalElements ?? content.length);
      })
      .catch(()=>setError('Failed to load users.'))
      .finally(()=>setLoading(false));
  }, [page, search, roleFilter]);

  useEffect(()=>{ load(); }, [load]);
  useEffect(()=>{ setPage(0); }, [search, roleFilter]);

  const openCreate = () => { setForm({ fullName:'', email:'', password:'', role:'JOB_SEEKER', active:true }); setModal('create'); };
  const openEdit   = u => { setForm({ fullName:u.fullName||'', email:u.email||'', password:'', role:u.role||'JOB_SEEKER', active:u.active??true }); setModal({ mode:'edit', user:u }); };
  const openDelete = u => setModal({ mode:'delete', user:u });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'create') {
        await createAdminUser(form);
        showToast('User created successfully.');
      } else {
        await updateAdminUser(modal.user.id, form);
        showToast('User updated successfully.');
      }
      setModal(null); load();
    } catch { showToast('Operation failed.', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await hardDeleteUser(modal.user.id);
      showToast('User permanently deleted.');
      setModal(null); load();
    } catch { showToast('Delete failed.', 'error'); }
  };

  const handleToggle = async (u) => {
    try {
      await toggleUserStatus(u.id, !u.active);
      showToast(`User ${u.active ? 'suspended' : 'activated'}.`);
      load();
    } catch { showToast('Toggle failed.', 'error'); }
  };

  const totalPages = Math.ceil(total / USERS_PAGE_SIZE);

  return (
    <div className="adm-users">
      <div className="adm-toolbar">
        <div className="adm-search-wrap"><Search size={14}/><input className="adm-search" placeholder="Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="adm-select" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="JOB_SEEKER">Job Seeker</option>
          <option value="EMPLOYER">Employer</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button className="adm-btn primary" onClick={openCreate}><Plus size={14}/> New User</button>
      </div>

      {loading ? <Spin/> : error ? <Err msg={error}/> : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u=>(
                  <tr key={u.id}>
                    <td><div style={{display:'flex',alignItems:'center',gap:8}}><Avatar name={u.fullName} size={30}/><span className="adm-td-strong">{fmt(u.fullName)}</span></div></td>
                    <td className="adm-td-muted">{fmt(u.email)}</td>
                    <td><span className="adm-role-pill">{fmt(u.role)}</span></td>
                    <td><Badge status={u.active?'active':'suspended'}/></td>
                    <td className="adm-td-muted">{fmtDate(u.createdAt)}</td>
                    <td>
                      <div className="adm-actions">
                        <button className="adm-icon-btn" title="Edit" onClick={()=>openEdit(u)}><Edit2 size={14}/></button>
                        <button className="adm-icon-btn" title={u.active?'Suspend':'Activate'} onClick={()=>handleToggle(u)}>{u.active?<Ban size={14}/>:<Check size={14}/>}</button>
                        <button className="adm-icon-btn danger" title="Delete" onClick={()=>openDelete(u)}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!users.length && <tr><td colSpan={6}><Empty/></td></tr>}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="adm-pagination">
              <button disabled={page===0} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={14}/></button>
              <span>{page+1} / {totalPages}</span>
              <button disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}><ChevronRight size={14}/></button>
            </div>
          )}
        </>
      )}

      {/* Create / Edit modal */}
      {(modal === 'create' || modal?.mode === 'edit') && (
        <div className="adm-overlay" style={{zIndex:9000}} onClick={()=>setModal(null)}>
          <div className="adm-modal" onClick={e=>e.stopPropagation()}>
            <div className="adm-modal-head">
              <span className="adm-modal-icon"><Edit2 size={20}/></span>
              <div><h3>{modal==='create'?'Create User':'Edit User'}</h3><p>{modal==='create'?'Add a new platform user':'Update account details'}</p></div>
            </div>
            <div className="adm-modal-fields">
              {[
                { label:'Full Name', key:'fullName', type:'text' },
                { label:'Email',     key:'email',    type:'email' },
                { label:'Password',  key:'password', type:'password', placeholder: modal?.mode==='edit'?'Leave blank to keep current':undefined },
              ].map(f=>(
                <div key={f.key} className="adm-field">
                  <label>{f.label}</label>
                  <input type={f.type} className="adm-input" value={form[f.key]} placeholder={f.placeholder||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}/>
                </div>
              ))}
              <div className="adm-field">
                <label>Role</label>
                <select className="adm-input" value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                  <option value="JOB_SEEKER">Job Seeker</option>
                  <option value="EMPLOYER">Employer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="adm-modal-foot">
              <button className="adm-btn ghost" onClick={()=>setModal(null)}>Cancel</button>
              <button className="adm-btn primary" onClick={handleSave} disabled={saving}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {modal?.mode === 'delete' && (
        <Confirm title="Delete User" body={`Permanently delete ${modal.user.fullName}? This cannot be undone.`} onConfirm={handleDelete} onCancel={()=>setModal(null)}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 1 — Overview
   ═══════════════════════════════════════════════════════════════════ */
function OverviewTab() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetchOverviewStats()
      .then(setStats)
      .catch(()=>setError('Failed to load statistics.'))
      .finally(()=>setLoading(false));
  }, []);

  if (loading) return <Spin/>;
  if (error)   return <Err msg={error}/>;
  if (!stats)  return null;

  const KPI = [
    { label:'Total Users',   value: fmtNum(stats.totalUsers),        icon:<Users size={18}/>,     color:C.purple },
    { label:'Job Seekers',   value: fmtNum(stats.totalJobSeekers),   icon:<Users size={18}/>,     color:C.blue   },
    { label:'Employers',     value: fmtNum(stats.totalEmployers),    icon:<Building2 size={18}/>, color:C.orange },
    { label:'Active Jobs',   value: fmtNum(stats.activeJobs),        icon:<Briefcase size={18}/>, color:C.teal   },
    { label:'Applications',  value: fmtNum(stats.totalApplications), icon:<BarChart3 size={18}/>, color:C.sky    },
    { label:'Hire Rate',     value: `${stats.hireRate??0}%`,         icon:<Award size={18}/>,     color:C.green  },
    { label:'Expired Jobs',  value: fmtNum(stats.expiredJobs),       icon:<Briefcase size={18}/>, color:C.amber  },
    { label:'Active Users',  value: fmtNum(stats.activeUsers),       icon:<CheckCircle size={18}/>,color:C.green },
  ];

  const growthDs = stats.usersOverTime ? [
    { label:'Job Seekers', data:stats.usersOverTime.jobSeekers, borderColor:C.purple, backgroundColor:C.purple+'12', fill:true, tension:0.4, borderWidth:2.5, pointRadius:4, pointBackgroundColor:C.purple },
    { label:'Employers',   data:stats.usersOverTime.employers,  borderColor:C.orange, backgroundColor:C.orange+'12', fill:true, tension:0.4, borderWidth:2.5, pointRadius:4, pointBackgroundColor:C.orange },
  ] : [];

  const catLabels = Object.keys(stats.applicationsByCategory||{});
  const catValues = Object.values(stats.applicationsByCategory||{});
  const stLabels  = Object.keys(stats.applicationStatusBreakdown||{});
  const stValues  = Object.values(stats.applicationStatusBreakdown||{});

  return (
    <div className="adm-overview">
      <div className="adm-kpi-grid">
        {KPI.map(k=><StatCard key={k.label} {...k}/>)}
      </div>
      <div className="adm-charts-2col">
        <div className="adm-chart-card">
          <div className="adm-chart-head"><TrendingUp size={14}/><h3>User Growth — Last 6 Months</h3></div>
          <div className="adm-chart-area">
            {stats.usersOverTime ? <LineChart labels={stats.usersOverTime.labels} datasets={growthDs}/> : <Empty msg="No growth data available."/>}
          </div>
        </div>
        <div className="adm-chart-card">
          <div className="adm-chart-head"><BarChart3 size={14}/><h3>Applications by Category</h3></div>
          <div className="adm-chart-area">
            {catLabels.length ? <BarChart labels={catLabels} values={catValues}/> : <Empty msg="No category data."/>}
          </div>
        </div>
      </div>
      <div className="adm-charts-2col">
        <div className="adm-chart-card">
          <div className="adm-chart-head"><Activity size={14}/><h3>Application Status Breakdown</h3></div>
          <div className="adm-chart-area">
            {stLabels.length ? <DoughnutChart labels={stLabels} values={stValues} colors={[C.purple,C.orange,C.green,C.rose,C.blue,C.amber]}/> : <Empty msg="No status data."/>}
          </div>
        </div>
        <div className="adm-chart-card">
          <div className="adm-chart-head"><Briefcase size={14}/><h3>Job Postings by Status</h3></div>
          <div className="adm-chart-area">
            <DoughnutChart labels={['Active','Expired','Deleted']} values={[stats.activeJobs,stats.expiredJobs,stats.deletedJobs]} colors={[C.green,C.amber,C.rose]}/>
          </div>
          <div className="adm-hire-rate-bar">
            <span>Application → Hire conversion</span>
            <strong>{stats.hireRate}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 2 — Reports
   ═══════════════════════════════════════════════════════════════════ */
function ReportsTab() {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    fetchAdminJobs({ size:200 })
      .then(d=>{ const c=Array.isArray(d)?d:d.content??[]; setJobs(c); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  if (loading) return <Spin/>;

  const totalApps = jobs.reduce((a,j)=>a+(j.applicationCount??0),0);
  const hired     = jobs.reduce((a,j)=>a+(j.hiredCount??0),0);
  const active    = jobs.filter(j=>(j.status??'').toUpperCase()==='ACTIVE');
  const hireRate  = totalApps>0 ? ((hired/totalApps)*100).toFixed(1):'—';
  const avgApps   = active.length>0 ? (totalApps/active.length).toFixed(1):'—';

  const catMap = {};
  jobs.forEach(j=>{ const cat=j.categoryName??j.category??'Other'; catMap[cat]=(catMap[cat]??0)+(j.applicationCount??1); });
  const topCats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,8);

  const statusMap = {};
  jobs.forEach(j=>{ const s=j.status??'UNKNOWN'; statusMap[s]=(statusMap[s]??0)+1; });

  return (
    <div className="adm-reports">
      <div className="adm-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        <StatCard label="Total Jobs"         value={fmtNum(jobs.length)}    icon={<Briefcase size={18}/>}    color={C.purple}/>
        <StatCard label="Total Applications" value={fmtNum(totalApps)}      icon={<ClipboardList size={18}/>} color={C.blue}/>
        <StatCard label="Hire Rate"          value={hireRate==='—'?'—':`${hireRate}%`} icon={<Award size={18}/>} color={C.green}/>
        <StatCard label="Avg Apps / Job"     value={avgApps}                icon={<Activity size={18}/>}    color={C.orange}/>
      </div>
      <div className="adm-charts-2col">
        <div className="adm-chart-card">
          <div className="adm-chart-head"><BarChart3 size={14}/><h3>Top 8 Categories by Applications</h3></div>
          <div className="adm-chart-area" style={{minHeight:300}}>
            {topCats.length ? <BarChart labels={topCats.map(([k])=>k)} values={topCats.map(([,v])=>v)} horizontal/> : <Empty/>}
          </div>
        </div>
        <div className="adm-chart-card">
          <div className="adm-chart-head"><Layers size={14}/><h3>Jobs by Status</h3></div>
          <div className="adm-chart-area">
            <DoughnutChart labels={Object.keys(statusMap)} values={Object.values(statusMap)} colors={[C.green,C.amber,C.rose,C.slate,C.purple]}/>
          </div>
        </div>
      </div>
      <SCard title="Most Applied Jobs" icon={<TrendingUp size={15}/>}>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Job Title</th><th>Company</th><th>Category</th><th>Status</th><th>Applications</th></tr></thead>
            <tbody>
              {jobs.sort((a,b)=>(b.applicationCount??0)-(a.applicationCount??0)).slice(0,10).map((j,i)=>(
                <tr key={j.id??i}>
                  <td className="adm-td-strong">{fmt(j.title??j.jobTitle)}</td>
                  <td className="adm-td-muted">{fmt(j.companyName)}</td>
                  <td className="adm-td-muted">{fmt(j.categoryName??j.category)}</td>
                  <td><Badge status={j.status}/></td>
                  <td><span className="adm-count-pill">{j.applicationCount??0}</span></td>
                </tr>
              ))}
              {jobs.length===0 && <tr><td colSpan={5}><Empty/></td></tr>}
            </tbody>
          </table>
        </div>
      </SCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 3 — Employers
   ═══════════════════════════════════════════════════════════════════ */
function EmployerTab({ showToast }) {
  const [employers, setEmployers] = useState([]);
  const [filter,    setFilter]    = useState('all');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState(null);
  const [detail,    setDetail]    = useState(null);

  const load = useCallback((f) => {
    setLoading(true); setError('');
    fetchEmployers(f)
      .then(setEmployers)
      .catch(()=>setError('Unable to load employers.'))
      .finally(()=>setLoading(false));
  }, []);

  useEffect(()=>{ load(filter); }, [filter, load]);

  const filtered = employers.filter(e =>
    !search || (e.fullName??'').toLowerCase().includes(search.toLowerCase()) ||
    (e.email??'').toLowerCase().includes(search.toLowerCase()) ||
    (e.companyName??'').toLowerCase().includes(search.toLowerCase())
  );

  const act = async (action, id) => {
    try {
      if (action==='approve')  { await approveEmployer(id);  showToast('Employer approved.'); }
      if (action==='suspend')  { await suspendEmployer(id);  showToast('Employer suspended.', 'error'); }
      if (action==='delete')   { await deleteEmployer(id);   showToast('Employer deleted.', 'error'); }
      load(filter);
    } catch { showToast('Action failed.', 'error'); }
    setModal(null);
  };

  return (
    <div className="adm-employers">
      <div className="adm-toolbar">
        <div className="adm-search-wrap"><Search size={14}/><input className="adm-search" placeholder="Search employers…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="adm-select" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      {loading ? <Spin/> : error ? <Err msg={error}/> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Employer</th><th>Company</th><th>Email</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(e=>(
                <tr key={e.id}>
                  <td><div style={{display:'flex',alignItems:'center',gap:8}}><Avatar name={e.fullName} size={30}/><span className="adm-td-strong">{fmt(e.fullName)}</span></div></td>
                  <td className="adm-td-muted">{fmt(e.companyName)}</td>
                  <td className="adm-td-muted">{fmt(e.email)}</td>
                  <td><Badge status={e.active?'active':e.approved?'active':'pending'}/></td>
                  <td className="adm-td-muted">{fmtDate(e.createdAt)}</td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-icon-btn" title="View" onClick={()=>setDetail(e)}><Eye size={14}/></button>
                      {!e.approved && <button className="adm-icon-btn success" title="Approve" onClick={()=>setModal({action:'approve',id:e.id,name:e.fullName})}><Check size={14}/></button>}
                      {e.active && <button className="adm-icon-btn warning" title="Suspend" onClick={()=>setModal({action:'suspend',id:e.id,name:e.fullName})}><Ban size={14}/></button>}
                      <button className="adm-icon-btn danger" title="Delete" onClick={()=>setModal({action:'delete',id:e.id,name:e.fullName})}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={6}><Empty/></td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <Confirm
          title={`${modal.action.charAt(0).toUpperCase()+modal.action.slice(1)} Employer`}
          body={`Are you sure you want to ${modal.action} ${modal.name}?`}
          danger={modal.action!=='approve'}
          onConfirm={()=>act(modal.action, modal.id)}
          onCancel={()=>setModal(null)}
        />
      )}
      {detail && (
        <div className="adm-overlay" style={{zIndex:9000}} onClick={()=>setDetail(null)}>
          <div className="adm-modal" onClick={e=>e.stopPropagation()}>
            <div className="adm-modal-head"><span className="adm-modal-icon"><Eye size={20}/></span><div><h3>Employer Detail</h3><p>{detail.email}</p></div></div>
            <div style={{padding:'16px 20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 24px'}}>
              {[['Full Name',detail.fullName],['Company',detail.companyName],['Phone',detail.phone],['City',detail.city],['Sector',detail.sector],['Status',detail.active?'Active':'Inactive']].map(([k,v])=>(
                <div key={k}><p style={{fontSize:11,color:'#64748b',margin:'0 0 2px'}}>{k}</p><p style={{fontSize:13,fontWeight:600,margin:0}}>{v||'—'}</p></div>
              ))}
            </div>
            <div className="adm-modal-foot"><button className="adm-btn ghost" onClick={()=>setDetail(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 4 — Job Seekers
   ═══════════════════════════════════════════════════════════════════ */
function SeekersTab({ showToast }) {
  const [seekers,  setSeekers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(null);

  useEffect(()=>{
    setLoading(true);
    fetchJobSeekers()
      .then(d=>setSeekers(Array.isArray(d)?d:d.content??[]))
      .catch(()=>setError('Failed to load job seekers.'))
      .finally(()=>setLoading(false));
  },[]);

  const filtered = seekers.filter(s =>
    !search || (s.fullName??'').toLowerCase().includes(search.toLowerCase()) ||
    (s.email??'').toLowerCase().includes(search.toLowerCase())
  );

  const handleSuspend = async () => {
    try {
      await suspendJobSeeker(modal.id);
      showToast('Job seeker suspended.');
      setSeekers(p=>p.map(s=>s.id===modal.id?{...s,active:false}:s));
    } catch { showToast('Action failed.', 'error'); }
    setModal(null);
  };

  return (
    <div className="adm-seekers">
      <div className="adm-toolbar">
        <div className="adm-search-wrap"><Search size={14}/><input className="adm-search" placeholder="Search job seekers…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
      </div>
      {loading ? <Spin/> : error ? <Err msg={error}/> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Candidate</th><th>Email</th><th>City</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.id}>
                  <td><div style={{display:'flex',alignItems:'center',gap:8}}><Avatar name={s.fullName} size={30} color={C.blue}/><span className="adm-td-strong">{fmt(s.fullName)}</span></div></td>
                  <td className="adm-td-muted">{fmt(s.email)}</td>
                  <td className="adm-td-muted">{fmt(s.city)}</td>
                  <td><Badge status={s.active?'active':'suspended'}/></td>
                  <td className="adm-td-muted">{fmtDate(s.createdAt)}</td>
                  <td>
                    <div className="adm-actions">
                      {s.active && <button className="adm-icon-btn warning" title="Suspend" onClick={()=>setModal({id:s.id,name:s.fullName})}><Ban size={14}/></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={6}><Empty/></td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {modal && <Confirm title="Suspend Job Seeker" body={`Suspend ${modal.name}?`} onConfirm={handleSuspend} onCancel={()=>setModal(null)}/>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 5 — Verification (stub)
   ═══════════════════════════════════════════════════════════════════ */
function VerificationTab({ showToast }) {
  return (
    <div className="adm-placeholder">
      <ShieldCheck size={40} style={{color:C.purple,marginBottom:12}}/>
      <h3>Identity Verification</h3>
      <p>Document review queue will appear here once users submit verification requests.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 6 — Jobs
   ═══════════════════════════════════════════════════════════════════ */
function JobsTab({ showToast }) {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(null);

  const load = useCallback(()=>{
    setLoading(true);
    fetchAdminJobs({ size:200 })
      .then(d=>{ const c=Array.isArray(d)?d:d.content??[]; setJobs(c); })
      .catch(()=>setError('Failed to load jobs.'))
      .finally(()=>setLoading(false));
  },[]);
  useEffect(()=>{ load(); },[load]);

  const filtered = jobs.filter(j =>
    !search || (j.title??'').toLowerCase().includes(search.toLowerCase()) ||
    (j.companyName??'').toLowerCase().includes(search.toLowerCase())
  );

  const act = async (action, id) => {
    try {
      if (action==='approve') { await approveJob(id); showToast('Job approved.'); }
      if (action==='flag')    { await flagJob(id);    showToast('Job flagged.', 'error'); }
      if (action==='delete')  { await deleteJob(id);  showToast('Job deleted.', 'error'); }
      load();
    } catch { showToast('Action failed.', 'error'); }
    setModal(null);
  };

  return (
    <div className="adm-jobs">
      <div className="adm-toolbar">
        <div className="adm-search-wrap"><Search size={14}/><input className="adm-search" placeholder="Search jobs…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
      </div>
      {loading ? <Spin/> : error ? <Err msg={error}/> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Title</th><th>Company</th><th>Category</th><th>Status</th><th>Posted</th><th>Apps</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(j=>(
                <tr key={j.id}>
                  <td className="adm-td-strong">{fmt(j.title??j.jobTitle)}</td>
                  <td className="adm-td-muted">{fmt(j.companyName)}</td>
                  <td className="adm-td-muted">{fmt(j.categoryName??j.category)}</td>
                  <td><Badge status={j.status}/></td>
                  <td className="adm-td-muted">{fmtDate(j.createdAt)}</td>
                  <td><span className="adm-count-pill">{j.applicationCount??0}</span></td>
                  <td>
                    <div className="adm-actions">
                      {(j.status??'').toUpperCase()==='DRAFT'&&<button className="adm-icon-btn success" title="Approve" onClick={()=>setModal({action:'approve',id:j.id,name:j.title})}><Check size={14}/></button>}
                      <button className="adm-icon-btn warning" title="Flag" onClick={()=>setModal({action:'flag',id:j.id,name:j.title})}><Flag size={14}/></button>
                      <button className="adm-icon-btn danger" title="Delete" onClick={()=>setModal({action:'delete',id:j.id,name:j.title})}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={7}><Empty/></td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <Confirm title={`${modal.action.charAt(0).toUpperCase()+modal.action.slice(1)} Job`} body={`${modal.action} "${modal.name}"?`} danger={modal.action!=='approve'} onConfirm={()=>act(modal.action,modal.id)} onCancel={()=>setModal(null)}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 7 — Applications
   ═══════════════════════════════════════════════════════════════════ */
function ApplicationsTab({ showToast }) {
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(()=>{
    setLoading(true);
    fetchAllApplications()
      .then(d=>setApps(Array.isArray(d)?d:d.content??[]))
      .catch(()=>setError('Failed to load applications.'))
      .finally(()=>setLoading(false));
  },[]);

  return (
    <div>
      {loading ? <Spin/> : error ? <Err msg={error}/> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Applicant</th><th>Job</th><th>Status</th><th>Applied</th></tr></thead>
            <tbody>
              {apps.slice(0,100).map(a=>(
                <tr key={a.id}>
                  <td className="adm-td-strong">Seeker #{a.seekerId}</td>
                  <td className="adm-td-muted">Job #{a.jobPostingId}</td>
                  <td><Badge status={(a.status??'').toLowerCase()}/></td>
                  <td className="adm-td-muted">{fmtDate(a.appliedAt)}</td>
                </tr>
              ))}
              {!apps.length && <tr><td colSpan={4}><Empty/></td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 8 — Interviews
   ═══════════════════════════════════════════════════════════════════ */
function InterviewsTab() {
  return (
    <div className="adm-placeholder">
      <CalendarClock size={40} style={{color:C.teal,marginBottom:12}}/>
      <h3>Interview Management</h3>
      <p>A list of all platform interviews — scheduled, completed, and cancelled — will display here.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 9 — Broadcast
   ═══════════════════════════════════════════════════════════════════ */
function BroadcastTab({ showToast }) {
  const [form,    setForm]    = useState({ title:'', message:'', targetRole:'ALL' });
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!form.title || !form.message) { showToast('Title and message are required.','error'); return; }
    setSending(true);
    try {
      await broadcastNotification(form);
      showToast('Notification broadcast sent!');
      setForm({ title:'', message:'', targetRole:'ALL' });
    } catch { showToast('Broadcast failed.','error'); }
    finally { setSending(false); }
  };

  return (
    <SCard title="Broadcast Notification" icon={<Send size={15}/>}>
      <div className="adm-modal-fields">
        <div className="adm-field"><label>Title</label><input className="adm-input" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></div>
        <div className="adm-field">
          <label>Target Audience</label>
          <select className="adm-input" value={form.targetRole} onChange={e=>setForm(p=>({...p,targetRole:e.target.value}))}>
            <option value="ALL">All Users</option>
            <option value="JOB_SEEKER">Job Seekers Only</option>
            <option value="EMPLOYER">Employers Only</option>
          </select>
        </div>
        <div className="adm-field"><label>Message</label><textarea className="adm-input" rows={4} value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))}/></div>
        <button className="adm-btn primary" onClick={send} disabled={sending}>{sending?'Sending…':'Send Broadcast'}</button>
      </div>
    </SCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 10 — Compliance
   ═══════════════════════════════════════════════════════════════════ */
function ComplianceTab() {
  return (
    <div className="adm-placeholder">
      <FileText size={40} style={{color:C.orange,marginBottom:12}}/>
      <h3>Compliance & Contact Requests</h3>
      <p>Reported content and contact form submissions will appear here for review.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 11 — Settings
   ═══════════════════════════════════════════════════════════════════ */
function SettingsTab({ showToast }) {
  return (
    <div className="adm-placeholder">
      <Sliders size={40} style={{color:C.slate,marginBottom:12}}/>
      <h3>Site Settings</h3>
      <p>Platform-wide configuration options will be available here.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 12 — Verification (detailed stub)
   ═══════════════════════════════════════════════════════════════════ */
function VerificationTabInner({ showToast }) {
  return (
    <div className="adm-verification-banner">
      <ShieldCheck size={22}/>
      <div>
        <strong>Verification Module</strong>
        <p>Document uploads and identity checks will appear here once the verification pipeline is enabled.</p>
      </div>
    </div>
  );
}