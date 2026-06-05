import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import KoraNav from '../../components/KoraNav';
import { getSalaryByCategory, getDemandTrends } from '../../api/insights';
import '../../styles/insights.css';

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

export default function InsightsPage() {
  const [salaries, setSalaries] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSalaryByCategory(),
      getDemandTrends()
    ])
    .then(([salaryData, trendData]) => {
      setSalaries(salaryData || []);
      setTrends(trendData || []);
    })
    .catch(err => console.error("Failed to fetch insights:", err))
    .finally(() => setLoading(false));
  }, []);

  return (
    <div className="insights-root" style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <KoraNav />
      <div className="insights-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px' }}>
        <div style={{ marginBottom: '40px', borderBottom: '1px solid #E5E7EB', paddingBottom: '24px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', color: '#111827', letterSpacing: '-0.02em' }}>
            Market Insights & Salary Trends
          </h1>
          <p style={{ color: '#4B5563', fontSize: '1.1rem', fontWeight: 300 }}>
            Explore real-time data on average salaries and job demand across the platform.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <div className="kora-spinner" />
          </div>
        ) : (
          <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px' }}>
            
            {/* Salary Bar Chart */}
            <div className="chart-card" style={{
              backgroundColor: 'white',
              padding: '28px',
              borderRadius: '20px',
              border: '1.5px solid #F3F4F6',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '24px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '4px', height: '18px', backgroundColor: '#1A5C2E', borderRadius: '2px' }} />
                Average Salary by Category
              </h2>
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salaries} margin={{ top: 20, right: 10, left: 10, bottom: 60 }}>
                    <defs>
                      <linearGradient id="salaryMinGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A5C2E" stopOpacity={0.85}/>
                        <stop offset="95%" stopColor="#1A5C2E" stopOpacity={0.25}/>
                      </linearGradient>
                      <linearGradient id="salaryMaxGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.85}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.25}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="category" angle={-40} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} />
                    <YAxis tickFormatter={(value) => `${Math.round(value/1000)}k`} tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <RechartsTooltip content={<CustomTooltip formatter={(value) => `${Number(value).toLocaleString()} XAF`} />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="avgSalaryMin" name="Avg Min Salary" fill="url(#salaryMinGrad)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="avgSalaryMax" name="Avg Max Salary" fill="url(#salaryMaxGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Demand Trends Line Chart */}
            <div className="chart-card" style={{
              backgroundColor: 'white',
              padding: '28px',
              borderRadius: '20px',
              border: '1.5px solid #F3F4F6',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '24px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '4px', height: '18px', backgroundColor: '#F97316', borderRadius: '2px' }} />
                Job Demand Trends
              </h2>
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" dataKey="jobCount" name="Active Postings" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#demandGrad)" dot={{ r: 5, stroke: "#F97316", strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 7, stroke: "#F97316", strokeWidth: 2, fill: "#F97316" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
