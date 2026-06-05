import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Kora_Logo from './assets/absolute-size-logo.png'
import { useAuth } from "./context/AuthContext";
import { useTranslation } from "react-i18next";
import { getJobs, getCategories, getCompanies } from "./api/jobs";
import { fetchLiveHero } from "./api/hero";

const G    = "#1A5C2E";
const G2   = "#0D3D1F";
const G_L  = "#E8F5EE";
const O    = "#F97316";
const O_L  = "#FFF3EA";
const INK  = "#111827";
const MUTED= "#6B7280";
const BORDER="#E5E7EB";

/* ─── CATEGORY EMOJI ICONS MAPPING ──────────────────────────── */
const CATEGORY_ICONS = {
  "Technologie": "💻",
  "Technology": "💻",
  "Finance": "📊",
  "Ingénierie": "⚙️",
  "Engineering": "⚙️",
  "Design": "🎨",
  "Marketing": "📣",
  "Santé": "🏥",
  "Healthcare": "🏥",
  "Commercial": "🤝",
  "Sales": "🤝",
  "Éducation": "📚",
  "Education": "📚"
};

const getCategoryIcon = (name) => CATEGORY_ICONS[name] || "💼";

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


/* ═══════════════════════════════════════════════════════════════════
   HERO — dynamic Framer Motion, backend-driven via /api/public/hero
   Layer stack (bottom → top):
     0  Per-slide gradient backgrounds     (original behaviour)
     1  Framer Motion background images    (NEW — heroConfig.slides)
        • fade / slide / zoom transitions  • Ken-Burns scale
        • configurable dark overlay
     2  Vignette + bottom white-fade       (original)
     3  Job-card content with Framer stagger (enhanced)
     4  Controls + optional stats strip
═══════════════════════════════════════════════════════════════════ */

/* ── Framer image transition variants ───────────────────────── */
const imgVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 1.1, ease: "easeInOut" } },
    exit:    { opacity: 0, transition: { duration: 0.7, ease: "easeInOut" } },
  },
  slide: {
    initial: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0.5 }),
    animate: { x: 0, opacity: 1, transition: { duration: 0.85, ease: [0.32,0.72,0,1] } },
    exit:    (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0.5, transition: { duration: 0.6 } }),
  },
  zoom: {
    initial: { opacity: 0, scale: 1.07 },
    animate: { opacity: 1, scale: 1, transition: { duration: 1.2, ease: "easeOut" } },
    exit:    { opacity: 0, scale: 0.96, transition: { duration: 0.6 } },
  },
};

const kenBurns = {
  initial:   { scale: 1.1 },
  animate:   { scale: 1.0, x: "-1.5%", y: "-1%" },
  transition:{ duration: 9, ease: "linear", repeat: Infinity, repeatType: "mirror" },
};

const contentItem = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.22,1,0.36,1] } },
  exit:   { opacity: 0, y: -12, transition: { duration: 0.25 } },
};
const contentParent = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09 } },
};

function Hero() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [heroConfig, setHeroConfig]     = useState(null);
  const [slides, setSlides]             = useState([]);
  const [current, setCurrent]           = useState(0);
  const [paused, setPaused]             = useState(false);
  const [animating, setAnimating]       = useState(false);
  const [displaySlide, setDisplaySlide] = useState(0);
  const timerRef   = useRef(null);
  const [bgIdx, setBgIdx] = useState(0);
  const [bgDir, setBgDir] = useState(1);
  const bgTimerRef = useRef(null);

  /* Fetch hero config */
  useEffect(() => {
    fetchLiveHero().then(cfg => setHeroConfig(cfg)).catch(() => {});
  }, []);

  /* Fetch real job slides */
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
          tag: (job.tags && job.tags[0]) || "TECH",
          tagColor: i === 0 ? "#3B82F6" : i === 1 ? "#1D4ED8" : "#7C3AED",
          id: job.id,
        })));
      }
    }).catch(console.error);
  }, []);

  const welcomeSlide = {
    eyebrow: "BIENVENUE",
    title: "Bienvenue sur Kora\nJob Portal",
    company: "Kora Platform",
    location: "Cameroun",
    salary: "Négociable",
    match: 100,
    tag: "KORA",
    tagColor: "#F97316",
    id: null
  };
  const currentSlides = (slides && slides.length > 0) ? slides : [welcomeSlide];

  /* Job carousel */
  const total = currentSlides.length;
  const goTo = useCallback((idx) => {
    if (total <= 0) return;
    const next = ((idx % total) + total) % total;
    setAnimating(true);
    setTimeout(() => { setDisplaySlide(next); setCurrent(next); setAnimating(false); }, 280);
  }, [total]);

  useEffect(() => {
    if (!paused) { timerRef.current = setInterval(() => goTo(current + 1), 5000); }
    return () => clearInterval(timerRef.current);
  }, [current, paused, goTo]);

  /* Background image auto-advance */
  const bgSlides    = heroConfig?.slides ?? [];
  const isSlideshow = heroConfig?.backgroundType === "slideshow" && bgSlides.length > 0;
  const hasMultipleBgSlides = isSlideshow && bgSlides.length > 1;
  const hasSingleBgImage = heroConfig?.backgroundType === "image" && !!heroConfig?.backgroundImageUrl;
  const intervalMs  = heroConfig?.slideIntervalMs ?? 4500;

  useEffect(() => {
    if (!hasMultipleBgSlides || paused) return;
    bgTimerRef.current = setInterval(() => {
      setBgDir(1);
      setBgIdx(i => (i + 1) % bgSlides.length);
    }, intervalMs);
    return () => clearInterval(bgTimerRef.current);
  }, [hasMultipleBgSlides, bgSlides.length, intervalMs, paused]);

  const transition = heroConfig?.slideTransition ?? "fade";
  const v          = imgVariants[transition] ?? imgVariants.fade;
  const overlayOpacity = heroConfig?.overlayOpacity ?? 0.55;
  const statsVisible   = heroConfig?.statsVisible   ?? false;
  const liveJobs       = heroConfig?.liveJobCount;
  const liveCompanies  = heroConfig?.liveCompanyCount;
  const liveSeekers    = heroConfig?.liveSeekerCount;

  const bgGrads = [
    "linear-gradient(135deg,#0D3D1F 0%,#0A2E1A 40%,#061A0F 100%)",
    "linear-gradient(135deg,#0A1628 0%,#071020 50%,#030810 100%)",
    "linear-gradient(135deg,#1A0D28 0%,#100818 50%,#070510 100%)",
  ];

  const customGrad = heroConfig?.backgroundType === "gradient" && heroConfig.gradientFrom && heroConfig.gradientTo
    ? `linear-gradient(135deg, ${heroConfig.gradientFrom} 0%, ${heroConfig.gradientTo} 100%)`
    : null;

  const getDashboardPath = () => {
    const role = user?.role || user?.type || "";
    if (role.includes("EMPLOYER")) return "/dashboard/employer";
    if (role.includes("ADMIN"))    return "/profile/admin";
    return "/employee/dashboard";
  };

  const s = currentSlides[displaySlide] || currentSlides[0] || welcomeSlide;
  const handleAction = () => { if (s.id) navigate(`/jobs/${s.id}`); else navigate("/jobs"); };
  const eyebrowLabel =
    s.eyebrow === "POSTE VEDETTE"       ? t('hero.featured') :
    s.eyebrow === "OPPORTUNITÉ FINANCE" ? t('hero.finance')  :
    s.eyebrow === "BIENVENUE"           ? "KORA PLATFORM" :
    t('hero.creative');

  return (
    <section style={{ position:"relative", minHeight:"min(calc(100vh - 64px), 620px)", height:"calc(100vh - 64px)", overflow:"hidden" }}>

      {/* Layer 0: gradient per slide or custom gradient */}
      {customGrad ? (
        <div style={{ position:"absolute", inset:0, background:customGrad, zIndex:1 }}/>
      ) : (
        bgGrads.map((bg, i) => (
          <div key={i} style={{ position:"absolute", inset:0, background:bg, opacity: i === current ? 1 : 0, transition:"opacity 0.9s ease", zIndex:1 }}/>
        ))
      )}

      {/* Layer 1: Framer Motion background image slideshow or single image */}
      {(isSlideshow || hasSingleBgImage) && (
        <div style={{ position:"absolute", inset:0, zIndex:2, overflow:"hidden" }}>
          {isSlideshow ? (
            <AnimatePresence mode="sync" custom={bgDir} initial={false}>
              <motion.div
                key={bgIdx}
                custom={bgDir}
                style={{ position:"absolute", inset:0 }}
                initial={typeof v.initial === "function" ? v.initial(bgDir) : v.initial}
                animate={v.animate}
                exit={typeof v.exit === "function" ? v.exit(bgDir) : v.exit}
              >
                <motion.img
                  src={bgSlides[bgIdx]?.url}
                  alt={bgSlides[bgIdx]?.alt ?? ""}
                  style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition: bgSlides[bgIdx]?.position ?? "center center", display:"block" }}
                  initial={kenBurns.initial}
                  animate={kenBurns.animate}
                  transition={kenBurns.transition}
                  draggable={false}
                  onError={e => { e.currentTarget.style.display = "none"; }}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div style={{ position:"absolute", inset:0 }}>
              <img
                src={heroConfig.backgroundImageUrl}
                alt=""
                style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition: "center center", display:"block" }}
                draggable={false}
                onError={e => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          )}
          {/* Image overlay */}
          <div style={{ position:"absolute", inset:0, background:"#000", opacity:overlayOpacity, zIndex:3, pointerEvents:"none" }}/>
        </div>
      )}

      {/* Layer 2: vignette + bottom white fade */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"32%", zIndex:6, background:"linear-gradient(to top, #fff 0%, transparent 100%)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", inset:0, zIndex:6, background:"radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)", pointerEvents:"none" }}/>

      {/* Layer 3: job-card content with Framer stagger */}
      <div style={{ position:"absolute", inset:0, zIndex:7, display:"flex", alignItems:"center", padding:"0 clamp(20px, 5vw, 80px)" }}>
        <AnimatePresence mode="wait">
          <motion.div key={displaySlide} variants={contentParent} initial="hidden" animate="show" exit="exit" style={{ maxWidth:650, width:"100%" }}>

            <motion.div variants={contentItem} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <span style={{ fontSize:"clamp(9px,2.5vw,11px)", fontWeight:700, letterSpacing:3, color:O }}>{eyebrowLabel}</span>
              <span style={{ fontSize:"clamp(9px,2vw,10px)", fontWeight:700, padding:"3px 10px", borderRadius:20, letterSpacing:1, background:`${s.tagColor}22`, color:s.tagColor, border:`1px solid ${s.tagColor}44` }}>{s.tag}</span>
            </motion.div>

            <motion.h1 variants={contentItem} style={{ fontSize:"clamp(32px, 6vw, 76px)", fontWeight:800, color:"#fff", lineHeight:1.05, letterSpacing:"-1.5px", marginBottom:20, whiteSpace:"pre-line" }}>
              {s.title}
            </motion.h1>

            <motion.div variants={contentItem} style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24 }}>
              {[{ icon:"🏢", val:s.company },{ icon:"📍", val:s.location },{ icon:"💰", val:s.salary }].map(chip => (
                <div key={chip.val} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.12)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:20, padding:"5px 12px", fontSize:"clamp(11px,2.5vw,13px)", color:"rgba(255,255,255,0.9)" }}>
                  <span>{chip.icon}</span>{chip.val}
                </div>
              ))}
            </motion.div>

            <motion.div variants={contentItem} style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              {isAuthenticated ? (
                <>
                  <Link to={getDashboardPath()} style={{ background:G, color:"white", textDecoration:"none", padding:"12px 26px", borderRadius:10, fontSize:"clamp(13px,3vw,15px)", fontWeight:700, boxShadow:"0 4px 20px rgba(26,92,46,0.4)" }}>
                    Mon Tableau de Bord →
                  </Link>
                  <button onClick={handleAction} style={{ background:"rgba(255,255,255,0.15)", color:"white", border:"1px solid rgba(255,255,255,0.3)", padding:"12px 26px", borderRadius:10, fontSize:"clamp(13px,3vw,15px)", fontWeight:700, cursor:"pointer", fontFamily:"inherit", backdropFilter:"blur(8px)" }}>
                    {t('hero.view_job')}
                  </button>
                </>
              ) : (
                <button onClick={handleAction} style={{ background:O, color:"white", border:"none", padding:"12px 26px", borderRadius:10, fontSize:"clamp(13px,3vw,15px)", fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 20px rgba(249,115,22,0.4)" }}>
                  Voir l'offre →
                </button>
              )}
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:20, padding:"8px 14px", fontSize:"clamp(11px,2.5vw,13px)", fontWeight:600, color:"white" }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background: s.match >= 90 ? "#22C55E" : "#F59E0B", display:"inline-block" }}/>
                {s.match}% {t('hero.compatibility')}
              </div>
            </motion.div>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Layer 4a: optional stats strip */}
      {statsVisible && (liveJobs || liveCompanies || liveSeekers) && (
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.9 }}
          style={{ position:"absolute", bottom:56, left:"clamp(20px,5vw,80px)", zIndex:8, display:"flex", background:"rgba(255,255,255,0.10)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:14, overflow:"hidden" }}
        >
          {[
            { val:liveJobs,      label: heroConfig?.statJobsLabel      ?? "Offres actives" },
            { val:liveCompanies, label: heroConfig?.statCompaniesLabel ?? "Entreprises"    },
            { val:liveSeekers,   label: heroConfig?.statSeekersLabel   ?? "Candidats"      },
          ].filter(x => x.val != null).map((stat, i, arr) => (
            <div key={i} style={{ padding:"10px 20px", textAlign:"center", borderRight: i < arr.length-1 ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
              <div style={{ fontSize:18, fontWeight:800, color:"#fff", lineHeight:1 }}>{Number(stat.val).toLocaleString()}+</div>
              <div style={{ fontSize:10, fontWeight:500, color:"rgba(255,255,255,0.65)", marginTop:3, whiteSpace:"nowrap" }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Layer 4b: arrows */}
      {[{ id:"prev", symbol:"‹", dir:-1 },{ id:"next", symbol:"›", dir:1 }].map(a => (
        <button key={a.id} onClick={() => goTo(current + a.dir)} className="kora-hero-arrow" style={{ position:"absolute", top:"50%", transform:"translateY(-50%)", zIndex:8, width:44, height:44, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.4)", background:"rgba(0,0,0,0.25)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"white", fontSize:20, ...(a.id==="prev" ? { left:12 } : { right:12 }) }}>
          {a.symbol}
        </button>
      ))}

      {/* Layer 4c: dots + counter + pause */}
      <div style={{ position:"absolute", right:"clamp(12px,4vw,48px)", bottom:48, zIndex:8, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10 }}>
        <span style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.55)" }}>{current+1}/{total}</span>
        <div style={{ display:"flex", gap:6 }}>
          {currentSlides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{ height:7, width: i===current ? 28 : 7, borderRadius:4, border:"none", cursor:"pointer", padding:0, background: i===current ? O : "rgba(255,255,255,0.35)", transition:"all 0.4s cubic-bezier(0.16,1,0.3,1)" }}/>
          ))}
        </div>
        <button onClick={() => setPaused(p => !p)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.4)", fontSize:12, fontFamily:"inherit", padding:0 }}>
          {paused ? "▶" : "⏸"}
        </button>
      </div>

      {/* Layer 4d: Framer progress bar (bg image timing) */}
      {isSlideshow && bgSlides.length > 1 && !paused && (
        <motion.div
          key={`pb-${bgIdx}`}
          initial={{ scaleX:0 }} animate={{ scaleX:1 }}
          transition={{ duration: intervalMs / 1000, ease:"linear" }}
          style={{ position:"absolute", bottom:0, left:0, right:0, height:3, zIndex:9, background:`linear-gradient(90deg, ${G}, ${O})`, transformOrigin:"left" }}
        />
      )}

      {/* Accent line when no bg images */}
      {(!isSlideshow && !hasSingleBgImage) && (
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, zIndex:8, background:`linear-gradient(90deg, ${G}, ${O})` }}/>
      )}

      {/* Layer 4e: bg-image dot indicators */}
      {isSlideshow && bgSlides.length > 1 && (
        <div style={{ position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)", zIndex:8, display:"flex", gap:6 }}>
          {bgSlides.map((_, i) => (
            <button key={i} onClick={() => { setBgDir(i > bgIdx ? 1 : -1); setBgIdx(i); }} style={{ width: i===bgIdx ? 20 : 6, height:6, borderRadius:3, background: i===bgIdx ? "#fff" : "rgba(255,255,255,0.35)", border:"none", cursor:"pointer", padding:0, transition:"all 0.3s cubic-bezier(0.16,1,0.3,1)" }}/>
          ))}
        </div>
      )}

      {/* Photo credit */}
      {isSlideshow && bgSlides[bgIdx]?.credit ? (
        <p style={{ position:"absolute", bottom:8, left:12, zIndex:8, fontSize:10, color:"rgba(255,255,255,0.3)", margin:0, pointerEvents:"none" }}>
          © {bgSlides[bgIdx].credit}
        </p>
      ) : null}
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
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    getJobs({ page: 1, limit: 10 }).then(res => {
      if (res.data && res.data.length > 0) {
        const msgs = res.data.map(job => {
          const compName = job.company || "Une entreprise partenaire";
          const jobTitle = job.title || "Opportunité";
          const loc = job.location || "Cameroun";
          return `${compName} recrute : ${jobTitle} (${loc})`;
        });
        setMessages(msgs);
      } else {
        setMessages([
          "Kora CM : Bienvenue sur la plateforme de recrutement premium",
          "Kora CM : Trouvez les meilleures opportunités professionnelles",
          "Kora CM : Rejoignez des milliers de professionnels talentueux"
        ]);
      }
    }).catch(() => {
      setMessages([
        "Kora CM : Bienvenue sur la plateforme de recrutement premium",
        "Kora CM : Trouvez les meilleures opportunités professionnelles"
      ]);
    });
  }, []);

  const companyMsgs = messages.length > 0 ? messages : ["Chargement des annonces en cours..."];
  const msgs = [...companyMsgs, ...companyMsgs];

  return (
    <div style={{ background:G_L, borderTop:`1px solid rgba(26,92,46,0.1)`, borderBottom:`1px solid rgba(26,92,46,0.1)`, overflow:"hidden", padding:"10px 0" }}>
      <style>{`@keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} } @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
      <div style={{ display:"flex", alignItems:"center" }}>
        <div style={{ background:G, color:"white", padding:"5px 14px", fontSize:10, fontWeight:700, letterSpacing:2, flexShrink:0, whiteSpace:"nowrap" }}>EN DIRECT</div>
        <div style={{ overflow:"hidden", flex:1, WebkitMaskImage:"linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)" }}>
          <div style={{ display:"flex", gap:48, width:"max-content", animation:`ticker ${companyMsgs.length * 8}s linear infinite` }}>
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
        fetchLiveHero().then(cfg => {
          const targets = {
            jobs:       cfg?.liveJobCount || 10,
            companies:  cfg?.liveCompanyCount || 5,
            candidates: cfg?.liveSeekerCount || 20,
            rate:       95,
          };
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
        }).catch(() => {
          const targets = { jobs: 10, companies: 5, candidates: 20, rate: 95 };
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
        });
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
  const { t } = useTranslation();
  const [ref, style] = useReveal(0);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    getJobs({ page: 1, limit: 6 }).then(res => {
      if (res.data && res.data.length > 0) {
        setJobs(res.data.map(job => ({
          ...job,
          match: Math.floor(Math.random() * 20) + 75,
          applicants: Math.floor(Math.random() * 50) + 1,
          posted: Math.max(0, Math.floor((Date.now() - new Date(job.postedAt).getTime()) / 86400000))
        })));
      } else {
        setJobs([]);
      }
    }).catch(err => {
      console.error(err);
      setJobs([]);
    });
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
        {jobs.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 0", background:"#fff", border:`1.5px solid ${BORDER}`, borderRadius:14 }}>
            <span style={{ fontSize:48, display:"block", marginBottom:12 }}>💼</span>
            <h3 style={{ fontSize:18, fontWeight:700, color:INK, marginBottom:6 }}>{t('jobs.empty_title', 'Aucune offre disponible')}</h3>
            <p style={{ fontSize:14, color:MUTED, maxWidth:400, margin:"0 auto" }}>
              {t('jobs.empty_desc', "Il n'y a pas de postes vacants pour le moment. Veuillez revenir plus tard ou publier une nouvelle offre.")}
            </p>
          </div>
        ) : (
          <div className="kora-jobs-grid">
            {jobs.map((job, i) => <JobCard key={job.id} job={job} delay={[60,140,220,300,380,460][i] || 0} />)}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── CATEGORIES ────────────────────────────────────────────── */
function CategoryCard({ cat, delay }) {
  const navigate = useNavigate();
  const [ref, style] = useReveal(delay);
  return (
    <div ref={ref} style={{
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
}

function CategoriesSection() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [hRef, hStyle] = useReveal(0);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories().then(data => {
      if (data && data.length > 0) {
        setCategories(data.slice(0, 8).map((cat, i) => ({
          name: cat.name,
          count: Math.floor(Math.random() * 300) + 50,
          trend: `+${Math.floor(Math.random() * 30) + 5}%`,
          icon: cat.iconUrl || getCategoryIcon(cat.name)
        })));
      } else {
        setCategories([]);
      }
    }).catch(err => {
      console.error(err);
      setCategories([]);
    });
  }, []);
  return (
    <section style={{ background:"#fff", padding:"clamp(48px,7vw,80px) clamp(16px,4vw,48px)" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div ref={hRef} style={{ ...hStyle, textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:700, color:O, letterSpacing:"2.5px", marginBottom:6 }}>EXPLORER</div>
          <h2 style={{ fontSize:"clamp(24px,4vw,34px)", fontWeight:800, color:INK, letterSpacing:"-0.5px" }}>Parcourir par Secteur</h2>
          <p style={{ fontSize:14, color:MUTED, marginTop:4, fontWeight:300 }}>Survolez une carte pour voir le salaire moyen</p>
        </div>
        {categories.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 0", background:"#fff", border:`1.5px solid ${BORDER}`, borderRadius:14 }}>
            <span style={{ fontSize:48, display:"block", marginBottom:12 }}>📊</span>
            <h3 style={{ fontSize:18, fontWeight:700, color:INK, marginBottom:6 }}>{t('categories.empty_title', 'Aucun secteur trouvé')}</h3>
            <p style={{ fontSize:14, color:MUTED, maxWidth:400, margin:"0 auto" }}>
              {t('categories.empty_desc', "Les secteurs d'activité seront affichés dès qu'ils seront disponibles dans le système.")}
            </p>
          </div>
        ) : (
          <div className="kora-categories-grid">
            {categories.map((cat, i) => (
              <CategoryCard key={cat.name} cat={cat} delay={[60,140,220,300,380,460,540,620][i] || 0} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── COMPANIES ─────────────────────────────────────────────── */
function CompanyCard({ co, delay }) {
  const navigate = useNavigate();
  const [ref, style] = useReveal(delay);
  return (
    <div ref={ref} style={{
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
}

function CompaniesSection() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [hRef, hStyle] = useReveal(0);
  const [companies, setCompanies] = useState([]);

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
      } else {
        setCompanies([]);
      }
    }).catch(err => {
      console.error(err);
      setCompanies([]);
    });
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
        {companies.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 0", background:"#fff", border:`1.5px solid ${BORDER}`, borderRadius:14 }}>
            <span style={{ fontSize:48, display:"block", marginBottom:12 }}>🏢</span>
            <h3 style={{ fontSize:18, fontWeight:700, color:INK, marginBottom:6 }}>{t('companies.empty_title', 'Aucune entreprise trouvée')}</h3>
            <p style={{ fontSize:14, color:MUTED, maxWidth:400, margin:"0 auto" }}>
              {t('companies.empty_desc', "Les entreprises partenaires apparaîtront ici dès leur inscription.")}
            </p>
          </div>
        ) : (
          <div className="kora-companies-grid">
            {companies.map((co, i) => (
              <CompanyCard key={co.name} co={co} delay={[60,140,220,300,380,460,540,620][i] || 0} />
            ))}
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