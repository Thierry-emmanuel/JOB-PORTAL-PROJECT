import { useState, useRef, useEffect } from "react";
import {
  Building2, Globe, MapPin, Mail, Phone, Edit2, Plus,
  Trash2, Camera, Briefcase, Users, CheckCircle,
  ExternalLink, LogOut, Bell, Settings, BarChart2, KeyRound, X
} from "lucide-react";
import koraLogo from "../../assets/absolute-size-logo.png";
import ResetPasswordModal from "../../components/profile/ResetPasswordModal";
import "../../styles/profile.css";
import "../../styles/employer-profile.css";
import { useAuth } from "../../context/AuthContext";
import { getEmployerProfile, updateEmployerProfile } from "../../api/profiles";

const FALLBACK_EMPLOYER = {
  companyName: "Employer",
  contactName: "",
  email: "",
  phone: "",
  sector: "",
  description: "",
  website: "",
  city: "",
  logo: null,
  status: "ACTIVE",
  activeJobs: [],
};

const SECTORS = [
  "Information Technology", "Finance & Banking", "Healthcare", "Education",
  "Telecoms", "Agriculture", "Energy", "Retail", "Logistics", "Consulting",
];

export default function EmployerProfile() {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState(FALLBACK_EMPLOYER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(FALLBACK_EMPLOYER);
  const [activeTab, setActiveTab] = useState("overview");
  const [resetModal, setResetModal] = useState(false);
  const logoRef = useRef();

  useEffect(() => {
    const fetchProfile = async () => {
      // In a real app, user object might contain the employerId
      // For now, if we have a user.id, we use it, otherwise we try id 2 as a fallback for demo
      const idToFetch = user?.id || user?.employerId || 2; 
      try {
        const data = await getEmployerProfile(idToFetch);
        setProfile({
          ...FALLBACK_EMPLOYER,
          ...data,
          companyName: data.fullName || data.companyName || "Employer",
          description: data.bio || data.description || "",
          logo: data.avatarUrl || data.logo || null,
          activeJobs: data.activeJobs || [],
        });
      } catch (err) {
        console.error("Failed to fetch employer profile", err);
        setError("Could not load employer profile data.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
      setError("Not authenticated.");
    }
  }, [user, token]);

  const handleSave = async () => {
    try {
      const idToUpdate = user?.id || user?.employerId || 2;
      const payload = {
        ...form,
        fullName: form.companyName,
        bio: form.description,
        avatarUrl: form.logo,
      };
      const updated = await updateEmployerProfile(idToUpdate, payload);
      setProfile({
        ...form,
        ...updated,
        companyName: updated.fullName || form.companyName,
        description: updated.bio || form.description,
        logo: updated.avatarUrl || form.logo,
      });
      setEditing(false);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to save changes.");
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleLogoChange = async (file) => {
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      const updatedProfileData = {
        ...profile,
        logo: base64,
        avatarUrl: base64,
        fullName: profile.companyName,
        bio: profile.description,
      };
      const idToUpdate = user?.id || user?.employerId || 2;
      const updated = await updateEmployerProfile(idToUpdate, updatedProfileData);
      const merged = {
        ...updatedProfileData,
        ...updated,
        companyName: updated.fullName || profile.companyName,
        description: updated.bio || profile.description,
        logo: updated.avatarUrl || base64,
      };
      setProfile(merged);
      setForm(merged);
    } catch (err) {
      console.error("Failed to upload logo", err);
      alert("Failed to upload logo.");
    }
  };

  const removeJob = (id) => {
    if (window.confirm("Remove this job posting?"))
      setProfile((p) => ({ ...p, activeJobs: p.activeJobs.filter((j) => j.id !== id) }));
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading employer profile...</div>;
  }

  if (error && !profile.id) {
    return <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  const initials = profile.companyName?.split(" ").map((w) => w[0]).slice(0, 2).join("") || "E";

  return (
    <div className="kora-profile-root employer">
      <KoraNav />
      <div className="kora-bg-mesh" />
      <div className="kora-profile-layout no-sidebar">

        {/* ── MAIN ── */}
        <main className="kora-main-content">
          <div className="kora-profile-header">
            <div className="kora-header-banner employer-banner">
              <div className="kora-banner-pattern" />
              <div className="kora-banner-gradient" />
            </div>
            <div className="kora-header-body">
              <div className="kora-header-avatar-wrap uploadable">
                {profile.logo ? (
                  <img src={profile.logo} alt={profile.companyName} className="kora-header-avatar-img kora-employer-logo-img" />
                ) : (
                  <div className="kora-header-avatar-placeholder kora-employer-placeholder">
                    <span>{initials}</span>
                  </div>
                )}
                <label className="kora-avatar-upload-overlay" htmlFor="logo-file-input">
                  <Camera size={18} />
                  <span>Upload</span>
                </label>
                <input
                  type="file"
                  id="logo-file-input"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoChange(file);
                  }}
                />
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
                      <div className="kora-job-apps-count"><Users size={14} />{job.applications || 0} applicants</div>
                      <span className={`kora-status-badge kora-status-${(job.status || "ACTIVE").toLowerCase()}`}>{job.status || "ACTIVE"}</span>
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
                <div className="kora-field"><label>Company Name *</label><input value={form.companyName || ''} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
                <div className="kora-field"><label>Contact Person</label><input value={form.contactName || ''} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
                <div className="kora-field"><label>Sector</label><select value={form.sector || ''} onChange={(e) => setForm({ ...form, sector: e.target.value })}><option value="">Select</option>{SECTORS.map((s) => <option key={s}>{s}</option>)}</select></div>
                <div className="kora-field"><label>City</label><input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div className="kora-field"><label>Phone</label><input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="kora-field"><label>Website URL</label><input value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
                <div className="kora-field kora-field-full"><label>Description</label><textarea rows={4} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
