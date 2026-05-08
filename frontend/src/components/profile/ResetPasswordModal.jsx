import { useState } from "react";
import { X, KeyRound, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

/*
  ResetPasswordModal
  ─────────────────
  Props:
    onClose    : () => void
    userEmail  : string   — pre-filled for display only
*/
export default function ResetPasswordModal({ onClose, userEmail }) {
  const [step, setStep] = useState("form"); // "form" | "success"
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const toggle = (field) => setShow((s) => ({ ...s, [field]: !s[field] }));

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = "Current password is required.";
    if (!form.newPassword) {
      e.newPassword = "New password is required.";
    } else if (form.newPassword.length < 8) {
      e.newPassword = "Minimum 8 characters.";
    } else if (!/[A-Z]/.test(form.newPassword)) {
      e.newPassword = "Must contain at least one uppercase letter.";
    } else if (!/[0-9]/.test(form.newPassword)) {
      e.newPassword = "Must contain at least one digit.";
    }
    if (!form.confirmPassword) {
      e.confirmPassword = "Please confirm your new password.";
    } else if (form.newPassword !== form.confirmPassword) {
      e.confirmPassword = "Passwords do not match.";
    }
    return e;
  };

  const strengthLevel = () => {
    const p = form.newPassword;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];
  const sl = strengthLevel();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setSubmitting(true);
    // Simulate API call — replace with: POST /api/v1/auth/change-password
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setStep("success");
  };

  return (
    <div className="kora-modal-overlay" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="kora-modal kora-reset-modal">

        {/* Header */}
        <div className="kora-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <KeyRound size={18} />
            <h2>Reset Password</h2>
          </div>
          <button className="kora-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="kora-modal-body">
            {/* Account info banner */}
            <div className="kora-reset-info-banner">
              <span>Changing password for</span>
              <strong>{userEmail}</strong>
            </div>

            {/* Current Password */}
            <div className="kora-field" style={{ marginBottom: 14 }}>
              <label>Current Password *</label>
              <div className="kora-pwd-input-wrap">
                <input
                  type={show.current ? "text" : "password"}
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                />
                <button type="button" className="kora-pwd-toggle" onClick={() => toggle("current")}>
                  {show.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.currentPassword && <span className="kora-field-error">{errors.currentPassword}</span>}
            </div>

            {/* New Password */}
            <div className="kora-field" style={{ marginBottom: 6 }}>
              <label>New Password *</label>
              <div className="kora-pwd-input-wrap">
                <input
                  type={show.next ? "text" : "password"}
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="At least 8 chars, 1 uppercase, 1 digit"
                  autoComplete="new-password"
                />
                <button type="button" className="kora-pwd-toggle" onClick={() => toggle("next")}>
                  {show.next ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword && <span className="kora-field-error">{errors.newPassword}</span>}

              {/* Strength meter */}
              {form.newPassword && (
                <div className="kora-pwd-strength">
                  <div className="kora-strength-bars">
                    {[1,2,3,4].map((i) => (
                      <div
                        key={i}
                        className="kora-strength-bar"
                        style={{ background: i <= sl ? strengthColor[sl] : "var(--kora-border)" }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 11.5, color: strengthColor[sl], fontWeight: 600 }}>
                    {strengthLabel[sl]}
                  </span>
                </div>
              )}
            </div>

            {/* Requirements checklist */}
            <div className="kora-pwd-checklist">
              {[
                { label: "At least 8 characters", ok: form.newPassword.length >= 8 },
                { label: "One uppercase letter", ok: /[A-Z]/.test(form.newPassword) },
                { label: "One digit", ok: /[0-9]/.test(form.newPassword) },
              ].map(({ label, ok }) => (
                <div key={label} className={`kora-check-item ${ok ? "ok" : ""}`}>
                  <CheckCircle size={12} />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Confirm */}
            <div className="kora-field" style={{ marginTop: 14, marginBottom: 0 }}>
              <label>Confirm New Password *</label>
              <div className="kora-pwd-input-wrap">
                <input
                  type={show.confirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
                <button type="button" className="kora-pwd-toggle" onClick={() => toggle("confirm")}>
                  {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="kora-field-error">{errors.confirmPassword}</span>}
            </div>

            <div className="kora-modal-footer">
              <button type="button" className="kora-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="kora-btn-primary" disabled={submitting}>
                {submitting ? (
                  <span className="kora-spinner" />
                ) : (
                  <><KeyRound size={15} />Update Password</>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Success state */
          <div className="kora-modal-body kora-reset-success">
            <div className="kora-success-icon">
              <CheckCircle size={48} />
            </div>
            <h3>Password Updated!</h3>
            <p>Your password has been changed successfully. Use your new password the next time you sign in.</p>
            <button className="kora-btn-primary" style={{ marginTop: 24, alignSelf: "center" }} onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
