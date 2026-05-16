import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getInterviewsByJobPosting, cancelInterview, recordInterviewResult } from '../../api/interviews';
import InterviewCard from '../../components/interviews/InterviewCard';
import { Calendar, Filter, Search, ChevronRight } from 'lucide-react';

export default function InterviewManagement() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, COMPLETED

  useEffect(() => {
    // In a real app, we might want to fetch all interviews for ALL employer job postings
    // For now, we'll try to fetch for a generic context or specific ID if available
    const fetchInterviews = async () => {
      try {
        // Mocking fetching for employer's active contexts
        // In a real system, the backend might have /api/v1/interviews/employer/me
        const data = await getInterviewsByJobPosting('all'); // Assuming backend handles 'all' or we iterate
        setInterviews(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
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
    <div className="kora-page-container">
      <div className="kora-bg-mesh" />
      
      <div className="kora-content-wrap">
        <header className="page-header">
          <div className="header-text">
            <h1 className="title">Interview Management</h1>
            <p className="subtitle">Track and manage candidate evaluations</p>
          </div>
          
          <div className="header-actions">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder="Search candidates..." />
            </div>
          </div>
        </header>

        <div className="management-layout">
          <aside className="filters-sidebar">
            <div className="filter-card">
              <h3>Status Filter</h3>
              <div className="filter-options">
                {['ALL', 'PENDING', 'COMPLETED'].map(f => (
                  <button 
                    key={f} 
                    className={`filter-btn ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="interviews-grid-wrap">
            {loading ? (
              <div className="loading-state">
                <div className="kora-spinner" />
                <p>Loading interviews...</p>
              </div>
            ) : filteredInterviews.length === 0 ? (
              <div className="empty-state">
                <Calendar size={48} />
                <h3>No interviews found</h3>
                <p>Scheduled interviews will appear here.</p>
              </div>
            ) : (
              <div className="interviews-grid">
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
          </main>
        </div>
      </div>

      <style jsx>{`
        .kora-page-container {
          min-height: 100vh;
          padding: 40px 20px;
          position: relative;
        }

        .kora-bg-mesh {
          position: fixed;
          inset: 0;
          background: 
            radial-gradient(at 0% 0%, rgba(26, 92, 46, 0.05) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(249, 115, 22, 0.05) 0px, transparent 50%),
            #F9FAFB;
          z-index: -1;
        }

        .kora-content-wrap {
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
        }

        .title {
          font-size: 32px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -1px;
          margin: 0;
        }

        .subtitle {
          color: #6B7280;
          margin: 8px 0 0;
        }

        .header-actions {
          display: flex;
          gap: 16px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          border: 1.5px solid #E5E7EB;
          padding: 10px 16px;
          border-radius: 14px;
          width: 300px;
          transition: all 0.2s;
        }

        .search-box:focus-within {
          border-color: #1A5C2E;
          box-shadow: 0 0 0 4px rgba(26, 92, 46, 0.1);
        }

        .search-box input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
        }

        .management-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
        }

        .filter-card {
          background: white;
          padding: 24px;
          border-radius: 20px;
          border: 1px solid #E5E7EB;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .filter-card h3 {
          font-size: 14px;
          font-weight: 700;
          color: #374151;
          margin: 0 0 16px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .filter-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #6B7280;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .filter-btn:hover {
          background: #F9FAFB;
          color: #111827;
        }

        .filter-btn.active {
          background: #F0FDF4;
          color: #1A5C2E;
        }

        .interviews-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 80px 0;
          background: white;
          border-radius: 24px;
          border: 1.5px dashed #E5E7EB;
        }

        .empty-state {
          color: #9CA3AF;
        }

        .empty-state h3 {
          color: #4B5563;
          margin: 16px 0 8px;
        }

        @media (max-width: 900px) {
          .management-layout {
            grid-template-columns: 1fr;
          }
          .filters-sidebar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
