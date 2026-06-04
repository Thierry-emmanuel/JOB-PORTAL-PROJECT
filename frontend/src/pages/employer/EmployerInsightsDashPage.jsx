import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
  TrendingUp, BarChart3, AlertCircle, RefreshCw, X,
  CheckCircle
} from 'lucide-react';
import EmployerSidebar from '../../components/employer/EmployerSidebar';
import { useEmployerDashboard } from '../../hooks/useEmployerDashboard';
import { getSalaryByCategory, getDemandTrends } from '../../api/insights';
import '../../styles/dashboard-shell.css';

/* ─── Toast ────────────────────────────────────────────────── */
function Toast({ toasts, remove }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position:'fixed', top:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex', alignItems:'flex-start', gap:10,
          background: t.type === 'error' ? '#FEF2F2' : '#ECFDF5',
          border: `1.5px solid ${t.type === 'error' ? '#FCA5A5' : '#6EE7B7'}`,
          borderRadius:12, padding:'12px 16px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)',
          minWidth:280, maxWidth:380,
        }}>
          {t.type === 'error'
            ? <AlertCircle size={16} color="#DC2626" style={{flexShrink:0,marginTop:1}}/>
            : <CheckCircle size={16} color="#10B981" style={{flexShrink:0,marginTop:1}}/>}
          <div style={{flex:1}}>
            <p style={{fontSize:13,fontWeight:600,color:t.type==='error'?'#991B1B':'#065F46',margin:'0 0 2px'}}>{t.title}</p>
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

/* ════════════════════════════════════════════════════════════
   EmployerInsightsDashPage
   ════════════════════════════════════════════════════════════ */
export default function EmployerInsightsDashPage() {
  const navigate = useNavigate();
  const { toasts, add: addToast, remove: removeToast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { employer, stats, loading: employerLoading } = useEmployerDashboard();

  const [salaries, setSalaries] = useState([]);
  const [trends,   setTrends]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchInsights = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getSalaryByCategory(), getDemandTrends()])
      .then(([s, t]) => { setSalaries(s || []); setTrends(t || []); })
      .catch(() => setError('Could not load market insights. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  return (
    <div className="ds-root employer">
      <Toast toasts={toasts} remove={removeToast} />

      {mobileOpen && <div className="ds-mobile-overlay" onClick={() => setMobileOpen(false)} />}

      <div className="ds-body">
        {/* ════ SIDEBAR ════ */}
        <aside className={`ds-sidebar${mobileOpen ? ' ds-sidebar--mobile-open' : ''}`}>
          <button className="ds-mobile-close" onClick={() => setMobileOpen(false)}><X size={16} /></button>
          <EmployerSidebar employer={employer} loading={employerLoading} stats={stats} />
        </aside>

        {/* ════ MAIN ════ */}
        <main className="ds-main">

          {/* ── Page Header ── */}
          <div className="ds-page-header">
            <div>
              <h1 className="ds-page-title">Market Insights</h1>
              <p className="ds-page-sub">Real-time salary and demand data across the Kora platform</p>
            </div>
            <button
              className="ds-btn ds-btn-ghost"
              onClick={fetchInsights}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'ds-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
              <div style={{
                width:28, height:28,
                border:'3px solid #E5E7EB',
                borderTopColor:'var(--ds-accent)',
                borderRadius:'50%',
                animation:'ds-spin 0.8s linear infinite'
              }} />
            </div>
          )}

          {/* ── Error ── */}
          {error && !loading && (
            <div className="ds-error">
              <div className="ds-error-icon"><AlertCircle size={22} /></div>
              <p style={{ fontWeight:700 }}>{error}</p>
              <button className="ds-btn ds-btn-primary" onClick={fetchInsights}>
                <RefreshCw size={13} /> Try Again
              </button>
            </div>
          )}

          {/* ── Charts ── */}
          {!loading && !error && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(480px, 1fr))', gap:20 }}>

              {/* Salary Bar Chart */}
              <div className="ds-card">
                <div className="ds-card-header">
                  <h2 className="ds-card-title">
                    <div className="ds-card-title-icon"><BarChart3 size={15} /></div>
                    Average Salary by Category
                  </h2>
                </div>
                <div className="ds-card-body" style={{ height:360 }}>
                  {salaries.length === 0 ? (
                    <div className="ds-empty">
                      <div className="ds-empty-icon"><BarChart3 size={22} /></div>
                      <p className="ds-empty-title">No salary data available</p>
                      <p className="ds-empty-sub">Salary data will appear as jobs are posted on the platform.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salaries} margin={{ top:10, right:20, left:10, bottom:60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="category" angle={-40} textAnchor="end" height={70} interval={0} tick={{ fontSize:11 }} />
                        <YAxis tickFormatter={v => `$${Math.round(v/1000)}k`} tick={{ fontSize:11 }} />
                        <Tooltip formatter={v => `$${Number(v).toLocaleString()}`} />
                        <Legend verticalAlign="top" height={30} />
                        <Bar dataKey="avgSalaryMin" name="Min Salary" fill="#1A5C2E" radius={[4,4,0,0]} />
                        <Bar dataKey="avgSalaryMax" name="Max Salary" fill="#10B981" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Demand Trends Line Chart */}
              <div className="ds-card">
                <div className="ds-card-header">
                  <h2 className="ds-card-title">
                    <div className="ds-card-title-icon"><TrendingUp size={15} /></div>
                    Job Demand Trends
                  </h2>
                </div>
                <div className="ds-card-body" style={{ height:360 }}>
                  {trends.length === 0 ? (
                    <div className="ds-empty">
                      <div className="ds-empty-icon"><TrendingUp size={22} /></div>
                      <p className="ds-empty-title">No trend data available</p>
                      <p className="ds-empty-sub">Trend data will appear as job postings accumulate over time.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trends} margin={{ top:10, right:20, left:10, bottom:10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="period" tick={{ fontSize:11 }} />
                        <YAxis tick={{ fontSize:11 }} />
                        <Tooltip />
                        <Legend verticalAlign="top" height={30} />
                        <Line type="monotone" dataKey="jobCount" name="Active Postings" stroke="#E07B39" strokeWidth={3} dot={{ r:5 }} activeDot={{ r:7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
