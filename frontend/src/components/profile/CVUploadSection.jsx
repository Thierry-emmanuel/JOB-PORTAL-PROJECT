import { useRef, useState } from "react";
import { Upload, FileText, Download, Trash2, CheckCircle, AlertCircle, X } from "lucide-react";

const MAX_SIZE_MB = 5;

export default function CVUploadSection({ cvUrl, cvFileName, onUpload }) {
  const fileRef = useRef();
  const [fileError, setFileError] = useState(null);

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
            <a
              href={cvUrl}
              target="_blank"
              rel="noreferrer"
              className="kora-btn-ghost kora-cv-btn"
              onClick={e => {
                // For base64 data URLs, open in a new tab via Blob to avoid browser blocking
                if (cvUrl && cvUrl.startsWith('data:')) {
                  e.preventDefault();
                  try {
                    const [header, b64] = cvUrl.split(',');
                    const mime = header.match(/:(.*?);/)[1];
                    const bytes = atob(b64);
                    const arr = new Uint8Array(bytes.length);
                    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
                    const blob = new Blob([arr], { type: mime });
                    const url = URL.createObjectURL(blob);
                    const w = window.open(url, '_blank');
                    if (w) setTimeout(() => URL.revokeObjectURL(url), 10000);
                  } catch {}
                }
              }}
            >
              <Download size={14} /> View
            </a>
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
    </section>
  );
}