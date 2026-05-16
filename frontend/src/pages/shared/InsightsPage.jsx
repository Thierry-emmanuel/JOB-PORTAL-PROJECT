import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import KoraNav from '../../components/KoraNav';
import { getSalaryByCategory, getDemandTrends } from '../../api/insights';
import '../../styles/insights.css';

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
    <div className="insights-root" style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <KoraNav />
      <div className="insights-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>Market Insights & Salary Trends</h1>
        <p style={{ color: '#6b7280', marginBottom: '40px' }}>Explore real-time data on average salaries and job demand across the platform.</p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <div className="kora-spinner" />
          </div>
        ) : (
          <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px' }}>
            
            {/* Salary Bar Chart */}
            <div className="chart-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '20px', color: '#374151' }}>Average Salary by Category</h2>
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salaries} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                    <RechartsTooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend verticalAlign="top" height={36}/>
                    <Bar dataKey="avgSalaryMin" name="Avg Min Salary" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgSalaryMax" name="Avg Max Salary" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Demand Trends Line Chart */}
            <div className="chart-card" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '20px', color: '#374151' }}>Job Demand Trends</h2>
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend verticalAlign="top" height={36}/>
                    <Line type="monotone" dataKey="jobCount" name="Active Postings" stroke="#F59E0B" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
