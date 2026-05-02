import { useState } from "react";
import { GraduationCap, Plus, Edit2, Trash2, MapPin } from "lucide-react";

export default function EducationSection({ education, onUpdate }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ degree: "", institution: "", city: "", startYear: "", endYear: "", current: false });

  const resetForm = () => setForm({ degree: "", institution: "", city: "", startYear: "", endYear: "", current: false });

  const handleAdd = () => {
    if (!form.degree || !form.institution) return;
    onUpdate([...education, { ...form, id: Date.now() }]);
    resetForm(); setAdding(false);
  };

  const handleEdit = (edu) => { setEditing(edu.id); setForm({ ...edu }); };

  const handleUpdate = () => {
    onUpdate(education.map((e) => (e.id === editing ? { ...form, id: editing } : e)));
    setEditing(null); resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm("Remove this education entry?")) onUpdate(education.filter((e) => e.id !== id));
  };

  return (
    <section className="kora-section">
      <div className="kora-section-header">
        <div className="kora-section-title">
          <GraduationCap size={18} />
          <h2>Education</h2>
        </div>
        <button className="kora-add-btn" onClick={() => { setAdding(true); setEditing(null); resetForm(); }}>
          <Plus size={15} />Add
        </button>
      </div>

      {(adding || editing !== null) && (
        <div className="kora-form-card">
          <h3 className="kora-form-title">{editing !== null ? "Edit Education" : "Add Education"}</h3>
          <div className="kora-form-grid">
            <div className="kora-field kora-field-full">
              <label>Degree / Certificate *</label>
              <input value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} placeholder="e.g. Engineer's Degree – Computer Science" />
            </div>
            <div className="kora-field">
              <label>Institution *</label>
              <input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="e.g. Institut Saint Jean" />
            </div>
            <div className="kora-field">
              <label>City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Yaoundé" />
            </div>
            <div className="kora-field">
              <label>Start Year</label>
              <input type="number" min="1990" max="2030" value={form.startYear} onChange={(e) => setForm({ ...form, startYear: e.target.value })} placeholder="2022" />
            </div>
            <div className="kora-field">
              <label>End Year</label>
              <input type="number" min="1990" max="2030" value={form.endYear} disabled={form.current} onChange={(e) => setForm({ ...form, endYear: e.target.value })} placeholder="2025" />
            </div>
            <div className="kora-field kora-checkbox-field">
              <label>
                <input type="checkbox" checked={form.current} onChange={(e) => setForm({ ...form, current: e.target.checked, endYear: "" })} />
                Currently enrolled
              </label>
            </div>
          </div>
          <div className="kora-form-actions">
            <button className="kora-btn-secondary" onClick={() => { setAdding(false); setEditing(null); resetForm(); }}>Cancel</button>
            <button className="kora-btn-primary" onClick={editing !== null ? handleUpdate : handleAdd}>{editing !== null ? "Update" : "Save"}</button>
          </div>
        </div>
      )}

      {education.length === 0 && !adding ? (
        <div className="kora-empty-state">
          <GraduationCap size={32} />
          <p>No education entries yet</p>
          <button className="kora-btn-ghost" onClick={() => setAdding(true)}>Add your education</button>
        </div>
      ) : (
        <div className="kora-timeline">
          {education.map((edu, i) => (
            <div key={edu.id} className="kora-timeline-item">
              <div className="kora-timeline-dot kora-dot-edu" />
              {i < education.length - 1 && <div className="kora-timeline-line" />}
              <div className="kora-timeline-content">
                <div className="kora-exp-header">
                  <div>
                    <h3 className="kora-exp-title">{edu.degree}</h3>
                    <p className="kora-exp-company">{edu.institution}</p>
                  </div>
                  <div className="kora-item-actions">
                    <button onClick={() => handleEdit(edu)}><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(edu.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="kora-exp-meta">
                  {edu.city && <span><MapPin size={12} />{edu.city}</span>}
                  <span>{edu.startYear} – {edu.current ? "Present" : edu.endYear}</span>
                </div>
                {edu.current && <span className="kora-current-badge">In progress</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
