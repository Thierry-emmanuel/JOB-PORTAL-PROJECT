import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getInterviewsByEmployer, cancelInterview, recordInterviewResult } from '../../api/interviews';
import InterviewCard from '../../components/interviews/InterviewCard';
import { Calendar, Filter, Search, ChevronRight } from 'lucide-react';
import EmployerSidebar from "../../components/employer/EmployerSidebar";
import { useEmployerDashboard } from "../../hooks/useEmployerDashboard";
import "../../styles/dashboard-shell.css";

import "../../styles/profile.css";

export default function InterviewManagement() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, COMPLETED

  const {
    employer, stats, loading
  } = useEmployerDashboard();

  useEffect(() => {
    const fetchInterviews = async () => {
      if (!user?.id) return;
      try {
        const data = await getInterviewsByEmployer(user.id);
        setInterviews(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLocalLoading(false);
      }
    };
    fetchInterviews();
  }, [user]);

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this interview?')) {
      try {
        await cancelInterview(id);
        setInterviews(interviews.filter(i => i.id !== id));
      } catch (err) {
        alert('Failed to cancel interview');
      }
    }
  };

  const handleRecordResult = async (interview) => {
    const result = window.prompt('Enter result (PASSED/FAILED):', 'PASSED');
    if (result) {
      try {
        const feedback = window.prompt('Enter feedback:');
        await recordInterviewResult(interview.id, { result, feedback });
        // Refresh list
        const updated = interviews.map(i => i.id === interview.id ? { ...i, result, pending: false, completed: true } : i);
        setInterviews(updated);
      } catch (err) {
        alert('Failed to record result');
      }
    }
  };

  const filteredInterviews = interviews.filter(i => {
    if (filter === 'PENDING') return i.pending;
    if (filter === 'COMPLETED') return i.completed;
    return true;
  });

  return (
    <div className="ds-root employer">
      <div className="ds-body">

        {/* ════════ SIDEBAR ════════ */}
        <aside className="ds-sidebar">
          <EmployerSidebar employer={employer} loading={loading} stats={stats} />
        </aside>

        {/* ════════ MAIN CONTENT ════════ */}
        <main className="ds-main">

          <div className="ed-welcome">
            <div>
              <h1 className="ed-welcome-title">Interview Management</h1>
              <p className="ed-welcome-sub">
                Track and manage candidate evaluations
              </p>
            </div>
          </div>

          <div className="ed-two-col" style={{ gridTemplateColumns: "1fr 280px" }}>

            {/* LEFT — Main List */}
            <div className="kora-section">
              <div className="ed-search-bar" style={{ marginBottom: "20px" }}>
                <Search size={14} />
                <input type="text" placeholder="Search candidates..." />
              </div>

              {localLoading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--kora-muted)" }}>
                  <p>Loading interviews...</p>
                </div>
              ) : filteredInterviews.length === 0 ? (
                <div className="kora-empty-state">
                  <Calendar size={48} />
                  <h3>No interviews found</h3>
                  <p>Scheduled interviews will appear here.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                  {filteredInterviews.map(iv => (
                    <InterviewCard
                      key={iv.id}
                      interview={iv}
                      isEmployer={true}
                      onCancel={handleCancel}
                      onRecordResult={handleRecordResult}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT Column — Filters */}
            <div className="ed-right-col">
              <div className="kora-section">
                <div className="kora-section-header">
                  <div className="kora-section-title">
                    <Filter size={18} />
                    <h2>Status Filter</h2>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {['ALL', 'PENDING', 'COMPLETED'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        border: "none",
                        background: filter === f ? "var(--kora-green-light)" : "transparent",
                        color: filter === f ? "var(--kora-green)" : "var(--kora-muted)",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {f}
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}