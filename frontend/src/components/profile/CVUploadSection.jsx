import { useRef, useState } from "react";
import { Upload, FileText, Download, Trash2, CheckCircle, AlertCircle, X } from "lucide-react";

const MAX_SIZE_MB = 5;

export default function CVUploadSection({ cvUrl, cvFileName, onUpload }) {
  const fileRef = useRef();
  const [fileError, setFileError] = useState(null);
  const [viewingPdfBlob, setViewingPdfBlob] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    setFileError(null);
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx"].includes(ext)) {
      setFileError("Only PDF or DOCX files are accepted.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`File size must be under ${MAX_SIZE_MB} MB.`);
      return;
    }
    onUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <section className="kora-section">
      {fileError && (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#FEF2F2", border:"1.5px solid #FCA5A5", borderRadius:10, padding:"10px 14px", marginBottom:12 }}>
          <AlertCircle size={14} color="#DC2626" style={{flexShrink:0}}/>
          <span style={{ fontSize:13, color:"#991B1B", flex:1 }}>{fileError}</span>
          <button onClick={() => setFileError(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", padding:0 }}><X size={13}/></button>
        </div>
      )}
      <div className="kora-section-header">
        <div className="kora-section-title">
          <FileText size={18} />
          <h2>Curriculum Vitae</h2>
        </div>
      </div>

      {cvUrl ? (
        <div className="kora-cv-uploaded">
          <div className="kora-cv-icon">
            <FileText size={28} />
          </div>
          <div className="kora-cv-info">
            <div className="kora-cv-name-row">
              <CheckCircle size={16} className="kora-cv-check" />
              <p className="kora-cv-filename">{cvFileName || "curriculum_vitae.pdf"}</p>
            </div>
            <p className="kora-cv-hint">Your CV is uploaded and visible to employers</p>
          </div>
          <div className="kora-cv-actions">
            <button
              className="kora-btn-ghost kora-cv-btn"
              onClick={() => {
                let url = cvUrl;
                if (cvUrl && cvUrl.startsWith('data:')) {
                  try {
                    const [header, b64] = cvUrl.split(',');
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
              <Download size={14} /> View
            </button>
            <button className="kora-btn-ghost kora-cv-btn kora-cv-btn-replace" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Replace
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={(e) => handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div
          className="kora-cv-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={32} className="kora-cv-upload-icon" />
          <p className="kora-cv-drop-title">Drag & drop your CV here</p>
          <p className="kora-cv-drop-hint">PDF or DOCX • Max {MAX_SIZE_MB} MB</p>
          <button className="kora-btn-primary kora-cv-browse-btn">Browse File</button>
          <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={(e) => handleFile(e.target.files[0])} />
        </div>
      )}

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
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1f2937' }}>Viewing CV: {cvFileName || 'resume.pdf'}</h3>
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
    </section>
  );
}