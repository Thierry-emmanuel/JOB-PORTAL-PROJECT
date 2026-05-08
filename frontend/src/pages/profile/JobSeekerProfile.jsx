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

const mockJobSeeker = {
  id: 1,
  fullName: "Lena Dorcas Valmira BILOA EKASSI",
  email: "lena.biloa@gmail.com",
  phone: "+237 691 234 567",
  city: "Yaoundé",
  region: "Centre",
  dateOfBirth: "1999-03-15",
  profilePhoto: null,
  summary:
    "Passionate software engineering student at Institut Saint Jean with strong foundations in Java, Spring Boot, and React.js. Eager to contribute to impactful digital solutions in Cameroon's growing tech ecosystem.",
  cvUrl: null,
  cvFileName: null,
  experiences: [
    {
      id: 1,
      title: "Web Development Intern",
      company: "TechCam Solutions",
      city: "Yaoundé",
      startDate: "2024-07",
      endDate: "2024-09",
      current: false,
      description:
        "Developed REST APIs using Spring Boot and integrated with a React.js frontend. Implemented JWT-based authentication and worked with MySQL databases.",
    },
  ],
  education: [
    {
      id: 1,
      degree: "Engineer's Degree – Software Engineering",
      institution: "Institut Universitaire Saint Jean",
      city: "Yaoundé",
      startYear: 2022,
      endYear: 2025,
      current: true,
    },
    {
      id: 2,
      degree: "Baccalauréat Série C",
      institution: "Lycée Général Leclerc",
      city: "Yaoundé",
      startYear: 2018,
      endYear: 2021,
      current: false,
    },
  ],
  skills: [
    { id: 1, name: "Java", type: "technical" },
    { id: 2, name: "Spring Boot", type: "technical" },
    { id: 3, name: "React.js", type: "technical" },
    { id: 4, name: "MySQL", type: "technical" },
    { id: 5, name: "Git & GitHub", type: "technical" },
    { id: 6, name: "Docker", type: "technical" },
    { id: 7, name: "Teamwork", type: "soft" },
    { id: 8, name: "Problem Solving", type: "soft" },
    { id: 9, name: "Communication", type: "soft" },
  ],
  languages: [
    { id: 1, name: "French", level: "Native" },
    { id: 2, name: "English", level: "Professional" },
  ],
};

export default function JobSeekerProfile() {
  const [profile, setProfile] = useState(mockJobSeeker);
  const [editModal, setEditModal] = useState({ open: false, section: null });
  const [resetModal, setResetModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const completionScore = () => {
    let score = 0;
    if (profile.profilePhoto) score += 15;
    if (profile.summary) score += 15;
    if (profile.phone) score += 10;
    if (profile.cvUrl) score += 20;
    if (profile.experiences.length > 0) score += 15;
    if (profile.education.length > 0) score += 10;
    if (profile.skills.length >= 3) score += 10;
    if (profile.languages.length > 0) score += 5;
    return score;
  };

  const openEdit = (section) => setEditModal({ open: true, section });
  const closeEdit = () => setEditModal({ open: false, section: null });

  const handleSave = (section, data) => {
    setProfile((prev) => ({ ...prev, ...data }));
    closeEdit();
  };

  return (
    <div className="kora-profile-root">
      <div className="kora-bg-mesh" />
      <div className="kora-profile-layout">
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

        <main className="kora-main-content">
          <ProfileHeader
            profile={profile}
            onEdit={openEdit}
            completion={completionScore()}
          />

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
                onUpdate={(experiences) => setProfile((p) => ({ ...p, experiences }))}
              />
            )}
            {(activeTab === "overview" || activeTab === "education") && (
              <EducationSection
                education={profile.education}
                onEdit={openEdit}
                onUpdate={(education) => setProfile((p) => ({ ...p, education }))}
              />
            )}
            {(activeTab === "overview" || activeTab === "skills") && (
              <>
                <SkillsSection
                  skills={profile.skills}
                  onUpdate={(skills) => setProfile((p) => ({ ...p, skills }))}
                />
                <LanguagesSection
                  languages={profile.languages}
                  onUpdate={(languages) => setProfile((p) => ({ ...p, languages }))}
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

      {editModal.open && (
        <EditProfileModal
          section={editModal.section}
          profile={profile}
          onSave={handleSave}
          onClose={closeEdit}
        />
      )}

      {resetModal && (
        <ResetPasswordModal onClose={() => setResetModal(false)} userEmail={profile.email} />
      )}
    </div>
  );
}