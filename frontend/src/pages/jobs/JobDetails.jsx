import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { getJob, getJobDetail, saveJob, getUserApplications } from '../../api/jobs';
import KoraNav from '../../components/KoraNav';
import '../../styles/job-list.css';

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid #F3F4F6' }}>
      <span style={{ fontSize:12, fontWeight:600, color:'#6B7280', minWidth:100, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13, color:'#111827' }}>{value}</span>
    </div>
  );
}

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [searchParams] = useSearchParams();

  const [job,     setJob]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const isViewOnly = searchParams.get('viewOnly') === 'true';

  // Determine if opened from employee dashboard context
  const isEmployee = isAuthenticated && (user?.role || '').toUpperCase().includes('JOB_SEEKER');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // When viewOnly=true (from application history), use the /detail endpoint
        // which returns any non-deleted job regardless of status (ACTIVE/DRAFT/EXPIRED).
        const data = isViewOnly ? await getJobDetail(id) : await getJob(id);
        if (!cancelled) {
          setJob(data);
          setSaved(data.saved ?? false);
          let userApplied = data.applied ?? false;
          if (isAuthenticated && isEmployee && user?.id) {
            try {
              const apps = await getUserApplications(user.id);
              userApplied = apps.some(a => String(a.jobPostingId) === String(data.id));
            } catch (err) {
              console.error("Error checking applications", err);
            }
          }
          setHasApplied(userApplied || isViewOnly);
        }
      } catch {
        if (!cancelled) setError(t('jobs.error_load_job') || 'Failed to load job details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, t, isAuthenticated, isEmployee, user?.id, isViewOnly]);

  const handleSave = async () => {
    setSaving(true);
    try { await saveJob(id, !saved); setSaved(v => !v); }
    catch { /* silently fail */ }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="jd-page">
        {!isEmployee && <KoraNav />}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:16 }}>
          <div style={{ width:36, height:36, border:'3px solid #E5E7EB', borderTopColor:'#1A5C2E', borderRadius:'50%', animation:'jd-spin 0.8s linear infinite' }} />
          <p style={{ fontSize:14, color:'#6B7280' }}>Loading job details…</p>
          <style>{`@keyframes jd-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="jd-page">
        {!isEmployee && <KoraNav />}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:16, padding:24 }}>
          <div style={{ fontSize:48 }}>😕</div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'#111827', margin:0 }}>Job Not Found</h2>
          <p style={{ fontSize:14, color:'#6B7280', textAlign:'center' }}>{error || 'This job posting may have been removed or is no longer available.'}</p>
          <button onClick={() => navigate(-1)} style={{ background:'#1A5C2E', color:'#fff', border:'none', padding:'10px 22px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="jd-page">
      {!isEmployee && <KoraNav />}

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px' }}>
        {/* Back button */}
        <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, background:'#F3F4F6', border:'none', borderRadius:10, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer', color:'#374151', marginBottom:24 }}>
          ← Back
        </button>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:24, alignItems:'start' }}>
          {/* ─── Main content ─── */}
          <div>
            {/* Header card */}
            <div style={{ background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:16, padding:24, marginBottom:20 }}>
              <div style={{ display:'flex', gap:16, alignItems:'flex-start', marginBottom:16 }}>
                <div style={{ width:60, height:60, borderRadius:14, background:'#E8F5EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#1A5C2E', flexShrink:0, border:'1.5px solid rgba(26,92,46,0.13)', overflow:'hidden' }}>
                  {job.logo
                    ? <img src={job.logo} alt={job.company} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : job.company?.charAt(0)}
                </div>
                <div style={{ flex:1 }}>
                  <h1 style={{ fontSize:22, fontWeight:800, color:'#111827', margin:'0 0 4px', lineHeight:1.2 }}>{job.title}</h1>
                  <p style={{ fontSize:15, color:'#1A5C2E', fontWeight:600, margin:0 }}>{job.company}</p>
                </div>
                <button onClick={handleSave} disabled={saving} style={{
                  background: saved ? '#E8F5EE' : '#F3F4F6', color: saved ? '#1A5C2E' : '#6B7280',
                  border: `1.5px solid ${saved ? '#1A5C2E' : '#E5E7EB'}`, borderRadius:10, padding:'8px 16px',
                  fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0,
                }}>
                  {saving ? '…' : saved ? '✓ Saved' : '🔖 Save'}
                </button>
              </div>

            {/* Quick facts */}
            <div className="jd-facts" aria-label={t('jobs.job_details_aria')}>
              {[
                { icon: '📍', val: job.location },
                { icon: '💼', val: job.type },
                job.salary  && { icon: '💰', val: job.salary },
                job.remote  && { icon: '🌐', val: t('jobs.remote_ok') },
                job.applicants != null && { icon: '👥', val: t('jobs.applicants_count', { count: job.applicants }) },
              ]
                .filter(Boolean)
                .map((f) => (
                  <span key={f.val} className="ujc-detail-item">
                    <span aria-hidden="true">{f.icon}</span> {f.val}
                  </span>
                ))}
              </div>

              {/* Skills */}
              {job.tags?.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {job.tags.map(tag => (
                    <span key={tag} style={{ background:'#E8F5EE', color:'#1A5C2E', border:'1px solid rgba(26,92,46,0.2)', borderRadius:6, padding:'4px 10px', fontSize:12, fontWeight:600 }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            {job.description && (
              <div style={{ background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:16, padding:24, marginBottom:20 }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:'#111827', marginBottom:16 }}>Job Description</h2>
                <div style={{ fontSize:14, color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{job.description}</div>
              </div>
            )}

            {/* Company info */}
            <div style={{ background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:16, padding:24 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#111827', marginBottom:12 }}>About {job.company}</h2>
              <DetailRow label="Location" value={job.location} />
              <DetailRow label="Job Type" value={job.type?.replace('_',' ')} />
              <DetailRow label="Salary"   value={job.salary} />
              {job.website && (
                <div style={{ display:'flex', gap:12, padding:'10px 0' }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'#6B7280', minWidth:100 }}>Website</span>
                  <a href={job.website} target="_blank" rel="noreferrer" style={{ fontSize:13, color:'#1A5C2E' }}>{job.website}</a>
                </div>
              )}
            </div>
          </div>

          {/* ─── Sticky apply card ─── */}
          <div style={{ position:'sticky', top:80 }}>
            <div style={{ background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:16, padding:24, boxShadow:'0 4px 20px rgba(0,0,0,0.07)' }}>
              
              {/* If candidate/guest */}
              {(isEmployee || !isAuthenticated) ? (
                <>
                  {hasApplied ? (
                    <div style={{ background:'#ECFDF5', border:'1.5px solid #6EE7B7', borderRadius:10, padding:'12px 16px', textAlign:'center', fontSize:14, fontWeight:700, color:'#065F46', marginBottom:12 }}>
                      ✓ Application submitted
                    </div>
                  ) : (
                    <>
                      <h2 style={{ fontSize:17, fontWeight:700, color:'#111827', marginBottom:8 }}>Ready to Apply?</h2>
                      <p style={{ fontSize:13, color:'#6B7280', marginBottom:20, lineHeight:1.6 }}>
                        {job.applicants != null ? `${job.applicants} people have already applied.` : 'Be among the first to apply!'}
                      </p>
                      <Link to={`/jobs/${id}/apply`} style={{ display:'block', background:'#1A5C2E', color:'#fff', borderRadius:12, padding:'13px', textAlign:'center', fontSize:15, fontWeight:700, textDecoration:'none', marginBottom:10, transition:'transform 0.15s', boxShadow:'0 4px 16px rgba(26,92,46,0.25)' }}
                        onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform=''}
                      >
                        Apply Now →
                      </Link>
                    </>
                  )}

                  {!hasApplied && (
                    <button onClick={handleSave} disabled={saving} style={{
                      width:'100%', background: saved ? '#E8F5EE' : '#F9FAFB',
                      color: saved ? '#1A5C2E' : '#6B7280',
                      border:`1.5px solid ${saved ? '#1A5C2E' : '#E5E7EB'}`,
                      borderRadius:12, padding:12, fontSize:14, fontWeight:700, cursor:'pointer', marginTop:4,
                    }}>
                      {saving ? 'Saving…' : saved ? '✓ Saved for Later' : '🔖 Save for Later'}
                    </button>
                  )}

                  <div style={{ marginTop:16, padding:'12px', background:'#F9FAFB', borderRadius:10 }}>
                    <p style={{ fontSize:11, color:'#6B7280', margin:0, lineHeight:1.6 }}>
                      💡 Tip: Complete your profile to increase your chances of being shortlisted.
                    </p>
                  </div>
                </>
              ) : (
                /* If employer/admin */
                <div style={{ textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
                  <p style={{ margin: '0 0 16px 0', fontWeight: 600 }}>Viewing details as {user?.role?.replace('ROLE_','')?.toLowerCase() || 'user'}</p>
                  <Link to={user?.role?.includes('EMPLOYER') ? '/dashboard/employer' : '/admin/dashboard'} style={{
                    display: 'block', background: '#1A5C2E', color: '#fff', borderRadius: 12, padding: '12px',
                    textDecoration: 'none', fontWeight: 700, fontSize: 14, boxShadow:'0 4px 16px rgba(26,92,46,0.25)'
                  }}>
                    Go to Dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          div[style*="grid-template-columns: 1fr 300px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="position: sticky"] {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}