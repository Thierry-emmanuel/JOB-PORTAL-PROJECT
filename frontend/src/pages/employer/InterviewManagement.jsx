import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getInterviewsByEmployer, cancelInterview, recordInterviewResult } from '../../api/interviews';
import InterviewCard from '../../components/interviews/InterviewCard';
import { Calendar, Filter, Search, ChevronRight } from 'lucide-react';
import EmployerSidebar from "../../components/employer/EmployerSidebar";
import KoraNav from "../../components/KoraNav";
import { useEmployerDashboard } from "../../hooks/useEmployerDashboard";
import "../../styles/employee-dashboard.css";
import "../../styles/employer-dashboard.css";
import "../../styles/profile.css";

export default function InterviewManagement() {
  const { t } = useTranslation();
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
    if (window.confirm(t('employer.interviews_scheduled'))) {
      try {
        await cancelInterview(id);
        setInterviews(interviews.filter(i => i.id !== id));
      } catch (err) {
        alert(t('common.retry'));
      }
    }
  };

  const handleRecordResult = async (interview) => {
    const result = window.prompt(t('employer.interviews_scheduled'), 'PASSED');
    if (result) {
      try {
        const feedback = window.prompt(t('employer.interviews_scheduled'));
        await recordInterviewResult(interview.id, { result, feedback });
        // Refresh list
        const updated = interviews.map(i => i.id === interview.id ? { ...i, result, pending: false, completed: true } : i);
        setInterviews(updated);
      } catch (err) {
        alert(t('common.retry'));
      }
    }
  };

  const filteredInterviews = interviews.filter(i => {
    if (filter === 'PENDING') return i.pending;
    if (filter === 'COMPLETED') return i.completed;
    return true;
  });

  return (
    <div className="ed-root">
      <KoraNav />
      <div className="ed-body">
        
        {/* ════════ SIDEBAR ════════ */}
        <aside className="ed-sidebar kora-sidebar">
          <EmployerSidebar employer={employer} loading={loading} stats={stats} />
        </aside>

        {/* ════════ MAIN CONTENT ════════ */}
        <main className="ed-main">
          
          <div className="ed-welcome">
            <div>
              <h1 className="ed-welcome-title">{t('employer.manage_jobs')}</h1>
              <p className="ed-welcome-sub">
                {t('employer.recent_jobs')}
              </p>
            </div>
          </div>

          <div className="ed-two-col" style={{ gridTemplateColumns: "1fr 280px" }}>
            
            {/* LEFT — Main List */}
            <div className="kora-section">
              <div className="ed-search-bar" style={{ marginBottom: "20px" }}>
                <Search size={14} />
                <input type="text" placeholder={t('employer.no_jobs_posted')} />
              </div>

              {localLoading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--kora-muted)" }}>
                  <p>{t('common.loading')}</p>
                </div>
              ) : filteredInterviews.length === 0 ? (
                <div className="kora-empty-state">
                  <Calendar size={48} />
                  <h3>{t('employer.no_jobs_posted')}</h3>
                  <p>{t('employer.post_first_job')}</p>
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
                    <h2>{t('employer.active_jobs')}</h2>
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
