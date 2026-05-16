import { useState } from "react";
import {
  X, Video, Phone, MapPin, Calendar, Clock,
  Link2, Copy, CheckCircle, Bell, Send, Briefcase,
  Info
} from "lucide-react";
import "../../styles/interview-scheduler.css";

// ── Helpers ───────────────────────────────────────────────

// Generates a fake Google Meet link (replace with real Google Calendar API in production)
function generateMeetLink() {
  const chars   = "abcdefghijklmnopqrstuvwxyz";
  const segment = (len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `https://meet.google.com/${segment(3)}-${segment(4)}-${segment(3)}`;
}

// Format date for display
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric",
    month: "long", day: "numeric",
  });
}

// Format time for display
function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour   = parseInt(h);
  const ampm   = hour >= 12 ? "PM" : "AM";
  const h12    = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

// Get tomorrow's date as min date
function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// ── Interview Types ───────────────────────────────────────
const INTERVIEW_TYPES = [
  {
    key:   "VIDEO",
    label: "Video Call",
    icon:  <Video size={18} />,
    color: "#1565c0",
    bg:    "#e3f2fd",
  },
  {
    key:   "PHONE",
    label: "Phone Call",
    icon:  <Phone size={18} />,
    color: "#2e7d32",
    bg:    "#e8f5e9",
  },
  {
    key:   "ONSITE",
    label: "On-site",
    icon:  <MapPin size={18} />,
    color: "#E07B39",
    bg:    "#fff3e0",
  },
];

// ── Initial Form ──────────────────────────────────────────
const INITIAL_FORM = {
  type:     "VIDEO",
  date:     "",
  time:     "",
  duration: "60",
  timezone: "Africa/Douala (WAT, UTC+1)",
  message:  "",
  location: "",
};

// ── Main Component ────────────────────────────────────────
export default function InterviewScheduler({ application, onClose, onScheduled }) {
  const [step,      setStep]      = useState("form");   // "form" | "confirm" | "success"
  const [form,      setForm]      = useState(INITIAL_FORM);
  const [errors,    setErrors]    = useState({});
  const [meetLink,  setMeetLink]  = useState("");
  const [copied,    setCopied]    = useState(false);
  const [sending,   setSending]   = useState(false);

  // ── Applicant initials ──
  const initials = application?.applicant
    ?.split(" ").map((w) => w[0]).slice(0, 2).join("") || "JD";

  // ── Validate form ──
  const validate = () => {
    const e = {};
    if (!form.date)     e.date     = "Please select a date.";
    if (!form.time)     e.time     = "Please select a time.";
    if (form.type === "ONSITE" && !form.location.trim())
      e.location = "Please enter the interview location.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Go to confirm step ──
  const handleNext = () => {
    if (!validate()) return;
    // Generate Google Meet link for video interviews
    if (form.type === "VIDEO") {
      setMeetLink(generateMeetLink());
    }
    setStep("confirm");
  };

  // ── Copy meet link ──
  const handleCopy = () => {
    navigator.clipboard.writeText(meetLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Send interview invitation ──
  const handleSend = async () => {
    setSending(true);

    // Simulate API call to:
    // 1. Create interview in DB: POST /api/v1/interviews
    // 2. Send email to job seeker: Spring Mail triggered automatically
    // 3. Create in-app notification: POST /api/v1/notifications
    //
    // In production:
    // await fetch("/api/v1/interviews", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    //   body: JSON.stringify({
    //     applicationId: application.id,
    //     type: form.type,
    //     scheduledAt: `${form.date}T${form.time}:00`,
    //     durationMinutes: parseInt(form.duration),
    //     meetingLink: meetLink,
    //     location: form.location,
    //     message: form.message,
    //   })
    // });

    await new Promise((r) => setTimeout(r, 1400));
    setSending(false);
    setStep("success");
    onScheduled?.({
      ...form,
      meetLink,
      applicant: application.applicant,
      job: application.job,
    });
  };

  // ── Selected type object ──
  const selectedType = INTERVIEW_TYPES.find((t) => t.key === form.type);

  return (
    <div className="is-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="is-modal">

        {/* ── Header ── */}
        <div className="is-header">
          <div className="is-header-left">
            <div className="is-header-icon">
              <Video size={22} />
            </div>
            <div>
              <p className="is-header-title">Schedule Interview</p>
              <p className="is-header-sub">
                {step === "form"    && "Fill in the interview details"}
                {step === "confirm" && "Review and send the invitation"}
                {step === "success" && "Interview scheduled successfully"}
              </p>
            </div>
          </div>
          <button className="is-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* ── Applicant Info Bar ── */}
        {step !== "success" && (
          <div className="is-applicant-bar">
            <div className="is-applicant-avatar">{initials}</div>
            <div>
              <p className="is-applicant-name">{application?.applicant}</p>
              <p className="is-applicant-job">
                <Briefcase size={11} /> {application?.job}
              </p>
            </div>
          </div>
        )}

        {/* ════════ STEP 1 — FORM ════════ */}
        {step === "form" && (
          <>
            <div className="is-body">

              {/* Interview Type */}
              <div className="is-field">
                <label>Interview Type <span>*</span></label>
                <div className="is-type-grid">
                  {INTERVIEW_TYPES.map((type) => (
                    <button
                      key={type.key}
                      className={`is-type-btn ${form.type === type.key ? "active" : ""}`}
                      onClick={() => setForm({ ...form, type: type.key })}
                    >
                      <div
                        className="is-type-btn-icon"
                        style={{
                          background: form.type === type.key ? type.bg : "#eee",
                          color: form.type === type.key ? type.color : "#999",
                        }}
                      >
                        {type.icon}
                      </div>
                      <span className="is-type-btn-label">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="is-form-grid">
                <div className="is-field">
                  <label>Date <span>*</span></label>
                  <input
                    className={`is-input ${errors.date ? "error" : ""}`}
                    type="date"
                    min={getTomorrow()}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                  {errors.date && <span className="is-error-msg">{errors.date}</span>}
                </div>

                <div className="is-field">
                  <label>Time <span>*</span></label>
                  <input
                    className={`is-input ${errors.time ? "error" : ""}`}
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                  {errors.time && <span className="is-error-msg">{errors.time}</span>}
                </div>

                <div className="is-field">
                  <label>Duration</label>
                  <select
                    className="is-select"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                <div className="is-field">
                  <label>Timezone</label>
                  <select
                    className="is-select"
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  >
                    <option value="Africa/Douala (WAT, UTC+1)">WAT — Douala / Yaoundé</option>
                    <option value="Europe/Paris (CET, UTC+1)">CET — Paris</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                {/* Location — only for ONSITE */}
                {form.type === "ONSITE" && (
                  <div className="is-field is-field-full">
                    <label>Interview Location <span>*</span></label>
                    <input
                      className={`is-input ${errors.location ? "error" : ""}`}
                      placeholder="e.g. 12 Rue des Palmiers, Douala — Building A, 3rd floor"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                    {errors.location && <span className="is-error-msg">{errors.location}</span>}
                  </div>
                )}

                {/* Google Meet info — VIDEO only */}
                {form.type === "VIDEO" && (
                  <div className="is-field is-field-full">
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 14px", background: "#e3f2fd", borderRadius: "9px", border: "1px solid #90caf9" }}>
                      <Info size={14} color="#1565c0" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: "12.5px", color: "#1565c0", fontWeight: 500 }}>
                        A Google Meet link will be automatically generated and sent to the candidate.
                      </span>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className="is-field is-field-full">
                  <label>Personal Message (optional)</label>
                  <textarea
                    className="is-textarea"
                    placeholder="e.g. We are excited to meet you! Please come prepared to discuss your experience with Java and Spring Boot. Feel free to bring any questions you have."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    maxLength={500}
                  />
                  <span style={{ fontSize: "11px", color: "#7a9590", textAlign: "right" }}>
                    {form.message.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="is-footer">
              <div className="is-footer-left">
                <Bell size={13} />
                Candidate will receive an email notification
              </div>
              <div className="is-footer-right">
                <button className="kora-btn-secondary" onClick={onClose}>Cancel</button>
                <button className="kora-btn-primary" onClick={handleNext}>
                  <Calendar size={14} /> Review Invitation
                </button>
              </div>
            </div>
          </>
        )}

        {/* ════════ STEP 2 — CONFIRM ════════ */}
        {step === "confirm" && (
          <>
            <div className="is-body">

              {/* Google Meet Link */}
              {form.type === "VIDEO" && meetLink && (
                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#3a5550", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
                    Google Meet Link
                  </label>
                  <div className="is-meet-preview">
                    <div className="is-meet-icon">
                      {/* Google Meet SVG icon */}
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M19.5 4.5H15V3h-6v1.5H4.5C3.675 4.5 3 5.175 3 6v13.5c0 .825.675 1.5 1.5 1.5h15c.825 0 1.5-.675 1.5-1.5V6c0-.825-.675-1.5-1.5-1.5zm-9 10.5H7.5v-1.5H10.5v1.5zm0-3H7.5V10.5H10.5V12zm6 3H13.5v-1.5H16.5v1.5zm0-3H13.5V10.5H16.5V12z" fill="#1a73e8"/>
                        <circle cx="20" cy="20" r="4" fill="#34a853"/>
                        <path d="M18.5 20l1 1.5 2.5-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="is-meet-info">
                      <div className="is-meet-label">Google Meet</div>
                      <a
                        href={meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="is-meet-link"
                      >
                        {meetLink}
                      </a>
                    </div>
                    <button
                      className={`is-copy-btn ${copied ? "copied" : ""}`}
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <><CheckCircle size={12} style={{ marginRight: 4 }} /> Copied!</>
                      ) : (
                        <><Copy size={12} style={{ marginRight: 4 }} /> Copy</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Interview Summary */}
              <div className="is-summary">
                <div className="is-summary-title">Interview Summary</div>
                <div className="is-summary-row">
                  <selectedType.icon size={15} />
                  <span><strong>{selectedType.label}</strong> Interview</span>
                </div>
                <div className="is-summary-row">
                  <Calendar size={15} />
                  <span>{formatDate(form.date)}</span>
                </div>
                <div className="is-summary-row">
                  <Clock size={15} />
                  <span>{formatTime(form.time)} · {form.duration} minutes</span>
                </div>
                <div className="is-summary-row">
                  <Info size={15} />
                  <span>{form.timezone}</span>
                </div>
                {form.type === "ONSITE" && form.location && (
                  <div className="is-summary-row">
                    <MapPin size={15} />
                    <span>{form.location}</span>
                  </div>
                )}
                {form.type === "VIDEO" && meetLink && (
                  <div className="is-summary-row">
                    <Link2 size={15} />
                    <span style={{ color: "#1565c0", fontSize: "12.5px", wordBreak: "break-all" }}>
                      {meetLink}
                    </span>
                  </div>
                )}
              </div>

              {/* What will be sent */}
              <div style={{ padding: "12px 16px", background: "#fff8f0", border: "1px solid rgba(224,123,57,0.25)", borderRadius: "10px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#E07B39", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Send size={13} /> What the candidate will receive
                </div>
                <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: "12.5px", color: "#7c3800", lineHeight: 1.8 }}>
                  <li>Email with interview date, time and details</li>
                  {form.type === "VIDEO" && <li>Google Meet link to join the call</li>}
                  {form.type === "ONSITE" && <li>Location and directions</li>}
                  <li>In-app notification on their Kora dashboard</li>
                  {form.message && <li>Your personal message</li>}
                </ul>
              </div>

            </div>

            {/* Footer */}
            <div className="is-footer">
              <div className="is-footer-left">
                <Bell size={13} />
                Sending to: <strong style={{ marginLeft: 4 }}>{application?.applicant}</strong>
              </div>
              <div className="is-footer-right">
                <button
                  className="kora-btn-secondary"
                  onClick={() => setStep("form")}
                  disabled={sending}
                >
                  ← Edit
                </button>
                <button
                  className="kora-btn-primary"
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "is-spin 0.7s linear infinite", display: "inline-block", marginRight: 6 }} />
                      Sending...
                    </>
                  ) : (
                    <><Send size={14} /> Send Invitation</>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ════════ STEP 3 — SUCCESS ════════ */}
        {step === "success" && (
          <div className="is-success">
            <div className="is-success-anim">
              <CheckCircle size={36} />
            </div>
            <h3>Interview Scheduled! 🎉</h3>
            <p>
              <strong>{application?.applicant}</strong> has been notified via email
              and in-app notification with all the interview details.
            </p>

            {/* Meet Link recap */}
            {form.type === "VIDEO" && meetLink && (
              <div className="is-success-meet" style={{ width: "100%" }}>
                <div className="is-meet-icon">
                  <Video size={18} color="#1565c0" />
                </div>
                <div className="is-meet-info">
                  <div className="is-meet-label">Your Google Meet Link</div>
                  <a
                    href={meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="is-meet-link"
                  >
                    {meetLink}
                  </a>
                </div>
                <button
                  className={`is-copy-btn ${copied ? "copied" : ""}`}
                  onClick={handleCopy}
                >
                  {copied ? "Copied!" : <><Copy size={12} /> Copy</>}
                </button>
              </div>
            )}

            {/* Date recap */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
              <div style={{ textAlign: "center", padding: "10px 20px", background: "#f4f7f6", borderRadius: "10px", border: "1px solid #d8e4e1" }}>
                <div style={{ fontSize: "11px", color: "#7a9590", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Date</div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0d1f1c" }}>{formatDate(form.date)}</div>
              </div>
              <div style={{ textAlign: "center", padding: "10px 20px", background: "#f4f7f6", borderRadius: "10px", border: "1px solid #d8e4e1" }}>
                <div style={{ fontSize: "11px", color: "#7a9590", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Time</div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0d1f1c" }}>{formatTime(form.time)} · {form.duration}min</div>
              </div>
            </div>

            <div className="is-success-actions">
              <button className="kora-btn-secondary" onClick={onClose}>
                Close
              </button>
              <button
                className="kora-btn-primary"
                onClick={() => {
                  setStep("form");
                  setForm(INITIAL_FORM);
                  setMeetLink("");
                }}
              >
                Schedule Another
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spinning animation for send button */}
      <style>{`@keyframes is-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}