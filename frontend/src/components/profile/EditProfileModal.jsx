import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

export default function EditProfileModal({ section, profile, onSave, onClose }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (section === "basic") {
      setForm({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        city: profile.city || "",
        region: profile.region || "",
        dateOfBirth: profile.dateOfBirth || "",
        summary: profile.summary || "",
      });
    }
  }, [section, profile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(section, form);
  };

  const REGIONS = ["Centre", "Littoral", "Nord", "Sud", "Est", "Ouest", "Adamaoua", "Nord-Ouest", "Sud-Ouest", "Extrême-Nord"];

  return (
    <div className="kora-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="kora-modal">
        <div className="kora-modal-header">
          <h2>Edit Personal Information</h2>
          <button className="kora-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="kora-modal-body">
          <div className="kora-form-grid">
            <div className="kora-field kora-field-full">
              <label>Full Name *</label>
              <input
                value={form.fullName || ""}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="kora-field">
              <label>Phone Number</label>
              <input
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+237 6XX XXX XXX"
              />
            </div>

            <div className="kora-field">
              <label>Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth || ""}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </div>

            <div className="kora-field">
              <label>City</label>
              <input
                value={form.city || ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Yaoundé"
              />
            </div>

            <div className="kora-field">
              <label>Region</label>
              <select value={form.region || ""} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                <option value="">Select region</option>
                {REGIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div className="kora-field kora-field-full">
              <label>Professional Summary</label>
              <textarea
                rows={4}
                value={form.summary || ""}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Tell employers about yourself — your strengths, goals, and what makes you stand out..."
                maxLength={600}
              />
              <span className="kora-char-count">{(form.summary || "").length}/600</span>
            </div>
          </div>

          <div className="kora-modal-footer">
            <button type="button" className="kora-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="kora-btn-primary">
              <Save size={15} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
