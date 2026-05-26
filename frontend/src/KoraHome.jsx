import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Kora_Logo from './assets/absolute-size-logo.png'
import { useAuth } from "./context/AuthContext";
import { useTranslation } from "react-i18next";
import { getJobs, getCategories, getCompanies } from "./api/jobs";


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
];

/*
 * ─── TICKER FEED DATA ───────────────────────────────────────────
 * Each entry is tagged with a `type`:
 *   "company"  → posted by a company (job announcements, news)
 *   "user"     → user-activity update (applications, profile matches, etc.)
 *
 * The Ticker component filters to only show "company" entries.
 */
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

const FILTERS = ["Tous","Remote","Full-time","Stage","Tech","Finance","Design"];

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

/* ─── NAVBAR ────────────────────────────────────────────────── */
function Navbar({ logoSrc, onLogoUpload }) {
  const { isAuthenticated, user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [scrolled, setScrolled]     = useState(false);
  const [activeNav, setActiveNav]   = useState("Offres");
  const [menuOpen, setMenuOpen]     = useState(false);

  // Re-read auth from localStorage as fallback to avoid stale Suspense cache
  const lsToken = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const effectivelyAuth = isAuthenticated || !!lsToken;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const navLinks = [
    { label: t('nav.jobs'), key: "Offres" },
    { label: t('nav.companies'), key: "Entreprises" },
    { label: t('nav.salaries'), key: "Salaires" },
    { label: t('nav.recruiters'), key: "Recruteurs" },
    { label: t('nav.blog'), key: "Blog" }
  ];

  const getDashboardPath = () => {
    const role = user?.role || user?.type || "";
    if (role.includes("EMPLOYER")) return "/dashboard/employer";
    if (role.includes("ADMIN")) return "/profile/admin";
    return "/employee/dashboard";
  };

  const handleNavClick = (link) => {
    setActiveNav(link.key);
    if (link.key === "Offres") {
      navigate("/jobs");
    } else if (link.key === "Entreprises") {
      const el = document.getElementById("companies-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      else navigate("/jobs");
    } else if (link.key === "Salaires") {
      navigate("/insights");
    } else if (link.key === "Recruteurs") {
      const el = document.getElementById("cta-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav style={{
      position:"sticky", top:0, zIndex:200, background:"#fff",
      borderBottom: scrolled ? `1px solid ${BORDER}` : "1px solid transparent",
      boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.07)" : "none",
      transition:"box-shadow 0.3s, border-color 0.3s",
    }}>
      {/* ── Main bar ── */}
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
        <div className="kora-desktop-nav" style={{ flex:1, display:"flex", justifyContent:"center", gap:4, alignItems:"center" }}>
          {navLinks.map(link => (
            <button key={link.key} onClick={() => handleNavClick(link)} style={{
              fontSize:14, fontWeight:500, color: activeNav===link.key ? O : "#374151",
              cursor:"pointer", padding:"6px 14px", background:"none", border:"none",
              fontFamily:"inherit", whiteSpace:"nowrap", position:"relative",
            }}>
              {link.label}
              <span style={{
                position:"absolute", bottom:-2, left:14, right:14, height:2,
                background: activeNav===link.key ? O : "transparent", borderRadius:2,
              }}/>
            </button>
          ))}
        </div>

        {/* Desktop auth buttons */}
        <div className="kora-desktop-nav" style={{ display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
          {/* Language Switcher */}
          <div style={{ display:"flex", background:"#F3F4F6", borderRadius:8, padding:2, marginRight:8 }}>
            <button
              onClick={() => i18n.changeLanguage('fr')}
              style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer", background: i18n.language === 'fr' ? "#fff" : "transparent", color: i18n.language === 'fr' ? G : MUTED, boxShadow: i18n.language === 'fr' ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
            >FR</button>
            <button
              onClick={() => i18n.changeLanguage('en')}
              style={{ padding:"4px 8px", border:"none", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer", background: i18n.language === 'en' ? "#fff" : "transparent", color: i18n.language === 'en' ? G : MUTED, boxShadow: i18n.language === 'en' ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
            >EN</button>
          </div>

          {effectivelyAuth ? (
            <Link
              to={getDashboardPath()}
              style={{ background:G, color:"white", textDecoration: "none", padding:"10px 22px", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 8px rgba(26,92,46,0.2)" }}
            >
              {t('nav.dashboard')}
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                style={{ background:"none", border:"none", fontSize:14, fontWeight:500, color:"#374151", cursor:"pointer", padding:"8px 14px", fontFamily:"inherit", textDecoration: "none" }}
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                style={{ background:O, color:"white", border:"none", padding:"10px 22px", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 8px rgba(249,115,22,0.3)", textDecoration: "none" }}
              >
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile: auth + hamburger */}
        <div className="kora-mobile-nav" style={{ display:"flex", gap:8, alignItems:"center", marginLeft:"auto" }}>
          {effectivelyAuth ? (
            <Link
              to={getDashboardPath()}
              style={{ background:G, color:"white", textDecoration: "none", padding:"9px 16px", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/register"
              style={{ background:O, color:"white", border:"none", padding:"9px 16px", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", textDecoration: "none" }}
            >
              S'inscrire
            </Link>
          )}
          {/* Hamburger button */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            style={{
              width:40, height:40, borderRadius:8,
              border:`1.5px solid ${BORDER}`,
              background:"#fff",
              cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5,
              padding:0, flexShrink:0,
            }}
          >
            {/* Three bars that animate into X */}
            {[0,1,2].map(i => (
              <span key={i} style={{
                display:"block", height:2, borderRadius:2,
                background: INK,
                width: menuOpen ? (i === 1 ? 0 : 22) : 22,
                transform: menuOpen
                  ? (i === 0 ? "translateY(7px) rotate(45deg)" : i === 2 ? "translateY(-7px) rotate(-45deg)" : "none")
                  : "none",
                opacity: menuOpen && i === 1 ? 0 : 1,
                transition:"all 0.25s cubic-bezier(0.16,1,0.3,1)",
              }}/>
            ))}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ── */}
      <div className="kora-mobile-nav" style={{
        overflow:"hidden",
        maxHeight: menuOpen ? 400 : 0,
        transition:"max-height 0.35s cubic-bezier(0.16,1,0.3,1)",
        borderTop: menuOpen ? `1px solid ${BORDER}` : "none",
        background:"#fff",
      }}>
        <div style={{ padding:"8px 16px 16px" }}>
          {navLinks.map(link => (
            <button key={link.key} onClick={() => { handleNavClick(link); setMenuOpen(false); }} style={{
              display:"block", width:"100%", textAlign:"left",
              fontSize:15, fontWeight: activeNav===link.key ? 700 : 500,
              color: activeNav===link.key ? O : INK,
              cursor:"pointer", padding:"12px 8px",
              background:"none", border:"none", fontFamily:"inherit",
              borderBottom:`1px solid ${BORDER}`,
            }}>
              {link.label}
            </button>
          ))}
          {effectivelyAuth ? (
            <Link 
              to={getDashboardPath()}
              onClick={() => setMenuOpen(false)}
              style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", fontSize:15, fontWeight:500, color:G, cursor:"pointer", padding:"12px 8px", fontFamily:"inherit", textDecoration: "none" }}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/login"
                onClick={() => setMenuOpen(false)}
                style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", fontSize:15, fontWeight:500, color:INK, cursor:"pointer", padding:"12px 8px", fontFamily:"inherit", textDecoration: "none" }}
              >
                Connexion
              </Link>
              <Link 
                to="/register"
                onClick={() => setMenuOpen(false)}
                style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", fontSize:15, fontWeight:500, color:O, cursor:"pointer", padding:"12px 8px", fontFamily:"inherit", textDecoration: "none" }}
              >
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ─── HERO CAROUSEL ─────────────────────────────────────────── */
function Hero() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [slides, setSlides] = useState(SLIDES_MOCK);
  
  useEffect(() => {
    getJobs({ page: 1, limit: 3 }).then(res => {
      if (res.data && res.data.length > 0) {
        setSlides(res.data.slice(0, 3).map((job, i) => ({
          eyebrow: i === 0 ? "POSTE VEDETTE" : i === 1 ? "OPPORTUNITÉ FINANCE" : "RÔLE CRÉATIF",
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary || "Négociable",
          match: Math.floor(Math.random() * 15) + 80,
          tag: job.tags[0] || "TECH",
          tagColor: i === 0 ? "#3B82F6" : i === 1 ? "#1D4ED8" : "#7C3AED",
          id: job.id
        })));
      }
    }).catch(console.error);
  }, []);

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [displaySlide, setDisplaySlide] = useState(0);
  const timerRef = useRef(null);
  const total = slides.length;

  const goTo = useCallback((idx) => {
    const next = ((idx % total) + total) % total;
    setAnimating(true);
    setTimeout(() => {
      setDisplaySlide(next);
      setCurrent(next);
      setAnimating(false);
    }, 280);
  }, [total]);

  useEffect(() => {
    if (!paused) {
      timerRef.current = setInterval(() => goTo(current + 1), 5000);
    }
    return () => clearInterval(timerRef.current);
  }, [current, paused, goTo]);

  const getDashboardPath = () => {
    const role = user?.role || user?.type || "";
    if (role.includes("EMPLOYER")) return "/dashboard/employer";
    if (role.includes("ADMIN")) return "/profile/admin";
    return "/employee/dashboard";
  };

  const handleAction = () => {
    if (s.id) navigate(`/jobs/${s.id}`);
    else navigate("/jobs");
  };

  const s = slides[displaySlide] || slides[0];
  const bgGrads = [
    "linear-gradient(135deg,#0D3D1F 0%,#0A2E1A 40%,#061A0F 100%)",
    "linear-gradient(135deg,#0A1628 0%,#071020 50%,#030810 100%)",
    "linear-gradient(135deg,#1A0D28 0%,#100818 50%,#070510 100%)",
  ];

  return (
    <section style={{ position:"relative", minHeight:"min(calc(100vh - 64px), 620px)", height:"calc(100vh - 64px)", overflow:"hidden" }}>
      {/* BG */}
      {bgGrads.map((bg, i) => (
        <div key={i} style={{
          position:"absolute", inset:0,
          background: bg,
          opacity: i === current ? 1 : 0,
          transition:"opacity 0.9s ease", zIndex:1,
        }}/>
      ))}
      {/* Fades */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"32%", zIndex:3, background:"linear-gradient(to top, #fff 0%, transparent 100%)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", inset:0, zIndex:3, background:"radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)", pointerEvents:"none" }}/>

      {/* Content */}
      <div style={{ position:"absolute", inset:0, zIndex:4, display:"flex", alignItems:"center", padding:"0 clamp(20px, 5vw, 80px)" }}>
        <div style={{
          maxWidth:650,
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(16px)" : "none",
          transition:"opacity 0.45s ease, transform 0.45s ease",
          width:"100%",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <span style={{ fontSize:"clamp(9px,2.5vw,11px)", fontWeight:700, letterSpacing:3, color:O }}>{s.eyebrow === "POSTE VEDETTE" ? t('hero.featured') : s.eyebrow === "OPPORTUNITÉ FINANCE" ? t('hero.finance') : t('hero.creative')}</span>
            <span style={{ fontSize:"clamp(9px,2vw,10px)", fontWeight:700, padding:"3px 10px", borderRadius:20, letterSpacing:1, background:`${s.tagColor}22`, color:s.tagColor, border:`1px solid ${s.tagColor}44` }}>{s.tag}</span>
          </div>
          <h1 style={{ fontSize:"clamp(32px, 6vw, 76px)", fontWeight:800, color:"#fff", lineHeight:1.05, letterSpacing:"-1.5px", marginBottom:20, whiteSpace:"pre-line" }}>
            {s.title}
          </h1>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24 }}>
            {[{ icon:"🏢", val:s.company },{ icon:"📍", val:s.location },{ icon:"💰", val:s.salary }].map(chip => (
              <div key={chip.val} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.12)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:20, padding:"5px 12px", fontSize:"clamp(11px,2.5vw,13px)", color:"rgba(255,255,255,0.9)" }}>
                <span>{chip.icon}</span>{chip.val}
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardPath()}
                  style={{ background:G, color:"white", textDecoration:"none", padding:"12px 26px", borderRadius:10, fontSize:"clamp(13px,3vw,15px)", fontWeight:700, boxShadow:"0 4px 20px rgba(26,92,46,0.4)" }}
                >
                  Mon Tableau de Bord →
                </Link>
                <button onClick={handleAction} style={{ background:"rgba(255,255,255,0.15)", color:"white", border:"1px solid rgba(255,255,255,0.3)", padding:"12px 26px", borderRadius:10, fontSize:"clamp(13px,3vw,15px)", fontWeight:700, cursor:"pointer", fontFamily:"inherit", backdropFilter:"blur(8px)" }}>
                  {t('hero.view_job')}
                </button>
              </>
            ) : (
              <>
                <button onClick={handleAction} style={{ background:O, color:"white", border:"none", padding:"12px 26px", borderRadius:10, fontSize:"clamp(13px,3vw,15px)", fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 20px rgba(249,115,22,0.4)" }}>
                  Voir l'offre →
                </button>
              </>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:20, padding:"8px 14px", fontSize:"clamp(11px,2.5vw,13px)", fontWeight:600, color:"white" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background: s.match >= 90 ? "#22C55E" : "#F59E0B", display:"inline-block" }}/>
              {s.match}% {t('hero.compatibility')}
            </div>
          </div>
        </div>
      </div>

      {/* Arrows — hidden on very small screens */}
      {[{ id:"prev", symbol:"‹", dir:-1 },{ id:"next", symbol:"›", dir:1 }].map(a => (
        <button key={a.id} onClick={() => goTo(current + a.dir)} className="kora-hero-arrow" style={{
          position:"absolute", top:"50%", transform:"translateY(-50%)", zIndex:5,
          width:44, height:44, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.4)",
          background:"rgba(0,0,0,0.25)", backdropFilter:"blur(8px)",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", color:"white", fontSize:20,
          ...(a.id==="prev" ? { left:12 } : { right:12 }),
        }}>
          {a.symbol}
        </button>
      ))}

      {/* Controls */}
      <div style={{ position:"absolute", right:"clamp(12px,4vw,48px)", bottom:48, zIndex:5, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10 }}>
        <span style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.55)" }}>{current+1}/{total}</span>
        <div style={{ display:"flex", gap:6 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              height:7, width: i===current ? 28 : 7, borderRadius:4, border:"none", cursor:"pointer", padding:0,
              background: i===current ? O : "rgba(255,255,255,0.35)",
              transition:"all 0.4s cubic-bezier(0.16,1,0.3,1)",
            }}/>
          ))}
        </div>
        <button onClick={() => setPaused(p => !p)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.4)", fontSize:12, fontFamily:"inherit", padding:0 }}>
          {paused ? "▶" : "⏸"}
        </button>
      </div>

      {/* Accent line */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, zIndex:5, background:`linear-gradient(90deg, ${G}, ${O})` }}/>
    </section>
  );
}

/* ─── TICKER ────────────────────────────────────────────────── */
/*
 * FEED FILTER: Only company posts are shown in the live feed.
 * User-activity updates (applications, match notifications, etc.)
 * are excluded by filtering TICKER_FEED to type === "company".
 */
function Ticker() {
  const companyMsgs = TICKER_FEED
    .filter(item => item.type === "company")
    .map(item => item.msg);

  // Duplicate for seamless loop
  const msgs = [...companyMsgs, ...companyMsgs];

  return (
    <div style={{ background:G_L, borderTop:`1px solid rgba(26,92,46,0.1)`, borderBottom:`1px solid rgba(26,92,46,0.1)`, overflow:"hidden", padding:"10px 0" }}>
      <style>{`@keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} } @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
      <div style={{ display:"flex", alignItems:"center" }}>
        <div style={{ background:G, color:"white", padding:"5px 14px", fontSize:10, fontWeight:700, letterSpacing:2, flexShrink:0, whiteSpace:"nowrap" }}>EN DIRECT</div>
        <div style={{ overflow:"hidden", flex:1, WebkitMaskImage:"linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)" }}>
          <div style={{ display:"flex", gap:48, width:"max-content", animation:`ticker ${companyMsgs.length * 5}s linear infinite` }}>
            {msgs.map((m, i) => (
              <span key={i} style={{ fontSize:12, fontWeight:400, color:G2, whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:16 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:O, display:"inline-block", animation:"blink 1.4s infinite" }}/>
                {m}
                <span style={{ color:"rgba(26,92,46,0.25)" }}>·</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── SEARCH SECTION ────────────────────────────────────────── */
function SearchSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [searchKw, setSearchKw] = useState("");
  const [locationKw, setLocationKw] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchKw) params.append("search", searchKw);
    if (locationKw) params.append("location", locationKw);
    navigate(`/jobs?${params.toString()}`);
  };

  const handleFilterClick = (f) => {
    setActiveFilter(f);
    const params = new URLSearchParams();
    if (f === "Remote") params.append("location", "Remote");
    else if (f === "Full-time") params.append("type", "CDI");
    else if (f === "Stage") params.append("type", "INTERNSHIP");
    else if (f !== "Tous") params.append("search", f);
    navigate(`/jobs?${params.toString()}`);
  };
  return (
    <div style={{ background:"#fff", padding:"clamp(20px,4vw,40px) clamp(16px,4vw,48px)", borderBottom:`1px solid ${BORDER}` }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        {/* Search inputs */}
        <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
          <div style={{ flex:"1 1 200px", minWidth:0, border:`2px solid ${BORDER}`, borderRadius:12, display:"flex", alignItems:"center", background:"#fff", padding:"8px 14px", gap:8, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
            <span style={{ color:"#9CA3AF", fontSize:16, flexShrink:0 }}>🔍</span>
            <input style={{ border:"none", background:"none", fontSize:14, flex:1, minWidth:0, color:INK, fontFamily:"inherit", outline:"none" }} placeholder="Titre de poste, compétence…" aria-label="Rechercher un poste" value={searchKw} onChange={e => setSearchKw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          </div>
          <div style={{ flex:"0 1 180px", minWidth:120, border:`2px solid ${BORDER}`, borderRadius:12, display:"flex", alignItems:"center", background:"#fff", padding:"8px 14px", gap:8 }}>
            <span style={{ color:"#9CA3AF", fontSize:16, flexShrink:0 }}>📍</span>
            <input style={{ border:"none", background:"none", fontSize:14, flex:1, minWidth:0, color:INK, fontFamily:"inherit", outline:"none" }} placeholder="Ville ou Remote" aria-label="Localisation" value={locationKw} onChange={e => setLocationKw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          </div>
          <button onClick={handleSearch} style={{ background:G, color:"white", border:"none", padding:"0 22px", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", minHeight:48, flexShrink:0, whiteSpace:"nowrap" }}>
            {t('search.button')}
          </button>
        </div>
        {/* Filter pills */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => handleFilterClick(f)} style={{
              fontSize:12, fontWeight:500, padding:"6px 16px", borderRadius:20,
              border:`1.5px solid ${activeFilter===f ? G : BORDER}`,
              background: activeFilter===f ? G : "#fff",
              color: activeFilter===f ? "white" : MUTED,
              cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", transition:"all 0.18s",
            }}>
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── STATS BAND ────────────────────────────────────────────── */
function StatsBand() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState({ jobs:0, companies:0, candidates:0, rate:0 });
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !counted.current) {
        counted.current = true;
        const targets = { jobs:10000, companies:500, candidates:50000, rate:95 };
        const dur = 1800;
        const start = performance.now();
        function tick(now) {
          const p = Math.min((now - start) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setCounts({
            jobs:       Math.floor(ease * targets.jobs),
            companies:  Math.floor(ease * targets.companies),
            candidates: Math.floor(ease * targets.candidates),
            rate:       Math.floor(ease * targets.rate),
          });
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const stats = [
    { icon:"💼", val: counts.jobs.toLocaleString(),       suf:"+", label: t('stats.active_jobs') },
    { icon:"🏢", val: counts.companies,                   suf:"+", label: t('stats.companies') },
    { icon:"👥", val: counts.candidates.toLocaleString(), suf:"+", label: t('stats.candidates') },
    { icon:"✓",  val: counts.rate,                        suf:"%", label: t('stats.placement_rate') },
  ];

  return (
    <div ref={ref} style={{ background:`linear-gradient(135deg, ${G} 0%, ${G2} 100%)`, padding:"clamp(32px,5vw,52px) clamp(16px,4vw,48px)" }}>
      <div style={{ maxWidth:1300, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:0 }} className="kora-stats-grid">
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign:"center", padding:"clamp(12px,3vw,16px) 0", borderRight: i % 2 === 0 ? "1px solid rgba(255,255,255,0.15)" : "none", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:"clamp(28px,5vw,44px)", fontWeight:800, color:"#fff", lineHeight:1, letterSpacing:"-1.5px" }}>
              {s.val}<span style={{ color:O, fontSize:"clamp(20px,3.5vw,30px)" }}>{s.suf}</span>
            </div>
            <div style={{ fontSize:"clamp(11px,2.5vw,13px)", fontWeight:500, color:"rgba(255,255,255,0.75)", marginTop:6 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── JOB CARD ──────────────────────────────────────────────── */
function JobCard({ job, delay }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [ref, style] = useReveal(delay);
  const [saved, setSaved] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const barRef = useRef(null);
  const { t } = useTranslation();
  const fresh = freshnessLabel(job.posted);
  const matchColor = job.match >= 90 ? "#16A34A" : job.match >= 80 ? "#D97706" : "#6B7280";
  const barGrad = job.match >= 90
    ? "linear-gradient(90deg,#86EFAC,#22C55E)"
    : job.match >= 80
      ? "linear-gradient(90deg,#FDE68A,#F59E0B)"
      : `linear-gradient(90deg,${G},${O})`;

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setBarVisible(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleCardClick = () => navigate(`/jobs/${job.id}`);

  const handleApplyClick = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) navigate("/login");
    else navigate(`/jobs/${job.id}/apply`);
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) navigate("/login");
    else setSaved(s => !s);
  };

  return (
    <div ref={ref} onClick={handleCardClick} style={{
      ...style,
      background:"#fff", border:`1.5px solid ${BORDER}`, borderRadius:14,
      padding:"clamp(16px,3vw,24px)", cursor:"pointer", position:"relative",
      overflow:"hidden", transition:"all 0.25s cubic-bezier(0.16,1,0.3,1)",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=G; e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 12px 36px rgba(26,92,46,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
    >
      {/* Top accent */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${G},${O})` }}/>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div style={{ display:"flex", gap:10, alignItems:"center", minWidth:0 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:G_L, border:`1.5px solid rgba(26,92,46,0.13)`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0 }}>
            {job.logo ? (
              <img src={job.logo} alt={`${job.company} logo`} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            ) : (
              <span style={{ fontWeight:800, fontSize:14, color:G }}>{job.company ? job.company.charAt(0) : "?"}</span>
            )}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, color:MUTED, fontWeight:400, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{job.company}</div>
            {job.remote && <span style={{ fontSize:9, fontWeight:700, color:G, background:G_L, border:`1px solid rgba(26,92,46,0.2)`, borderRadius:8, padding:"1px 7px", letterSpacing:"0.5px" }}>REMOTE</span>}
          </div>
        </div>
        <button onClick={handleSaveClick} style={{ background: saved ? O_L : "none", border:"none", cursor:"pointer", color: saved ? O : "#D1D5DB", fontSize:18, padding:4, borderRadius:6, lineHeight:1, transition:"all 0.2s", flexShrink:0 }} aria-label="Sauvegarder">
          {saved ? "♥" : "♡"}
        </button>
      </div>

      <h3 style={{ fontSize:"clamp(13px,2.5vw,15px)", fontWeight:700, color:INK, marginBottom:8, lineHeight:1.35 }}>{job.title}</h3>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", fontSize:12, color:MUTED, marginBottom:10 }}>
        <span>📍 {job.location}</span>
        <span>⏱ {job.type}</span>
        <span>👥 {job.applicants}</span>
      </div>

      {/* Match bar */}
      <div style={{ marginBottom:12 }} ref={barRef}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
          <span style={{ color:MUTED, fontWeight:500 }}>{t('jobs.compatibility_label')}</span>
          <span style={{ fontWeight:700, color:matchColor }}>{job.match}%</span>
        </div>
        <div style={{ height:4, background:"#F3F4F6", borderRadius:4 }}>
          <div style={{ height:"100%", borderRadius:4, background:barGrad, width: barVisible ? `${job.match}%` : "0%", transition:"width 1.2s ease" }}/>
        </div>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {job.tags.map(tag => (
          <span key={tag} style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background:G_L, color:G, fontWeight:600, border:`1px solid rgba(26,92,46,0.13)` }}>{tag}</span>
        ))}
      </div>

      {/* ↓ Single bottom row — duplicate was removed */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:`1px solid ${BORDER}`, paddingTop:14, flexWrap:"wrap", gap:8 }}>
        <div>
          <div style={{ fontSize:"clamp(14px,3vw,16px)", fontWeight:800, color:G }}>{job.salary}</div>
          <div style={{ fontSize:11, fontWeight:600, color:fresh.color, marginTop:2 }}>● {fresh.label}</div>
        </div>
        <button onClick={handleApplyClick} style={{ background:G, color:"white", border:"none", padding:"9px 18px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
          {t('jobs.apply')} →
        </button>
      </div>
    </div>
  );
}

/* ─── JOBS SECTION ──────────────────────────────────────────── */
function JobsSection() {
  const { t } = useTranslation();                          // ← WAS MISSING
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
          <Link to="/jobs" style={{ fontSize:14, fontWeight:600, color:G, textDecoration:"none", display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>
            {t('jobs.view_all', { count: 10000 })} →
          </Link>
        </div>
        <div className="kora-jobs-grid">
          {jobs.map((job, i) => <JobCard key={job.id} job={job} delay={[60,140,220,300,380,460][i] || 0} />)}
        </div>
      </div>
    </section>
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
          <p style={{ fontSize:14, color:MUTED, marginTop:4, fontWeight:300 }}>Survolez une carte pour voir le salaire moyen</p>
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
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [hRef, hStyle] = useReveal(0);
  const [companies, setCompanies] = useState(COMPANIES_MOCK);

  useEffect(() => {
    getCompanies().then(data => {
      if (data && data.length > 0) {
        setCompanies(data.slice(0, 8).map((co, i) => ({
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
            Publiez une offre en moins de 5 minutes. Atteignez 50 000+ candidats qualifiés au Cameroun et au-delà. Matching IA inclus.
          </p>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:24 }}>
            <button onClick={handleAction} style={{ background:"white", color:O, border:"none", padding:"13px 26px", borderRadius:10, fontSize:"clamp(13px,2.5vw,15px)", fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 20px rgba(0,0,0,0.15)" }}>
              Publier une offre →
            </button>
            <button style={{ background:"transparent", color:"white", border:"2px solid rgba(255,255,255,0.5)", padding:"13px 22px", borderRadius:10, fontSize:"clamp(13px,2.5vw,15px)", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              Voir les tarifs
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
function Footer({ logoSrc }) {
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
            { title:"CANDIDATS", links:["Offres d'emploi","Entreprises","Offres sauvegardées","Conseils carrière","Salaires"] },
            { title:"RECRUTEURS", links:["Publier une offre","Tarifs","Recherche talents","Analytiques"] },
            { title:"KORA", links:["À propos","Blog","Carrières","Contact","Confidentialité"] },
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
  const [logoSrc, setLogoSrc] = useState(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogoSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

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

        /* ── Responsive layout helpers ── */

        /* Navbar: show desktop links above 768px, hide below */
        .kora-desktop-nav { display: flex !important; }
        .kora-mobile-nav  { display: none !important; }

        @media (max-width: 767px) {
          .kora-desktop-nav { display: none !important; }
          .kora-mobile-nav  { display: flex !important; }
          /* Hero arrows — hide on very small screens to save space */
          .kora-hero-arrow  { display: none !important; }
        }

        /* Jobs: 3-col → 2-col → 1-col */
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

        /* Categories: 4-col → 2-col → 2-col (stays 2 on mobile) */
        .kora-categories-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 900px) {
          .kora-categories-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* Companies: 4-col → 2-col */
        .kora-companies-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        @media (max-width: 900px) {
          .kora-companies-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .kora-companies-grid { grid-template-columns: 1fr; }
        }

        /* Stats: use 4-col on desktop (overridden by inline style for 2-col base),
           switch back to 4-col above 640px */
        @media (min-width: 640px) {
          .kora-stats-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          /* reset borders for 4-col layout */
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

        /* CTA: single-col on mobile, 2-col on desktop */
        .kora-cta-grid {
          grid-template-columns: 1fr;
        }
        @media (min-width: 900px) {
          .kora-cta-grid { grid-template-columns: 1fr 1fr; gap: 80px; }
        }

        /* Footer: 1-col on mobile, 4-col on desktop */
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

        /* Prevent horizontal overflow on all sections */
        section, div, nav, footer { max-width: 100vw; }
      `}</style>
      <Navbar logoSrc={logoSrc} onLogoUpload={handleLogoUpload} />
      <Hero />
      <Ticker />
      <SearchSection />
      <StatsBand />
      <JobsSection />
      <CategoriesSection />
      <CompaniesSection />
      <CtaSection />
      <Newsletter />
      <Footer logoSrc={logoSrc} />
      <ScrollToTop />
    </div>
  );
}