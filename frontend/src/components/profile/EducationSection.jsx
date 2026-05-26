import { useState } from "react";
import { GraduationCap, Plus, Edit2, Trash2, MapPin, AlertTriangle } from "lucide-react";

function ConfirmDeleteModal({ name, onConfirm, onCancel }) {
  return (
    <>
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:2000 }} onClick={onCancel}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", background:"#fff", borderRadius:16, padding:24, width:"min(360px,90vw)", zIndex:2001, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:"#FEF2F2", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <AlertTriangle size={20} color="#DC2626"/>
          </div>
          <h3 style={{ fontSize:15, fontWeight:700, margin:0, color:"#111827" }}>Remove Education</h3>
        </div>
        <p style={{ fontSize:13, color:"#6B7280", marginBottom:20, lineHeight:1.6 }}>
          Remove <strong style={{color:"#111827"}}>{name}</strong>? This cannot be undone.
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onCancel}  style={{ background:"#F3F4F6", border:"none", borderRadius:10, padding:"9px 20px", fontSize:13, fontWeight:600, cursor:"pointer", color:"#374151" }}>Cancel</button>
          <button onClick={onConfirm} style={{ background:"#DC2626",  border:"none", borderRadius:10, padding:"9px 20px", fontSize:13, fontWeight:700, cursor:"pointer", color:"#fff" }}>Remove</button>
        </div>
      </div>
    </>
  );
}

export default function EducationSection({ education, onUpdate }) {
  const [adding,   setAdding]   = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form,     setForm]     = useState({ degree: "", institution: "", city: "", startYear: "", endYear: "", current: false });

  const resetForm = () => setForm({ degree: "", institution: "", city: "", startYear: "", endYear: "", current: false });

  const handleAdd = () => {
    if (!form.degree || !form.institution) return;
    onUpdate([...education, { ...form, id: Date.now() }]);
    resetForm(); setAdding(false);
  };

  const handleEdit   = (edu) => { setEditing(edu.id); setForm({ ...edu }); };
  const handleUpdate = () => {
    onUpdate(education.map((e) => (e.id === editing ? { ...form, id: editing } : e)));
    setEditing(null); resetForm();
  };

  const handleDelete  = (id) => setDeleteId(id);
  const confirmDelete = () => { onUpdate(education.filter((e) => e.id !== deleteId)); setDeleteId(null); };

  const deletingEdu = education.find(e => e.id === deleteId);

  return (
    <>
    {deleteId && <ConfirmDeleteModal name={`${deletingEdu?.degree} at ${deletingEdu?.institution}`} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />}
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
    </>
  );
}