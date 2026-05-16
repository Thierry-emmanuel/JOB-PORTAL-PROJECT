import { useState } from "react";
import { Globe, Plus, Trash2 } from "lucide-react";

const LEVELS = ["Native", "Fluent", "Professional", "Intermediate", "Basic"];
const LEVEL_COLOR = {
  Native: "#1A5C2E",
  Fluent: "#1a4a42",
  Professional: "#F97316",
  Intermediate: "#f0a070",
  Basic: "#b5c4c1",
};

export default function LanguagesSection({ languages, onUpdate }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", level: "Professional" });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    onUpdate([...languages, { ...form, id: Date.now() }]);
    setForm({ name: "", level: "Professional" });
    setAdding(false);
  };

  return (
    <section className="kora-section">
      <div className="kora-section-header">
        <div className="kora-section-title">
          <Globe size={18} />
          <h2>Languages</h2>
        </div>
        <button className="kora-add-btn" onClick={() => setAdding(!adding)}>
          <Plus size={15} />Add
        </button>
      </div>

      {adding && (
        <div className="kora-form-card">
          <div className="kora-form-grid">
            <div className="kora-field">
              <label>Language</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. French"
              />
            </div>
            <div className="kora-field">
              <label>Proficiency Level</label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="kora-form-actions">
            <button className="kora-btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
            <button className="kora-btn-primary" onClick={handleAdd}>Save</button>
          </div>
        </div>
      )}

      <div className="kora-languages-grid">
        {languages.map((lang) => (
          <div key={lang.id} className="kora-lang-card">
            <div className="kora-lang-flag">
              <Globe size={20} />
            </div>
            <div className="kora-lang-info">
              <p className="kora-lang-name">{lang.name}</p>
              <span
                className="kora-lang-level"
                style={{ backgroundColor: LEVEL_COLOR[lang.level] + "20", color: LEVEL_COLOR[lang.level] }}
              >
                {lang.level}
              </span>
            </div>
            <button className="kora-lang-remove" onClick={() => onUpdate(languages.filter((l) => l.id !== lang.id))}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {languages.length === 0 && !adding && (
          <div className="kora-empty-state">
            <Globe size={28} />
            <p>No languages added</p>
          </div>
        )}
      </div>
    </section>
  );
}
