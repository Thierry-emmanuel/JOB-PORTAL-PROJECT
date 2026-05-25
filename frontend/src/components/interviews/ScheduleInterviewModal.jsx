import React, { useState } from 'react';
import { X, Calendar, Video, Phone, MapPin, Globe } from 'lucide-react';

/**
 * ScheduleInterviewModal
 *
 * Lightweight modal used in contexts where the full InterviewScheduler
 * multi-step wizard is not required.
 *
 * Fix: the type radio buttons previously sent 'VIRTUAL' which is not a valid
 *      value for the backend's InterviewType enum (VIDEO | PHONE | IN_PERSON).
 *      Updated to VIDEO / IN_PERSON. Added PHONE as a third option.
 *      The condition `formData.type === 'VIRTUAL'` that controlled the
 *      platform/meeting-link sub-form is updated to `'VIDEO'`.
 *      application.seekerName falls back to application.applicant for
 *      consistency with the employer dashboard shape.
 */
export default function ScheduleInterviewModal({ application, onClose, onSchedule }) {
  const [formData, setFormData] = useState({
    scheduledAt: '',
    type:        'VIDEO',        // matches InterviewType.VIDEO
    platform:    'Google Meet',
    meetingLink: '',
    notes:       ''
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSchedule(application.id, formData);
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to schedule interview. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Display name: prefer seekerName (admin view), then applicant (employer dashboard view)
  const applicantLabel =
    application.seekerName ||
    application.applicant  ||
    'Applicant';

  return (
    <div className="kora-modal-overlay">
      <div className="kora-modal">
        <div className="kora-modal-header">
          <div>
            <h2>Schedule Interview</h2>
            <p className="subtitle">
              For {applicantLabel}
              {application.jobTitle ? ` — ${application.jobTitle}` : ''}
            </p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="kora-modal-form">
          <div className="form-grid">

            {/* Date & Time */}
            <div className="form-group full">
              <label htmlFor="smi-date">Date &amp; Time</label>
              <div className="input-wrap">
                <Calendar size={18} className="input-icon" />
                <input
                  id="smi-date"
                  type="datetime-local"
                  required
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                />
              </div>
            </div>

            {/* Interview Type — uses real backend enum values */}
            <div className="form-group full">
              <label>Interview Type</label>
              <div className="radio-group">
                <label className={`radio-pill ${formData.type === 'VIDEO' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="type"
                    value="VIDEO"
                    checked={formData.type === 'VIDEO'}
                    onChange={() => setFormData({ ...formData, type: 'VIDEO', platform: 'Google Meet' })}
                  />
                  <Video size={16} /> Video Call
                </label>
                <label className={`radio-pill ${formData.type === 'PHONE' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="type"
                    value="PHONE"
                    checked={formData.type === 'PHONE'}
                    onChange={() => setFormData({ ...formData, type: 'PHONE', platform: 'Phone', meetingLink: '' })}
                  />
                  <Phone size={16} /> Phone
                </label>
                <label className={`radio-pill ${formData.type === 'IN_PERSON' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="type"
                    value="IN_PERSON"
                    checked={formData.type === 'IN_PERSON'}
                    onChange={() => setFormData({ ...formData, type: 'IN_PERSON', meetingLink: '' })}
                  />
                  <MapPin size={16} /> In Person
                </label>
              </div>
            </div>

            {/* Platform + meeting link — only for video calls */}
            {formData.type === 'VIDEO' && (
              <>
                <div className="form-group">
                  <label htmlFor="smi-platform">Platform</label>
                  <div className="input-wrap">
                    <Globe size={18} className="input-icon" />
                    <select
                      id="smi-platform"
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    >
                      <option>Google Meet</option>
                      <option>Zoom</option>
                      <option>Microsoft Teams</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group full">
                  <label htmlFor="smi-link">Meeting Link</label>
                  <input
                    id="smi-link"
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Location — only for in-person */}
            {formData.type === 'IN_PERSON' && (
              <div className="form-group full">
                <label htmlFor="smi-location">Location / Address</label>
                <input
                  id="smi-location"
                  type="text"
                  placeholder="e.g. 12 Rue des Palmiers, Douala"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                />
              </div>
            )}

            {/* Notes */}
            <div className="form-group full">
              <label htmlFor="smi-notes">Message to Candidate (optional)</label>
              <textarea
                id="smi-notes"
                rows="3"
                placeholder="Any details or instructions for the candidate..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <p role="alert" style={{
              marginTop: '12px',
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#991b1b',
            }}>
              {error}
            </p>
          )}

          <div className="kora-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Scheduling…' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
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
          max-width: 520px;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .kora-modal-header {
          padding: 24px;
          border-bottom: 1px solid #F3F4F6;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .kora-modal-header h2 { margin: 0; font-size: 20px; color: #111827; }
        .subtitle { margin: 4px 0 0; font-size: 14px; color: #6B7280; }
        .close-btn {
          background: #F9FAFB;
          border: none;
          padding: 8px;
          border-radius: 12px;
          cursor: pointer;
          color: #6B7280;
          transition: all 0.2s;
        }
        .close-btn:hover { background: #F3F4F6; color: #111827; }
        .kora-modal-form { padding: 24px; }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .form-group { display: flex; flex-direction: column; }
        .form-group.full { grid-column: 1 / -1; }
        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .input-wrap { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 12px; color: #9CA3AF; pointer-events: none; }
        input[type="datetime-local"],
        input[type="url"],
        input[type="text"],
        select,
        textarea {
          width: 100%;
          padding: 12px;
          border: 1.5px solid #E5E7EB;
          border-radius: 12px;
          font-size: 14px;
          color: #111827;
          background: white;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .input-wrap input,
        .input-wrap select { padding-left: 40px; }
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #1A5C2E;
          box-shadow: 0 0 0 4px rgba(26, 92, 46, 0.1);
        }
        textarea { resize: vertical; }
        .radio-group { display: flex; gap: 8px; flex-wrap: wrap; }
        .radio-pill {
          flex: 1;
          min-width: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border-radius: 12px;
          border: 1.5px solid #E5E7EB;
          font-size: 13px;
          font-weight: 600;
          color: #6B7280;
          cursor: pointer;
          transition: all 0.2s;
          user-select: none;
        }
        .radio-pill input[type="radio"] { display: none; }
        .radio-pill.active {
          background: #F0FDF4;
          border-color: #1A5C2E;
          color: #1A5C2E;
        }
        .kora-modal-footer { margin-top: 24px; display: flex; gap: 12px; }
        .btn-primary, .btn-secondary {
          flex: 1;
          padding: 14px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .btn-primary { background: #1A5C2E; color: white; }
        .btn-primary:hover:not(:disabled) { background: #0D3D1F; transform: translateY(-2px); }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .btn-secondary { background: white; color: #374151; border: 1.5px solid #E5E7EB; }
        .btn-secondary:hover { background: #F9FAFB; }
      `}</style>
    </div>
  );
}