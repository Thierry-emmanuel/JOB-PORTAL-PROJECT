import { useState } from "react";
import { Zap, Plus, X } from "lucide-react";

const PRESET_TECHNICAL = ["Java", "Spring Boot", "React.js", "Python", "MySQL", "Node.js", "Docker", "Git", "TypeScript", "MongoDB"];
const PRESET_SOFT = ["Teamwork", "Leadership", "Communication", "Problem Solving", "Adaptability", "Time Management"];

export default function SkillsSection({ skills, onUpdate }) {
  const [newSkill, setNewSkill] = useState("");
  const [newType, setNewType] = useState("technical");

  const technical = skills.filter((s) => s.type === "technical");
  const soft = skills.filter((s) => s.type === "soft");

  const addSkill = (name, type) => {
    const trimmed = (name || newSkill).trim();
    if (!trimmed) return;
    if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;
    onUpdate([...skills, { id: Date.now(), name: trimmed, type: type || newType }]);
    setNewSkill("");
  };

  const removeSkill = (id) => onUpdate(skills.filter((s) => s.id !== id));

  return (
    <section className="kora-section">
      <div className="kora-section-header">
        <div className="kora-section-title">
          <Zap size={18} />
          <h2>Skills</h2>
        </div>
      </div>

      {/* Technical Skills */}
      <div className="kora-skills-group">
        <p className="kora-skills-group-label">Technical Skills</p>
        <div className="kora-skills-cloud">
          {technical.map((s) => (
            <span key={s.id} className="kora-skill-tag kora-skill-tech">
              {s.name}
              <button onClick={() => removeSkill(s.id)}><X size={11} /></button>
            </span>
          ))}
          {technical.length === 0 && <span className="kora-skills-empty">None added yet</span>}
        </div>
        {/* Presets */}
        <div className="kora-skill-presets">
          {PRESET_TECHNICAL.filter((p) => !skills.some((s) => s.name === p)).slice(0, 5).map((p) => (
            <button key={p} className="kora-preset-tag" onClick={() => addSkill(p, "technical")}>
              <Plus size={11} />{p}
            </button>
          ))}
        </div>
      </div>

      {/* Soft Skills */}
      <div className="kora-skills-group">
        <p className="kora-skills-group-label">Soft Skills</p>
        <div className="kora-skills-cloud">
          {soft.map((s) => (
            <span key={s.id} className="kora-skill-tag kora-skill-soft">
              {s.name}
              <button onClick={() => removeSkill(s.id)}><X size={11} /></button>
            </span>
          ))}
          {soft.length === 0 && <span className="kora-skills-empty">None added yet</span>}
        </div>
        <div className="kora-skill-presets">
          {PRESET_SOFT.filter((p) => !skills.some((s) => s.name === p)).slice(0, 4).map((p) => (
            <button key={p} className="kora-preset-tag kora-preset-soft" onClick={() => addSkill(p, "soft")}>
              <Plus size={11} />{p}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Add */}
      <div className="kora-skill-add-row">
        <input
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSkill()}
          placeholder="Add a custom skill..."
          className="kora-skill-input"
        />
        <select value={newType} onChange={(e) => setNewType(e.target.value)} className="kora-skill-type-select">
          <option value="technical">Technical</option>
          <option value="soft">Soft</option>
        </select>
        <button className="kora-btn-primary kora-skill-add-btn" onClick={() => addSkill()}>
          <Plus size={14} />Add
        </button>
      </div>
    </section>
  );
}
