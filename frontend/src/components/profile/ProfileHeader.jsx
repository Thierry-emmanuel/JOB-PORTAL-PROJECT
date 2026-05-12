import { MapPin, Mail, Phone, Calendar, Edit2, CheckCircle } from "lucide-react";

export default function ProfileHeader({ profile, onEdit, completion }) {
  const initials = profile.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="kora-profile-header">
      {/* Decorative top bar */}
      <div className="kora-header-banner">
        <div className="kora-banner-pattern" />
        <div className="kora-banner-gradient" />
      </div>

      <div className="kora-header-body">
        {/* Avatar */}
        <div className="kora-header-avatar-wrap">
          {profile.profilePhoto ? (
            <img
              src={profile.profilePhoto}
              alt={profile.fullName}
              className="kora-header-avatar-img"
            />
          ) : (
            <div className="kora-header-avatar-placeholder">
              <span>{initials}</span>
            </div>
          )}
          <div className="kora-avatar-badge">
            <CheckCircle size={14} />
          </div>
        </div>

        {/* Info */}
        <div className="kora-header-info">
          <div className="kora-header-name-row">
            <h1 className="kora-header-name">{profile.fullName}</h1>
            <button className="kora-edit-btn" onClick={() => onEdit("basic")}>
              <Edit2 size={15} />
              Edit Profile
            </button>
          </div>

          {profile.summary && (
            <p className="kora-header-summary">{profile.summary}</p>
          )}

          <div className="kora-header-meta">
            {profile.city && (
              <span className="kora-meta-chip">
                <MapPin size={13} />
                {profile.city}, {profile.region}
              </span>
            )}
            {profile.email && (
              <span className="kora-meta-chip">
                <Mail size={13} />
                {profile.email}
              </span>
            )}
            {profile.phone && (
              <span className="kora-meta-chip">
                <Phone size={13} />
                {profile.phone}
              </span>
            )}
            {profile.dateOfBirth && (
              <span className="kora-meta-chip">
                <Calendar size={13} />
                {new Date(profile.dateOfBirth).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        {/* Completion Ring */}
        <div className="kora-completion-ring-wrap">
          <svg viewBox="0 0 80 80" className="kora-ring-svg">
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke="rgba(11,43,38,0.1)"
              strokeWidth="6"
            />
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke="#1A5C2E"
              strokeWidth="6"
              strokeDasharray={`${(completion / 100) * 201} 201`}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
          </svg>
          <div className="kora-ring-label">
            <span className="kora-ring-pct">{completion}%</span>
            <span className="kora-ring-text">Complete</span>
          </div>
        </div>
      </div>
    </div>
  );
}
