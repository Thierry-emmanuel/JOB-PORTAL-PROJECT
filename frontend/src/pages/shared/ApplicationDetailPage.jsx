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
import '../../styles/application-detail.css';

const STATUS = {
  APPLIED:             { bg: '#EFF6FF', color: '#1E40AF', dot: '#3B82F6', label: 'Applied',            icon: <FileText size={12}/> },
  SHORTLISTED:         { bg: '#FAF5FF', color: '#6B21A8', dot: '#A855F7', label: 'Shortlisted',        icon: <Star size={12}/> },
  INTERVIEW_SCHEDULED: { bg: '#FFF7ED', color: '#C2410C', dot: '#F97316', label: 'Interview Scheduled', icon: <CalendarClock size={12}/> },
  HIRED:               { bg: '#ECFDF5', color: '#065F46', dot: '#10B981', label: 'Hired <PartyPopper size={16} style={{display:"inline-block",verticalAlign:"middle"}} />',           icon: <CheckCircle2 size={12}/> },
  REJECTED:            { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444', label: 'Not Selected',       icon: <X size={12}/> },
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
  
  // Employer interactive states
  const [reviewNotes, setReviewNotes] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [ivFeedback, setIvFeedback] = useState('');
  const [savingIvFeedback, setSavingIvFeedback] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const role = (user?.role || '').toUpperCase().replace('ROLE_', '');
  const isEmployer = role === 'EMPLOYER';
  const isSeeker = role === 'JOB_SEEKER';

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

      // 2. Fetch Job posting and Seeker Profile in parallel
      const [jobData, profileData] = await Promise.all([
        getJobDetail(appData.jobPostingId).catch(err => {
          console.warn('Failed to load job details', err);
          return null;
        }),
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
      await updateApplicationStatus(app.id, newStatus, app.status);
      setApp(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to update application status.');
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
      alert('Recruiter notes saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save recruiter notes.');
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
      alert('Interview feedback saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save interview feedback.');
    } finally {
      setSavingIvFeedback(false);
    }
  };

  // Handle withdraw application (Seeker)
  const handleWithdraw = async () => {
    if (!app || !user?.id) return;
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return;
    setWithdrawing(true);
    try {
      await withdrawApplication(app.id, user.id);
      alert('Application withdrawn successfully.');
      navigate('/employee/applications');
    } catch (err) {
      console.error(err);
      alert('Failed to withdraw application.');
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

  const s = STATUS[app.status] || DEFAULT_STATUS;
  const iv = app.interview;
  const ivMap = {
    VIDEO:     { icon: <Video size={13}/>,  color: '#1d4ed8', bg: '#eff6ff', label: 'Video Call'   },
    PHONE:     { icon: <Phone size={13}/>,  color: '#065f46', bg: '#ecfdf5', label: 'Phone Call'   },
    IN_PERSON: { icon: <MapPin size={13}/>, color: '#92400e', bg: '#fffbeb', label: 'On-site'      },
  };
  const ivType = iv ? (ivMap[iv.type] || ivMap.VIDEO) : null;
  const displayJobTitle = job?.title || `Job Posting #${app.jobPostingId}`;
  const displayCompanyName = job?.company || app.companyName || 'Corporate Partner';
  const companyLogo = job?.logo || null;

  // Breadcrumbs parent destination
  const backPath = isEmployer ? '/employer/jobs' : '/employee/applications';
  const backLabel = isEmployer ? 'Manage Jobs' : 'My Applications';

  return (
    <div className="app-detail-root">
      <div className="app-detail-container">
        
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
                      <a href={profile.cvUrl} target="_blank" rel="noreferrer" className="app-detail-cv-btn secondary" title="View resume PDF">
                        View
                      </a>
                      <a
                        href={profile.cvUrl.includes('cloudinary.com') ? profile.cvUrl.replace('/upload/', '/upload/fl_attachment/') : profile.cvUrl}
                        download={profile.cvFileName || 'resume.pdf'}
                        className="app-detail-cv-btn"
                        title="Download resume file"
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

                  {app.status === 'SHORTLISTED' && (
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

                  {app.status === 'INTERVIEW_SCHEDULED' && (
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
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                >
                  {withdrawing ? 'Withdrawing...' : 'Withdraw'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
          onScheduled={(newIv) => {
            setShowScheduler(false);
            setApp(prev => ({
              ...prev,
              status: 'INTERVIEW_SCHEDULED',
              interview: newIv
            }));
            setIvFeedback(newIv.feedback || '');
          }}
        />
      )}
    </div>
  );
}