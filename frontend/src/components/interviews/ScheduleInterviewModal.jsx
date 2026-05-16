import React, { useState } from 'react';
import { X, Calendar, Video, MapPin, Globe } from 'lucide-react';

export default function ScheduleInterviewModal({ application, onClose, onSchedule }) {
  const [formData, setFormData] = useState({
    scheduledAt: '',
    type: 'VIRTUAL',
    platform: 'Google Meet',
    meetingLink: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSchedule(application.id, formData);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kora-modal-overlay">
      <div className="kora-modal">
        <div className="kora-modal-header">
          <div>
            <h2>Schedule Interview</h2>
            <p className="subtitle">For {application.seekerName || 'Applicant'} - {application.jobTitle}</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="kora-modal-form">
          <div className="form-grid">
            <div className="form-group full">
              <label>Date & Time</label>
              <div className="input-wrap">
                <Calendar size={18} className="input-icon" />
                <input 
                  type="datetime-local" 
                  required 
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Interview Type</label>
              <div className="radio-group">
                <label className={`radio-pill ${formData.type === 'VIRTUAL' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="type" 
                    value="VIRTUAL" 
                    checked={formData.type === 'VIRTUAL'} 
                    onChange={() => setFormData({...formData, type: 'VIRTUAL'})} 
                  />
                  <Video size={16} /> Virtual
                </label>
                <label className={`radio-pill ${formData.type === 'IN_PERSON' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="type" 
                    value="IN_PERSON" 
                    checked={formData.type === 'IN_PERSON'} 
                    onChange={() => setFormData({...formData, type: 'IN_PERSON'})} 
                  />
                  <MapPin size={16} /> In Person
                </label>
              </div>
            </div>

            {formData.type === 'VIRTUAL' && (
              <>
                <div className="form-group">
                  <label>Platform</label>
                  <div className="input-wrap">
                    <Globe size={18} className="input-icon" />
                    <select 
                      value={formData.platform}
                      onChange={(e) => setFormData({...formData, platform: e.target.value})}
                    >
                      <option>Google Meet</option>
                      <option>Zoom</option>
                      <option>Microsoft Teams</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group full">
                  <label>Meeting Link</label>
                  <input 
                    type="url" 
                    placeholder="https://meet.google.com/..." 
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({...formData, meetingLink: e.target.value})}
                  />
                </div>
              </>
            )}

            <div className="form-group full">
              <label>Internal Notes / Feedback</label>
              <textarea 
                rows="3" 
                placeholder="Details for the candidate..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          <div className="kora-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .kora-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(17, 24, 39, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .kora-modal {
          background: white;
          width: 100%;
          max-width: 500px;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .kora-modal-header {
          padding: 24px;
          border-bottom: 1px solid #F3F4F6;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .kora-modal-header h2 {
          margin: 0;
          font-size: 20px;
          color: #111827;
        }

        .subtitle {
          margin: 4px 0 0;
          font-size: 14px;
          color: #6B7280;
        }

        .close-btn {
          background: #F9FAFB;
          border: none;
          padding: 8px;
          border-radius: 12px;
          cursor: pointer;
          color: #6B7280;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #F3F4F6;
          color: #111827;
        }

        .kora-modal-form {
          padding: 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group.full {
          grid-column: 1 / -1;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: #9CA3AF;
        }

        input, select, textarea {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1.5px solid #E5E7EB;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.2s;
        }

        input:not(.input-icon + input), textarea:not(.input-icon + input) {
          padding-left: 12px;
        }

        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #1A5C2E;
          box-shadow: 0 0 0 4px rgba(26, 92, 46, 0.1);
        }

        .radio-group {
          display: flex;
          gap: 8px;
        }

        .radio-pill {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          border-radius: 12px;
          border: 1.5px solid #E5E7EB;
          font-size: 13px;
          font-weight: 600;
          color: #6B7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .radio-pill input {
          display: none;
        }

        .radio-pill.active {
          background: #F0FDF4;
          border-color: #1A5C2E;
          color: #1A5C2E;
        }

        .kora-modal-footer {
          margin-top: 32px;
          display: flex;
          gap: 12px;
        }

        .btn-primary, .btn-secondary {
          flex: 1;
          padding: 14px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #1A5C2E;
          color: white;
          border: none;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0D3D1F;
          transform: translateY(-2px);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: white;
          color: #374151;
          border: 1.5px solid #E5E7EB;
        }

        .btn-secondary:hover {
          background: #F9FAFB;
        }
      `}</style>
    </div>
  );
}
