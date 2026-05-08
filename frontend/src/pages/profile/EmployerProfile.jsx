import { useState, useRef } from "react";
import {
  Building2, Globe, MapPin, Mail, Phone, Edit2, Plus,
  Trash2, Upload, Camera, Briefcase, Users, CheckCircle,
  ExternalLink, LogOut, Bell, Settings, BarChart2, KeyRound
} from "lucide-react";
import koraLogo from "../../assets/Kora-logo.png";
import ResetPasswordModal from "../../components/profile/ResetPasswordModal";
import "../../styles/profile.css";
import "../../styles/employer-profile.css";

const mockEmployer = {
  id: 2,
  companyName: "TechCam Solutions",
  contactName: "Jean-Pierre MVONDO",
  email: "contact@techcam.cm",
  phone: "+237 233 456 789",
  sector: "Information Technology",
  description:
    "TechCam Solutions is a leading software development company based in Cameroon, specializing in enterprise web applications, mobile solutions, and digital transformation for African businesses.",
  website: "https://www.techcam.cm",
  city: "Douala",
  logo: null,
  status: "ACTIVE",
  activeJobs: [
    { id: 1, title: "Senior Java Developer", type: "CDI", applications: 12, deadline: "2025-06-15", status: "ACTIVE" },
    { id: 2, title: "React.js Frontend Engineer", type: "CDD", applications: 8, deadline: "2025-05-30", status: "ACTIVE" },
    { id: 3, title: "DevOps Engineer", type: "CDI", applications: 4, deadline: "2025-07-01", status: "ACTIVE" },
  ],
};

const SECTORS = [
  "Information Technology", "Finance & Banking", "Healthcare", "Education",
  "Telecoms", "Agriculture", "Energy", "Retail", "Logistics", "Consulting",
];

export default function EmployerProfile() {
  const [profile, setProfile] = useState(mockEmployer);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...mockEmployer });
  const [activeTab, setActiveTab] = useState("overview");
  const [resetModal, setResetModal] = useState(false);
  const logoRef = useRef();

  const handleSave = () => { setProfile({ ...form }); setEditing(false); };

  const handleLogoChange = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProfile((p) => ({ ...p, logo: url }));
    setForm((f) => ({ ...f, logo: url }));
  };

  const removeJob = (id) => {
    if (window.confirm("Remove this job posting?"))
      setProfile((p) => ({ ...p, activeJobs: p.activeJobs.filter((j) => j.id !== id) }));
  };

  const initials = profile.companyName.split(" ").map((w) => w[0]).slice(0, 2).join("");

  return (
    <div className="kora-profile-root employer">
      <div className="kora-bg-mesh" />
      <div className="kora-profile-layout">

        {/* ── SIDEBAR ── */}
        <aside className="kora-sidebar">
          <div className="kora-sidebar-inner">

            {/* New logo — dark bg, no filter */}
            <div className="kora-sidebar-logo">
              <img src={koraLogo} alt="KORA – Unlock Your Career" className="kora-sidebar-logo-img" />
            </div>

            {/* Company Logo / Avatar */}
            <div className="kora-sidebar-avatar-section">
              <div className="kora-sidebar-avatar" onClick={() => logoRef.current?.click()}>
                {profile.logo ? (
                  <img src={profile.logo} alt={profile.companyName} />
                ) : (
                  <span className="kora-sidebar-initials">{initials}</span>
                )}
                <button className="kora-photo-overlay"><Camera size={16} /></button>
                <input ref={logoRef} type="file" accept="image/*" hidden onChange={(e) => handleLogoChange(e.target.files[0])} />
              </div>
              <p className="kora-sidebar-name">{profile.companyName}</p>
              <p className="kora-sidebar-role">Employer Account</p>
              <span className="kora-verified-badge"><CheckCircle size={12} /> Verified</span>
            </div>

            {/* Stats */}
            <div className="kora-employer-stats">
              {[
                { label: "Active Jobs", value: profile.activeJobs.filter(j => j.status === "ACTIVE").length },
                { label: "Applications", value: profile.activeJobs.reduce((a, j) => a + j.applications, 0) },
              ].map(({ label, value }) => (
                <div key={label} className="kora-stat-pill">
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <nav className="kora-sidebar-nav">
              <p className="kora-sidebar-nav-label">Dashboard</p>
              {[
                { icon: <Briefcase size={16} />, label: "Job Postings", count: profile.activeJobs.length },
                { icon: <Users size={16} />, label: "Applications", count: 24 },
                { icon: <BarChart2 size={16} />, label: "Analytics" },
                { icon: <Bell size={16} />, label: "Notifications", count: 3 },
                { icon: <Settings size={16} />, label: "Settings" },
              ].map(({ icon, label, count }) => (
                <button key={label} className="kora-sidebar-nav-item">
                  {icon}<span>{label}</span>
                  {count !== undefined && <span className="kora-nav-badge">{count}</span>}
                </button>
              ))}

              {/* Reset Password */}
              <button className="kora-sidebar-nav-item kora-reset-pwd-btn" onClick={() => setResetModal(true)}>
                <KeyRound size={16} /><span>Reset Password</span>
              </button>
            </nav>

            <button className="kora-sidebar-logout"><LogOut size={15} />Sign Out</button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="kora-main-content">
          <div className="kora-profile-header">
            <div className="kora-header-banner employer-banner">
              <div className="kora-banner-pattern" />
              <div className="kora-banner-gradient" />
            </div>
            <div className="kora-header-body">
              <div className="kora-header-avatar-wrap">
                {profile.logo ? (
                  <img src={profile.logo} alt={profile.companyName} className="kora-header-avatar-img kora-employer-logo-img" />
                ) : (
                  <div className="kora-header-avatar-placeholder kora-employer-placeholder">
                    <span>{initials}</span>
                  </div>
                )}
              </div>
              <div className="kora-header-info">
                <div className="kora-header-name-row">
                  <div>
                    <h1 className="kora-header-name">{profile.companyName}</h1>
                    <p className="kora-employer-contact-name">{profile.contactName}</p>
                  </div>
                  <button className="kora-edit-btn" onClick={() => { setForm({ ...profile }); setEditing(true); }}>
                    <Edit2 size={15} />Edit Profile
                  </button>
                </div>
                {profile.description && <p className="kora-header-summary">{profile.description}</p>}
                <div className="kora-header-meta">
                  {profile.city && <span className="kora-meta-chip"><MapPin size={13} />{profile.city}</span>}
                  {profile.sector && <span className="kora-meta-chip"><Building2 size={13} />{profile.sector}</span>}
                  {profile.email && <span className="kora-meta-chip"><Mail size={13} />{profile.email}</span>}
                  {profile.phone && <span className="kora-meta-chip"><Phone size={13} />{profile.phone}</span>}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noreferrer" className="kora-meta-chip kora-meta-link">
                      <Globe size={13} />{profile.website.replace("https://", "")} <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="kora-tabs">
            {["overview", "job postings"].map((tab) => (
              <button key={tab} className={`kora-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {(activeTab === "overview" || activeTab === "job postings") && (
            <section className="kora-section">
              <div className="kora-section-header">
                <div className="kora-section-title"><Briefcase size={18} /><h2>Job Postings</h2></div>
                <button className="kora-add-btn"><Plus size={15} />Post New Job</button>
              </div>
              <div className="kora-jobs-list">
                {profile.activeJobs.map((job) => (
                  <div key={job.id} className="kora-job-row">
                    <div className="kora-job-row-info">
                      <h3 className="kora-job-row-title">{job.title}</h3>
                      <div className="kora-job-row-meta">
                        <span className="kora-job-type-badge">{job.type}</span>
                        <span className="kora-job-row-deadline">Deadline: {job.deadline}</span>
                      </div>
                    </div>
                    <div className="kora-job-row-stats">
                      <div className="kora-job-apps-count"><Users size={14} />{job.applications} applicants</div>
                      <span className={`kora-status-badge kora-status-${job.status.toLowerCase()}`}>{job.status}</span>
                    </div>
                    <div className="kora-item-actions" style={{ opacity: 1 }}>
                      <button title="Edit"><Edit2 size={14} /></button>
                      <button title="Delete" onClick={() => removeJob(job.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {profile.activeJobs.length === 0 && (
                  <div className="kora-empty-state"><Briefcase size={32} /><p>No job postings yet.</p></div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>

      {editing && (
        <div className="kora-modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditing(false)}>
          <div className="kora-modal">
            <div className="kora-modal-header">
              <h2>Edit Company Profile</h2>
              <button className="kora-modal-close" onClick={() => setEditing(false)}><X size={20} /></button>
            </div>
            <div className="kora-modal-body">
              <div className="kora-form-grid">
                <div className="kora-field"><label>Company Name *</label><input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
                <div className="kora-field"><label>Contact Person</label><input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
                <div className="kora-field"><label>Sector</label><select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })}>{SECTORS.map((s) => <option key={s}>{s}</option>)}</select></div>
                <div className="kora-field"><label>City</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div className="kora-field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="kora-field"><label>Website URL</label><input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
                <div className="kora-field kora-field-full"><label>Description</label><textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              </div>
              <div className="kora-modal-footer">
                <button className="kora-btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button className="kora-btn-primary" onClick={handleSave}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {resetModal && (
        <ResetPasswordModal onClose={() => setResetModal(false)} userEmail={profile.email} />
      )}
    </div>
  );
}