import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Building2, Briefcase, Users, BarChart3, ChevronLeft, ChevronRight,
  Check, Ban, Trash2, Eye, Flag, AlertCircle, X, Search, TrendingUp,
  Activity, CheckCircle, Shield, Plus, Edit2, Bell, Save, RefreshCw,
  Globe, Image, Type, AlignLeft, ToggleLeft, ToggleRight, Send,
  MessageSquare, Mail, Phone, Calendar, ClipboardList, CalendarClock,
  Award, FileText, ShieldCheck, Upload, Download, Filter, SortDesc,
  Sliders, Hash, Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchEmployers, approveEmployer, suspendEmployer, deleteEmployer,
  fetchAdminJobs, approveJob, flagJob, deleteJob,
  fetchJobSeekers, suspendJobSeeker,
  fetchOverviewStats, fetchMarketInsights,
  fetchAllApplications, updateApplicationStatus,
  fetchAdminUsers, toggleUserStatus,
  fetchCategories, createCategory, deleteCategory,
  fetchSkills, createSkill, deleteSkill,
  fetchFAQs, createFAQ, updateFAQ, deleteFAQ,
  broadcastNotification,
} from '../../api/admin';
import AdminSidebar from '../../components/admin/AdminSidebar';
import HeroEditor from './HeroEditor';
import '../../styles/admin-dashboard.css';

/* ═══════════════════════════════════════════════════════════════════
   CHART UTILITIES
   ═══════════════════════════════════════════════════════════════════ */
function useChart(ref, configFn, deps) {
  useEffect(() => {
    if (!ref.current) return;
    let chart;
    const build = () => {
      if (!window.Chart) return;
      // Destroy any chart already bound to this canvas (handles async-load race condition)
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
      // Safety net: if build() ran after unmount, clean up via canvas lookup
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
  return (
    <div className="adm-overlay" onClick={onCancel}>
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
    <div className="adm-avatar" style={{ width:size, height:size, fontSize:size*0.38, background:color+'20', color }}>
      {initials(name)}
    </div>
  );
}

function StatCard({ icon, label, value, delta, color=C.purple, sub }) {
  return (
    <div className="adm-stat-card" style={{'--c': color, '--cl': color+'18'}}>
      <div className="adm-stat-icon">{icon}</div>
      <div className="adm-stat-body">
        <p className="adm-stat-label">{label}</p>
        <p className="adm-stat-value">{value}</p>
        {(delta||sub) && <p className="adm-stat-delta">{delta||sub}</p>}
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, placeholder='Search…', className='' }) {
  return (
    <div className={`adm-search ${className}`}>
      <Search size={14} className="adm-search-icon"/>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
      {value && <button className="adm-search-clear" onClick={()=>onChange('')}><X size={12}/></button>}
    </div>
  );
}

function FilterBar({ tabs, active, onChange, right }) {
  return (
    <div className="adm-filter-bar">
      <div className="adm-filter-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`adm-ftab${active===t.key?' active':''}`} onClick={()=>onChange(t.key)}>
            {t.label}
            {t.count != null && <span className="adm-ftab-count">{t.count}</span>}
          </button>
        ))}
      </div>
      {right && <div className="adm-filter-right">{right}</div>}
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i);
  return (
    <div className="adm-pagination">
      <button className="adm-page-btn" disabled={page===0} onClick={()=>onChange(page-1)}><ChevronLeft size={14}/></button>
      {pages.map(p => (
        <button key={p} className={`adm-page-btn${p===page?' active':''}`} onClick={()=>onChange(p)}>{p+1}</button>
      ))}
      {totalPages > 7 && <span className="adm-page-ellipsis">…{totalPages}</span>}
      <button className="adm-page-btn" disabled={page>=totalPages-1} onClick={()=>onChange(page+1)}><ChevronRight size={14}/></button>
    </div>
  );
}

/* Section card wrapper */
function SCard({ title, icon, action, children, noPad=false }) {
  return (
    <div className="adm-scard">
      <div className="adm-scard-head">
        <h2 className="adm-scard-title">{icon && <span className="adm-scard-icon">{icon}</span>}{title}</h2>
        {action && <div className="adm-scard-action">{action}</div>}
      </div>
      <div className={noPad?'':undefined}>{children}</div>
    </div>
  );
}

/* Page header */
function PageHead({ title, sub, badge, actions }) {
  return (
    <div className="adm-page-head">
      <div>
        <h1 className="adm-page-title">{title}</h1>
        {sub && <p className="adm-page-sub">{sub}</p>}
      </div>
      <div className="adm-page-head-right">
        {badge && <span className="adm-role-badge"><Shield size={12}/>{badge}</span>}
        {actions}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB META
   ═══════════════════════════════════════════════════════════════════ */
const TAB_META = {
  overview:     { title: 'Overview',          sub: 'Platform analytics at a glance' },
  reports:      { title: 'Reports & Analytics',sub: 'Deep-dive platform performance metrics' },
  employers:    { title: 'Employer Management',sub: 'Approve, suspend and manage employer accounts' },
  seekers:      { title: 'Job Seekers',        sub: 'Manage candidate profiles and access' },
  verification: { title: 'Verification',       sub: 'Review and approve user identity documents' },
  jobs:         { title: 'Job Moderation',     sub: 'Review, approve and remove job listings' },
  applications: { title: 'Applications',       sub: 'Monitor all applications across the platform' },
  interviews:   { title: 'Interviews',         sub: 'Track scheduled and completed interviews' },
  hero:         { title: 'Hero Section',       sub: 'Configure the homepage hero banner' },
  cms:          { title: 'FAQ & CMS',          sub: 'Manage FAQs, categories and site skills' },
  broadcast:    { title: 'Broadcast Notifications', sub: 'Send platform-wide notifications to users' },
  compliance:   { title: 'Contacts & Compliance',   sub: 'Review reported issues and contact requests' },
  settings:     { title: 'Site Settings',      sub: 'General platform configuration' },
};

/* ═══════════════════════════════════════════════════════════════════
   ROOT COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const { title, sub } = TAB_META[tab] ?? TAB_META.overview;
  const showToast = useCallback((msg, type='success') => setToast({ msg, type }), []);

  return (
    <div className="adm-root">
      {mobileOpen && <div className="adm-mob-overlay" onClick={()=>setMobileOpen(false)}/>}

      {/* Mobile toggle */}
      <button className="adm-mob-toggle" onClick={()=>setMobileOpen(true)} aria-label="Open menu">
        <Layers size={18}/>
      </button>

      <aside className={`adm-sidebar${mobileOpen?' open':''}`}>
        <button className="adm-mob-close" onClick={()=>setMobileOpen(false)}><X size={16}/></button>
        <AdminSidebar activeTab={tab} setActiveTab={t=>{ setTab(t); setMobileOpen(false); }}/>
      </aside>

      <main className="adm-main">
        <PageHead
          title={title}
          sub={sub}
          badge={`${user?.fullName?.split(' ')[0]??'Admin'} · Super Admin`}
        />

        <div className={`adm-content ${tab === 'hero' ? 'hero-tab' : ''}`}>
          {tab === 'overview'     && <OverviewTab />}
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
   TAB 1 — Overview
   ═══════════════════════════════════════════════════════════════════ */
function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    { label:'Total Users',       value: fmtNum(stats.totalUsers),        icon:<Users size={18}/>,     color:C.purple },
    { label:'Job Seekers',       value: fmtNum(stats.totalJobSeekers),   icon:<Users size={18}/>,     color:C.blue   },
    { label:'Employers',         value: fmtNum(stats.totalEmployers),    icon:<Building2 size={18}/>, color:C.orange },
    { label:'Active Jobs',       value: fmtNum(stats.activeJobs),        icon:<Briefcase size={18}/>, color:C.teal   },
    { label:'Applications',      value: fmtNum(stats.totalApplications), icon:<BarChart3 size={18}/>, color:C.sky    },
    { label:'Hire Rate',         value: `${stats.hireRate??0}%`,         icon:<Award size={18}/>,     color:C.green  },
    { label:'Expired Jobs',      value: fmtNum(stats.expiredJobs),       icon:<Briefcase size={18}/>, color:C.amber  },
    { label:'Active Users',      value: fmtNum(stats.activeUsers),       icon:<CheckCircle size={18}/>,color:C.green },
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
      {/* KPI grid */}
      <div className="adm-kpi-grid">
        {KPI.map(k=><StatCard key={k.label} {...k}/>)}
      </div>

      {/* Charts row 1 */}
      <div className="adm-charts-2col">
        <div className="adm-chart-card">
          <div className="adm-chart-head"><TrendingUp size={14}/><h3>User Growth — Last 6 Months</h3></div>
          <div className="adm-chart-area">
            {stats.usersOverTime
              ? <LineChart labels={stats.usersOverTime.labels} datasets={growthDs}/>
              : <Empty msg="No growth data available."/>}
          </div>
        </div>
        <div className="adm-chart-card">
          <div className="adm-chart-head"><BarChart3 size={14}/><h3>Applications by Category</h3></div>
          <div className="adm-chart-area">
            {catLabels.length ? <BarChart labels={catLabels} values={catValues}/> : <Empty msg="No category data."/>}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="adm-charts-2col">
        <div className="adm-chart-card">
          <div className="adm-chart-head"><Activity size={14}/><h3>Application Status Breakdown</h3></div>
          <div className="adm-chart-area">
            {stLabels.length
              ? <DoughnutChart labels={stLabels} values={stValues} colors={[C.purple,C.orange,C.green,C.rose,C.blue,C.amber]}/>
              : <Empty msg="No status data."/>}
          </div>
        </div>
        <div className="adm-chart-card">
          <div className="adm-chart-head"><Briefcase size={14}/><h3>Job Postings by Status</h3></div>
          <div className="adm-chart-area">
            <DoughnutChart
              labels={['Active','Expired','Deleted']}
              values={[stats.activeJobs,stats.expiredJobs,stats.deletedJobs]}
              colors={[C.green,C.amber,C.rose]}
            />
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
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    fetchAdminJobs({ size:200 })
      .then(d=>{ const c=Array.isArray(d)?d:d.content??[]; setJobs(c); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  if (loading) return <Spin/>;

  const totalApps  = jobs.reduce((a,j)=>a+(j.applicationCount??0),0);
  const hired      = jobs.reduce((a,j)=>a+(j.hiredCount??0),0);
  const active     = jobs.filter(j=>(j.status??'').toUpperCase()==='ACTIVE');
  const hireRate   = totalApps>0 ? ((hired/totalApps)*100).toFixed(1):'—';
  const avgApps    = active.length>0 ? (totalApps/active.length).toFixed(1):'—';

  const catMap = {};
  jobs.forEach(j=>{ const cat=j.categoryName??j.category??'Other'; catMap[cat]=(catMap[cat]??0)+(j.applicationCount??1); });
  const topCats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,8);

  const statusMap = {};
  jobs.forEach(j=>{ const s=j.status??'UNKNOWN'; statusMap[s]=(statusMap[s]??0)+1; });

  return (
    <div className="adm-reports">
      {/* KPIs */}
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
            {topCats.length
              ? <BarChart labels={topCats.map(([k])=>k)} values={topCats.map(([,v])=>v)} horizontal/>
              : <Empty/>}
          </div>
        </div>
        <div className="adm-chart-card">
          <div className="adm-chart-head"><Layers size={14}/><h3>Jobs by Status</h3></div>
          <div className="adm-chart-area">
            <DoughnutChart
              labels={Object.keys(statusMap)}
              values={Object.values(statusMap)}
              colors={[C.green,C.amber,C.rose,C.slate,C.purple]}
            />
          </div>
        </div>
      </div>

      {/* Top jobs table */}
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
  const [filter, setFilter]       = useState('all');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null);
  const [detail, setDetail]       = useState(null);

  const load = useCallback((f) => {
    setLoading(true); setError('');
    fetchEmployers(f)
      .then(setEmployers)
      .catch(()=>setError('Unable to load employers.'))
      .finally(()=>setLoading(false));
  }, []);

  useEffect(()=>{ load(filter); }, [filter, load]);

  const act = async () => {
    const { type, emp } = modal; setModal(null);
    try {
      const id = emp.id ?? emp.userId;
      if (type==='approve') await approveEmployer(id);
      if (type==='suspend') await suspendEmployer(id);
      if (type==='delete')  await deleteEmployer(id);
      showToast(`Employer ${type==='approve'?'approved':type==='suspend'?'suspended':'deleted'}.`);
      load(filter);
    } catch { showToast('Action failed.','error'); }
  };

  const pending    = employers.filter(e=>e.isApproved===false).length;
  const filteredList = employers.filter(e=>{
    const q=search.toLowerCase();
    return !q||(e.fullName??'').toLowerCase().includes(q)||(e.email??'').toLowerCase().includes(q)||(e.jobTitle??'').toLowerCase().includes(q);
  });

  const TABS = [
    {key:'all',label:'All'},
    {key:'pending',label:'Pending',count:pending},
    {key:'approved',label:'Approved'},
    {key:'suspended',label:'Suspended'},
  ];

  return (
    <>
      {error && <Err msg={error}/>}
      <FilterBar tabs={TABS} active={filter} onChange={setFilter} right={<SearchBar value={search} onChange={setSearch} placeholder="Search employers…"/>}/>

      <SCard title={`Employers (${filteredList.length})`} icon={<Building2 size={15}/>}>
        {loading ? <Spin/> : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Company / Contact</th><th>Role</th><th>Email</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredList.length===0 ? <tr><td colSpan={6}><Empty/></td></tr> : filteredList.map(emp=>{
                  const status = emp.isApproved===false?'PENDING':emp.isActive===false?'SUSPENDED':'ACTIVE';
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="adm-cell-person">
                          <Avatar name={emp.fullName??'?'} color={C.orange}/>
                          <span className="adm-td-strong">{fmt(emp.fullName)}</span>
                        </div>
                      </td>
                      <td className="adm-td-muted">{fmt(emp.jobTitle)}</td>
                      <td className="adm-td-muted">{fmt(emp.email)}</td>
                      <td><Badge status={status}/></td>
                      <td className="adm-td-muted">{fmtDate(emp.createdAt)}</td>
                      <td>
                        <div className="adm-actions">
                          <button className="adm-icon-btn info" onClick={()=>setDetail(emp)} title="View"><Eye size={13}/></button>
                          {status==='PENDING'   && <button className="adm-icon-btn approve" onClick={()=>setModal({type:'approve',emp})} title="Approve"><Check size={13}/></button>}
                          {status==='ACTIVE'    && <button className="adm-icon-btn warn"    onClick={()=>setModal({type:'suspend',emp})} title="Suspend"><Ban size={13}/></button>}
                          {status==='SUSPENDED' && <button className="adm-icon-btn approve" onClick={()=>setModal({type:'approve',emp})} title="Reactivate"><Check size={13}/></button>}
                          <button className="adm-icon-btn danger" onClick={()=>setModal({type:'delete',emp})} title="Delete"><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SCard>

      {modal && (
        <Confirm
          title={modal.type==='delete'?'Delete Employer':modal.type==='approve'?'Approve Employer':'Suspend Employer'}
          body={`Are you sure you want to ${modal.type} ${modal.emp.fullName}?`}
          danger={modal.type!=='approve'}
          onConfirm={act}
          onCancel={()=>setModal(null)}
        />
      )}

      {detail && (
        <SlideOver title="Employer Profile" onClose={()=>setDetail(null)}>
          <ProfileDetail data={detail} fields={[['Email',detail.email],['Role',detail.jobTitle],['Company',detail.companyName],['City',detail.city],['Phone',detail.phone],['Joined',fmtDate(detail.createdAt)],['Status',detail.isActive===false?'SUSPENDED':'ACTIVE'],]}/>
        </SlideOver>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 4 — Job Seekers
   ═══════════════════════════════════════════════════════════════════ */
function SeekersTab({ showToast }) {
  const [seekers, setSeekers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null);
  const [detail, setDetail]     = useState(null);

  useEffect(()=>{
    fetchJobSeekers()
      .then(setSeekers)
      .catch(()=>setError('Unable to load job seekers.'))
      .finally(()=>setLoading(false));
  },[]);

  const filtered = seekers.filter(s=>{
    const q=search.toLowerCase();
    return !q||(s.fullName??'').toLowerCase().includes(q)||(s.email??'').toLowerCase().includes(q);
  });

  const act = async () => {
    const { seeker } = modal; setModal(null);
    try {
      await suspendJobSeeker(seeker.id??seeker.userId);
      showToast('Job seeker suspended.');
      setSeekers(prev=>prev.map(s=>(s.id===seeker.id||s.userId===seeker.userId)?{...s,isActive:false}:s));
    } catch { showToast('Action failed.','error'); }
  };

  return (
    <>
      {error && <Err msg={error}/>}
      <div className="adm-filter-bar">
        <div className="adm-filter-right"><SearchBar value={search} onChange={setSearch} placeholder="Search job seekers…"/></div>
      </div>
      <SCard title={`Job Seekers (${filtered.length})`} icon={<Users size={15}/>}>
        {loading ? <Spin/> : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Name</th><th>Email</th><th>City</th><th>Open to Work</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length===0 ? <tr><td colSpan={7}><Empty/></td></tr> : filtered.map(s=>{
                  const status = s.isActive===false?'SUSPENDED':'ACTIVE';
                  return (
                    <tr key={s.id??s.userId}>
                      <td><div className="adm-cell-person"><Avatar name={s.fullName??'?'} color={C.blue}/><span className="adm-td-strong">{fmt(s.fullName)}</span></div></td>
                      <td className="adm-td-muted">{fmt(s.email)}</td>
                      <td className="adm-td-muted">{fmt(s.city)}</td>
                      <td>{s.isOpenToWork ? <span className="adm-pill green">Yes</span> : <span className="adm-pill">No</span>}</td>
                      <td><Badge status={status}/></td>
                      <td className="adm-td-muted">{fmtDate(s.createdAt)}</td>
                      <td>
                        <div className="adm-actions">
                          <button className="adm-icon-btn info" onClick={()=>setDetail(s)} title="View"><Eye size={13}/></button>
                          {status==='ACTIVE' && <button className="adm-icon-btn warn" onClick={()=>setModal({seeker:s})} title="Suspend"><Ban size={13}/></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SCard>

      {modal && (
        <Confirm title="Suspend Job Seeker" body={`Suspend ${modal.seeker.fullName}?`} onConfirm={act} onCancel={()=>setModal(null)}/>
      )}

      {detail && (
        <SlideOver title="Job Seeker Profile" onClose={()=>setDetail(null)}>
          <ProfileDetail data={detail} fields={[['Email',detail.email],['Phone',detail.phone],['City',detail.city],['Region',detail.region],['Joined',fmtDate(detail.createdAt)],['Open to Work',detail.isOpenToWork?'Yes':'No'],['LinkedIn',detail.linkedInUrl],['Portfolio',detail.portfolioUrl]]}/>
          {(detail.keywords?.length||detail.skills?.length) ? (
            <div className="adm-detail-section">
              <p className="adm-detail-label">Skills</p>
              <div className="adm-chip-group">{(detail.keywords??detail.skills??[]).map(sk=><span key={sk} className="adm-skill-chip">{sk}</span>)}</div>
            </div>
          ) : null}
        </SlideOver>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 5 — Verification
   ═══════════════════════════════════════════════════════════════════ */
function VerificationTab({ showToast }) {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(()=>{
    fetchAdminUsers()
      .then(setUsers)
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  const pending = users.filter(u=>u.isActive===false);
  const filtered = pending.filter(u=>{
    const q=search.toLowerCase();
    return !q||(u.fullName??'').toLowerCase().includes(q)||(u.email??'').toLowerCase().includes(q);
  });

  const toggle = async (u) => {
    try {
      await toggleUserStatus(u.id);
      showToast(`User ${u.isActive?'deactivated':'activated'}.`);
      setUsers(prev=>prev.map(x=>x.id===u.id?{...x,isActive:!x.isActive}:x));
    } catch { showToast('Failed.','error'); }
  };

  return (
    <>
      <div className="adm-verification-banner">
        <ShieldCheck size={18}/>
        <div>
          <strong>Identity Verification Queue</strong>
          <p>Users awaiting manual verification are listed below. Toggle status to activate or deactivate accounts.</p>
        </div>
        <span className="adm-count-pill large">{pending.length} pending</span>
      </div>

      <div className="adm-filter-bar">
        <div className="adm-filter-right"><SearchBar value={search} onChange={setSearch} placeholder="Search users…"/></div>
      </div>

      <SCard title="Users Awaiting Verification" icon={<ShieldCheck size={15}/>}>
        {loading ? <Spin/> : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Registered</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {filtered.length===0 ? <tr><td colSpan={6}><Empty msg="No pending verifications."/></td></tr> : filtered.map(u=>(
                  <tr key={u.id}>
                    <td><div className="adm-cell-person"><Avatar name={u.fullName??'?'} color={C.purple}/><span className="adm-td-strong">{fmt(u.fullName)}</span></div></td>
                    <td className="adm-td-muted">{fmt(u.email)}</td>
                    <td><span className="adm-role-tag">{u.role}</span></td>
                    <td className="adm-td-muted">{fmtDate(u.createdAt)}</td>
                    <td><Badge status={u.isActive?'ACTIVE':'SUSPENDED'}/></td>
                    <td>
                      <button className="adm-btn primary sm" onClick={()=>toggle(u)}>
                        {u.isActive ? <><Ban size={12}/> Deactivate</> : <><Check size={12}/> Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SCard>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 6 — Jobs
   ═══════════════════════════════════════════════════════════════════ */
function JobsTab({ showToast }) {
  const [jobs, setJobs]         = useState([]);
  const [filter, setFilter]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(0);
  const [totalPages, setTotal]  = useState(0);
  const [modal, setModal]       = useState(null);
  const [flagReason, setFlagReason] = useState('');

  const load = useCallback((p=0) => {
    setLoading(true);
    fetchAdminJobs({ status:filter, page:p, size:20 })
      .then(d=>{ setJobs(Array.isArray(d)?d:d.content??[]); setTotal(d.totalPages??1); })
      .catch(()=>setError('Unable to load jobs.'))
      .finally(()=>setLoading(false));
  },[filter]);

  useEffect(()=>{ load(page); },[filter, page, load]);

  const act = async () => {
    const { type, job } = modal; setModal(null); setFlagReason('');
    try {
      if (type==='approve') await approveJob(job.id);
      if (type==='flag')    await flagJob(job.id, flagReason);
      if (type==='delete')  await deleteJob(job.id);
      showToast(`Job ${type==='approve'?'approved':type==='flag'?'flagged':'deleted'}.`);
      load(page);
    } catch { showToast('Action failed.','error'); }
  };

  const filtered = jobs.filter(j=>{
    const q=search.toLowerCase();
    return !q||(j.title??j.jobTitle??'').toLowerCase().includes(q)||(j.companyName??'').toLowerCase().includes(q);
  });

  const STATUS_TABS = [{key:'',label:'All'},{key:'ACTIVE',label:'Active'},{key:'DRAFT',label:'Draft'},{key:'EXPIRED',label:'Expired'},{key:'DELETED',label:'Deleted'}];

  return (
    <>
      {error && <Err msg={error}/>}
      <FilterBar tabs={STATUS_TABS} active={filter} onChange={f=>{ setFilter(f); setPage(0); }} right={<SearchBar value={search} onChange={setSearch} placeholder="Search jobs…"/>}/>

      <SCard title={`Job Listings (${filtered.length})`} icon={<Briefcase size={15}/>}>
        {loading ? <Spin/> : (
          <>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Title</th><th>Company</th><th>Location</th><th>Type</th><th>Status</th><th>Posted</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.length===0 ? <tr><td colSpan={7}><Empty/></td></tr> : filtered.map(j=>(
                    <tr key={j.id}>
                      <td className="adm-td-strong">{fmt(j.title??j.jobTitle)}</td>
                      <td className="adm-td-muted">{fmt(j.companyName)}</td>
                      <td className="adm-td-muted">{fmt(j.location??j.locationSummary?.city)}</td>
                      <td className="adm-td-muted">{fmt(j.jobType)}</td>
                      <td><Badge status={j.status??j.postingStatus}/></td>
                      <td className="adm-td-muted">{fmtDate(j.createdAt)}</td>
                      <td>
                        <div className="adm-actions">
                          {(j.status==='DRAFT'||j.status==='PENDING') && <button className="adm-icon-btn approve" onClick={()=>setModal({type:'approve',job:j})} title="Approve"><Check size={13}/></button>}
                          <button className="adm-icon-btn warn" onClick={()=>setModal({type:'flag',job:j})} title="Flag"><Flag size={13}/></button>
                          <button className="adm-icon-btn danger" onClick={()=>setModal({type:'delete',job:j})} title="Delete"><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={p=>{setPage(p);load(p);}}/>
          </>
        )}
      </SCard>

      {modal && (
        <Confirm
          title={modal.type==='approve'?'Approve Job':modal.type==='flag'?'Flag Job':'Delete Job'}
          body={`${modal.type==='approve'?'Approve':'Remove'} "${modal.job.title??modal.job.jobTitle}"?`}
          danger={modal.type!=='approve'}
          onConfirm={act}
          onCancel={()=>{setModal(null);setFlagReason('');}}
        >
          {modal.type==='flag' && (
            <textarea className="adm-textarea" placeholder="Reason for flagging (min 10 chars)…" value={flagReason} onChange={e=>setFlagReason(e.target.value)} rows={3}/>
          )}
        </Confirm>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 7 — Applications
   ═══════════════════════════════════════════════════════════════════ */
function ApplicationsTab({ showToast }) {
  const [apps, setApps]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(0);
  const [totalPages, setTotal]  = useState(0);

  const load = useCallback((p=0) => {
    setLoading(true);
    fetchAllApplications({ status:filter, page:p, size:20 })
      .then(d=>{ setApps(d.content??d.applications??[]); setTotal(d.totalPages??1); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[filter]);

  useEffect(()=>{ load(page); },[filter, page, load]);

  const filtered = apps.filter(a=>{
    const q=search.toLowerCase();
    return !q||(a.seekerName??'').toLowerCase().includes(q)||(a.jobTitle??'').toLowerCase().includes(q);
  });

  const STATUS_TABS = [
    {key:'',label:'All'},
    {key:'APPLIED',label:'Applied'},
    {key:'SHORTLISTED',label:'Shortlisted'},
    {key:'INTERVIEW_SCHEDULED',label:'Interview'},
    {key:'HIRED',label:'Hired'},
    {key:'REJECTED',label:'Rejected'},
  ];

  return (
    <>
      <FilterBar tabs={STATUS_TABS} active={filter} onChange={f=>{setFilter(f);setPage(0);}} right={<SearchBar value={search} onChange={setSearch} placeholder="Search applications…"/>}/>
      <SCard title={`Applications (${filtered.length})`} icon={<ClipboardList size={15}/>}>
        {loading ? <Spin/> : (
          <>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Candidate</th><th>Job Title</th><th>Company</th><th>Status</th><th>Applied</th></tr></thead>
                <tbody>
                  {filtered.length===0 ? <tr><td colSpan={5}><Empty/></td></tr> : filtered.map((a,i)=>(
                    <tr key={a.id??i}>
                      <td><div className="adm-cell-person"><Avatar name={a.seekerName??'?'} color={C.teal}/><span className="adm-td-strong">{fmt(a.seekerName??a.candidateName)}</span></div></td>
                      <td className="adm-td-strong">{fmt(a.jobTitle)}</td>
                      <td className="adm-td-muted">{fmt(a.companyName)}</td>
                      <td><Badge status={a.status}/></td>
                      <td className="adm-td-muted">{fmtDate(a.appliedAt??a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={p=>{setPage(p);load(p);}}/>
          </>
        )}
      </SCard>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 8 — Interviews (read-only oversight)
   ═══════════════════════════════════════════════════════════════════ */
function InterviewsTab() {
  const [apps, setApps]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    fetchAllApplications({ status:'INTERVIEW_SCHEDULED', size:50 })
      .then(d=>setApps(d.content??d.applications??[]))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  return (
    <SCard title="Scheduled Interviews" icon={<CalendarClock size={15}/>}>
      {loading ? <Spin/> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Candidate</th><th>Job</th><th>Company</th><th>Status</th><th>Applied</th></tr></thead>
            <tbody>
              {apps.length===0 ? <tr><td colSpan={5}><Empty msg="No interviews scheduled."/></td></tr> : apps.map((a,i)=>(
                <tr key={a.id??i}>
                  <td><div className="adm-cell-person"><Avatar name={a.seekerName??'?'} color={C.sky}/><span className="adm-td-strong">{fmt(a.seekerName)}</span></div></td>
                  <td className="adm-td-strong">{fmt(a.jobTitle)}</td>
                  <td className="adm-td-muted">{fmt(a.companyName)}</td>
                  <td><Badge status={a.status}/></td>
                  <td className="adm-td-muted">{fmtDate(a.appliedAt??a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 9 — Hero Section CMS
   ═══════════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════════
   TAB 10 — CMS (FAQs, Categories, Skills)
   ═══════════════════════════════════════════════════════════════════ */
function CMSTab({ showToast }) {
  const [sub, setSub] = useState('faqs');

  return (
    <>
      <div className="adm-sub-tabs">
        {[{key:'faqs',label:'FAQs'},{key:'categories',label:'Job Categories'},{key:'skills',label:'Skills'}].map(t=>(
          <button key={t.key} className={`adm-sub-tab${sub===t.key?' active':''}`} onClick={()=>setSub(t.key)}>{t.label}</button>
        ))}
      </div>
      {sub==='faqs'       && <FAQManager showToast={showToast}/>}
      {sub==='categories' && <CategoryManager showToast={showToast}/>}
      {sub==='skills'     && <SkillManager showToast={showToast}/>}
    </>
  );
}

function FAQManager({ showToast }) {
  const [faqs, setFaqs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({ question:'', answer:'', isActive:true });
  const [showForm, setShowForm] = useState(false);

  const load = ()=>{ fetchFAQs().then(setFaqs).finally(()=>setLoading(false)); };
  useEffect(load,[]);

  const save = async () => {
    try {
      if (editing) { await updateFAQ(editing.id, form); showToast('FAQ updated.'); }
      else { await createFAQ(form); showToast('FAQ created.'); }
      setShowForm(false); setEditing(null); setForm({ question:'', answer:'', isActive:true });
      load();
    } catch { showToast('Failed.','error'); }
  };

  const del = async (id) => {
    try { await deleteFAQ(id); showToast('FAQ deleted.'); load(); }
    catch { showToast('Failed.','error'); }
  };

  const startEdit = (faq) => { setEditing(faq); setForm({question:faq.question,answer:faq.answer,isActive:faq.isActive}); setShowForm(true); };

  return (
    <SCard title="FAQs" icon={<FileText size={15}/>} action={
      <button className="adm-btn primary sm" onClick={()=>{ setEditing(null); setForm({question:'',answer:'',isActive:true}); setShowForm(true); }}>
        <Plus size={13}/> New FAQ
      </button>
    }>
      {showForm && (
        <div className="adm-inline-form">
          <div className="adm-field"><label>Question</label><input className="adm-input" value={form.question} onChange={e=>setForm(f=>({...f,question:e.target.value}))}/></div>
          <div className="adm-field"><label>Answer</label><textarea className="adm-textarea" value={form.answer} onChange={e=>setForm(f=>({...f,answer:e.target.value}))} rows={3}/></div>
          <div className="adm-field-toggle"><span>Active</span><button className="adm-toggle" onClick={()=>setForm(f=>({...f,isActive:!f.isActive}))}>{form.isActive?<ToggleRight size={24} color={C.purple}/>:<ToggleLeft size={24} color={C.slate}/>}</button></div>
          <div className="adm-form-actions">
            <button className="adm-btn ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="adm-btn primary" onClick={save}><Save size={13}/> {editing?'Update':'Create'}</button>
          </div>
        </div>
      )}
      {loading ? <Spin/> : (
        <div className="adm-faq-list">
          {faqs.length===0 ? <Empty msg="No FAQs yet."/> : faqs.map(f=>(
            <div key={f.id} className={`adm-faq-item${!f.isActive?' inactive':''}`}>
              <div className="adm-faq-q">{f.question}</div>
              <div className="adm-faq-a">{f.answer}</div>
              <div className="adm-faq-foot">
                <Badge status={f.isActive?'ACTIVE':'SUSPENDED'}/>
                <div className="adm-actions">
                  <button className="adm-icon-btn info" onClick={()=>startEdit(f)}><Edit2 size={13}/></button>
                  <button className="adm-icon-btn danger" onClick={()=>del(f.id)}><Trash2 size={13}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SCard>
  );
}

function CategoryManager({ showToast }) {
  const [cats, setCats]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]   = useState({ name:'', description:'' });
  const [showForm, setShowForm] = useState(false);

  const load = ()=>{ fetchCategories().then(setCats).finally(()=>setLoading(false)); };
  useEffect(load,[]);

  const save = async () => {
    try { await createCategory(form); showToast('Category created.'); setShowForm(false); setForm({name:'',description:''}); load(); }
    catch { showToast('Failed.','error'); }
  };

  const del = async (id) => {
    try { await deleteCategory(id); showToast('Deleted.'); load(); }
    catch { showToast('Failed.','error'); }
  };

  return (
    <SCard title="Job Categories" icon={<Hash size={15}/>} action={
      <button className="adm-btn primary sm" onClick={()=>setShowForm(true)}><Plus size={13}/> New</button>
    }>
      {showForm && (
        <div className="adm-inline-form">
          <div className="adm-field-row">
            <div className="adm-field"><label>Name</label><input className="adm-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
            <div className="adm-field"><label>Description</label><input className="adm-input" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
          </div>
          <div className="adm-form-actions">
            <button className="adm-btn ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="adm-btn primary" onClick={save}><Save size={13}/> Create</button>
          </div>
        </div>
      )}
      {loading ? <Spin/> : (
        <div className="adm-tag-grid">
          {cats.length===0 ? <Empty msg="No categories."/> : cats.map(c=>(
            <div key={c.id} className="adm-tag-item">
              <div><strong>{c.name}</strong>{c.description && <span>{c.description}</span>}</div>
              <button className="adm-icon-btn danger" onClick={()=>del(c.id)}><Trash2 size={12}/></button>
            </div>
          ))}
        </div>
      )}
    </SCard>
  );
}

function SkillManager({ showToast }) {
  const [skills, setSkills]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName]       = useState('');

  const load = ()=>{ fetchSkills().then(setSkills).finally(()=>setLoading(false)); };
  useEffect(load,[]);

  const save = async () => {
    if (!name.trim()) return;
    try { await createSkill({ name }); showToast('Skill added.'); setName(''); load(); }
    catch { showToast('Failed.','error'); }
  };

  const del = async (id) => {
    try { await deleteSkill(id); showToast('Skill removed.'); load(); }
    catch { showToast('Failed.','error'); }
  };

  return (
    <SCard title="Platform Skills" icon={<Award size={15}/>}>
      <div className="adm-inline-form compact">
        <div className="adm-add-row">
          <input className="adm-input" placeholder="New skill name…" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&save()}/>
          <button className="adm-btn primary" onClick={save}><Plus size={13}/> Add</button>
        </div>
      </div>
      {loading ? <Spin/> : (
        <div className="adm-chip-grid">
          {skills.map(s=>(
            <div key={s.id} className="adm-skill-item">
              <span>{s.name}</span>
              <button onClick={()=>del(s.id)}><X size={11}/></button>
            </div>
          ))}
        </div>
      )}
    </SCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 11 — Broadcast Notifications
   ═══════════════════════════════════════════════════════════════════ */
function BroadcastTab({ showToast }) {
  const [form, setForm] = useState({ title:'', message:'', targetRole:'' });
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!form.title.trim()||!form.message.trim()) { showToast('Title and message required.','error'); return; }
    setSending(true);
    try {
      await broadcastNotification(form);
      showToast('Notification broadcast successfully!');
      setForm({ title:'', message:'', targetRole:'' });
    } catch { showToast('Failed to send.','error'); }
    finally { setSending(false); }
  };

  const ROLES = [{value:'',label:'All Users'},{value:'JOB_SEEKER',label:'Job Seekers Only'},{value:'EMPLOYER',label:'Employers Only'}];

  return (
    <div className="adm-two-col">
      <div>
        <SCard title="Send Broadcast" icon={<Bell size={15}/>}>
          <div className="adm-form-grid">
            <div className="adm-field">
              <label>Notification Title</label>
              <input className="adm-input" placeholder="e.g. Platform Maintenance" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
            </div>
            <div className="adm-field">
              <label>Message</label>
              <textarea className="adm-textarea" placeholder="Write your notification message…" value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={5}/>
            </div>
            <div className="adm-field">
              <label>Target Audience</label>
              <div className="adm-radio-group">
                {ROLES.map(r=>(
                  <label key={r.value} className={`adm-radio-option${form.targetRole===r.value?' active':''}`}>
                    <input type="radio" name="role" value={r.value} checked={form.targetRole===r.value} onChange={()=>setForm(f=>({...f,targetRole:r.value}))}/>
                    {r.label}
                  </label>
                ))}
              </div>
            </div>
            <button className="adm-btn primary" onClick={send} disabled={sending}>
              <Send size={14}/> {sending?'Sending…':'Send Notification'}
            </button>
          </div>
        </SCard>
      </div>
      <div>
        <SCard title="Preview" icon={<Eye size={15}/>}>
          <div className="adm-notif-preview">
            <div className="adm-notif-preview-icon"><Bell size={20}/></div>
            <div className="adm-notif-preview-body">
              <strong>{form.title||'Notification Title'}</strong>
              <p>{form.message||'Your message will appear here.'}</p>
              <span className="adm-notif-preview-meta">To: {ROLES.find(r=>r.value===form.targetRole)?.label||'All Users'}</span>
            </div>
          </div>
        </SCard>
        <SCard title="Tips" icon={<AlertCircle size={15}/>}>
          <ul className="adm-tips-list">
            <li>Keep titles short and actionable.</li>
            <li>Notifications are sent in real-time via WebSocket.</li>
            <li>Target specific roles to reduce notification fatigue.</li>
            <li>Announcements about outages should target all users.</li>
          </ul>
        </SCard>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 12 — Contacts / Compliance
   ═══════════════════════════════════════════════════════════════════ */
function ComplianceTab() {
  // Mock data — replace with real API when backend endpoint is available
  const issues = [
    { id:1, type:'Report', user:'Alice Mbah', subject:'Inappropriate job posting', status:'PENDING', date:'2025-01-10' },
    { id:2, type:'Contact', user:'Bob Foka', subject:'Cannot access account', status:'PENDING', date:'2025-01-11' },
    { id:3, type:'Report', user:'Claire Ngo', subject:'Fake company profile', status:'RESOLVED', date:'2025-01-09' },
    { id:4, type:'Contact', user:'David Sama', subject:'Payment issue', status:'PENDING', date:'2025-01-12' },
  ];

  return (
    <SCard title="Contacts & Compliance Issues" icon={<MessageSquare size={15}/>}>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Type</th><th>User</th><th>Subject</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {issues.map(iss=>(
              <tr key={iss.id}>
                <td><span className={`adm-type-tag ${iss.type.toLowerCase()}`}>{iss.type}</span></td>
                <td><div className="adm-cell-person"><Avatar name={iss.user} size={28} color={C.sky}/><span className="adm-td-strong">{iss.user}</span></div></td>
                <td className="adm-td-muted">{iss.subject}</td>
                <td><Badge status={iss.status}/></td>
                <td className="adm-td-muted">{iss.date}</td>
                <td>
                  <div className="adm-actions">
                    <button className="adm-icon-btn info" title="View"><Eye size={13}/></button>
                    <button className="adm-icon-btn approve" title="Resolve"><Check size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="adm-compliance-notice">
        <AlertCircle size={14}/>
        Connect a contact form API or support ticketing backend to populate real compliance issues here.
      </div>
    </SCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB 13 — Site Settings
   ═══════════════════════════════════════════════════════════════════ */
function SettingsTab({ showToast }) {
  const [settings, setSettings] = useState({
    siteName: 'KORA Jobs',
    siteUrl: 'https://korajobs.cm',
    supportEmail: 'support@korajobs.cm',
    timezone: 'Africa/Douala',
    language: 'fr',
    maintenanceMode: false,
    allowRegistrations: true,
    emailVerification: true,
    employerApproval: true,
    maxJobsPerEmployer: 10,
    applicationNotifs: true,
    weeklyDigest: false,
  });

  const upd = (k, v) => setSettings(s=>({...s,[k]:v}));
  const save = () => showToast('Settings saved.');

  const Toggle = ({ k }) => (
    <button className="adm-toggle" onClick={()=>upd(k,!settings[k])}>
      {settings[k] ? <ToggleRight size={28} color={C.purple}/> : <ToggleLeft size={28} color={C.slate}/>}
    </button>
  );

  return (
    <div className="adm-settings">
      <div className="adm-two-col">
        <div>
          <SCard title="General" icon={<Globe size={15}/>}>
            <div className="adm-form-grid">
              {[['siteName','Site Name'],['siteUrl','Site URL'],['supportEmail','Support Email']].map(([k,l])=>(
                <div key={k} className="adm-field">
                  <label>{l}</label>
                  <input className="adm-input" value={settings[k]} onChange={e=>upd(k,e.target.value)}/>
                </div>
              ))}
              <div className="adm-field-row">
                <div className="adm-field">
                  <label>Timezone</label>
                  <select className="adm-select" value={settings.timezone} onChange={e=>upd('timezone',e.target.value)}>
                    <option value="Africa/Douala">Africa/Douala</option>
                    <option value="Africa/Lagos">Africa/Lagos</option>
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="adm-field">
                  <label>Default Language</label>
                  <select className="adm-select" value={settings.language} onChange={e=>upd('language',e.target.value)}>
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <div className="adm-field">
                <label>Max Jobs per Employer</label>
                <input className="adm-input" type="number" value={settings.maxJobsPerEmployer} onChange={e=>upd('maxJobsPerEmployer',+e.target.value)} min={1} max={100}/>
              </div>
            </div>
          </SCard>
        </div>

        <div>
          <SCard title="Platform Toggles" icon={<Sliders size={15}/>}>
            <div className="adm-toggles-list">
              {[
                ['maintenanceMode',   'Maintenance Mode',         'Take the platform offline for maintenance'],
                ['allowRegistrations','Allow New Registrations',  'Let new users sign up'],
                ['emailVerification', 'Email Verification',       'Require email confirmation to activate accounts'],
                ['employerApproval',  'Manual Employer Approval', 'Admin must approve new employer accounts'],
                ['applicationNotifs', 'Application Notifications','Send emails on new applications'],
                ['weeklyDigest',      'Weekly Digest',            'Send weekly job alert emails to seekers'],
              ].map(([k,label,desc])=>(
                <div key={k} className="adm-toggle-row">
                  <div>
                    <strong>{label}</strong>
                    <p>{desc}</p>
                  </div>
                  <Toggle k={k}/>
                </div>
              ))}
            </div>
          </SCard>
        </div>
      </div>

      <div className="adm-settings-actions">
        <button className="adm-btn primary" onClick={save}><Save size={14}/> Save All Settings</button>
        <button className="adm-btn ghost" onClick={()=>showToast('Settings reset to defaults.')}><RefreshCw size={14}/> Reset to Defaults</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SHARED SLIDE-OVER
   ═══════════════════════════════════════════════════════════════════ */
function SlideOver({ title, children, onClose }) {
  return (
    <>
      <div className="adm-so-overlay" onClick={onClose}/>
      <div className="adm-so" role="dialog">
        <div className="adm-so-head">
          <h3>{title}</h3>
          <button className="adm-icon-btn" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="adm-so-body">{children}</div>
      </div>
    </>
  );
}

function ProfileDetail({ data, fields }) {
  return (
    <div className="adm-detail-section">
      <div className="adm-detail-avatar-row">
        <Avatar name={data.fullName??data.email??'?'} size={52} color={C.purple}/>
        <div>
          <strong>{data.fullName||'—'}</strong>
          <p>{data.profileSummary??data.jobTitle??''}</p>
        </div>
      </div>
      {fields.map(([k,v])=>(
        <div key={k} className="adm-detail-row">
          <span className="key">{k}</span>
          <span className="val">{fmt(v)}</span>
        </div>
      ))}
    </div>
  );
}