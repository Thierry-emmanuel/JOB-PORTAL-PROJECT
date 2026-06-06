/**
 * InterviewScheduler.jsx
 * Full-featured interview scheduling modal used inside ManageJobs ApplicantDrawer.
 *
 * Features:
 * • Video (Google Meet auto-generated or custom) / Phone / In-Person
 * • Animated step: Configure → Review → Success
 * • Copy-to-clipboard for meeting links
 * • Summary preview before confirming
 * • Google Calendar sync via backend
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Video, Phone, MapPin, Calendar, Clock, Globe,
  CheckCircle2, Copy, Check, Send, Zap, User,
  ArrowRight, AlertCircle, Briefcase, CalendarClock,
} from 'lucide-react';
import { scheduleInterview, rescheduleInterview } from '../../api/interviews';
import { useAuth } from '../../context/AuthContext';
import '../../styles/interview-scheduler.css';

/* ─── Google Meet SVG icon ────────────────────────────────── */
const MeetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="8" fill="#fff"/>
    <path d="M28 16H12a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V18a2 2 0 00-2-2z" fill="#1a73e8"/>
    <path d="M30 22l8-5v14l-8-5v-4z" fill="#1a73e8"/>
    <path d="M16 22h8M16 26h6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/* ─── Constants ───────────────────────────────────────────── */
const PLATFORMS = ['Google Meet','Zoom','Microsoft Teams','Other'];

const formatGoogleMeetLink = (input) => {
  if (!input) return input;
  let str = input.trim();

  // If they entered just a 10-character code (possibly with dashes) e.g., "lgkouszeur" or "lgk-ousz-eur"
  const cleanCode = str.replace(/-/g, '');
  const isPlainCode = /^[a-zA-Z]{10}$/.test(cleanCode);

  if (isPlainCode) {
    const formattedCode = `${cleanCode.slice(0, 3)}-${cleanCode.slice(3, 7)}-${cleanCode.slice(7, 10)}`.toLowerCase();
    return `https://meet.google.com/${formattedCode}`;
  }

  // Prepend https:// if it starts with meet.google.com
  if (str.toLowerCase().startsWith('meet.google.com')) {
    str = 'https://' + str;
  }

  try {
    const url = new URL(str);
    if (url.hostname === 'meet.google.com') {
      const pathCode = url.pathname.replace(/^\//, '').replace(/-/g, '');
      if (/^[a-zA-Z]{10}$/.test(pathCode)) {
        const formattedCode = `${pathCode.slice(0, 3)}-${pathCode.slice(3, 7)}-${pathCode.slice(7, 10)}`.toLowerCase();
        return `https://meet.google.com/${formattedCode}`;
      }
    }
  } catch (err) {
    const meetMatch = str.match(/meet\.google\.com\/([a-zA-Z-]{10,12})/i);
    if (meetMatch) {
      const pathCode = meetMatch[1].replace(/-/g, '');
      if (/^[a-zA-Z]{10}$/.test(pathCode)) {
        const formattedCode = `${pathCode.slice(0, 3)}-${pathCode.slice(3, 7)}-${pathCode.slice(7, 10)}`.toLowerCase();
        return `https://meet.google.com/${formattedCode}`;
      }
    }
  }

  return str;
};

const TYPE_OPTIONS = [
  {
    value: 'VIDEO',
    label: 'Video Call',
    icon: <Video size={18}/>,
    color: '#1d4ed8',
    bg:    '#eff6ff',
    desc:  'Remote video interview with meeting link',
  },
  {
    value: 'PHONE',
    label: 'Phone Call',
    icon: <Phone size={18}/>,
    color: '#065f46',
    bg:    '#ecfdf5',
    desc:  'Direct phone call to candidate',
  },
  {
    value: 'IN_PERSON',
    label: 'On-Site',
    icon: <MapPin size={18}/>,
    color: '#92400e',
    bg:    '#fffbeb',
    desc:  'Physical meeting at your office',
  },
];

/* Framer variants */
const slideIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22,1,0.36,1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

/* ═══════════════════════════════════════════════════════════ */
export default function InterviewScheduler({ application, existingInterview, onClose, onScheduled }) {
  const { user } = useAuth();

  const [phase, setPhase]   = useState('form');  // 'form' | 'review' | 'success'
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState(() => {
    if (existingInterview) {
      const isVideo = existingInterview.type === 'VIDEO';
      return {
        type:         existingInterview.type || 'VIDEO',
        platform:     existingInterview.platform || 'Google Meet',
        scheduledAt:  existingInterview.scheduledAt ? existingInterview.scheduledAt.slice(0, 16) : '',
        meetingLink:  existingInterview.meetingLink || '',
        location:     existingInterview.type === 'IN_PERSON' ? (existingInterview.platform || '') : '',
        phone:        existingInterview.type === 'PHONE' ? (existingInterview.platform || '') : '',
        notes:        existingInterview.notes || '',
        generateMeet: isVideo && !existingInterview.meetingLink,
      };
    }
    return {
      type:        'VIDEO',
      platform:    'Google Meet',
      scheduledAt: '',
      meetingLink: '',
      location:    '',   // for IN_PERSON
      phone:       '',   // for PHONE
      notes:       '',
      generateMeet: true,  // auto-generate Google Meet link
    };
  });

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* ── Validate ───────────────────────────────────────────── */
  const [errors, setErrors] = useState({});
  const validate = (f = form) => {
    const e = {};
    if (!f.scheduledAt) e.scheduledAt = 'Date & time is required';
    else if (new Date(f.scheduledAt) <= new Date()) e.scheduledAt = 'Must be a future date';
    
    if (f.type === 'VIDEO' && !f.generateMeet) {
      if (!f.meetingLink) {
        e.meetingLink = 'Provide a meeting link or enable auto-generate';
      } else {
        const isGoogleMeet = f.platform === 'Google Meet' || f.meetingLink.includes('meet.google.com');
        if (isGoogleMeet) {
          const meetRegex = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/i;
          if (!meetRegex.test(f.meetingLink)) {
            e.meetingLink = 'Invalid Google Meet format. Expected: meet.google.com/abc-defg-hij';
          }
        } else {
          try {
            new URL(f.meetingLink);
          } catch (err) {
            if (!/^https?:\/\//i.test(f.meetingLink)) {
              e.meetingLink = 'Please enter a valid URL starting with http:// or https://';
            }
          }
        }
      }
    }
    
    if (f.type === 'IN_PERSON' && !f.location.trim())
      e.location = 'Location is required for on-site interviews';
    return e;
  };

  /* ── Go to review ───────────────────────────────────────── */
  const handleReview = () => {
    let updatedLink = form.meetingLink;
    if (form.type === 'VIDEO' && !form.generateMeet) {
      updatedLink = formatGoogleMeetLink(form.meetingLink);
      upd('meetingLink', updatedLink);
    }
    const e = validate({ ...form, meetingLink: updatedLink });
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setPhase('review');
  };

  /* ── Submit ─────────────────────────────────────────────── */
  const handleSubmit = useCallback(async () => {
    setSaving(true); setError(null);
    try {
      if (existingInterview) {
        const payload = {
          newScheduledAt: form.scheduledAt,
          meetingLink: form.type === 'VIDEO' && !form.generateMeet
            ? form.meetingLink
            : '',
        };
        const iv = await rescheduleInterview(existingInterview.id, payload);
        setResult(iv);
        setPhase('success');
      } else {
        const payload = {
          scheduledAt:  form.scheduledAt,
          type:         form.type,
          platform:     form.type === 'IN_PERSON'
            ? form.location
            : form.type === 'PHONE'
              ? (form.phone || 'Phone')
              : form.platform,
          meetingLink:  form.type === 'VIDEO' && !form.generateMeet
            ? form.meetingLink
            : '',   // backend generates Meet link when blank + type=VIDEO
          notes:        form.notes,
        };
        const iv = await scheduleInterview(application.id, payload);
        setResult(iv);
        setPhase('success');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Scheduling failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [form, application.id, existingInterview]);

  /* ── Copy link ──────────────────────────────────────────── */
  const copyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const applicantName = application.applicant || application.seekerName || 'Candidate';
  const jobTitle      = application.job        || application.jobTitle   || '';

  /* ── Selected type meta ─────────────────────────────────── */
  const typeMeta = TYPE_OPTIONS.find(t => t.value === form.type);

  /* ── Summary row helper ─────────────────────────────────── */
  const SumRow = ({ icon, label, value }) => value ? (
    <div className="is-summary-row">
      {icon}
      <span><strong>{label}:</strong> {value}</span>
    </div>
  ) : null;

  const fmtScheduled = form.scheduledAt
    ? new Date(form.scheduledAt).toLocaleString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
    : '—';

  return (
    <div className="is-overlay" role="dialog" aria-modal="true" aria-label="Schedule Interview">
      <div className="is-modal">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="is-header">
          <div className="is-header-left">
            <div className="is-header-icon"><CalendarClock size={20} color="#fff"/></div>
            <div>
              <h2 className="is-header-title">Schedule Interview</h2>
              <p className="is-header-sub">
                {phase === 'success' ? 'Interview confirmed!' : `For ${applicantName}`}
              </p>
            </div>
          </div>
          <button className="is-close-btn" onClick={onClose} aria-label="Close">
            <X size={16}/>
          </button>
        </div>

        {/* ── Applicant bar ───────────────────────────────────── */}
        {phase !== 'success' && (
          <div className="is-applicant-bar">
            <div className="is-applicant-avatar">
              {applicantName.split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('')}
            </div>
            <div>
              <p className="is-applicant-name">{applicantName}</p>
              <p className="is-applicant-job">
                <Briefcase size={11}/> {jobTitle || `Application #${application.id}`}
              </p>
            </div>
          </div>
        )}

        {/* ── Body ────────────────────────────────────────────── */}
        <div className="is-body">
          <AnimatePresence mode="wait">

            {/* ──────── PHASE: FORM ──────── */}
            {phase === 'form' && (
              <motion.div key="form" {...slideIn}>

                {/* Interview type */}
                <div className="is-field is-field-full">
                  <label>Interview Type <span>*</span></label>
                  <div className="is-type-grid">
                    {TYPE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`is-type-btn${form.type === opt.value ? ' active' : ''}`}
                        onClick={() => upd('type', opt.value)}
                        style={form.type === opt.value
                          ? { borderColor: opt.color, background: opt.bg }
                          : {}}
                      >
                        <div className="is-type-btn-icon" style={{ background: opt.bg, color: opt.color }}>
                          {opt.icon}
                        </div>
                        <span className="is-type-btn-label" style={form.type===opt.value ? {color:opt.color}:{}}>{opt.label}</span>
                        <span className="is-type-btn-desc">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="is-form-grid">

                  {/* Date & Time */}
                  <div className="is-field is-field-full">
                    <label>Date &amp; Time <span>*</span></label>
                    <div style={{ position:'relative' }}>
                      <Calendar size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#7a9590', pointerEvents:'none' }}/>
                      <input
                        type="datetime-local"
                        className={`is-input${errors.scheduledAt?' error':''}`}
                        style={{ paddingLeft: 36 }}
                        value={form.scheduledAt}
                        onChange={e => { upd('scheduledAt', e.target.value); setErrors(er=>({...er,scheduledAt:undefined})); }}
                        min={new Date(Date.now() + 30 * 60 * 1000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                      />
                    </div>
                    {errors.scheduledAt && <p className="is-error-msg">{errors.scheduledAt}</p>}
                  </div>

                  {/* VIDEO fields */}
                  {form.type === 'VIDEO' && (
                    <>
                      <div className="is-field">
                        <label>Platform</label>
                        <select className="is-select" value={form.platform} onChange={e=>upd('platform',e.target.value)}>
                          {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="is-field">
                        <label>Meeting Link</label>
                        <div className="is-toggle-row">
                          <button
                            type="button"
                            className={`is-toggle-chip${form.generateMeet?' active':''}`}
                            onClick={() => upd('generateMeet', !form.generateMeet)}
                          >
                            <Zap size={12}/> Auto-generate Google Meet
                          </button>
                        </div>
                      </div>
                      {!form.generateMeet && (
                        <div className="is-field is-field-full">
                          <label>Custom Meeting URL</label>
                          <input
                            type="url"
                            className={`is-input${errors.meetingLink?' error':''}`}
                            placeholder="https://meet.google.com/…"
                            value={form.meetingLink}
                            onChange={e=>{ upd('meetingLink',e.target.value); setErrors(er=>({...er,meetingLink:undefined})); }}
                          />
                          {errors.meetingLink && <p className="is-error-msg">{errors.meetingLink}</p>}
                        </div>
                      )}
                      {form.generateMeet && (
                        <div className="is-field is-field-full">
                          <div className="is-meet-preview">
                            <div className="is-meet-icon"><MeetIcon/></div>
                            <div className="is-meet-info">
                              <p className="is-meet-label">Google Meet</p>
                              <span className="is-meet-link">A unique link will be generated when you schedule</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* PHONE fields */}
                  {form.type === 'PHONE' && (
                    <div className="is-field is-field-full">
                      <label>Candidate Phone (optional)</label>
                      <input
                        type="tel"
                        className="is-input"
                        placeholder="+237 6xx xxx xxx"
                        value={form.phone}
                        onChange={e => upd('phone', e.target.value)}
                      />
                      <p style={{ fontSize:11.5, color:'#7a9590', marginTop:4 }}>
                        Leave blank to use the candidate's registered phone number.
                      </p>
                    </div>
                  )}

                  {/* IN_PERSON fields */}
                  {form.type === 'IN_PERSON' && (
                    <div className="is-field is-field-full">
                      <label>Interview Location / Address <span>*</span></label>
                      <input
                        type="text"
                        className={`is-input${errors.location?' error':''}`}
                        placeholder="e.g. 5th Floor, BICEC Tower, Akwa, Douala"
                        value={form.location}
                        onChange={e=>{ upd('location',e.target.value); setErrors(er=>({...er,location:undefined})); }}
                      />
                      {errors.location && <p className="is-error-msg">{errors.location}</p>}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="is-field is-field-full">
                    <label>Message to Candidate <span style={{fontWeight:400,color:'#9ca3af'}}>(optional)</span></label>
                    <textarea
                      className="is-textarea"
                      rows={3}
                      placeholder="Any preparation notes, attire requirements, what to bring…"
                      value={form.notes}
                      onChange={e => upd('notes', e.target.value)}
                    />
                  </div>

                </div>
              </motion.div>
            )}

            {/* ──────── PHASE: REVIEW ──────── */}
            {phase === 'review' && (
              <motion.div key="review" {...slideIn}>
                <div className="is-review-header">
                  <CheckCircle2 size={18} color="#1A5C2E"/>
                  <div>
                    <h3>Review Interview Details</h3>
                    <p>Confirm before sending the invitation to {applicantName}.</p>
                  </div>
                </div>

                {/* Type chip */}
                <div className="is-review-type-chip" style={{ background: typeMeta?.bg, color: typeMeta?.color }}>
                  {typeMeta?.icon}
                  <strong>{typeMeta?.label}</strong>
                  <span>interview</span>
                </div>

                <div className="is-summary">
                  <p className="is-summary-title">Summary</p>
                  <SumRow icon={<User size={13}/>}     label="Candidate"  value={applicantName}/>
                  <SumRow icon={<Briefcase size={13}/>} label="Position"   value={jobTitle}/>
                  <SumRow icon={<Calendar size={13}/>}  label="Scheduled"  value={fmtScheduled}/>
                  {form.type === 'VIDEO' && (
                    <SumRow icon={<Globe size={13}/>}   label="Platform"   value={form.platform}/>
                  )}
                  {form.type === 'VIDEO' && form.generateMeet && (
                    <SumRow icon={<Zap size={13}/>}     label="Meeting"    value="Google Meet link will be auto-generated"/>
                  )}
                  {form.type === 'VIDEO' && !form.generateMeet && form.meetingLink && (
                    <SumRow icon={<Globe size={13}/>}   label="Link"       value={form.meetingLink}/>
                  )}
                  {form.type === 'IN_PERSON' && (
                    <SumRow icon={<MapPin size={13}/>}  label="Location"   value={form.location}/>
                  )}
                  {form.type === 'PHONE' && (
                    <SumRow icon={<Phone size={13}/>}   label="Phone"      value={form.phone || 'Candidate registered number'}/>
                  )}
                  {form.notes && (
                    <SumRow icon={<AlertCircle size={13}/>} label="Notes"  value={form.notes}/>
                  )}
                </div>

                {error && (
                  <div className="is-error-banner">
                    <AlertCircle size={14}/> {error}
                  </div>
                )}
              </motion.div>
            )}

            {/* ──────── PHASE: SUCCESS ──────── */}
            {phase === 'success' && (
              <motion.div key="success" {...slideIn} className="is-success">
                <div className="is-success-anim">
                  <CheckCircle2 size={36}/>
                </div>
                <h3>Interview Scheduled!</h3>
                <p>
                  <strong>{applicantName}</strong> has been invited for a{' '}
                  {typeMeta?.label.toLowerCase()} interview on{' '}
                  <strong>{fmtScheduled}</strong>. A notification has been sent.
                </p>

                {/* Show meet link if generated */}
                {result?.meetingLink && form.type === 'VIDEO' && (
                  <div className="is-success-meet">
                    <div className="is-meet-icon"><MeetIcon/></div>
                    <div className="is-meet-info">
                      <p className="is-meet-label">Meeting Link</p>
                      <a href={result.meetingLink} target="_blank" rel="noreferrer" className="is-meet-link">
                        {result.meetingLink}
                      </a>
                    </div>
                    <button
                      className={`is-copy-btn${copied?' copied':''}`}
                      onClick={() => copyLink(result.meetingLink)}
                    >
                      {copied ? <><Check size={12}/> Copied!</> : <><Copy size={12}/> Copy</>}
                    </button>
                  </div>
                )}

                {result?.type === 'IN_PERSON' && result?.meetingLink && (
                  <div className="is-success-meet" style={{ borderColor:'#fcd34d', background:'#fffbeb' }}>
                    <MapPin size={18} color="#92400e"/>
                    <div className="is-meet-info">
                      <p className="is-meet-label" style={{ color:'#92400e' }}>Location</p>
                      <span style={{ fontSize:13, color:'#78350f' }}>{result.meetingLink}</span>
                    </div>
                  </div>
                )}

                <div className="is-success-actions">
                  <button className="is-btn is-btn-primary" onClick={() => { onScheduled?.(result); onClose(); }}>
                    Done <ArrowRight size={13}/>
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        {phase !== 'success' && (
          <div className="is-footer">
            <div className="is-footer-left">
              <AlertCircle size={12}/>
              {phase === 'form'
                ? 'Candidate will be notified by email.'
                : 'This will send an invite to the candidate.'}
            </div>
            <div className="is-footer-right">
              {phase === 'review' && (
                <button className="is-btn is-btn-ghost" onClick={() => setPhase('form')}>
                  ← Back
                </button>
              )}
              <button className="is-btn is-btn-ghost" onClick={onClose}>Cancel</button>
              {phase === 'form' && (
                <button className="is-btn is-btn-primary" onClick={handleReview}>
                  Review <ArrowRight size={13}/>
                </button>
              )}
              {phase === 'review' && (
                <button className="is-btn is-btn-primary" onClick={handleSubmit} disabled={saving}>
                  {saving
                    ? <><span className="is-btn-spin"/> Scheduling…</>
                    : <><Send size={13}/> Confirm & Send</>}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}