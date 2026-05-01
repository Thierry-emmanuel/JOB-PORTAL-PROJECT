import { useState } from "react";
import { Briefcase, Plus, Edit2, Trash2, MapPin, Calendar } from "lucide-react";

export default function ExperienceSection({ experiences, onUpdate }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    company: "",
    city: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });

  const resetForm = () =>
    setForm({ title: "", company: "", city: "", startDate: "", endDate: "", current: false, description: "" });

  const handleAdd = () => {
    if (!form.title || !form.company) return;
    const newExp = { ...form, id: Date.now() };
    onUpdate([...experiences, newExp]);
    resetForm();
    setAdding(false);
  };

  const handleEdit = (exp) => {
    setEditing(exp.id);
    setForm({ ...exp });
  };

  const handleUpdate = () => {
    onUpdate(experiences.map((e) => (e.id === editing ? { ...form, id: editing } : e)));
    setEditing(null);
    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm("Remove this experience?")) {
      onUpdate(experiences.filter((e) => e.id !== id));
    }
  };

  const formatDate = (d) =>
    d ? new Date(d + "-01").toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "Present";

  return (
    <section className="kora-section">
      <div className="kora-section-header">
        <div className="kora-section-title">
          <Briefcase size={18} />
          <h2>Work Experience</h2>
        </div>
        <button className="kora-add-btn" onClick={() => { setAdding(true); setEditing(null); resetForm(); }}>
          <Plus size={15} />
          Add
        </button>
      </div>

      {/* Add / Edit Form */}
      {(adding || editing !== null) && (
        <div className="kora-form-card">
          <h3 className="kora-form-title">{editing !== null ? "Edit Experience" : "New Experience"}</h3>
          <div className="kora-form-grid">
            <div className="kora-field">
              <label>Job Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Software Engineer" />
            </div>
            <div className="kora-field">
              <label>Company *</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. TechCam Solutions" />
            </div>
            <div className="kora-field">
              <label>City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Douala" />
            </div>
            <div className="kora-field">
              <label>Start Date</label>
              <input type="month" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="kora-field">
              <label>End Date</label>
              <input type="month" value={form.endDate} disabled={form.current} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div className="kora-field kora-checkbox-field">
              <label>
                <input type="checkbox" checked={form.current} onChange={(e) => setForm({ ...form, current: e.target.checked, endDate: "" })} />
                Currently working here
              </label>
            </div>
            <div className="kora-field kora-field-full">
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your responsibilities and achievements..." />
            </div>
          </div>
          <div className="kora-form-actions">
            <button className="kora-btn-secondary" onClick={() => { setAdding(false); setEditing(null); resetForm(); }}>Cancel</button>
            <button className="kora-btn-primary" onClick={editing !== null ? handleUpdate : handleAdd}>
              {editing !== null ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {experiences.length === 0 && !adding ? (
        <div className="kora-empty-state">
          <Briefcase size={32} />
          <p>No work experience added yet</p>
          <button className="kora-btn-ghost" onClick={() => setAdding(true)}>Add your first experience</button>
        </div>
      ) : (
        <div className="kora-timeline">
          {experiences.map((exp, i) => (
            <div key={exp.id} className="kora-timeline-item">
              <div className="kora-timeline-dot" />
              {i < experiences.length - 1 && <div className="kora-timeline-line" />}
              <div className="kora-timeline-content">
                <div className="kora-exp-header">
                  <div>
                    <h3 className="kora-exp-title">{exp.title}</h3>
                    <p className="kora-exp-company">{exp.company}</p>
                  </div>
                  <div className="kora-item-actions">
                    <button onClick={() => handleEdit(exp)}><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(exp.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="kora-exp-meta">
                  {exp.city && <span><MapPin size={12} />{exp.city}</span>}
                  <span><Calendar size={12} />{formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}</span>
                </div>
                {exp.description && <p className="kora-exp-desc">{exp.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
