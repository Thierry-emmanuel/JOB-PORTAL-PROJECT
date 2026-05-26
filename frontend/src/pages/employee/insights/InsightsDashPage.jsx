import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line
} from "recharts";
import { TrendingUp, BarChart3, AlertCircle } from "lucide-react";
import EmployeeLayout from "../../../layouts/EmployeeLayout";
import useEmployeeDashboard from "../../../hooks/useEmployeeDashboard";
import { getSalaryByCategory, getDemandTrends } from "../../../api/insights";

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

          <div className="ds-card">
            <div className="ds-card-header">
              <h2 className="ds-card-title">
                <div className="ds-card-title-icon"><BarChart3 size={15} /></div>
                Average Salary by Category
              </h2>
            </div>
            <div className="ds-card-body" style={{ height:360 }}>
              {salaries.length === 0
                ? <div className="ds-empty"><p className="ds-empty-title">No salary data available</p></div>
                : (
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
                )
              }
            </div>
          </div>

          <div className="ds-card">
            <div className="ds-card-header">
              <h2 className="ds-card-title">
                <div className="ds-card-title-icon"><TrendingUp size={15} /></div>
                Job Demand Trends
              </h2>
            </div>
            <div className="ds-card-body" style={{ height:360 }}>
              {trends.length === 0
                ? <div className="ds-empty"><p className="ds-empty-title">No trend data available</p></div>
                : (
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
                )
              }
            </div>
          </div>

        </div>
      )}
    </EmployeeLayout>
  );
}