import { useState, useEffect } from "react";
import { KeyRound, Camera, User, Briefcase, GraduationCap, Code2, Languages, FileText, Edit3, CheckCircle, AlertCircle, X } from "lucide-react";
import EmployeeLayout from "../../layouts/EmployeeLayout";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ExperienceSection from "../../components/profile/ExperienceSection";
import EducationSection from "../../components/profile/EducationSection";
import SkillsSection from "../../components/profile/SkillsSection";
import LanguagesSection from "../../components/profile/LanguagesSection";
import CVUploadSection from "../../components/profile/CVUploadSection";
import EditProfileModal from "../../components/profile/EditProfileModal";
import ResetPasswordModal from "../../components/profile/ResetPasswordModal";
import "../../styles/profile.css";
import { useAuth } from "../../context/AuthContext";
import { getJobSeekerProfile, updateJobSeekerProfile } from "../../api/profiles";

const FALLBACK_PROFILE = {
  fullName: "User", email: "", phone: "", city: "", region: "",
  dateOfBirth: "", profilePhoto: null, summary: "",
  cvUrl: null, cvFileName: null,
  experiences: [], education: [], skills: [], languages: [],
};

/* ─── Toast ────────────────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  return (
    <div style={{
      position:'fixed', top:20, right:20, zIndex:9999,
      display:'flex', alignItems:'center', gap:10,
      background: type==='error' ? '#FEF2F2' : '#ECFDF5',
      border:`1.5px solid ${type==='error'?'#FCA5A5':'#6EE7B7'}`,
      borderRadius:12, padding:'12px 16px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)',
      minWidth:260, maxWidth:360,
    }}>
      {type==='error'
        ? <AlertCircle size={16} color="#DC2626"/>
        : <CheckCircle size={16} color="#10B981"/>}
      <span style={{ fontSize:13, fontWeight:600, color: type==='error'?'#991B1B':'#065F46', flex:1 }}>{msg}</span>
      <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',padding:0}}><X size={14}/></button>
    </div>
  );
}

/* ─── Profile completion ────────────────────────────────────── */
const COMPLETION_ITEMS = [
  { key:'profilePhoto', label:'Profile Photo',      weight:15 },
  { key:'summary',      label:'Professional Bio',   weight:15 },
  { key:'phone',        label:'Phone Number',        weight:10 },
  { key:'cvUrl',        label:'CV / Resume',         weight:20 },
  { key:'experiences',  label:'Work Experience',    weight:15, arr:true },
  { key:'education',    label:'Education',           weight:10, arr:true },
  { key:'skills',       label:'Skills (3+)',         weight:10, count:3 },
  { key:'languages',    label:'Languages',           weight:5,  arr:true },
];

function calcCompletion(p) {
  if (!p) return 0;
  return Math.min(COMPLETION_ITEMS.reduce((s, it) => {
    if (it.arr)   return s + (p[it.key]?.length > 0 ? it.weight : 0);
    if (it.count) return s + ((p[it.key]?.length || 0) >= it.count ? it.weight : 0);
    return s + (p[it.key] ? it.weight : 0);
  }, 0), 100);
}

/* ─── Completion Ring ───────────────────────────────────────── */
function CompletionRing({ pct }) {
  const r = 36, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <svg width={96} height={96} viewBox="0 0 96 96" style={{ display:'block' }}>
      <circle cx={48} cy={48} r={r} fill="none" stroke="#F3F4F6" strokeWidth={8} />
      <circle cx={48} cy={48} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform="rotate(-90 48 48)" style={{ transition:'stroke-dasharray 0.6s ease' }} />
      <text x={48} y={44} textAnchor="middle" fontSize={18} fontWeight={800} fill={color}>{pct}%</text>
      <text x={48} y={60} textAnchor="middle" fontSize={9} fontWeight={600} fill="#6B7280">COMPLETE</text>
    </svg>
  );
}

const TABS = [
  { key:'overview',    label:'Overview',    icon: User },
  { key:'experience',  label:'Experience',  icon: Briefcase },
  { key:'education',   label:'Education',   icon: GraduationCap },
  { key:'skills',      label:'Skills',      icon: Code2 },
];

export default function JobSeekerProfile() {
  const { user, token } = useAuth();
  const [profile,    setProfile]    = useState(FALLBACK_PROFILE);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [editModal,  setEditModal]  = useState({ open: false, section: null });
  const [resetModal, setResetModal] = useState(false);
  const [activeTab,  setActiveTab]  = useState("overview");
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!token) { setLoading(false); setError("Not authenticated."); return; }
    const id = user?.id || user?.jobSeekerId || 1;
    getJobSeekerProfile(id)
      .then(data => {
        setProfile({
          ...FALLBACK_PROFILE, ...data,
          profilePhoto: data.avatarUrl || data.profilePhoto || null,
          summary:      data.profileSummary || data.summary || "",
          experiences:  data.experiences || [],
          education:    data.education   || [],
          skills:       data.skills      || [],
          languages:    data.languages   || [],
        });
      })
      .catch(() => setError("Could not load profile data."))
      .finally(() => setLoading(false));
  }, [user, token]);

  const completion = calcCompletion(profile);
  const missing    = COMPLETION_ITEMS.filter(it => {
    if (it.arr)   return !profile[it.key]?.length;
    if (it.count) return (profile[it.key]?.length || 0) < it.count;
    return !profile[it.key];
  });

  const fileToBase64 = file => new Promise((res, rej) => {
    const r = new FileReader(); r.readAsDataURL(file);
    r.onload = () => res(r.result); r.onerror = rej;
  });

  const handlePhotoChange = async (file) => {
    try {
      const base64 = await fileToBase64(file);
      const payload = { ...profile, profilePhoto: base64, avatarUrl: base64, profileSummary: profile.summary };
      const id = user?.id || user?.jobSeekerId || 1;
      const updated = await updateJobSeekerProfile(id, payload);
      setProfile(p => ({ ...p, ...payload, ...updated, profilePhoto: updated.avatarUrl || base64, summary: updated.profileSummary || p.summary }));
      showToast('Profile photo updated!');
    } catch { showToast('Failed to upload photo.', 'error'); }
  };

  const handleSave = async (section, data) => {
    try {
      const payload = { ...profile, ...data, avatarUrl: data.profilePhoto || profile.profilePhoto, profileSummary: data.summary || profile.summary };
      const id = user?.id || user?.jobSeekerId || 1;
      const updated = await updateJobSeekerProfile(id, payload);
      setProfile(p => ({ ...p, ...payload, ...updated, profilePhoto: updated.avatarUrl || payload.profilePhoto, summary: updated.profileSummary || payload.summary }));
      setEditModal({ open: false, section: null });
      showToast('Profile saved successfully!');
    } catch { showToast('Failed to save changes.', 'error'); }
  };

  if (loading) return (
    <EmployeeLayout profile={profile} completion={0}>
      <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
        <div style={{ width:32, height:32, border:'3px solid #E5E7EB', borderTopColor:'#1A5C2E', borderRadius:'50%', animation:'ds-spin 0.8s linear infinite' }} />
      </div>
    </EmployeeLayout>
  );

  return (
    <EmployeeLayout profile={profile} completion={completion} onPhotoChange={handlePhotoChange}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="ds-page-header">
        <div>
          <h1 className="ds-page-title">My Profile</h1>
          <p className="ds-page-sub">Build a complete profile to attract the best employers.</p>
        </div>
        <button className="ds-btn ds-btn-ghost" onClick={() => setResetModal(true)}>
          <KeyRound size={14} /> Reset Password
        </button>
      </div>

      {/* ── Profile overview banner ── */}
      <div className="ds-card" style={{ padding:0, overflow:'hidden' }}>
        {/* Cover banner */}
        <div style={{ height:90, background:'linear-gradient(135deg, #1A5C2E 0%, #0D3D1F 60%, #F97316 100%)', position:'relative' }}>
          <div style={{ position:'absolute', inset:0, opacity:0.15, backgroundImage:'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize:'24px 24px' }}/>
        </div>

        <div style={{ padding:'0 24px 24px', display:'flex', gap:24, alignItems:'flex-end', marginTop:-44, flexWrap:'wrap' }}>
          {/* Avatar */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{ width:88, height:88, borderRadius:20, border:'4px solid #fff', background:'#E8F5EE', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}>
              {profile.profilePhoto
                ? <img src={profile.profilePhoto} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <span style={{ fontSize:28, fontWeight:800, color:'#1A5C2E' }}>{(profile.fullName || 'U').charAt(0)}</span>}
            </div>
            <label htmlFor="photo-upload" style={{ position:'absolute', bottom:-4, right:-4, width:28, height:28, borderRadius:8, background:'#1A5C2E', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <Camera size={12} color="#fff"/>
            </label>
            <input id="photo-upload" type="file" accept="image/*" style={{ display:'none' }} onChange={e => e.target.files[0] && handlePhotoChange(e.target.files[0])} />
          </div>

          <div style={{ flex:1, paddingTop:50, minWidth:200 }}>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#111827', margin:'0 0 4px' }}>{profile.fullName || 'Your Name'}</h2>
            <p style={{ fontSize:14, color:'#6B7280', margin:'0 0 8px' }}>{profile.email}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {profile.city && <span style={{ fontSize:12, color:'#374151', background:'#F3F4F6', padding:'3px 10px', borderRadius:20 }}>📍 {profile.city}{profile.region ? `, ${profile.region}` : ''}</span>}
              {profile.phone && <span style={{ fontSize:12, color:'#374151', background:'#F3F4F6', padding:'3px 10px', borderRadius:20 }}>📞 {profile.phone}</span>}
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:16, paddingTop:50 }}>
            <CompletionRing pct={completion} />
            <button onClick={() => setEditModal({ open:true, section:'basic' })} className="ds-btn ds-btn-primary" style={{ flexShrink:0 }}>
              <Edit3 size={14}/> Edit Profile
            </button>
          </div>
        </div>

        {/* Completion nudge */}
        {completion < 100 && missing.length > 0 && (
          <div style={{ margin:'0 24px 20px', background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:18 }}>💡</span>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, fontWeight:700, color:'#92400E', margin:'0 0 2px' }}>Complete your profile to boost visibility</p>
              <p style={{ fontSize:12, color:'#B45309', margin:0 }}>Missing: {missing.slice(0,3).map(i => i.label).join(', ')}{missing.length > 3 ? ` +${missing.length - 3} more` : ''}</p>
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:'#92400E' }}>+{missing.reduce((s,i) => s+i.weight, 0)}%</span>
          </div>
        )}

        {/* Summary */}
        {profile.summary && (
          <div style={{ margin:'0 24px 24px', padding:'16px', background:'#F9FAFB', borderRadius:12 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.8px', margin:'0 0 8px' }}>About Me</p>
            <p style={{ fontSize:14, color:'#374151', lineHeight:1.7, margin:0 }}>{profile.summary}</p>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:4, background:'#F9FAFB', borderRadius:12, padding:4 }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            background: activeTab === key ? '#fff' : 'transparent',
            border: 'none', borderRadius:9,
            padding:'10px 12px', fontSize:13, fontWeight: activeTab === key ? 700 : 500,
            color: activeTab === key ? '#1A5C2E' : '#6B7280',
            cursor:'pointer', boxShadow: activeTab === key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition:'all 0.2s',
          }}>
            <Icon size={14}/> {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {(activeTab === 'overview' || activeTab === 'experience') && (
        <ExperienceSection experiences={profile.experiences} onEdit={() => setEditModal({ open:true, section:'experience' })} onUpdate={experiences => handleSave('experiences', { experiences })} />
      )}
      {(activeTab === 'overview' || activeTab === 'education') && (
        <EducationSection education={profile.education} onEdit={() => setEditModal({ open:true, section:'education' })} onUpdate={education => handleSave('education', { education })} />
      )}
      {(activeTab === 'overview' || activeTab === 'skills') && (
        <>
          <SkillsSection    skills={profile.skills}       onUpdate={skills    => handleSave('skills',    { skills    })} />
          <LanguagesSection languages={profile.languages} onUpdate={languages => handleSave('languages', { languages })} />
        </>
      )}
      {activeTab === 'overview' && (
        <CVUploadSection cvUrl={profile.cvUrl} cvFileName={profile.cvFileName}
          onUpload={file => setProfile(p => ({ ...p, cvUrl: URL.createObjectURL(file), cvFileName: file.name }))} />
      )}

      {editModal.open && (
        <EditProfileModal section={editModal.section} profile={profile} onSave={handleSave} onClose={() => setEditModal({ open:false, section:null })} />
      )}
      {resetModal && <ResetPasswordModal onClose={() => setResetModal(false)} userEmail={profile.email} />}
    </EmployeeLayout>
  );
}