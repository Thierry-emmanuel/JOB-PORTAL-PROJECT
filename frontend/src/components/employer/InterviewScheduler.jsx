import { useState } from "react";
import {
  X, Video, Phone, MapPin, Calendar, Clock,
  Link2, Copy, CheckCircle, Bell, Send, Briefcase,
  Info, AlertCircle, Navigation, ExternalLink
} from "lucide-react";
import { scheduleInterview } from "../../api/interviews";
import "../../styles/interview-scheduler.css";

// ── Helpers ───────────────────────────────────────────────

/**
 * Generates a Google-Meet-formatted random room code.
 * The backend also generates one as a fallback, but we do it here too
 * so the employer can copy/share the link before the API call returns.
 */
function generateMeetLink() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const seg = (len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function buildScheduledAt(date, time) {
  return `${date}T${time}:00`;
}

// ── Interview Types ───────────────────────────────────────
const INTERVIEW_TYPES = [
  {
    key:   "VIDEO",
    label: "Video Call",
    icon:  <Video size={18} />,
    color: "#1565c0",
    bg:    "#e3f2fd",
    desc:  "Google Meet link auto-generated",
  },
  {
    key:   "PHONE",
    label: "Phone Call",
    icon:  <Phone size={18} />,
    color: "#2e7d32",
    bg:    "#e8f5e9",
    desc:  "Candidate will be called directly",
  },
  {
    key:   "IN_PERSON",
    label: "On-site",
    icon:  <MapPin size={18} />,
    color: "#b45309",
    bg:    "#fffbeb",
    desc:  "Enter the physical interview address",
  },
];

const INITIAL_FORM = {
  type:     "VIDEO",
  date:     "",
  time:     "",
  duration: "60",
  timezone: "Africa/Douala (WAT, UTC+1)",
  message:  "",
  location: "",   // used for IN_PERSON physical address
};

// ── Main Component ────────────────────────────────────────
export default function InterviewScheduler({ application, onClose, onScheduled }) {
  const [step,        setStep]        = useState("form");   // "form" | "confirm" | "success"
  const [form,        setForm]        = useState(INITIAL_FORM);
  const [errors,      setErrors]      = useState({});
  const [meetLink,    setMeetLink]    = useState("");
  const [copied,      setCopied]      = useState(false);
  const [sending,     setSending]     = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const initials = application?.applicant
    ?.split(" ").map((w) => w[0]).slice(0, 2).join("") || "JD";

  // ── Validate ──
  const validate = () => {
    const e = {};
    if (!form.date) e.date = "Please select a date.";
    if (!form.time) e.time = "Please select a time.";
    if (form.type === "IN_PERSON" && !form.location.trim())
      e.location = "Please enter the interview location / address.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Proceed to confirm step ──
  const handleNext = () => {
    if (!validate()) return;
    if (form.type === "VIDEO") setMeetLink(generateMeetLink());
    setSubmitError(null);
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
    if (!application?.id) {
      setSubmitError("Cannot schedule: application ID is missing.");
      return;
    }
    setSending(true);
    setSubmitError(null);

    // For IN_PERSON interviews we store the physical address in the meetingLink
    // field (not platform) so InterviewCard can render it with a Maps directions
    // link and GoogleCalendarService can set it as the event location.
    const platform =
      form.type === "VIDEO"    ? "Google Meet" :
      form.type === "PHONE"    ? "Phone"       : form.location;

    // meetingLink carries the Google Meet URL for VIDEO, or the physical address
    // for IN_PERSON so the seeker gets a Maps-ready address from InterviewCard.
    const meetingLinkPayload =
      form.type === "VIDEO"     ? meetLink        :
      form.type === "IN_PERSON" ? form.location   : null;

    const payload = {
      scheduledAt: buildScheduledAt(form.date, form.time),
      type:        form.type,
      platform,
      meetingLink: meetingLinkPayload,
    };

    try {
      await scheduleInterview(application.id, payload);
      setSending(false);
      setStep("success");
      onScheduled?.({ ...form, meetLink, applicant: application.applicant, job: application.job });
    } catch (err) {
      setSending(false);
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to schedule the interview. Please try again.";
      setSubmitError(serverMessage);
    }
  };

  const selectedType = INTERVIEW_TYPES.find((t) => t.key === form.type);

  return (
    <div className="is-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="is-modal">

        {/* ── Header ── */}
        <div className="is-header">
          <div className="is-header-left">
            <div className="is-header-icon"><Calendar size={22} /></div>
            <div>
              <p className="is-header-title">Schedule Interview</p>
              <p className="is-header-sub">
                {step === "form"    && "Fill in the interview details"}
                {step === "confirm" && "Review and send the invitation"}
                {step === "success" && "Interview scheduled successfully"}
              </p>
            </div>
          </div>
          <button className="is-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {/* ── Applicant bar ── */}
        {step !== "success" && (
          <div className="is-applicant-bar">
            <div className="is-applicant-avatar">{initials}</div>
            <div>
              <p className="is-applicant-name">{application?.applicant}</p>
              <p className="is-applicant-job"><Briefcase size={11} /> {application?.job}</p>
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
                      onClick={() => setForm({ ...form, type: type.key, location: "" })}
                    >
                      <div
                        className="is-type-btn-icon"
                        style={{
                          background: form.type === type.key ? type.bg  : "#f3f4f6",
                          color:      form.type === type.key ? type.color : "#9ca3af",
                        }}
                      >
                        {type.icon}
                      </div>
                      <span className="is-type-btn-label">{type.label}</span>
                      <span className="is-type-btn-desc">{type.desc}</span>
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
                  <select className="is-select" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                <div className="is-field">
                  <label>Timezone</label>
                  <select className="is-select" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
                    <option value="Africa/Douala (WAT, UTC+1)">WAT — Douala / Yaoundé</option>
                    <option value="Europe/Paris (CET, UTC+1)">CET — Paris</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                {/* ── VIDEO: Google Meet info banner ── */}
                {form.type === "VIDEO" && (
                  <div className="is-field is-field-full">
                    <div className="is-info-banner is-info-banner--blue">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <rect width="24" height="24" rx="4" fill="#1a73e8"/>
                        <path d="M5 8h8a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V9a1 1 0 011-1z" fill="white"/>
                        <path d="M14 10.5l4-2.5v8l-4-2.5v-3z" fill="white"/>
                      </svg>
                      <div>
                        <strong style={{ fontSize: "12.5px", color: "#1565c0" }}>Google Meet link will be auto-generated</strong>
                        <p style={{ fontSize: "12px", color: "#1976d2", margin: "2px 0 0" }}>
                          You'll see the link on the next step. The candidate will receive it in their notification.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── IN_PERSON: physical address field ── */}
                {form.type === "IN_PERSON" && (
                  <div className="is-field is-field-full">
                    <label>
                      <MapPin size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                      Interview Location / Address <span>*</span>
                    </label>
                    <input
                      className={`is-input ${errors.location ? "error" : ""}`}
                      placeholder="e.g. 12 Rue des Palmiers, Douala — Building A, 3rd Floor"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                    {errors.location && <span className="is-error-msg">{errors.location}</span>}
                    <p style={{ fontSize: "11.5px", color: "#78350f", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <Navigation size={11} /> The candidate will receive a Google Maps directions link.
                    </p>
                  </div>
                )}

                {/* ── PHONE: info ── */}
                {form.type === "PHONE" && (
                  <div className="is-field is-field-full">
                    <div className="is-info-banner is-info-banner--green">
                      <Phone size={15} style={{ flexShrink: 0, color: "#2e7d32" }} />
                      <span style={{ fontSize: "12.5px", color: "#166534" }}>
                        The candidate will be called at their registered phone number on the day of the interview.
                      </span>
                    </div>
                  </div>
                )}

                {/* Personal Message */}
                <div className="is-field is-field-full">
                  <label>Personal Message <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span></label>
                  <textarea
                    className="is-textarea"
                    placeholder="e.g. We are excited to meet you! Please prepare to discuss your experience…"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    maxLength={500}
                  />
                  <span style={{ fontSize: "11px", color: "#9ca3af", textAlign: "right" }}>
                    {form.message.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="is-footer">
              <div className="is-footer-left"><Bell size={13} /> Candidate will receive an email notification</div>
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

              {/* VIDEO: Google Meet link preview */}
              {form.type === "VIDEO" && meetLink && (
                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#1565c0", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                    Google Meet Link
                  </label>
                  <div className="is-meet-preview">
                    <div className="is-meet-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <rect width="24" height="24" rx="5" fill="#1a73e8"/>
                        <path d="M5 8h8a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V9a1 1 0 011-1z" fill="white"/>
                        <path d="M14 10.5l4-2.5v8l-4-2.5v-3z" fill="white"/>
                      </svg>
                    </div>
                    <div className="is-meet-info">
                      <div className="is-meet-label">Google Meet</div>
                      <a href={meetLink} target="_blank" rel="noreferrer" className="is-meet-link">
                        {meetLink}
                      </a>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className={`is-copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
                        {copied ? <><CheckCircle size={12} style={{ marginRight: 4 }} /> Copied!</> : <><Copy size={12} style={{ marginRight: 4 }} /> Copy</>}
                      </button>
                      <a href={meetLink} target="_blank" rel="noreferrer" className="is-copy-btn" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 4, background: "#e3f2fd", color: "#1565c0" }}>
                        <ExternalLink size={12} /> Open
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* IN_PERSON: location summary card */}
              {form.type === "IN_PERSON" && form.location && (
                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                    Interview Location
                  </label>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: 12 }}>
                    <MapPin size={18} color="#b45309" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#78350f" }}>{form.location}</div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, color: "#1a73e8", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, textDecoration: "none" }}
                      >
                        <Navigation size={11} /> Preview on Google Maps
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Interview Summary */}
              <div className="is-summary">
                <div className="is-summary-title">Interview Summary</div>
                <div className="is-summary-row">
                  {selectedType.icon}
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
                {form.type === "VIDEO" && meetLink && (
                  <div className="is-summary-row">
                    <Link2 size={15} />
                    <span style={{ color: "#1565c0", fontSize: "12.5px", wordBreak: "break-all" }}>{meetLink}</span>
                  </div>
                )}
                {form.type === "IN_PERSON" && form.location && (
                  <div className="is-summary-row">
                    <MapPin size={15} />
                    <span>{form.location}</span>
                  </div>
                )}
              </div>

              {/* What candidate receives */}
              <div style={{ padding: "12px 16px", background: "#fff8f0", border: "1px solid rgba(180,83,9,0.2)", borderRadius: 10 }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#b45309", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Send size={13} /> What the candidate will receive
                </div>
                <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: "12.5px", color: "#7c3800", lineHeight: 1.9 }}>
                  <li>Email with interview date, time and details</li>
                  {form.type === "VIDEO"     && <li>Google Meet link to join the call</li>}
                  {form.type === "IN_PERSON" && <li>Physical address + Google Maps directions link</li>}
                  {form.type === "PHONE"     && <li>Confirmation that a call will be made to their number</li>}
                  <li>In-app notification on their Kora dashboard</li>
                  {form.message && <li>Your personal message</li>}
                </ul>
              </div>

              {/* API error */}
              {submitError && (
                <div role="alert" style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 9, marginTop: 4 }}>
                  <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: "12.5px", color: "#991b1b", lineHeight: 1.5 }}>{submitError}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="is-footer">
              <div className="is-footer-left">
                <Bell size={13} /> Sending to: <strong style={{ marginLeft: 4 }}>{application?.applicant}</strong>
              </div>
              <div className="is-footer-right">
                <button className="kora-btn-secondary" onClick={() => { setStep("form"); setSubmitError(null); }} disabled={sending}>
                  ← Edit
                </button>
                <button className="kora-btn-primary" onClick={handleSend} disabled={sending}>
                  {sending ? (
                    <>
                      <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "is-spin 0.7s linear infinite", display: "inline-block", marginRight: 6 }} />
                      Sending…
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
            <div className="is-success-anim"><CheckCircle size={36} /></div>
            <h3>Interview Scheduled! 🎉</h3>
            <p>
              <strong>{application?.applicant}</strong> has been notified via email
              and in-app notification with all the interview details.
            </p>

            {/* Meet link recap */}
            {form.type === "VIDEO" && meetLink && (
              <div className="is-success-meet" style={{ width: "100%" }}>
                <div className="is-meet-icon"><Video size={18} color="#1565c0" /></div>
                <div className="is-meet-info">
                  <div className="is-meet-label">Google Meet Link</div>
                  <a href={meetLink} target="_blank" rel="noreferrer" className="is-meet-link">{meetLink}</a>
                </div>
                <button className={`is-copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
                  {copied ? "Copied!" : <><Copy size={12} /> Copy</>}
                </button>
              </div>
            )}

            {/* Location recap */}
            {form.type === "IN_PERSON" && form.location && (
              <div style={{ width: "100%", padding: "12px 16px", background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: 12, display: "flex", gap: 10, alignItems: "center" }}>
                <MapPin size={16} color="#b45309" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#78350f" }}>{form.location}</div>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location)}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11.5, color: "#1a73e8", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, textDecoration: "none" }}>
                    <Navigation size={11} /> Open in Google Maps
                  </a>
                </div>
              </div>
            )}

            {/* Date/time recap */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
              <div style={{ textAlign: "center", padding: "10px 20px", background: "#f4f7f6", borderRadius: 10, border: "1px solid #d8e4e1" }}>
                <div style={{ fontSize: "11px", color: "#7a9590", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Date</div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0d1f1c" }}>{formatDate(form.date)}</div>
              </div>
              <div style={{ textAlign: "center", padding: "10px 20px", background: "#f4f7f6", borderRadius: 10, border: "1px solid #d8e4e1" }}>
                <div style={{ fontSize: "11px", color: "#7a9590", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Time</div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0d1f1c" }}>{formatTime(form.time)} · {form.duration}min</div>
              </div>
            </div>

            <div className="is-success-actions">
              <button className="kora-btn-secondary" onClick={onClose}>Close</button>
              <button className="kora-btn-primary" onClick={() => { setStep("form"); setForm(INITIAL_FORM); setMeetLink(""); setSubmitError(null); }}>
                Schedule Another
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes is-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .is-info-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid;
        }
        .is-info-banner--blue { background: #eff6ff; border-color: #bfdbfe; }
        .is-info-banner--green { background: #f0fdf4; border-color: #86efac; }
        .is-type-btn-desc {
          font-size: 10px;
          color: #9ca3af;
          font-weight: 400;
          margin-top: 2px;
          line-height: 1.3;
        }
        .is-type-btn.active .is-type-btn-desc { color: inherit; opacity: 0.75; }
      `}</style>
    </div>
  );
}