import { useState } from "react";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileSidebar from "../../components/profile/ProfileSidebar";
import ExperienceSection from "../../components/profile/ExperienceSection";
import EducationSection from "../../components/profile/EducationSection";
import SkillsSection from "../../components/profile/SkillsSection";
import LanguagesSection from "../../components/profile/LanguagesSection";
import CVUploadSection from "../../components/profile/CVUploadSection";
import EditProfileModal from "../../components/profile/EditProfileModal";
import ResetPasswordModal from "../../components/profile/ResetPasswordModal";
import "../../styles/profile.css";

import { useState, useEffect } from "react";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileSidebar from "../../components/profile/ProfileSidebar";
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
  fullName: "User",
  email: "",
  phone: "",
  city: "",
  region: "",
  dateOfBirth: "",
  profilePhoto: null,
  summary: "",
  cvUrl: null,
  cvFileName: null,
  experiences: [],
  education: [],
  skills: [],
  languages: [],
};

export default function JobSeekerProfile() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(FALLBACK_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editModal, setEditModal] = useState({ open: false, section: null });
  const [resetModal, setResetModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchProfile = async () => {
      // In a real app, user object might contain the jobSeekerId, or we fetch /me
      // For now, if we have a user.id, we use it, otherwise we try id 1 as a fallback for demo
      const idToFetch = user?.id || user?.jobSeekerId || 1; 
      try {
        const data = await getJobSeekerProfile(idToFetch);
        // Ensure arrays exist
        setProfile({
          ...FALLBACK_PROFILE,
          ...data,
          experiences: data.experiences || [],
          education: data.education || [],
          skills: data.skills || [],
          languages: data.languages || []
        });
      } catch (err) {
        console.error("Failed to fetch profile", err);
        setError("Could not load profile data.");
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

  const completionScore = () => {
    let score = 0;
    if (profile.profilePhoto) score += 15;
    if (profile.summary) score += 15;
    if (profile.phone) score += 10;
    if (profile.cvUrl) score += 20;
    if (profile.experiences?.length > 0) score += 15;
    if (profile.education?.length > 0) score += 10;
    if (profile.skills?.length >= 3) score += 10;
    if (profile.languages?.length > 0) score += 5;
    return score;
  };

  const openEdit = (section) => setEditModal({ open: true, section });
  const closeEdit = () => setEditModal({ open: false, section: null });

  const handleSave = async (section, data) => {
    try {
      const updatedProfileData = { ...profile, ...data };
      const idToUpdate = user?.id || user?.jobSeekerId || 1;
      const updated = await updateJobSeekerProfile(idToUpdate, updatedProfileData);
      setProfile({ ...updatedProfileData, ...updated });
      closeEdit();
    } catch (err) {
      console.error("Failed to save profile", err);
      alert("Failed to save changes.");
    }
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading profile...</div>;
  }

  if (error && !profile.id) {
    return <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  return (
    <div className="kora-profile-root">
      {/* Ambient background */}
      <div className="kora-bg-mesh" />

      <div className="kora-profile-layout">
        {/* LEFT SIDEBAR */}
        <aside className="kora-sidebar">
          <ProfileSidebar
            profile={profile}
            completion={completionScore()}
            onEdit={openEdit}
            onPhotoChange={(file) => {
              const url = URL.createObjectURL(file);
              setProfile((p) => ({ ...p, profilePhoto: url }));
            }}
            onResetPassword={() => setResetModal(true)}
          />
        </aside>

        {/* MAIN CONTENT */}
        <main className="kora-main-content">
          <ProfileHeader
            profile={profile}
            onEdit={openEdit}
            completion={completionScore()}
          />

          {/* Tab Navigation */}
          <div className="kora-tabs">
            {["overview", "experience", "education", "skills"].map((tab) => (
              <button
                key={tab}
                className={`kora-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="kora-tab-content">
            {(activeTab === "overview" || activeTab === "experience") && (
              <ExperienceSection
                experiences={profile.experiences}
                onEdit={openEdit}
                onUpdate={(experiences) => handleSave("experiences", { experiences })}
              />
            )}
            {(activeTab === "overview" || activeTab === "education") && (
              <EducationSection
                education={profile.education}
                onEdit={openEdit}
                onUpdate={(education) => handleSave("education", { education })}
              />
            )}
            {(activeTab === "overview" || activeTab === "skills") && (
              <>
                <SkillsSection
                  skills={profile.skills}
                  onUpdate={(skills) => handleSave("skills", { skills })}
                />
                <LanguagesSection
                  languages={profile.languages}
                  onUpdate={(languages) => handleSave("languages", { languages })}
                />
              </>
            )}
            {activeTab === "overview" && (
              <CVUploadSection
                cvUrl={profile.cvUrl}
                cvFileName={profile.cvFileName}
                onUpload={(file) => {
                  setProfile((p) => ({
                    ...p,
                    cvUrl: URL.createObjectURL(file),
                    cvFileName: file.name,
                  }));
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      {editModal.open && (
        <EditProfileModal
          section={editModal.section}
          profile={profile}
          onSave={handleSave}
          onClose={closeEdit}
        />
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <ResetPasswordModal onClose={() => setResetModal(false)} userEmail={profile.email} />
      )}
    </div>
  );
}
