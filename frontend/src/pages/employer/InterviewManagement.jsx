import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getInterviewsByEmployer, cancelInterview, recordInterviewResult } from '../../api/interviews';
import EmployerSidebar from "../../components/employer/EmployerSidebar";
import { useEmployerDashboard } from "../../hooks/useEmployerDashboard";
import {
  Calendar, Filter, Search, Video, Phone, MapPin,
  Clock, CheckCircle, XCircle, AlertCircle, RefreshCw,
  User, Briefcase, ChevronDown, X, Check, Menu,
} from 'lucide-react';
import "../../styles/dashboard-shell.css";

/* ─── Toast ────────────────────────────────────────────────── */
function Toast({ toasts, remove }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position:'fixed', top:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex', alignItems:'flex-start', gap:10,
          background: t.type === 'error' ? '#FEF2F2' : '#ECFDF5',
          border:`1.5px solid ${t.type === 'error' ? '#FCA5A5' : '#6EE7B7'}`,
          borderRadius:12, padding:'12px 16px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)',
          minWidth:280, maxWidth:380,
        }}>
          {t.type === 'error'
            ? <AlertCircle size={16} color="#DC2626" style={{flexShrink:0, marginTop:1}}/>
            : <CheckCircle size={16} color="#10B981" style={{flexShrink:0, marginTop:1}}/>}
          <div style={{flex:1}}>
            <p style={{fontSize:13, fontWeight:600, color:t.type==='error'?'#991B1B':'#065F46', margin:'0 0 2px'}}>{t.title}</p>
            {t.body && <p style={{fontSize:12, color:'#6B7280', margin:0}}>{t.body}</p>}
          </div>
          <button onClick={() => remove(t.id)} style={{background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', padding:0}}><X size={14}/></button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((title, body='', type='success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, title, body, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, add, remove };
}

/* ─── Confirm Modal ─────────────────────────────────────────── */
function ConfirmModal({ open, title, body, onConfirm, onCancel, danger }) {
  if (!open) return null;
  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:2000 }} onClick={onCancel}/>
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#fff', borderRadius:16, padding:28, width:'min(400px,90vw)', zIndex:2001, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{ width:40, height:40, borderRadius:10, background: danger ? '#FEF2F2' : '#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {danger ? <XCircle size={20} color="#DC2626"/> : <AlertCircle size={20} color="#3B82F6"/>}
          </div>
          <h3 style={{ fontSize:16, fontWeight:700, margin:0, color:'#111827' }}>{title}</h3>
        </div>
        <p style={{ fontSize:14, color:'#6B7280', marginBottom:24, lineHeight:1.6 }}>{body}</p>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onCancel} style={{ background:'#F3F4F6', border:'none', borderRadius:10, padding:'9px 20px', fontSize:14, fontWeight:600, cursor:'pointer', color:'#374151' }}>Cancel</button>
          <button onClick={onConfirm} style={{ background: danger ? '#DC2626' : 'var(--ds-accent)', border:'none', borderRadius:10, padding:'9px 20px', fontSize:14, fontWeight:700, cursor:'pointer', color:'#fff' }}>Confirm</button>
        </div>
      </div>
    </>
  );
}

/* ─── Result Modal ──────────────────────────────────────────── */
function ResultModal({ interview, onSave, onClose }) {
  const [result, setResult]     = useState('PASSED');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(interview.id, { result, feedback });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:2000 }} onClick={onClose}/>
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#fff', borderRadius:16, padding:28, width:'min(440px,90vw)', zIndex:2001, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ fontSize:16, fontWeight:700, margin:0 }}>Record Interview Result</h3>
          <button onClick={onClose} style={{ background:'#F3F4F6', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14}/></button>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:8 }}>Result</label>
          <div style={{ display:'flex', gap:8 }}>
                        {[
              {v:'PASSED', label:'Passed', color:'#10B981', bg:'#ECFDF5', text:'#065F46'},
              {v:'FAILED', label:'Failed', color:'#EF4444', bg:'#FEF2F2', text:'#991B1B'},
            ].map(({v, label, color, bg, text}) => (
              <button key={v} onClick={() => setResult(v)} style={{
                flex:1, padding:'10px', borderRadius:10,
                border:`2px solid ${result === v ? color : '#E5E7EB'}`,
                background: result === v ? bg : '#fff',
                color: result === v ? text : '#6B7280',
                fontSize:14, fontWeight:700, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              }}>
                {v === 'PASSED'
                  ? <Check size={16} style={{display:'inline-block',verticalAlign:'middle'}}/>
                  : <X     size={16} style={{display:'inline-block',verticalAlign:'middle'}}/>}
                {label}
              </button>
            ))}          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:8 }}>Feedback (optional)</label>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
            placeholder="Add interview notes or feedback for the candidate…"
            style={{ width:'100%', minHeight:100, border:'1.5px solid #E5E7EB', borderRadius:10, padding:'10px 14px', fontSize:13, fontFamily:'inherit', resize:'vertical', outline:'none', boxSizing:'border-box', color:'#111827' }}
          />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'#F3F4F6', border:'none', borderRadius:10, padding:'10px 20px', fontSize:14, fontWeight:600, cursor:'pointer', color:'#374151' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ background:'var(--ds-accent)', border:'none', borderRadius:10, padding:'10px 22px', fontSize:14, fontWeight:700, cursor:'pointer', color:'#fff', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Result'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Interview Card ────────────────────────────────────────── */
const TYPE_ICON = { VIDEO: <Video size={16}/>, PHONE: <Phone size={16}/>, IN_PERSON: <MapPin size={16}/> };
const TYPE_COLOR = { VIDEO: { bg:'#EFF6FF', color:'#1E40AF' }, PHONE: { bg:'#ECFDF5', color:'#065F46' }, IN_PERSON: { bg:'#FFF3EA', color:'#92400E' } };

function InterviewCard({ iv, onCancel, onResult }) {
  const isCompleted = iv.completed || iv.result;
  const isPending   = !isCompleted;
  const ivType = iv.type ?? iv.interviewType;
  const tc = TYPE_COLOR[ivType] || { bg:'#F3F4F6', color:'#374151' };
  const scheduledAt = iv.scheduledAt ? new Date(iv.scheduledAt) : null;

  return (
    <div style={{ background:'#fff', border:'1.5px solid #E5E7EB', borderRadius:16, overflow:'hidden', transition:'box-shadow 0.18s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.09)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow=''}
    >
      {/* Card header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ width:40, height:40, borderRadius:10, background: tc.bg, color: tc.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {TYPE_ICON[ivType] || <Calendar size={16}/>}
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:'#111827', margin:'0 0 2px' }}>
              {(ivType || 'Interview').replace('_',' ')} Interview
            </p>
            <p style={{ fontSize:11, color:'#6B7280', margin:0 }}>ID #{iv.id}</p>
          </div>
        </div>
        <span style={{
          fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20,
          background: isCompleted ? '#F3F4F6' : isPending ? '#EFF6FF' : '#F9FAFB',
          color: isCompleted ? '#6B7280' : '#1E40AF',
        }}>
          {isCompleted ? (iv.result || 'Completed') : 'Pending'}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding:'16px 20px' }}>
        <div style={{ display:'grid', gap:10 }}>
          {scheduledAt && (
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
              <Calendar size={14} color="#6B7280"/>
              <span style={{ color:'#374151', fontWeight:600 }}>
                {scheduledAt.toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric' })}
              </span>
              <span style={{ color:'#6B7280' }}>at {scheduledAt.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}</span>
            </div>
          )}
          {iv.durationMinutes && (
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#6B7280' }}>
              <Clock size={14}/>
              <span>{iv.durationMinutes} minutes</span>
            </div>
          )}
          {iv.meetingLink && (
            <a href={iv.meetingLink} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#1E40AF', wordBreak:'break-all', display:'flex', alignItems:'center', gap:6 }}>
              <Video size={12}/> {iv.meetingLink}
            </a>
          )}
          {iv.location && (
            <div style={{ fontSize:13, color:'#374151', display:'flex', gap:6 }}>
              <MapPin size={14} style={{flexShrink:0, marginTop:1}}/> {iv.location}
            </div>
          )}
          {iv.feedback && (
            <div style={{ background:'#F9FAFB', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#374151', lineHeight:1.5 }}>
              <strong style={{ color:'#111827', display:'block', marginBottom:4 }}>Feedback:</strong>
              {iv.feedback}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {isPending && (
        <div style={{ padding:'12px 20px', borderTop:'1px solid #F3F4F6', display:'flex', gap:8 }}>
          <button onClick={() => onCancel(iv)} style={{ flex:1, background:'#FEF2F2', border:'1.5px solid #FECACA', borderRadius:10, padding:'8px', fontSize:13, fontWeight:600, cursor:'pointer', color:'#991B1B', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <XCircle size={13}/> Cancel
          </button>
          <button onClick={() => onResult(iv)} style={{ flex:1, background:'#ECFDF5', border:'1.5px solid #6EE7B7', borderRadius:10, padding:'8px', fontSize:13, fontWeight:600, cursor:'pointer', color:'#065F46', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <Check size={13}/> Record Result
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function InterviewManagement() {
  const { user } = useAuth();
  const { employer, stats, loading } = useEmployerDashboard();
  const { toasts, add: addToast, remove: removeToast } = useToast();

  const [interviews,   setInterviews]   = useState([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [searchQ,      setSearchQ]      = useState('');
  const [filter,       setFilter]       = useState('ALL');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [resultTarget, setResultTarget] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const fetchInterviews = useCallback(async () => {
    if (!user?.id) return;
    setLocalLoading(true);
    try {
      const data = await getInterviewsByEmployer(user.id);
      setInterviews(Array.isArray(data) ? data : []);
    } catch {
      addToast('Load error', 'Could not fetch interviews.', 'error');
    } finally { setLocalLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);

  const handleCancel = async () => {
    try {
      await cancelInterview(cancelTarget.id);
      setInterviews(prev => prev.filter(i => i.id !== cancelTarget.id));
      addToast('Interview cancelled', 'The interview has been cancelled.');
    } catch {
      addToast('Cancel failed', 'Could not cancel this interview.', 'error');
    } finally { setCancelTarget(null); }
  };

  const handleRecordResult = async (id, payload) => {
    try {
      await recordInterviewResult(id, payload);
      setInterviews(prev => prev.map(i => i.id === id ? { ...i, result: payload.result, feedback: payload.feedback, completed: true } : i));
      addToast('Result recorded', `Interview marked as ${payload.result}.`);
    } catch {
      addToast('Save failed', 'Could not save the result.', 'error');
    }
  };

  const filtered = interviews.filter(i => {
    const matchFilter = filter === 'ALL' || (filter === 'PENDING' && !i.completed && !i.result) || (filter === 'COMPLETED' && (i.completed || i.result));
    const matchSearch = !searchQ || JSON.stringify(i).toLowerCase().includes(searchQ.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    ALL:       interviews.length,
    PENDING:   interviews.filter(i => !i.completed && !i.result).length,
    COMPLETED: interviews.filter(i => i.completed || i.result).length,
  };

  return (
    <div className="ds-root employer">
      <Toast toasts={toasts} remove={removeToast} />
      <ConfirmModal open={!!cancelTarget} title="Cancel Interview" body="Are you sure you want to cancel this interview? The candidate will be notified." onConfirm={handleCancel} onCancel={() => setCancelTarget(null)} danger />
      {resultTarget && <ResultModal interview={resultTarget} onSave={handleRecordResult} onClose={() => setResultTarget(null)} />}

      {/* Mobile */}
      {mobileOpen && <div className="ds-mobile-overlay" onClick={() => setMobileOpen(false)} />}

      <div className="ds-body">
        <aside className={`ds-sidebar${mobileOpen ? ' ds-sidebar--mobile-open' : ''}`}>
          <button className="ds-mobile-close" onClick={() => setMobileOpen(false)}><X size={16} /></button>
          <EmployerSidebar employer={employer} loading={loading} stats={stats} />
        </aside>

        <main className="ds-main">
          {/* FAB trigger (mobile) */}
          <button className="ds-mobile-trigger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="ds-page-header">
            <div>
              <h1 className="ds-page-title">Interview Management</h1>
              <p className="ds-page-sub">Track, manage and record results for candidate interviews.</p>
            </div>
            <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={fetchInterviews}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {/* Stats row */}
          <div className="ds-stats-grid">
            {[
              { label:'Total',     value: counts.ALL,       color:'#1A5C2E' },
              { label:'Pending',   value: counts.PENDING,   color:'#F97316' },
              { label:'Completed', value: counts.COMPLETED, color:'#10B981' },
              { label:'Pass Rate', value: interviews.length > 0 ? `${Math.round(interviews.filter(i => i.result === 'PASSED').length / Math.max(counts.COMPLETED,1) * 100)}%` : '—', color:'#3B82F6' },
            ].map(s => (
              <div key={s.label} className="ds-stat-card" style={{'--ds-accent': s.color, '--ds-accent-light': s.color + '15'}}>
                <div className="ds-stat-icon" style={{ background: s.color + '18', color: s.color }}>
                  <Calendar size={20}/>
                </div>
                <div className="ds-stat-body">
                  <p className="ds-stat-value">{s.value}</p>
                  <p className="ds-stat-label">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters + search */}
          <div className="ds-card" style={{ padding:'16px 20px' }}>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              <div className="ds-search" style={{ flex:'2 1 200px' }}>
                <Search size={14} className="ds-search-icon"/>
                <input placeholder="Search interviews…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {['ALL','PENDING','COMPLETED'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className="ds-btn ds-btn-sm"
                    style={{ background: filter === f ? 'var(--ds-accent)' : '#fff', color: filter === f ? '#fff' : '#374151', border:'1.5px solid #E5E7EB' }}>
                    {f} ({counts[f]})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid */}
          {localLoading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
              {[1,2,3].map(i => <div key={i} style={{ height:200, background:'#fff', borderRadius:16, border:'1.5px solid #E5E7EB' }}><div className="ds-skeleton" style={{ margin:20, height:160, borderRadius:10 }}/></div>)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="ds-card">
              <div className="ds-empty">
                <div className="ds-empty-icon"><Calendar size={32}/></div>
                <p className="ds-empty-title">No interviews found</p>
                <p className="ds-empty-sub">{filter !== 'ALL' ? 'Try a different filter.' : 'Scheduled interviews will appear here.'}</p>
              </div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
              {filtered.map(iv => (
                <InterviewCard key={iv.id} iv={iv} onCancel={setCancelTarget} onResult={setResultTarget} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}