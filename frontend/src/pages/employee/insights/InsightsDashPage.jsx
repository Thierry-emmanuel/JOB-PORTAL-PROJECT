import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { TrendingUp, BarChart3, AlertCircle } from "lucide-react";
import EmployeeLayout from "../../../layouts/EmployeeLayout";
import useEmployeeDashboard from "../../../hooks/useEmployeeDashboard";
import { getSalaryByCategory, getDemandTrends } from "../../../api/insights";

/* ─── Premium Glassmorphic Tooltip ─── */
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '14px',
        padding: '14px 18px',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
        color: '#fff',
        fontFamily: 'inherit'
      }}>
        <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </p>
        {payload.map((p, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', margin: '6px 0' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.color || p.stroke }} />
            <span style={{ fontWeight: 500, color: '#D1D5DB' }}>{p.name}:</span>
            <span style={{ fontWeight: 700, color: '#fff' }}>
              {formatter ? formatter(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function InsightsDashPage() {
  const { profile, completion, handlePhotoChange } = useEmployeeDashboard();
  const [salaries, setSalaries] = useState([]);
  const [trends,   setTrends]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    Promise.all([getSalaryByCategory(), getDemandTrends()])
      .then(([s, t]) => { setSalaries(s || []); setTrends(t || []); })
      .catch(() => setError("Could not load market insights."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <EmployeeLayout profile={profile} completion={completion} onPhotoChange={handlePhotoChange}>
      <div className="ds-page-header">
        <div>
          <h1 className="ds-page-title">Market Insights</h1>
          <p className="ds-page-sub">Real-time salary and demand data across the Kora platform</p>
        </div>
      </div>

      {loading && (
        <div style={{ display:"flex", justifyContent:"center", padding:"80px 0" }}>
          <div style={{ width:28, height:28, border:"3px solid #E5E7EB", borderTopColor:"var(--ds-accent)", borderRadius:"50%", animation:"ds-spin 0.8s linear infinite" }} />
        </div>
      )}

      {error && (
        <div className="ds-error">
          <div className="ds-error-icon"><AlertCircle size={22} /></div>
          <p style={{ fontWeight:700 }}>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(480px, 1fr))", gap:20 }}>

          <div className="ds-card" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            <div className="ds-card-header">
              <h2 className="ds-card-title">
                <div className="ds-card-title-icon" style={{ backgroundColor: 'rgba(26,92,46,0.1)', color: '#1A5C2E' }}><BarChart3 size={15} /></div>
                Average Salary by Category
              </h2>
            </div>
            <div className="ds-card-body" style={{ height:360 }}>
              {salaries.length === 0
                ? <div className="ds-empty"><p className="ds-empty-title">No salary data available</p></div>
                : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salaries} margin={{ top:15, right:15, left:5, bottom:60 }}>
                      <defs>
                        <linearGradient id="seekerSalaryMinGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1A5C2E" stopOpacity={0.85}/>
                          <stop offset="95%" stopColor="#1A5C2E" stopOpacity={0.25}/>
                        </linearGradient>
                        <linearGradient id="seekerSalaryMaxGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.85}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.25}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="category" angle={-40} textAnchor="end" height={70} interval={0} tick={{ fontSize:11, fill: '#6B7280', fontWeight: 500 }} />
                      <YAxis tickFormatter={v => `${Math.round(v/1000)}k`} tick={{ fontSize:11, fill: '#6B7280' }} />
                      <Tooltip content={<CustomTooltip formatter={(value) => `${Number(value).toLocaleString()} XAF`} />} />
                      <Legend verticalAlign="top" height={30} iconType="circle" />
                      <Bar dataKey="avgSalaryMin" name="Min Salary" fill="url(#seekerSalaryMinGrad)" radius={[6,6,0,0]} />
                      <Bar dataKey="avgSalaryMax" name="Max Salary" fill="url(#seekerSalaryMaxGrad)" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </div>
          </div>

          <div className="ds-card" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            <div className="ds-card-header">
              <h2 className="ds-card-title">
                <div className="ds-card-title-icon" style={{ backgroundColor: 'rgba(249,115,22,0.1)', color: '#F97316' }}><TrendingUp size={15} /></div>
                Job Demand Trends
              </h2>
            </div>
            <div className="ds-card-body" style={{ height:360 }}>
              {trends.length === 0
                ? <div className="ds-empty"><p className="ds-empty-title">No trend data available</p></div>
                : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top:15, right:15, left:5, bottom:10 }}>
                      <defs>
                        <linearGradient id="seekerDemandGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F97316" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#F97316" stopOpacity={0.02}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="period" tick={{ fontSize:11, fill: '#6B7280', fontWeight: 500 }} />
                      <YAxis tick={{ fontSize:11, fill: '#6B7280' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={30} iconType="circle" />
                      <Area type="monotone" dataKey="jobCount" name="Active Postings" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#seekerDemandGrad)" dot={{ r: 5, stroke: "#F97316", strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 7, stroke: "#F97316", strokeWidth: 2, fill: "#F97316" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )
              }
            </div>
          </div>

        </div>
      )}
    </EmployeeLayout>
  );
}