import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Kora_Logo from './assets/absolute-size-logo.png'
import { useAuth } from "./context/AuthContext";
import { useTranslation } from "react-i18next";
import { getJobs, getCategories, getCompanies } from "./api/jobs";
import { getSalaryByCategory, getDemandTrends } from "./api/insights";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

/* ─── DESIGN TOKENS ─────────────────────────────────────────── */
const G    = "#1A5C2E";
const G2   = "#0D3D1F";
const G_L  = "#E8F5EE";
const O    = "#F97316";
const O_L  = "#FFF3EA";
const INK  = "#111827";
const MUTED= "#6B7280";
const BORDER="#E5E7EB";

/* ─── DATA ──────────────────────────────────────────────────── */
const SLIDES_MOCK = [
  { eyebrow:"POSTE VEDETTE",       title:"Senior Frontend\nDeveloper",  company:"Orange Digital Centre", location:"Douala · Remote OK",  salary:"2.5M – 4M FCFA/mo", match:94, tag:"TECH",    tagColor:"#3B82F6" },
  { eyebrow:"OPPORTUNITÉ FINANCE", title:"Product Manager\nFintech",    company:"Afriland First Bank",   location:"Yaoundé · CDI",       salary:"3M – 5M FCFA/mo",   match:88, tag:"FINANCE", tagColor:"#1D4ED8" },
  { eyebrow:"RÔLE CRÉATIF",        title:"Lead UX\nDesigner",           company:"CamTech Solutions",     location:"Remote · Contract",   salary:"1.8M – 3M FCFA/mo", match:81, tag:"DESIGN",  tagColor:"#7C3AED" },
];

const JOBS_MOCK = [
  { id:1, title:"Senior Frontend Developer", company:"Orange Digital Centre", location:"Douala",   type:"Full-time", salary:"2.5M – 4M FCFA/mo",   posted:0, logo:"OD", match:94, tags:["React","TypeScript"], remote:true,  applicants:12 },
  { id:2, title:"Product Manager",           company:"Afriland First Bank",   location:"Yaoundé",  type:"Full-time", salary:"3M – 5M FCFA/mo",     posted:1, logo:"AF", match:88, tags:["Fintech","Agile"],    remote:false, applicants:34 },
  { id:3, title:"Data Scientist",            company:"CamTech Solutions",     location:"Remote",   type:"Contract",  salary:"1.8M – 3M FCFA/mo",   posted:3, logo:"CT", match:81, tags:["Python","ML"],        remote:true,  applicants:7  },
  { id:4, title:"DevOps Engineer",           company:"MTN Cameroon",          location:"Douala",   type:"Full-time", salary:"2.2M – 3.8M FCFA/mo", posted:0, logo:"MT", match:76, tags:["AWS","Docker"],       remote:false, applicants:19 },
  { id:5, title:"Responsable Marketing",     company:"Jumia Cameroun",        location:"Douala",   type:"Full-time", salary:"1.5M – 2.5M FCFA/mo", posted:2, logo:"JM", match:71, tags:["SEO","Brand"],        remote:false, applicants:28 },
  { id:6, title:"Analyste Financier",        company:"UBA Bank",              location:"Yaoundé",  type:"Full-time", salary:"2M – 3.5M FCFA/mo",   posted:1, logo:"UB", match:79, tags:["Excel","Finance"],    remote:false, applicants:22 },
];

const CATEGORIES_MOCK = [
  { name:"Technologie", count:342, trend:"+12%", icon:"💻" },
  { name:"Finance",     count:218, trend:"+8%",  icon:"📊" },
  { name:"Ingénierie",  count:289, trend:"+6%",  icon:"⚙️" },
  { name:"Design",      count:88,  trend:"+31%", icon:"🎨" },
  { name:"Marketing",   count:156, trend:"+15%", icon:"📣" },
  { name:"Santé",       count:124, trend:"+22%", icon:"🏥" },
  { name:"Commercial",  count:201, trend:"+19%", icon:"🤝" },
  { name:"Éducation",   count:97,  trend:"+5%",  icon:"📚" },
];

const COMPANIES_MOCK = [
  { name:"MTN Cameroon",  abbr:"MTN", roles:23, hot:true  },
  { name:"Orange CM",     abbr:"ORG", roles:18, hot:true  },
  { name:"Afriland Bank", abbr:"AFL", roles:15, hot:false },
  { name:"Jumia",         abbr:"JMI", roles:31, hot:true  },
  { name:"Expresso",      abbr:"EXP", roles:9,  hot:false },
  { name:"CamTel",        abbr:"CTL", roles:12, hot:false },
  { name:"Dangote",       abbr:"DNG", roles:44, hot:true  },
  { name:"UBA Bank",      abbr:"UBA", roles:17, hot:true  },
  { name:"CamTech",       abbr:"CMT", roles:8,  hot:false },
];

const TICKER_FEED = [
  { type:"company", msg:"Orange CM : 8 nouveaux postes en ingénierie" },
  { type:"user",    msg:"Emmanuel K. accepté chez MTN · Douala" },
  { type:"company", msg:"Afriland recrute sur 15 postes" },
  { type:"user",    msg:"Beatrice N. postule chez Expresso" },
  { type:"company", msg:"Dangote : 44 postes ouverts dès aujourd'hui" },
  { type:"user",    msg:"Martin A. — Senior DevOps Engineer" },
  { type:"company", msg:"MTN Cameroon : ouverture de 23 postes tech" },
  { type:"user",    msg:"Claudine T. — 94% de compatibilité" },
  { type:"company", msg:"Jumia Cameroun : 31 offres publiées ce mois" },
  { type:"company", msg:"UBA Bank : recrutement de 17 talents · Yaoundé" },
  { type:"user",    msg:"Patrick M. postule chez CamTech Solutions" },
  { type:"company", msg:"CamTel : nouvelles opportunités en ingénierie réseau" },
];

/* ─── HELPERS ───────────────────────────────────────────────── */
function freshnessLabel(d) {
  if (d === 0) return { label:"Aujourd'hui", color:"#22C55E" };
  if (d === 1) return { label:"Hier",        color:"#84CC16" };
  return { label:`Il y a ${d}j`, color: d > 5 ? "#EF4444" : "#F59E0B" };
}

/* ─── KORA SVG LOGO ─────────────────────────────────────────── */
function KoraLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <path d="M18 12 L18 68" stroke={G} strokeWidth="10" strokeLinecap="round"/>
      <path d="M18 42 L50 12" stroke={G} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 42 L50 68" stroke={G} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 58 L58 16" stroke={O} strokeWidth="9" strokeLinecap="round"/>
      <path d="M58 16 L58 30" stroke={O} strokeWidth="9" strokeLinecap="round"/>
      <path d="M58 16 L44 16" stroke={O} strokeWidth="9" strokeLinecap="round"/>
      <circle cx="62" cy="10" r="5" fill={O}/>
    </svg>
  );
}

/* ─── REVEAL HOOK ───────────────────────────────────────────── */
function useReveal(delay = 0) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, { opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(22px)", transition: `opacity 0.65s ${delay}ms cubic-bezier(0.16,1,0.3,1), transform 0.65s ${delay}ms cubic-bezier(0.16,1,0.3,1)` }];
}

/* ─── JOBS OVERLAY ─────────────────────────────────────────── */
function JobsOverlay({ onClose }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [jobs, setJobs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch]       = useState("");
  const [location, setLocation]   = useState("");
  const [jobType, setJobType]     = useState("");

  const fetchJobs = useCallback((p = 1, s = search, l = location, ty = jobType) => {
    setLoading(true);
    getJobs({ page: p, size: 9, search: s || undefined, location: l || undefined, type: ty || undefined })
      .then(res => { setJobs(res.data || []); setTotal(res.total || 0); setTotalPages(res.totalPages || 1); setPage(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchJobs(1); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchJobs(1, search, location, jobType); };

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)", display:"flex", flexDirection:"column" }}>
      <div style={{ background:"#fff", width:"100%", height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ background:G, padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <h2 style={{ color:"#fff", fontWeight:800, fontSize:20, margin:0 }}>Jobs Picked For You</h2>
            <p style={{ color:"rgba(255,255,255,0.75)", fontSize:13, margin:0 }}>{total.toLocaleString()} opportunities available</p>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.18)", border:"1.5px solid rgba(255,255,255,0.35)", color:"#fff", borderRadius:10, padding:"8px 18px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8 }}>
            ← Back to Home
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ padding:"14px 24px", background:"#F9FAFB", borderBottom:`1px solid ${BORDER}`, display:"flex", gap:10, flexWrap:"wrap", flexShrink:0 }}>
          <input style={{ flex:"2 1 200px", border:`1.5px solid ${BORDER}`, borderRadius:10, padding:"10px 14px", fontSize:14, fontFamily:"inherit", outline:"none", color:INK }} placeholder="Job title, keywords…" value={search} onChange={e => setSearch(e.target.value)} />
          <input style={{ flex:"1 1 160px", border:`1.5px solid ${BORDER}`, borderRadius:10, padding:"10px 14px", fontSize:14, fontFamily:"inherit", outline:"none", color:INK }} placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
          <select style={{ flex:"1 1 140px", border:`1.5px solid ${BORDER}`, borderRadius:10, padding:"10px 14px", fontSize:14, fontFamily:"inherit", outline:"none", color:INK, background:"#fff" }} value={jobType} onChange={e => setJobType(e.target.value)}>
            <option value="">All Types</option>
            {["FULL_TIME","PART_TIME","CONTRACT","INTERNSHIP","FREELANCE"].map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
          </select>
          <button type="submit" style={{ background:G, color:"#fff", border:"none", borderRadius:10, padding:"10px 22px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>Search</button>
        </form>

        {/* Results */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:"80px 0" }}>
              <div style={{ width:32, height:32, border:"3px solid #E5E7EB", borderTopColor:G, borderRadius:"50%", animation:"ovr-spin 0.8s linear infinite" }} />
            </div>
          ) : jobs.length === 0 ? (
            <div style={{ textAlign:"center", padding:"80px 0", color:MUTED }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
              <p style={{ fontWeight:700, fontSize:16, color:INK }}>No jobs found</p>
              <p style={{ fontSize:14 }}>Try adjusting your search filters.</p>
            </div>
          ) : (
            <div className="kora-jobs-grid">
              {jobs.map(job => <OverlayJobCard key={job.id} job={job} navigate={navigate} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:24 }}>
              {page > 1 && <button onClick={() => fetchJobs(page-1)} style={{ border:`1.5px solid ${BORDER}`, background:"#fff", borderRadius:10, padding:"8px 18px", fontSize:14, fontWeight:600, cursor:"pointer", color:INK }}>← Prev</button>}
              <span style={{ display:"flex", alignItems:"center", fontSize:13, color:MUTED, padding:"0 12px" }}>Page {page} of {totalPages}</span>
              {page < totalPages && <button onClick={() => fetchJobs(page+1)} style={{ border:`1.5px solid ${BORDER}`, background:"#fff", borderRadius:10, padding:"8px 18px", fontSize:14, fontWeight:600, cursor:"pointer", color:INK }}>Next →</button>}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes ovr-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function OverlayJobCard({ job, navigate }) {
  const posted = job.postedAt ? Math.floor((Date.now() - new Date(job.postedAt).getTime()) / 86400000) : 0;
  const fresh = freshnessLabel(Math.max(0, posted));
  return (
    <div onClick={() => navigate(`/jobs/${job.id}`)} style={{ background:"#fff", border:`1.5px solid ${BORDER}`, borderRadius:16, padding:"20px", cursor:"pointer", transition:"all 0.2s", display:"flex", flexDirection:"column", gap:10 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=G; e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(26,92,46,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ width:44, height:44, borderRadius:12, background:G_L, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15, color:G, border:`1.5px solid rgba(26,92,46,0.13)` }}>
          {job.company?.charAt(0) || "K"}
        </div>
        <span style={{ fontSize:11, fontWeight:600, color:fresh.color, background:fresh.color+"18", padding:"3px 8px", borderRadius:20 }}>● {fresh.label}</span>
      </div>
      <div>
        <h3 style={{ fontSize:15, fontWeight:700, color:INK, margin:"0 0 3px", lineHeight:1.3 }}>{job.title}</h3>
        <p style={{ fontSize:13, color:MUTED, margin:0 }}>{job.company}</p>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, fontSize:12, color:MUTED }}>
        {job.location && <span>📍 {job.location}</span>}
        {job.salary   && <span>💰 {job.salary}</span>}
        {job.type     && <span style={{ background:G_L, color:G, padding:"2px 8px", borderRadius:6, fontWeight:600, fontSize:11 }}>{job.type}</span>}
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <span style={{ fontSize:13, fontWeight:700, color:G }}>Apply now →</span>
      </div>
    </div>
  );
}

/* ─── NAVBAR ────────────────────────────────────────────────── */
function Navbar({ onShowJobs }) {
  const { isAuthenticated, user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [scrolled, setScrolled]     = useState(false);
  const [activeNav, setActiveNav]   = useState("Offres");
  const [menuOpen, setMenuOpen]     = useState(false);

  const lsToken = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const effectivelyAuth = isAuthenticated || !!lsToken;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Only show sections that exist as home page sections
  const navLinks = [
    { label: t('nav.jobs'),       key: "Offres",      scrollId: "jobs-section"       },
    { label: t('nav.companies'),  key: "Entreprises",  scrollId: "companies-section"  },
    { label: "Insights",          key: "Insights",     scrollId: "insights-section"   },
    { label: t('nav.recruiters'), key: "Recruteurs",   scrollId: "cta-section"        },
  ];

  const getDashboardPath = () => {
    const role = user?.role || user?.type || "";
    if (role.includes("EMPLOYER")) return "/dashboard/employer";
    if (role.includes("ADMIN")) return "/profile/admin";
    return "/employee/dashboard";
  };

  const handleNavClick = (link) => {
    setActiveNav(link.key);
    const el = document.getElementById(link.scrollId);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav style={{
      position:"sticky", top:0, zIndex:200, background:"#fff",
      borderBottom: scrolled ? `1px solid ${BORDER}` : "1px solid transparent",
      boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.07)" : "none",
      transition:"box-shadow 0.3s, border-color 0.3s",
    }}>
      <div style={{
        maxWidth:1300, margin:"0 auto",
        display:"flex", alignItems:"center",
        height:64,
        padding:"0 16px",
        gap:16,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display:"flex", alignItems:"center", flexShrink:0, textDecoration: "none" }}>
          <div style={{ width:70, height:50, borderRadius:8, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <img src={Kora_Logo} alt="Logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:G, letterSpacing:"-0.3px", lineHeight:1 }}>KORA</div>
            <div style={{ fontSize:8, color:O, fontWeight:600, letterSpacing:"1.5px" }}>UNLOCK YOUR CAREER</div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="kora-desktop-nav" style={{ flex:1, alignItems:"center", justifyContent:"center", gap:4 }}>
          {navLinks.map(link => (
            <button key={link.key} onClick={() => handleNavClick(link)} style={{
              background:"none", border:"none", padding:"8px 14px",
              fontSize:14, fontWeight: activeNav === link.key ? 700 : 500,
              color: activeNav === link.key ? G : MUTED,
              borderRadius:8, cursor:"pointer", fontFamily:"inherit",
              transition:"color 0.2s, background 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.background=G_L}
              onMouseLeave={e => e.currentTarget.style.background="none"}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="kora-desktop-nav" style={{ alignItems:"center", gap:8, flexShrink:0 }}>
          <button onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
            style={{ background:"none", border:`1px solid ${BORDER}`, borderRadius:8, padding:"5px 10px", fontSize:12, fontWeight:600, cursor:"pointer", color:MUTED, fontFamily:"inherit" }}
          >
            {i18n.language === 'fr' ? 'EN' : 'FR'}
          </button>
          {effectivelyAuth ? (
            <>
              <button onClick={() => navigate(getDashboardPath())} style={{ background:G_L, color:G, border:"none", padding:"8px 16px", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                Dashboard
              </button>
              <button onClick={() => { logout(); navigate("/"); }} style={{ background:"none", border:`1px solid ${BORDER}`, color:MUTED, padding:"8px 14px", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/login")} style={{ background:"none", border:`1px solid ${BORDER}`, color:G, padding:"8px 16px", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                {t('nav.sign_in')}
              </button>
              <button onClick={() => navigate("/register")} style={{ background:G, color:"#fff", border:"none", padding:"8px 18px", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                {t('nav.get_started')}
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="kora-mobile-nav" onClick={() => setMenuOpen(v => !v)} style={{ background:"none", border:"none", cursor:"pointer", color:INK, marginLeft:"auto" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {menuOpen ? <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></> : <><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></>}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="kora-mobile-nav" style={{ position:"absolute", top:64, left:0, right:0, background:"#fff", borderTop:`1px solid ${BORDER}`, boxShadow:"0 10px 32px rgba(0,0,0,0.12)", zIndex:300, flexDirection:"column", padding:"12px 0" }}>
          {navLinks.map(link => (
            <button key={link.key} onClick={() => { handleNavClick(link); setMenuOpen(false); }} style={{
              background:"none", border:"none", padding:"13px 24px",
              fontSize:15, fontWeight:600, color:INK, textAlign:"left",
              cursor:"pointer", fontFamily:"inherit", display:"block", width:"100%",
            }}>
              {link.label}
            </button>
          ))}
          <div style={{ padding:"12px 24px 8px", borderTop:`1px solid ${BORDER}`, marginTop:4, display:"flex", gap:8, flexWrap:"wrap" }}>
            {effectivelyAuth ? (
              <button onClick={() => { navigate(getDashboardPath()); setMenuOpen(false); }} style={{ background:G, color:"#fff", border:"none", padding:"10px 20px", borderRadius:9, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => { navigate("/login"); setMenuOpen(false); }} style={{ background:G_L, color:G, border:"none", padding:"10px 20px", borderRadius:9, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Sign In</button>
                <button onClick={() => { navigate("/register"); setMenuOpen(false); }} style={{ background:G, color:"#fff", border:"none", padding:"10px 20px", borderRadius:9, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Get Started</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── TICKER ────────────────────────────────────────────────── */
function Ticker() {
  const companyTicks = TICKER_FEED.filter(t => t.type === "company");
  const items = [...companyTicks, ...companyTicks];
  return (
    <div style={{ background:G, overflow:"hidden", padding:"10px 0", borderBottom:"none" }}>
      <div style={{ display:"flex", animation:"ticker 28s linear infinite", whiteSpace:"nowrap", gap:0 }}>
        {items.map((item, i) => (
          <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"0 28px", fontSize:13, color:"rgba(255,255,255,0.88)", fontWeight:500 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:O, flexShrink:0 }}/>
            {item.msg}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── SEARCH SECTION ────────────────────────────────────────── */
function SearchSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  return (
    <section style={{ background:"#fff", padding:"clamp(32px,5vw,56px) clamp(16px,4vw,48px)", textAlign:"center" }}>
      <div style={{ maxWidth:760, margin:"0 auto" }}>
        <h2 style={{ fontSize:"clamp(22px,4vw,32px)", fontWeight:800, color:INK, marginBottom:8, letterSpacing:"-0.5px" }}>
          {t('search.title')}
        </h2>
        <p style={{ fontSize:14, color:MUTED, marginBottom:24, fontWeight:300 }}>{t('search.subtitle')}</p>
        <div style={{ display:"flex", gap:8, background:"#fff", border:`2px solid ${BORDER}`, borderRadius:14, padding:6, boxShadow:"0 4px 20px rgba(0,0,0,0.07)", flexWrap:"wrap" }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('search.placeholder_job')}
            style={{ flex:"2 1 160px", border:"none", background:"none", fontSize:15, color:INK, padding:"10px 14px", fontFamily:"inherit", outline:"none", minWidth:0 }} />
          <div style={{ width:1, background:BORDER, margin:"6px 0", flexShrink:0 }} />
          <input value={loc} onChange={e => setLoc(e.target.value)} placeholder={t('search.placeholder_location')}
            style={{ flex:"1 1 120px", border:"none", background:"none", fontSize:15, color:INK, padding:"10px 14px", fontFamily:"inherit", outline:"none", minWidth:0 }} />
          <button onClick={() => navigate(`/jobs${q || loc ? `?search=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}` : ''}`)}
            style={{ background:G, color:"#fff", border:"none", padding:"12px 24px", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}
          >
            {t('search.cta')} →
          </button>
        </div>
        <div style={{ marginTop:14, display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
          {["React","Finance","DevOps","Marketing","Python","Design"].map(tag => (
            <button key={tag} onClick={() => navigate(`/jobs?search=${tag}`)}
              style={{ background:G_L, color:G, border:"none", padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
            >{tag}</button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── STATS BAND ─────────────────────────────────────────────── */
function StatsBand() {
  const { t } = useTranslation();
  const [ref, style] = useReveal(0);
  return (
    <section style={{ background:G, padding:"clamp(28px,5vw,44px) clamp(16px,4vw,48px)" }}>
      <div ref={ref} style={{ ...style, maxWidth:1300, margin:"0 auto" }}>
        <div className="kora-stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:0 }}>
          {[
            { val:"12 000+", label:t('stats.active_jobs')    },
            { val:"3 200+",  label:t('stats.companies')      },
            { val:"50 000+", label:t('stats.job_seekers')    },
            { val:"94%",     label:t('stats.satisfaction')   },
          ].map((s, i, arr) => (
            <div key={s.val} style={{
              textAlign:"center", padding:"clamp(18px,3vw,28px)",
              borderRight: i < arr.length-1 ? "1px solid rgba(255,255,255,0.15)" : "none",
              borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.15)" : "none",
            }}>
              <div style={{ fontSize:"clamp(22px,4vw,32px)", fontWeight:800, color:"white", letterSpacing:"-0.5px" }}>{s.val}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", fontWeight:400, marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── HERO ───────────────────────────────────────────────────── */
function Hero({ onShowJobs }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [current, setCurrent] = useState(0);
  const [slides, setSlides]   = useState(SLIDES_MOCK);

  useEffect(() => {
    getJobs({ page: 1, limit: 3 }).then(res => {
      if (res.data && res.data.length >= 3) {
        setSlides(res.data.slice(0,3).map((job, i) => ({
          ...SLIDES_MOCK[i],
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary || SLIDES_MOCK[i].salary,
        })));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  const s = slides[current];
  const posted = 0;
  const fresh = freshnessLabel(posted);
  const handleApplyClick = () => {
    if (!isAuthenticated) navigate("/login");
    else navigate("/employee/jobs");
  };

  const goTo = (idx) => setCurrent((idx + slides.length) % slides.length);

  return (
    <section id="jobs-section" style={{ position:"relative", minHeight:"min(calc(100vh - 64px), 620px)", height:"calc(100vh - 64px)", overflow:"hidden" }}>
      {/* Background gradient */}
      <div style={{ position:"absolute", inset:0, background:`linear-gradient(135deg, ${G2} 0%, ${G} 50%, #2D7A47 100%)` }} />
      <div style={{ position:"absolute", top:-120, right:-80, width:560, height:560, borderRadius:"50%", background:"rgba(249,115,22,0.07)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-80, left:40, width:320, height:320, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />

      <div style={{ position:"relative", zIndex:1, height:"100%", maxWidth:1300, margin:"0 auto", padding:"clamp(32px,6vw,64px) clamp(16px,4vw,48px)", display:"flex", gap:48, alignItems:"center" }}>
        {/* Left */}
        <div style={{ flex:"1 1 420px", color:"#fff" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:24, padding:"6px 14px", marginBottom:20 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#22C55E", animation:"blink 1.3s infinite" }}/>
            <span style={{ fontSize:12, fontWeight:700, letterSpacing:"1.5px" }}>LIVE · {12000}+ OFFRES</span>
          </div>
          <h1 style={{ fontSize:"clamp(28px,5.5vw,56px)", fontWeight:800, lineHeight:1.08, letterSpacing:"-1.5px", marginBottom:20 }}>
            {t('hero.tagline_1')}<br/>
            <span style={{ color:O }}>{t('hero.tagline_2')}</span>
          </h1>
          <p style={{ fontSize:"clamp(13px,2vw,16px)", color:"rgba(255,255,255,0.8)", lineHeight:1.7, fontWeight:300, marginBottom:32, maxWidth:420 }}>
            {t('hero.subtitle')}
          </p>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <button onClick={onShowJobs} style={{ background:O, color:"#fff", border:"none", padding:"14px 28px", borderRadius:12, fontSize:"clamp(13px,2vw,15px)", fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 20px rgba(249,115,22,0.4)", transition:"transform 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform=""}
            >
              Jobs picked for you →
            </button>
            <button onClick={() => navigate(isAuthenticated ? "/employee/dashboard" : "/register")} style={{ background:"rgba(255,255,255,0.12)", color:"#fff", border:"1.5px solid rgba(255,255,255,0.3)", padding:"14px 24px", borderRadius:12, fontSize:"clamp(13px,2vw,15px)", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              {isAuthenticated ? "My Dashboard" : t('hero.post_job')}
            </button>
          </div>
        </div>

        {/* Right – Job card carousel */}
        <div style={{ flex:"0 0 clamp(300px,38vw,420px)", position:"relative" }} className="kora-hero-card">
          <div style={{ background:"rgba(255,255,255,0.08)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:20, padding:"clamp(20px,3vw,28px)", color:"#fff", position:"relative" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div>
                <span style={{ fontSize:"clamp(9px,2.5vw,11px)", fontWeight:700, letterSpacing:3, color:O }}>{s.eyebrow}</span>
                <h2 style={{ fontSize:"clamp(18px,3.5vw,26px)", fontWeight:800, lineHeight:1.1, marginTop:6, whiteSpace:"pre-line" }}>{s.title}</h2>
              </div>
              <span style={{ background:s.tagColor, color:"#fff", padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0 }}>{s.tag}</span>
            </div>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:4 }}>{s.company}</p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginBottom:16 }}>📍 {s.location}</p>
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              {["Senior","Hybrid","CDI"].map(tag => (
                <span key={tag} style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:600 }}>{tag}</span>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"1px solid rgba(255,255,255,0.15)", paddingTop:14 }}>
              <div>
                <div style={{ fontSize:"clamp(14px,3vw,16px)", fontWeight:800 }}>{s.salary}</div>
                <div style={{ fontSize:11, fontWeight:600, color:fresh.color, marginTop:2 }}>● {fresh.label}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginBottom:2 }}>{t('hero.compatibility')}</div>
                <div style={{ fontSize:20, fontWeight:800, color:O }}>{s.match}%</div>
              </div>
            </div>
            <button onClick={handleApplyClick} style={{ width:"100%", marginTop:14, background:G, color:"white", border:"none", padding:"11px", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              {t('jobs.apply')} →
            </button>
          </div>

          {/* Dots */}
          <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:14 }}>
            {slides.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{ width: i === current ? 24 : 8, height:8, borderRadius:4, background: i === current ? O : "rgba(255,255,255,0.3)", border:"none", cursor:"pointer", padding:0, transition:"width 0.3s, background 0.3s" }} />
            ))}
          </div>
        </div>

        {/* Arrows */}
        {[{ dir:-1, side:"left" },{ dir:1, side:"right" }].map(a => (
          <button key={a.side} onClick={() => goTo(current + a.dir)} className="kora-hero-arrow" style={{
            position:"absolute", top:"50%", [a.side]: 16, transform:"translateY(-50%)",
            width:40, height:40, borderRadius:"50%", background:"rgba(255,255,255,0.12)",
            border:"1px solid rgba(255,255,255,0.25)", color:"#fff", cursor:"pointer", fontSize:18,
            display:"flex", alignItems:"center", justifyContent:"center", zIndex:10,
          }}>
            {a.dir === -1 ? "‹" : "›"}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ─── JOBS SECTION (home) ────────────────────────────────────── */
function JobsSection({ onShowAll }) {
  const { t } = useTranslation();
  const [ref, style] = useReveal(0);
  const [jobs, setJobs] = useState(JOBS_MOCK);

  useEffect(() => {
    getJobs({ page: 1, limit: 6 }).then(res => {
      if (res.data && res.data.length > 0) {
        setJobs(res.data.map(job => ({
          ...job,
          match: Math.floor(Math.random() * 20) + 75,
          applicants: Math.floor(Math.random() * 50) + 1,
          posted: Math.max(0, Math.floor((Date.now() - new Date(job.postedAt).getTime()) / 86400000))
        })));
      }
    }).catch(console.error);
  }, []);

  return (
    <section style={{ background:"#F9FAFB", padding:"clamp(48px,7vw,80px) clamp(16px,4vw,48px)" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div ref={ref} style={{ ...style, display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:36, flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:O, letterSpacing:"2.5px", marginBottom:6 }}>{t('jobs.eyebrow')}</div>
            <h2 style={{ fontSize:"clamp(24px,4vw,34px)", fontWeight:800, color:INK, letterSpacing:"-0.5px" }}>{t('jobs.title')}</h2>
            <p style={{ fontSize:14, color:MUTED, marginTop:4, fontWeight:300 }}>{t('jobs.subtitle')}</p>
          </div>
          <button onClick={onShowAll} style={{ fontSize:14, fontWeight:700, color:G, background:"none", border:`1.5px solid ${G}`, padding:"8px 18px", borderRadius:10, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>
            View all jobs →
          </button>
        </div>
        <div className="kora-jobs-grid">
          {jobs.map((job, i) => <JobCard key={job.id} job={job} delay={[60,140,220,300,380,460][i] || 0} />)}
        </div>
      </div>
    </section>
  );
}

/* ─── JOB CARD ──────────────────────────────────────────────── */
function JobCard({ job, delay }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [ref, style] = useReveal(delay);
  const fresh = freshnessLabel(job.posted ?? 0);
  return (
    <div ref={ref} style={{
      ...style,
      background:"#fff", border:`1.5px solid ${BORDER}`, borderRadius:16, padding:"clamp(18px,3vw,24px)",
      cursor:"pointer", transition:"all 0.22s",
    }}
      onClick={() => navigate(`/jobs/${job.id}`)}
      onMouseEnter={e => { e.currentTarget.style.borderColor=G; e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(26,92,46,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:G_L, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15, color:G, border:`1.5px solid rgba(26,92,46,0.13)`, overflow:"hidden" }}>
          {job.logo ? <img src={job.logo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : (typeof job.logo === 'string' && job.logo.length <= 3 ? job.logo : job.company?.charAt(0) || "K")}
        </div>
        <span style={{ fontSize:11, fontWeight:600, color:fresh.color, background:fresh.color+"18", padding:"3px 8px", borderRadius:20 }}>● {fresh.label}</span>
      </div>
      <h3 style={{ fontSize:"clamp(14px,2.5vw,16px)", fontWeight:700, color:INK, marginBottom:4 }}>{job.title}</h3>
      <p style={{ fontSize:13, color:MUTED, marginBottom:10, fontWeight:300 }}>{job.company}</p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, fontSize:12, color:MUTED, marginBottom:12 }}>
        {job.location && <span>📍 {job.location}</span>}
        {job.type && <span style={{ background:G_L, color:G, padding:"2px 8px", borderRadius:6, fontWeight:600, fontSize:11 }}>{job.type}</span>}
        {job.salary && <span>💰 {job.salary}</span>}
      </div>
      {job.tags && job.tags.length > 0 && (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}>
          {job.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{ background:"#F3F4F6", color:"#374151", padding:"3px 9px", borderRadius:6, fontSize:11, fontWeight:600 }}>{tag}</span>
          ))}
        </div>
      )}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:`1px solid ${BORDER}`, paddingTop:12 }}>
        <span style={{ fontSize:12, color:MUTED }}>{job.applicants || 0} candidats</span>
        {job.match && (
          <span style={{ fontSize:12, fontWeight:700, color:G, background:G_L, padding:"3px 10px", borderRadius:20 }}>
            {job.match}% {t('hero.compatibility')}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── CATEGORIES ────────────────────────────────────────────── */
function CategoriesSection() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [hRef, hStyle] = useReveal(0);
  const [categories, setCategories] = useState(CATEGORIES_MOCK);

  useEffect(() => {
    getCategories().then(data => {
      if (data && data.length > 0) {
        setCategories(data.slice(0, 8).map((cat, i) => ({
          name: cat.name,
          count: Math.floor(Math.random() * 300) + 50,
          trend: `+${Math.floor(Math.random() * 30) + 5}%`,
          icon: cat.iconUrl || CATEGORIES_MOCK[i % CATEGORIES_MOCK.length].icon
        })));
      }
    }).catch(console.error);
  }, []);

  return (
    <section style={{ background:"#fff", padding:"clamp(48px,7vw,80px) clamp(16px,4vw,48px)" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div ref={hRef} style={{ ...hStyle, textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:700, color:O, letterSpacing:"2.5px", marginBottom:6 }}>EXPLORER</div>
          <h2 style={{ fontSize:"clamp(24px,4vw,34px)", fontWeight:800, color:INK, letterSpacing:"-0.5px" }}>Parcourir par Secteur</h2>
          <p style={{ fontSize:14, color:MUTED, marginTop:4, fontWeight:300 }}>Cliquez sur une catégorie pour voir les offres correspondantes</p>
        </div>
        <div className="kora-categories-grid">
          {categories.map((cat, i) => {
            const [ref, style] = useReveal([60,140,220,300,380,460,540,620][i]);
            return (
              <div key={cat.name} ref={ref} style={{
                ...style,
                background:"#fff", border:`1.5px solid ${BORDER}`, borderRadius:14, padding:"clamp(16px,3vw,24px) clamp(14px,2.5vw,20px)",
                cursor:"pointer", transition:"all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
              }}
                onClick={() => navigate(`/jobs?search=${encodeURIComponent(cat.name)}`)}
                onMouseEnter={e => { e.currentTarget.style.borderColor=G; e.currentTarget.style.transform="translateY(-5px)"; e.currentTarget.style.boxShadow="0 10px 28px rgba(26,92,46,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
              >
                <span style={{ fontSize:26, display:"block", marginBottom:10 }}>{cat.icon}</span>
                <div style={{ fontWeight:700, fontSize:"clamp(13px,2.5vw,15px)", color:INK, marginBottom:4 }}>{cat.name}</div>
                <div style={{ fontSize:12, color:MUTED, fontWeight:300 }}>{cat.count} offres</div>
                <div style={{ marginTop:10, borderTop:`1px dashed ${BORDER}`, paddingTop:8, fontSize:11, color:"#22C55E", fontWeight:700 }}>↑ {cat.trend} ce mois</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── COMPANIES ─────────────────────────────────────────────── */
function CompaniesSection() {
  const navigate = useNavigate();
  const [hRef, hStyle] = useReveal(0);
  const [companies, setCompanies] = useState(COMPANIES_MOCK);

  useEffect(() => {
    getCompanies().then(data => {
      const arr = Array.isArray(data) ? data : (data?.content || []);
      if (arr.length > 0) {
        setCompanies(arr.slice(0, 9).map((co, i) => ({
          name: co.name,
          abbr: co.name.substring(0, 3).toUpperCase(),
          logo: co.logoUrl || null,
          roles: Math.floor(Math.random() * 40) + 5,
          hot: i < 4
        })));
      }
    }).catch(console.error);
  }, []);

  return (
    <section id="companies-section" style={{ background:"#F9FAFB", padding:"clamp(48px,7vw,80px) clamp(16px,4vw,48px)" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div ref={hRef} style={{ ...hStyle, textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:700, color:O, letterSpacing:"2.5px", marginBottom:6 }}>RECRUTEURS</div>
          <h2 style={{ fontSize:"clamp(24px,4vw,34px)", fontWeight:800, color:INK, letterSpacing:"-0.5px" }}>Entreprises qui recrutent</h2>
          <p style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, color:MUTED, fontSize:14, fontWeight:300, marginTop:8 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"blink 1.3s infinite" }}/>
            Pulse vert = postes ouverts en ce moment
          </p>
        </div>
        <div className="kora-companies-grid">
          {companies.map((co, i) => {
            const [ref, style] = useReveal([60,140,220,300,380,460,540,620][i]);
            return (
              <div key={co.name} ref={ref} style={{
                ...style,
                background:"#fff", border:`1.5px solid ${BORDER}`, borderRadius:12, padding:"16px 18px",
                cursor:"pointer", display:"flex", alignItems:"center", gap:12, transition:"all 0.2s",
              }}
                onClick={() => navigate(`/jobs?search=${encodeURIComponent(co.name)}`)}
                onMouseEnter={e => { e.currentTarget.style.borderColor=G; e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 20px rgba(26,92,46,0.09)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
              >
                <div style={{ width:44, height:44, borderRadius:10, background:G_L, border:`1.5px solid rgba(26,92,46,0.13)`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative", flexShrink:0 }}>
                  {co.logo ? (
                    <img src={co.logo} alt={`${co.name} logo`} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  ) : (
                    <span style={{ fontWeight:800, fontSize:12, color:G }}>{co.abbr}</span>
                  )}
                  {co.hot && <span style={{ position:"absolute", top:-4, right:-4, width:10, height:10, borderRadius:"50%", background:"#22C55E", border:"2.5px solid white", animation:"blink 1.4s infinite", zIndex:2 }}/>}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:INK, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{co.name}</div>
                  <div style={{ fontSize:12, color:MUTED, fontWeight:300 }}>{co.roles} postes ouverts</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── INSIGHTS SECTION ──────────────────────────────────────── */
function InsightsSection() {
  const [hRef, hStyle] = useReveal(0);
  const [salaries, setSalaries] = useState([]);
  const [trends, setTrends]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getSalaryByCategory(), getDemandTrends()])
      .then(([s, t]) => { setSalaries(s || []); setTrends(t || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="insights-section" style={{ background:"#fff", padding:"clamp(48px,7vw,80px) clamp(16px,4vw,48px)" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div ref={hRef} style={{ ...hStyle, textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:700, color:O, letterSpacing:"2.5px", marginBottom:6 }}>DONNÉES DU MARCHÉ</div>
          <h2 style={{ fontSize:"clamp(24px,4vw,34px)", fontWeight:800, color:INK, letterSpacing:"-0.5px" }}>Insights & Tendances</h2>
          <p style={{ fontSize:14, color:MUTED, marginTop:4, fontWeight:300 }}>Salaires moyens et dynamiques d'emploi en temps réel</p>
        </div>

        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
            <div style={{ width:36, height:36, border:"3px solid #E5E7EB", borderTopColor:G, borderRadius:"50%", animation:"ticker 0.8s linear infinite" }} />
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 480px), 1fr))", gap:28 }}>
            {/* Salary bar chart */}
            <div style={{ background:"#F9FAFB", border:`1.5px solid ${BORDER}`, borderRadius:16, padding:24 }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:INK, marginBottom:20 }}>Salaires moyens par catégorie</h3>
              {salaries.length > 0 ? (
                <div style={{ height:280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salaries} margin={{ top:10, right:10, left:0, bottom:40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="category" angle={-35} textAnchor="end" height={60} tick={{ fontSize:11 }} />
                      <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize:11 }} />
                      <RechartsTooltip formatter={v => `${Number(v).toLocaleString()} XAF`} />
                      <Bar dataKey="avgSalaryMin" name="Min" fill={G} radius={[4,4,0,0]} />
                      <Bar dataKey="avgSalaryMax" name="Max" fill={O} radius={[4,4,0,0]} />
                      <Legend verticalAlign="top" height={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height:200, display:"flex", alignItems:"center", justifyContent:"center", color:MUTED, fontSize:13 }}>Données bientôt disponibles</div>
              )}
            </div>

            {/* Demand trends line chart */}
            <div style={{ background:"#F9FAFB", border:`1.5px solid ${BORDER}`, borderRadius:16, padding:24 }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:INK, marginBottom:20 }}>Tendances des offres d'emploi</h3>
              {trends.length > 0 ? (
                <div style={{ height:280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top:10, right:10, left:0, bottom:10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize:11 }} />
                      <YAxis tick={{ fontSize:11 }} />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="jobCount" name="Offres actives" stroke={O} strokeWidth={3} dot={{ r:5 }} activeDot={{ r:7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height:200, display:"flex", alignItems:"center", justifyContent:"center", color:MUTED, fontSize:13 }}>Données bientôt disponibles</div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── EMPLOYER CTA ──────────────────────────────────────────── */
function CtaSection() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [ref, style] = useReveal(0);

  const handleAction = () => {
    if (!isAuthenticated) navigate("/login");
    else navigate("/employer/post-job");
  };

  return (
    <section id="cta-section" style={{ background:`linear-gradient(135deg, ${O} 0%, #EA580C 100%)`, padding:"clamp(52px,8vw,88px) clamp(16px,4vw,48px)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-80, right:-80, width:400, height:400, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:-100, left:-60, width:320, height:320, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }}/>
      <div ref={ref} style={{ ...style, maxWidth:1300, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr", gap:40, alignItems:"center", position:"relative", zIndex:1 }} className="kora-cta-grid">
        <div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"2.5px", color:"rgba(255,255,255,0.8)", marginBottom:16 }}>POUR LES RECRUTEURS</div>
          <h2 style={{ fontSize:"clamp(28px,5vw,44px)", fontWeight:800, color:"white", letterSpacing:"-1px", lineHeight:1.1, marginBottom:20 }}>Recrutez les meilleurs<br/>talents d'Afrique</h2>
          <p style={{ fontSize:"clamp(13px,2.5vw,15px)", color:"rgba(255,255,255,0.85)", lineHeight:1.75, fontWeight:300, marginBottom:32, maxWidth:420 }}>
            Publiez une offre en moins de 5 minutes. Atteignez 50 000+ candidats qualifiés au Cameroun et au-delà.
          </p>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:24 }}>
            <button onClick={handleAction} style={{ background:"white", color:O, border:"none", padding:"13px 26px", borderRadius:10, fontSize:"clamp(13px,2.5vw,15px)", fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 20px rgba(0,0,0,0.15)" }}>
              Publier une offre →
            </button>
          </div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            {["Sans carte bancaire","1er post gratuit","Annulez à tout moment"].map(p => (
              <span key={p} style={{ fontSize:12, color:"rgba(255,255,255,0.8)", display:"flex", alignItems:"center", gap:5 }}><strong>✓</strong> {p}</span>
            ))}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[{ val:"5 min", label:"pour publier" },{ val:"50 000+", label:"candidats actifs" },{ val:"94%", label:"satisfaction" },{ val:"Gratuit", label:"pour commencer" }].map(s => (
            <div key={s.label} style={{ background:"rgba(255,255,255,0.12)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:14, padding:"clamp(16px,3vw,22px) clamp(14px,2.5vw,20px)", textAlign:"center" }}>
              <div style={{ fontSize:"clamp(22px,4vw,28px)", fontWeight:800, color:"white", letterSpacing:"-0.5px" }}>{s.val}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)", fontWeight:400, marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── NEWSLETTER ────────────────────────────────────────────── */
function Newsletter() {
  const [ref, style] = useReveal(0);
  return (
    <section style={{ background:"#fff", padding:"clamp(48px,7vw,72px) clamp(16px,4vw,48px)", borderTop:`1px solid ${BORDER}` }}>
      <div ref={ref} style={{ ...style, maxWidth:560, margin:"0 auto", textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:14 }}>📬</div>
        <h3 style={{ fontSize:"clamp(22px,4vw,28px)", fontWeight:800, color:INK, letterSpacing:"-0.5px", marginBottom:10 }}>Offres dans votre boîte mail</h3>
        <p style={{ fontSize:14, color:MUTED, marginBottom:24, fontWeight:300, lineHeight:1.65 }}>
          Sélection personnalisée chaque semaine. Aucun spam. Désabonnement en 1 clic.
        </p>
        <div style={{ display:"flex", border:`2px solid ${BORDER}`, borderRadius:12, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.05)", background:"white", flexWrap:"wrap" }}>
          <input style={{ flex:"1 1 160px", border:"none", background:"none", fontSize:15, color:INK, padding:"14px 16px", fontFamily:"inherit", outline:"none", minWidth:0 }} type="email" placeholder="votre@email.com" aria-label="Adresse e-mail"/>
          <button style={{ background:G, color:"white", border:"none", padding:"0 20px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0, minHeight:50 }}>S'abonner</button>
        </div>
        <p style={{ fontSize:12, color:"#D1D5DB", marginTop:12, fontWeight:300 }}>Rejoint par 12 400+ professionnels</p>
      </div>
    </section>
  );
}

/* ─── FOOTER ────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background:G2, padding:"clamp(40px,6vw,60px) clamp(16px,4vw,48px) 28px" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div className="kora-footer-grid" style={{ marginBottom:40 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", marginBottom:16 }}>
              <div style={{ width:60, height:48, borderRadius:8, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <img src={Kora_Logo} alt="Logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:16, color:"white" }}>KORA</div>
                <div style={{ fontSize:8, color:O, fontWeight:600, letterSpacing:"1.5px" }}>UNLOCK YOUR CAREER</div>
              </div>
            </div>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.45)", lineHeight:1.8, maxWidth:220, fontWeight:300 }}>
              La plateforme emploi des professionnels africains en devenir.
            </p>
            <div style={{ display:"flex", gap:8, marginTop:20 }}>
              {["𝕏","in","f"].map(s => (
                <button key={s} style={{ width:32, height:32, borderRadius:8, border:"1px solid rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(255,255,255,0.4)", fontSize:12, background:"none" }}>{s}</button>
              ))}
            </div>
          </div>
          {[
            { title:"CANDIDATS", links:["Offres d'emploi","Entreprises","Offres sauvegardées","Conseils carrière"] },
            { title:"RECRUTEURS", links:["Publier une offre","Tarifs","Recherche talents","Analytiques"] },
            { title:"KORA", links:["À propos","Carrières","Contact","Confidentialité"] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize:11, fontWeight:700, color:O, letterSpacing:1, marginBottom:16 }}>{col.title}</div>
              {col.links.map(l => (
                <a key={l} href="#" style={{ display:"block", fontSize:13, color:"#9CA3AF", marginBottom:8, textDecoration:"none" }}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:22, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)", fontWeight:300 }}>© 2025 KORA · Tous droits réservés</span>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)", fontWeight:300 }}>Fait avec <span style={{ color:O }}>♥</span> pour l'Afrique</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── SCROLL TO TOP ─────────────────────────────────────────── */
function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  if (!visible) return null;
  return (
    <button onClick={() => window.scrollTo({ top:0, behavior:"smooth" })} style={{
      position:"fixed", bottom:20, right:20, zIndex:300, width:44, height:44, borderRadius:12,
      border:`2px solid rgba(26,92,46,0.2)`, background:"white", color:G, cursor:"pointer", fontSize:16,
      display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(0,0,0,0.12)",
    }} aria-label="Retour en haut">
      ↑
    </button>
  );
}

/* ─── APP ROOT ──────────────────────────────────────────────── */
export default function KoraHome() {
  const [showJobsOverlay, setShowJobsOverlay] = useState(false);

  return (
    <div style={{ fontFamily:"'Poppins', sans-serif", background:"#fff", color:INK, overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #f9fafb; }
        ::-webkit-scrollbar-thumb { background: rgba(26,92,46,0.25); border-radius: 4px; }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.2} }
        a:hover { color: ${O} !important; }

        .kora-desktop-nav { display: flex !important; }
        .kora-mobile-nav  { display: none !important; }

        @media (max-width: 767px) {
          .kora-desktop-nav { display: none !important; }
          .kora-mobile-nav  { display: flex !important; }
          .kora-hero-arrow  { display: none !important; }
          .kora-hero-card   { display: none !important; }
        }

        .kora-jobs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        @media (max-width: 900px) {
          .kora-jobs-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .kora-jobs-grid { grid-template-columns: 1fr; }
        }

        .kora-categories-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 900px) {
          .kora-categories-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .kora-companies-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 900px) {
          .kora-companies-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .kora-companies-grid { grid-template-columns: 1fr; }
        }

        @media (min-width: 640px) {
          .kora-stats-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .kora-stats-grid > div {
            border-bottom: none !important;
          }
          .kora-stats-grid > div:nth-child(3) {
            border-right: 1px solid rgba(255,255,255,0.15) !important;
          }
          .kora-stats-grid > div:nth-child(4) {
            border-right: none !important;
          }
        }

        .kora-cta-grid {
          grid-template-columns: 1fr;
        }
        @media (min-width: 900px) {
          .kora-cta-grid { grid-template-columns: 1fr 1fr; gap: 80px; }
        }

        .kora-footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }
        @media (min-width: 640px) {
          .kora-footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 900px) {
          .kora-footer-grid { grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 40px; }
        }

        section, div, nav, footer { max-width: 100vw; }
      `}</style>

      {showJobsOverlay && <JobsOverlay onClose={() => setShowJobsOverlay(false)} />}

      <Navbar onShowJobs={() => setShowJobsOverlay(true)} />
      <Hero onShowJobs={() => setShowJobsOverlay(true)} />
      <Ticker />
      <SearchSection />
      <StatsBand />
      <JobsSection onShowAll={() => setShowJobsOverlay(true)} />
      <CategoriesSection />
      <CompaniesSection />
      <InsightsSection />
      <CtaSection />
      <Newsletter />
      <Footer />
      <ScrollToTop />
    </div>
  );
}