import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowUpRight, Award, BookOpen, Briefcase, Building2, Calendar, CalendarClock, Check, CheckCircle2, ClipboardList, Clock, DollarSign, Download, ExternalLink, FileText, Globe, Mail, MapPin, MessageSquare, PartyPopper, Phone, ShieldAlert, Star, Trash2, User, Users, Video, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getApplication,
  getJobDetail,
  updateApplicationStatus,
  withdrawApplication,
  updateApplicationReview
} from '../../api/jobs';
import { getJobSeekerProfile } from '../../api/profiles';
import { addInterviewFeedback } from '../../api/interviews';
import InterviewScheduler from '../../components/employer/InterviewScheduler';
import { getApplicationDisplayStatus } from '../../utils/applicationStatus';
import '../../styles/application-detail.css';

const STATUS = {
  APPLIED:             { bg: '#EFF6FF', color: '#1E40AF', dot: '#3B82F6', label: 'Applied',            icon: <FileText size={12}/> },
  SHORTLISTED:         { bg: '#FAF5FF', color: '#6B21A8', dot: '#A855F7', label: 'Shortlisted',        icon: <Star size={12}/> },
  INTERVIEW_SCHEDULED: { bg: '#FFF7ED', color: '#C2410C', dot: '#F97316', label: 'Interview Scheduled', icon: <CalendarClock size={12}/> },
  HIRED:               { bg: '#ECFDF5', color: '#065F46', dot: '#10B981', label: 'Hired 🎉',            icon: <CheckCircle2 size={12}/> },
  REJECTED:            { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444', label: 'Not Selected',        icon: <X size={12}/> },
};
const DEFAULT_STATUS = { bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF', label: 'Pending', icon: <Clock size={12}/> };

const fmtSalary = s => !s ? '—' : Number(s).toLocaleString() + ' XAF';
const fmtDate   = d => !d ? '—' : new Date(d).toLocaleDateString('fr-CM', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime   = d => !d ? '' : new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [app, setApp] = useState(null);
  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inline feedback toasts (replaces alert/confirm)
  const [toast, setToast] = useState(null); // { msg, type: 'success'|'error' }
  const [withdrawConfirm, setWithdrawConfirm] = useState(false);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };
  
  // Employer interactive states
  const [reviewNotes, setReviewNotes] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [ivFeedback, setIvFeedback] = useState('');
  const [savingIvFeedback, setSavingIvFeedback] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [viewingPdfBlob, setViewingPdfBlob] = useState(null);

  const role = (user?.role || '').toUpperCase().replace('ROLE_', '');
  const isEmployer = role === 'EMPLOYER';
  const isSeeker = role === 'JOB_SEEKER';
  const hasScheduledInterview = Boolean(app?.interview?.id || app?.hasInterview);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch application details
      const appData = await getApplication(id);
      if (!appData) {
        throw new Error('Application details not found.');
      }
      setApp(appData);
      setReviewNotes(appData.employerReview || '');
      setIvFeedback(appData.interview?.feedback || '');

      // 2. Fetch Job listing and Seeker Profile in parallel.
      //    FIX: only call getJobDetail when jobListingId (a UUID string) is present.
      //    jobPostingId is a numeric Long that identifies a row in the job_postings
      //    table and is NOT a valid path parameter for GET /api/jobs/{uuid}/detail —
      //    passing it produces a 404. For legacy applications where jobListingId was
      //    not yet recorded, we resolve jobData to null and fall back to the title
      //    already embedded in the application response.
      const jobFetch = appData.jobListingId
        ? getJobDetail(appData.jobListingId).catch(err => {
            console.warn('Failed to load job details', err);
            return null;
          })
        : Promise.resolve(null);

      const [jobData, profileData] = await Promise.all([
        jobFetch,
        getJobSeekerProfile(appData.seekerId).catch(err => {
          console.warn('Failed to load candidate profile', err);
          return null;
        })
      ]);

      setJob(jobData);
      setProfile(profileData);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Could not load application details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, loadData]);

  // Handle status transition (Employer)
  const handleStatusChange = async (newStatus) => {
    if (!app) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateApplicationStatus(app.id, newStatus, app.status);
      // Use the server response to keep local state consistent
      const freshStatus = updated?.status ?? updated?.data?.status ?? newStatus;
      setApp(prev => ({ ...prev, status: freshStatus }));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to update application status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle saving evaluation notes (Employer)
  const handleSaveNotes = async () => {
    if (!app) return;
    setSavingReview(true);
    try {
      await updateApplicationReview(app.id, reviewNotes);
      setApp(prev => ({ ...prev, employerReview: reviewNotes }));
      showToast('Recruiter notes saved successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to save recruiter notes.', 'error');
    } finally {
      setSavingReview(false);
    }
  };

  // Handle saving interview feedback (Employer)
  const handleSaveIvFeedback = async () => {
    if (!app?.interview?.id) return;
    setSavingIvFeedback(true);
    try {
      await addInterviewFeedback(app.interview.id, ivFeedback);
      setApp(prev => ({
        ...prev,
        interview: { ...prev.interview, feedback: ivFeedback }
      }));
      showToast('Interview feedback saved successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to save interview feedback.', 'error');
    } finally {
      setSavingIvFeedback(false);
    }
  };

  // Handle withdraw application (Seeker)
  const handleWithdraw = async () => {
    if (!app || !user?.id) return;
    setWithdrawConfirm(false);
    setWithdrawing(true);
    try {
      await withdrawApplication(app.id, user.id);
      showToast('Application withdrawn successfully.');
      setTimeout(() => navigate('/employee/applications'), 1500);
    } catch (err) {
      console.error(err);
      showToast('Failed to withdraw application.', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="app-detail-root">
        <div className="app-detail-loading-box">
          <div className="app-detail-spinner" />
          <span>Loading application details...</span>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="app-detail-root">
        <div className="app-detail-error-card">
          <ShieldAlert size={48} color="#dc2626" />
          <h3>Error Loading Page</h3>
          <p>{error || 'The requested application could not be found or you do not have permission to view it.'}</p>
          <button className="app-detail-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const displayStatus = getApplicationDisplayStatus(app);
  const s = STATUS[displayStatus] || DEFAULT_STATUS;
  const iv = app.interview;
  const ivMap = {
    VIDEO:     { icon: <Video size={13}/>,  color: '#1d4ed8', bg: '#eff6ff', label: 'Video Call'   },
    PHONE:     { icon: <Phone size={13}/>,  color: '#065f46', bg: '#ecfdf5', label: 'Phone Call'   },
    IN_PERSON: { icon: <MapPin size={13}/>, color: '#92400e', bg: '#fffbeb', label: 'On-site'      },
  };
  const ivTypeKey = iv?.type ?? iv?.interviewType;
  const ivType = iv ? (ivMap[ivTypeKey] || ivMap.VIDEO) : null;
  const displayJobTitle = job?.title || `Job Posting #${app.jobPostingId}`;
  const displayCompanyName = job?.company || app.companyName || 'Corporate Partner';
  const companyLogo = job?.logo || null;

  // Breadcrumbs parent destination
  const backPath = isEmployer ? '/employer/jobs' : '/employee/applications';
  const backLabel = isEmployer ? 'Manage Jobs' : 'My Applications';

  return (
    <div className="app-detail-root">
      <div className="app-detail-container">

        {/* Inline toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: 10,
            background: toast.type === 'error' ? '#FEF2F2' : '#ECFDF5',
            border: `1.5px solid ${toast.type === 'error' ? '#FCA5A5' : '#6EE7B7'}`,
            borderRadius: 12, padding: '12px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 280, maxWidth: 400,
          }}>
            {toast.type === 'error'
              ? <AlertCircle size={16} color="#DC2626" style={{flexShrink:0}}/>
              : <CheckCircle2 size={16} color="#10B981" style={{flexShrink:0}}/>}
            <span style={{ fontSize: 13, fontWeight: 600, color: toast.type === 'error' ? '#991B1B' : '#065F46', flex: 1 }}>{toast.msg}</span>
            <button onClick={() => setToast(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',padding:0}}>
              <X size={14}/>
            </button>
          </div>
        )}

        {/* Withdraw confirm dialog */}
        {withdrawConfirm && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Withdraw Application?</h3>
              <p style={{ fontSize: 13.5, color: '#6B7280', margin: '0 0 20px', lineHeight: 1.6 }}>
                This action cannot be undone. Your application for <strong>{job?.title || 'this position'}</strong> will be permanently withdrawn.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setWithdrawConfirm(false)}
                  style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#F9FAFB', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#374151' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#DC2626', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  {withdrawing ? 'Withdrawing…' : 'Yes, Withdraw'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Bar */}
        <div className="app-detail-nav">
          <button className="app-detail-back-btn" onClick={() => navigate(backPath)}>
            <ArrowLeft size={14} /> Back to {backLabel}
          </button>
          
          <div className="app-detail-breadcrumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to={backPath}>{backLabel}</Link>
            <span>/</span>
            <span style={{ fontWeight: 600 }}>Application Details</span>
          </div>

          {/* View Job button — only shown when a valid UUID job listing exists */}
          {app?.jobListingId && (
            <Link
              to={`/jobs/${app.jobListingId}?viewOnly=true`}
              className="app-detail-back-btn"
              style={{ background: 'var(--ds-accent, #1A5C2E)', color: '#fff', border: 'none', marginLeft: 'auto' }}
            >
              <Briefcase size={14} /> View Job
            </Link>
          )}
        </div>

        {/* Header Summary Card */}
        <div className="app-detail-header-card" style={{ '--status-dot': s.dot }}>
          <div className="app-detail-header-left">
            <div className="app-detail-company-logo">
              {companyLogo ? (
                <img src={companyLogo} alt={displayCompanyName} />
              ) : (
                displayCompanyName.charAt(0).toUpperCase()
              )}
            </div>
            
            <div className="app-detail-header-info">
              <h1>{displayJobTitle}</h1>
              <div className="app-detail-company-row">
                <Building2 size={14} />
                <span>{displayCompanyName}</span>
              </div>
              <div className="app-detail-meta-list">
                <div className="app-detail-meta-item">
                  <MapPin size={12} />
                  <span>{job?.location || 'Remote'}</span>
                </div>
                <div className="app-detail-meta-item">
                  <Briefcase size={12} />
                  <span>{job?.type || 'Full-time'}</span>
                </div>
                <div className="app-detail-meta-item">
                  <DollarSign size={12} />
                  <span>{job?.salary || 'Unspecified Salary'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="app-detail-header-right">
            <span className="apps-badge" style={{ background: s.bg, color: s.color, border: `1.5px solid ${s.dot}30` }}>
              <span className="apps-badge-dot" style={{ background: s.dot }}/>
              {s.label}
            </span>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Applied {fmtDate(app.appliedAt)}
            </span>
          </div>
        </div>

        {/* Two-Column Grid Content */}
        <div className="app-detail-grid">
          
          {/* LEFT COLUMN: Application, Company Details, Interview Info */}
          <div className="app-detail-col">
            
            {/* Application Sent Card */}
            <div className="app-detail-card">
              <div className="app-detail-card-header">
                <h3 className="app-detail-card-title">
                  <ClipboardList size={16} />
                  Application Info
                </h3>
              </div>
              
              <div className="app-detail-card-body">
                {app.expectedSalary && (
                  <div className="appd-section">
                    <p className="appd-section-label" style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                      Expected Salary
                    </p>
                    <p className="appd-salary" style={{ fontSize: 20, fontWeight: 800, color: 'var(--ds-accent, #1a5c2e)', margin: 0 }}>
                      {Number(app.expectedSalary).toLocaleString()} XAF
                    </p>
                  </div>
                )}
                
                <div className="appd-section">
                  <p className="appd-section-label" style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Cover Letter
                  </p>
                  {app.coverLetter ? (
                    <div className="app-detail-cover-letter">
                      {app.coverLetter}
                    </div>
                  ) : (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13, margin: 0 }}>
                      No cover letter was submitted.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Company Overview Card */}
            {job && (
              <div className="app-detail-card">
                <div className="app-detail-card-header">
                  <h3 className="app-detail-card-title">
                    <Building2 size={16} />
                    About the Company
                  </h3>
                </div>
                
                <div className="app-detail-card-body">
                  <p className="app-detail-company-desc">
                    {job.description || `No detailed description available for ${displayCompanyName}.`}
                  </p>
                  
                  {job.website && (
                    <div className="app-detail-company-website">
                      <a href={job.website} target="_blank" rel="noreferrer" className="app-detail-back-btn" style={{ padding: '6px 12px', fontSize: 12 }}>
                        <Globe size={12} /> Visit Website <ArrowUpRight size={11} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interview Card */}
            {iv && (
              <div className="app-detail-card">
                <div className="app-detail-card-header">
                  <h3 className="app-detail-card-title">
                    <CalendarClock size={16} />
                    Interview Details
                  </h3>
                </div>
                
                <div className="app-detail-card-body">
                  <div className="app-detail-iv-card" style={{ borderLeft: `4px solid ${ivType?.color}` }}>
                    <span className="app-detail-iv-badge" style={{ background: ivType?.bg, color: ivType?.color }}>
                      {ivType?.icon} {ivType?.label}
                    </span>
                    
                    <div className="app-detail-iv-row">
                      <Calendar size={14} />
                      <span>{fmtDate(iv.scheduledAt)} at {fmtTime(iv.scheduledAt)}</span>
                    </div>
                    
                    {iv.platform && (
                      <div className="app-detail-iv-row">
                        <Building2 size={14} />
                        <span>Platform: {iv.platform}</span>
                      </div>
                    )}
                    
                    {iv.meetingLink && iv.type === 'VIDEO' && (
                      <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="app-detail-iv-join-btn">
                        <Video size={13} /> Join Meeting <ArrowUpRight size={11} />
                      </a>
                    )}

                    {iv.notes && (
                      <div className="app-detail-iv-feedback-box" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                        <p className="app-detail-iv-feedback-title">Recruiter Notes</p>
                        <p className="app-detail-iv-feedback-text">{iv.notes}</p>
                      </div>
                    )}

                    {iv.feedback && (
                      <div className="app-detail-iv-feedback-box">
                        <p className="app-detail-iv-feedback-title">Evaluation Feedback</p>
                        <p className="app-detail-iv-feedback-text">{iv.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Status Banner */}
            {app.status === 'HIRED' && (
              <div className="app-detail-banner hired">
                <Award size={18} />
                <span>Congratulations! The candidate has been hired for this position.</span>
              </div>
            )}

            {app.status === 'REJECTED' && (
              <div className="app-detail-banner rejected">
                <X size={18} />
                <span>This application has been declined.</span>
              </div>
            )}
          </div>
          
          {/* RIGHT COLUMN: Candidate Profile, Resume/CV, Action Forms */}
          <div className="app-detail-col">
            
            {/* Candidate Profile Details */}
            {profile && (
              <div className="app-detail-card">
                <div className="app-detail-card-header">
                  <h3 className="app-detail-card-title">
                    <User size={16} />
                    Candidate Profile
                  </h3>
                </div>
                
                <div className="app-detail-card-body">
                  <div className="app-detail-profile-header">
                    <div className="app-detail-profile-avatar">
                      {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.fullName} />
                      ) : (
                        (profile.fullName || profile.email || '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="app-detail-profile-name">{profile.fullName || 'Candidate'}</h4>
                      <p className="app-detail-profile-title">Job Seeker</p>
                    </div>
                  </div>
                  
                  <div className="app-detail-profile-info-grid">
                    {profile.email && (
                      <div className="app-detail-info-item">
                        <Mail size={13} />
                        <a href={`mailto:${profile.email}`}>{profile.email}</a>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="app-detail-info-item">
                        <Phone size={13} />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile.city && (
                      <div className="app-detail-info-item">
                        <MapPin size={13} />
                        <span>{profile.city}{profile.region ? `, ${profile.region}` : ''}</span>
                      </div>
                    )}
                    
                    {/* Professional Socials */}
                    {(profile.linkedInUrl || profile.portfolioUrl) && (
                      <div className="app-detail-info-item" style={{ gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                        {profile.linkedInUrl && (
                          <a href={profile.linkedInUrl} target="_blank" rel="noreferrer" className="appd-link-badge appd-link-badge--linkedin" style={{ padding: '4px 8px', fontSize: 11.5 }}>
                            <ExternalLink size={10} /> LinkedIn
                          </a>
                        )}
                        {profile.portfolioUrl && (
                          <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="appd-link-badge" style={{ padding: '4px 8px', fontSize: 11.5 }}>
                            <Globe size={10} /> Portfolio
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Bio Summary */}
                  {profile.profileSummary && (
                    <div className="appd-section">
                      <p className="app-detail-textarea-label" style={{ marginBottom: 6 }}>Summary</p>
                      <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                        {profile.profileSummary}
                      </p>
                    </div>
                  )}

                  {/* Skills tags */}
                  {profile.skills?.length > 0 && (
                    <div className="appd-section">
                      <p className="app-detail-textarea-label" style={{ marginBottom: 6 }}>Skills</p>
                      <div className="app-detail-skills-grid">
                        {profile.skills.map((skill, index) => {
                          const skillName = typeof skill === 'object' ? skill.name : skill;
                          return (
                            <span key={index} className="app-detail-skill-tag">
                              {skillName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Experiences timeline */}
                  <div className="appd-section">
                    <p className="app-detail-textarea-label" style={{ marginBottom: 12 }}>Experience</p>
                    {profile.experiences?.length > 0 ? (
                      <div className="app-detail-timeline">
                        {profile.experiences.map((exp, index) => (
                          <div key={index} className="app-detail-timeline-item">
                            <span className="app-detail-timeline-dot" />
                            <h5 className="app-detail-timeline-title">{exp.jobTitle || exp.position}</h5>
                            <p className="app-detail-timeline-company">{exp.companyName || exp.company}</p>
                            {exp.startDate && (
                              <p className="app-detail-timeline-date">
                                {fmtDate(exp.startDate)} – {exp.current ? 'Present' : fmtDate(exp.endDate)}
                              </p>
                            )}
                            {exp.description && (
                              <p className="app-detail-timeline-desc">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="app-detail-timeline-empty">No work experience listed.</p>
                    )}
                  </div>

                  {/* Education timeline */}
                  <div className="appd-section">
                    <p className="app-detail-textarea-label" style={{ marginBottom: 12 }}>Education</p>
                    {profile.education?.length > 0 ? (
                      <div className="app-detail-timeline">
                        {profile.education.map((edu, index) => (
                          <div key={index} className="app-detail-timeline-item">
                            <span className="app-detail-timeline-dot" />
                            <h5 className="app-detail-timeline-title">{edu.degree || edu.fieldOfStudy}</h5>
                            <p className="app-detail-timeline-company">{edu.school || edu.institution}</p>
                            {edu.startDate && (
                              <p className="app-detail-timeline-date">
                                {fmtDate(edu.startDate)} – {edu.current ? 'Present' : fmtDate(edu.endDate)}
                              </p>
                            )}
                            {edu.description && (
                              <p className="app-detail-timeline-desc">{edu.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="app-detail-timeline-empty">No education details listed.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submitted Resume / CV File Attachment */}
            {profile?.cvUrl && (
              <div className="app-detail-card">
                <div className="app-detail-card-header">
                  <h3 className="app-detail-card-title">
                    <FileText size={16} />
                    Documents
                  </h3>
                </div>
                
                <div className="app-detail-card-body">
                  <div className="app-detail-cv-card">
                    <div className="app-detail-cv-info">
                      <FileText size={24} className="app-detail-cv-icon" />
                      <div className="app-detail-cv-text">
                        <p className="app-detail-cv-name">{profile.cvFileName || 'resume.pdf'}</p>
                        <p className="app-detail-cv-lbl">Curriculum Vitae</p>
                      </div>
                    </div>
                    
                    <div className="app-detail-cv-btn-group">
                      <button
                        className="app-detail-cv-btn secondary"
                        title="View resume PDF"
                        onClick={() => {
                          let url = profile.cvUrl;
                          if (profile.cvUrl?.startsWith('data:')) {
                            try {
                              const [header, b64] = profile.cvUrl.split(',');
                              const mime = header.match(/:(.*?);/)[1];
                              const bytes = atob(b64);
                              const arr = new Uint8Array(bytes.length);
                              for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
                              const blob = new Blob([arr], { type: mime });
                              url = URL.createObjectURL(blob);
                              setViewingPdfBlob(url);
                            } catch (err) {
                              console.error(err);
                            }
                          } else {
                            setViewingPdfBlob(url);
                          }
                        }}
                      >
                        View
                      </button>
                      <a
                        href={profile.cvUrl?.includes('cloudinary.com')
                          ? profile.cvUrl.replace('/upload/', '/upload/fl_attachment/')
                          : profile.cvUrl?.startsWith('data:') ? '#' : profile.cvUrl}
                        download={profile.cvFileName || 'resume.pdf'}
                        className="app-detail-cv-btn"
                        title="Download resume file"
                        onClick={e => {
                          if (profile.cvUrl?.startsWith('data:')) {
                            e.preventDefault();
                            try {
                              const [header, b64] = profile.cvUrl.split(',');
                              const mime = header.match(/:(.*?);/)[1];
                              const bytes = atob(b64);
                              const arr = new Uint8Array(bytes.length);
                              for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
                              const blob = new Blob([arr], { type: mime });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url; a.download = profile.cvFileName || 'resume.pdf';
                              a.click();
                              setTimeout(() => URL.revokeObjectURL(url), 5000);
                            } catch {}
                          }
                        }}
                      >
                        <Download size={12} /> Download
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EMPLOYER ACTIONS FORM */}
            {isEmployer && (
              <div className="app-detail-card app-detail-action-card">
                <div className="app-detail-card-header" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <h3 className="app-detail-card-title">
                    <Award size={16} />
                    Application Management
                  </h3>
                </div>
                
                <div className="app-detail-card-body">
                  
                  {/* Status transitions */}
                  {app.status === 'APPLIED' && (
                    <div className="app-detail-textarea-wrapper">
                      <p className="app-detail-textarea-label">Status Actions</p>
                      <div className="app-detail-action-btn-row">
                        <button
                          className="app-detail-status-btn shortlist"
                          onClick={() => handleStatusChange('SHORTLISTED')}
                          disabled={updatingStatus}
                        >
                          <Star size={13} /> Shortlist
                        </button>
                        <button
                          className="app-detail-status-btn reject"
                          onClick={() => handleStatusChange('REJECTED')}
                          disabled={updatingStatus}
                        >
                          <X size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {app.status === 'SHORTLISTED' && !hasScheduledInterview && (
                    <div className="app-detail-textarea-wrapper">
                      <p className="app-detail-textarea-label">Status Actions</p>
                      <div className="app-detail-action-btn-row">
                        <button
                          className="app-detail-status-btn hire"
                          onClick={() => handleStatusChange('HIRED')}
                          disabled={updatingStatus}
                        >
                          <Check size={13} /> Hire Candidate
                        </button>
                        <button
                          className="app-detail-status-btn schedule"
                          onClick={() => setShowScheduler(true)}
                          disabled={updatingStatus}
                        >
                          <CalendarClock size={13} /> Schedule Interview
                        </button>
                        <button
                          className="app-detail-status-btn reject"
                          onClick={() => handleStatusChange('REJECTED')}
                          disabled={updatingStatus}
                        >
                          <X size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {hasScheduledInterview && app.status === 'SHORTLISTED' && (
                    <div className="app-detail-textarea-wrapper">
                      <p className="app-detail-textarea-label">Status Actions</p>
                      <div className="app-detail-action-btn-row">
                        <button
                          className="app-detail-status-btn hire"
                          onClick={() => handleStatusChange('HIRED')}
                          disabled={updatingStatus}
                        >
                          <Check size={13} /> Hire Candidate
                        </button>
                        <button
                          className="app-detail-status-btn schedule"
                          onClick={() => setShowScheduler(true)}
                          disabled={updatingStatus}
                        >
                          <CalendarClock size={13} /> Reschedule Interview
                        </button>
                        <button
                          className="app-detail-status-btn reject"
                          onClick={() => handleStatusChange('REJECTED')}
                          disabled={updatingStatus}
                        >
                          <X size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Manual Status Overrides (Dropdown override) */}
                  {(app.status === 'HIRED' || app.status === 'REJECTED') && (
                    <div className="app-detail-dropdown-wrapper">
                      <label htmlFor="status-override-select">Status Override</label>
                      <select
                        id="status-override-select"
                        className="app-detail-select"
                        value={app.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={updatingStatus}
                      >
                        <option value="HIRED">Hired</option>
                        <option value="REJECTED">Not Selected (Rejected)</option>
                        <option value="APPLIED">Applied</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                      </select>
                    </div>
                  )}

                  {/* Recruiter Review Notes */}
                  <div className="app-detail-textarea-wrapper" style={{ marginTop: 12 }}>
                    <label htmlFor="recruiter-evaluation-notes" className="app-detail-textarea-label">Recruiter Review Notes</label>
                    <textarea
                      id="recruiter-evaluation-notes"
                      className="app-detail-textarea"
                      placeholder="Add notes, evaluations or summary review about this candidate..."
                      value={reviewNotes}
                      onChange={e => setReviewNotes(e.target.value)}
                    />
                    <button
                      className="app-detail-save-btn"
                      onClick={handleSaveNotes}
                      disabled={savingReview}
                    >
                      {savingReview ? 'Saving...' : 'Save Evaluation Notes'}
                    </button>
                  </div>

                  {/* Interview feedback section (employer facing) */}
                  {app.interview && (
                    <div className="app-detail-textarea-wrapper" style={{ marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 18 }}>
                      <label htmlFor="interview-feedback-textarea" className="app-detail-textarea-label">Post-Interview Evaluation Feedback</label>
                      <textarea
                        id="interview-feedback-textarea"
                        className="app-detail-textarea"
                        placeholder="Record evaluation and comments from the interview..."
                        value={ivFeedback}
                        onChange={e => setIvFeedback(e.target.value)}
                      />
                      <button
                        className="app-detail-save-btn"
                        onClick={handleSaveIvFeedback}
                        disabled={savingIvFeedback}
                      >
                        {savingIvFeedback ? 'Saving...' : 'Save Feedback'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SEEKER WITHDRAW CARD */}
            {isSeeker && (app.status === 'APPLIED' || app.status === 'SHORTLISTED') && (
              <div className="app-detail-withdraw-card">
                <div className="app-detail-withdraw-info">
                  <h4>Withdraw Application</h4>
                  <p>No longer interested in this position? You can retract your application.</p>
                </div>
                <button
                  className="app-detail-withdraw-btn"
                  onClick={() => setWithdrawConfirm(true)}
                  disabled={withdrawing}
                >
                  {withdrawing ? 'Withdrawing...' : 'Withdraw'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF CV Viewer Overlay */}
      {viewingPdfBlob && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            width: '100%', maxWidth: '900px', height: '90vh', background: '#fff', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1f2937' }}>Viewing CV: {profile.cvFileName || 'resume.pdf'}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <a 
                  href={viewingPdfBlob} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    color: '#fff', background: 'var(--kora-primary, #7c3aed)', textDecoration: 'none',
                    border: 'none', cursor: 'pointer', transition: 'opacity 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseOut={e => e.currentTarget.style.opacity = '1'}
                >
                  <ExternalLink size={14} /> Open in New Tab
                </a>
                <button 
                  onClick={() => {
                    if (viewingPdfBlob.startsWith('blob:')) {
                      URL.revokeObjectURL(viewingPdfBlob);
                    }
                    setViewingPdfBlob(null);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, display: 'flex' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, background: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
              <iframe 
                src={viewingPdfBlob} 
                style={{ width: '100%', height: '100%', border: 'none', flex: 1 }} 
                title="CV PDF Viewer" 
              />
              <div style={{ padding: 12, background: '#fff', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: 13, color: '#4b5563' }}>
                <span>PDF not loading? </span>
                <a href={viewingPdfBlob} target="_blank" rel="noreferrer" style={{ color: 'var(--kora-primary, #7c3aed)', fontWeight: 600, textDecoration: 'underline' }}>
                  Click here to open it directly in a new tab
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduler modal overlay */}
      {showScheduler && (
        <InterviewScheduler
          application={{
            id: app.id,
            applicant: profile?.fullName || app.applicantName || `Candidate #${app.seekerId}`,
            job: job?.title || displayJobTitle,
          }}
          existingInterview={app.interview}
          onClose={() => setShowScheduler(false)}
          onScheduled={async (newIv) => {
            setShowScheduler(false);
            // Re-fetch to get the authoritative status (backend sets INTERVIEW_SCHEDULED)
            try {
              const fresh = await getApplication(id);
              if (fresh) {
                setApp(fresh);
                setIvFeedback(fresh.interview?.feedback || '');
                return;
              }
            } catch (_) {}
            // Fallback: optimistic update
            setApp(prev => ({
              ...prev,
              hasInterview: true,
              interview: newIv,
            }));
            setIvFeedback(newIv?.feedback || '');
            loadData();
          }}
        />
      )}
    </div>
  );
}