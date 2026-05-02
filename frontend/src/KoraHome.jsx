import { useState, useEffect, useRef, useCallback } from "react";
import Kora_Logo from './assets/absolute-size-logo.png'


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
const SLIDES = [
  { eyebrow:"POSTE VEDETTE",       title:"Senior Frontend\nDeveloper",  company:"Orange Digital Centre", location:"Douala · Remote OK",  salary:"2.5M – 4M FCFA/mo", match:94, tag:"TECH",    tagColor:"#3B82F6" },
  { eyebrow:"OPPORTUNITÉ FINANCE", title:"Product Manager\nFintech",    company:"Afriland First Bank",   location:"Yaoundé · CDI",       salary:"3M – 5M FCFA/mo",   match:88, tag:"FINANCE", tagColor:"#1D4ED8" },
  { eyebrow:"RÔLE CRÉATIF",        title:"Lead UX\nDesigner",           company:"CamTech Solutions",     location:"Remote · Contract",   salary:"1.8M – 3M FCFA/mo", match:81, tag:"DESIGN",  tagColor:"#7C3AED" },
];

const JOBS = [
  { id:1, title:"Senior Frontend Developer", company:"Orange Digital Centre", location:"Douala",   type:"Full-time", salary:"2.5M – 4M FCFA/mo",   posted:0, logo:"OD", match:94, tags:["React","TypeScript"], remote:true,  applicants:12 },
  { id:2, title:"Product Manager",           company:"Afriland First Bank",   location:"Yaoundé",  type:"Full-time", salary:"3M – 5M FCFA/mo",     posted:1, logo:"AF", match:88, tags:["Fintech","Agile"],    remote:false, applicants:34 },
  { id:3, title:"Data Scientist",            company:"CamTech Solutions",     location:"Remote",   type:"Contract",  salary:"1.8M – 3M FCFA/mo",   posted:3, logo:"CT", match:81, tags:["Python","ML"],        remote:true,  applicants:7  },
  { id:4, title:"DevOps Engineer",           company:"MTN Cameroon",          location:"Douala",   type:"Full-time", salary:"2.2M – 3.8M FCFA/mo", posted:0, logo:"MT", match:76, tags:["AWS","Docker"],       remote:false, applicants:19 },
  { id:5, title:"Responsable Marketing",     company:"Jumia Cameroun",        location:"Douala",   type:"Full-time", salary:"1.5M – 2.5M FCFA/mo", posted:2, logo:"JM", match:71, tags:["SEO","Brand"],        remote:false, applicants:28 },
  { id:6, title:"Analyste Financier",        company:"UBA Bank",              location:"Yaoundé",  type:"Full-time", salary:"2M – 3.5M FCFA/mo",   posted:1, logo:"UB", match:79, tags:["Excel","Finance"],    remote:false, applicants:22 },
];

const CATEGORIES = [
  { name:"Technologie", count:342, trend:"+12%", icon:"💻" },
  { name:"Finance",     count:218, trend:"+8%",  icon:"📊" },
  { name:"Ingénierie",  count:289, trend:"+6%",  icon:"⚙️" },
  { name:"Design",      count:88,  trend:"+31%", icon:"🎨" },
  { name:"Marketing",   count:156, trend:"+15%", icon:"📣" },
  { name:"Santé",       count:124, trend:"+22%", icon:"🏥" },
  { name:"Commercial",  count:201, trend:"+19%", icon:"🤝" },
  { name:"Éducation",   count:97,  trend:"+5%",  icon:"📚" },
];

const COMPANIES = [
  { name:"MTN Cameroon",  abbr:"MTN", roles:23, hot:true  },
  { name:"Orange CM",     abbr:"ORG", roles:18, hot:true  },
  { name:"Afriland Bank", abbr:"AFL", roles:15, hot:false },
  { name:"Jumia",         abbr:"JMI", roles:31, hot:true  },
  { name:"Expresso",      abbr:"EXP", roles:9,  hot:false },
  { name:"CamTel",        abbr:"CTL", roles:12, hot:false },
  { name:"Dangote",       abbr:"DNG", roles:44, hot:true  },
  { name:"UBA Bank",      abbr:"UBA", roles:17, hot:true  },
];

const TICKER_MSGS = [
  "Emmanuel K. accepté chez MTN · Douala",
  "Orange CM : 8 nouveaux postes en ingénierie",
  "Beatrice N. postule chez Expresso",
  "Afriland recrute sur 15 postes",
  "Martin A. — Senior DevOps Engineer",
  "Claudine T. — 94% de compatibilité",
  "Dangote : 44 postes ouverts dès aujourd'hui",
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
  const [scrolled, setScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState("Offres");
  const fileRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = ["Offres","Entreprises","Salaires","Recruteurs","Blog"];

  return (
    <nav style={{
      position:"sticky", top:0, zIndex:200, background:"#fff", padding:"0 48px",
      borderBottom: scrolled ? `1px solid ${BORDER}` : "1px solid transparent",
      boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.07)" : "none",
      transition:"box-shadow 0.3s, border-color 0.3s",
    }}>

      <div style={{ maxWidth:1300, margin:"0 auto", display:"flex", alignItems:"center", height:100, gap:24 }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center"}}>
          <div
            style={{
              width:100, height:70, borderRadius:8, overflow:"hidden",
              display:"flex", alignItems:"center", justifyContent:"center"
              }}
          >
            <img src={Kora_Logo} alt="Logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:18, color:G, letterSpacing:"-0.3px", lineHeight:1 }}>KORA</div>
            <div style={{ fontSize:9, color:O, fontWeight:600, letterSpacing:"1.5px" }}>UNLOCK YOUR CAREER</div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ flex:1, display:"flex", justifyContent:"center", gap:4, alignItems:"center" }}>
          {navLinks.map(link => (
            <button key={link} onClick={() => setActiveNav(link)} style={{
              fontSize:14, fontWeight:500, color: activeNav===link ? O : "#374151",
              cursor:"pointer", padding:"6px 14px", background:"none", border:"none",
              fontFamily:"inherit", whiteSpace:"nowrap", position:"relative",
            }}>
              {link}
              <span style={{
                position:"absolute", bottom:-2, left:14, right:14, height:2,
                background: activeNav===link ? O : "transparent", borderRadius:2,
              }}/>
            </button>
          ))}
        </div>

        {/* Auth */}
        <div style={{ display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
          <button style={{ background:"none", border:"none", fontSize:14, fontWeight:500, color:"#374151", cursor:"pointer", padding:"8px 14px", fontFamily:"inherit" }}>
            Connexion
          </button>
          <button style={{ background:O, color:"white", border:"none", padding:"10px 22px", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 8px rgba(249,115,22,0.3)" }}>
            Postuler
          </button>
        </div>
      </div>

      <style>{`.logo-hover-overlay:hover { opacity: 1 !important; }`}</style>
    </nav>
  );
}

/* ─── HERO CAROUSEL ─────────────────────────────────────────── */
function Hero() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [displaySlide, setDisplaySlide] = useState(0);
  const timerRef = useRef(null);
  const total = SLIDES.length;

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

  const s = SLIDES[displaySlide];
  const bgGrads = [
    "linear-gradient(135deg,#0D3D1F 0%,#0A2E1A 40%,#061A0F 100%)",
    "linear-gradient(135deg,#0A1628 0%,#071020 50%,#030810 100%)",
    "linear-gradient(135deg,#1A0D28 0%,#100818 50%,#070510 100%)",
  ];

  return (
    <section style={{ position:"relative", height:"calc(100vh - 106px)", overflow:"hidden", minHeight:520 }}>
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
      <div style={{ position:"absolute", inset:0, zIndex:4, display:"flex", alignItems:"center", padding:"0 80px" }}>
        <div style={{
          maxWidth:650,
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(16px)" : "none",
          transition:"opacity 0.45s ease, transform 0.45s ease",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:3, color:O }}>{s.eyebrow}</span>
            <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, letterSpacing:1, background:`${s.tagColor}22`, color:s.tagColor, border:`1px solid ${s.tagColor}44` }}>{s.tag}</span>
          </div>
          <h1 style={{ fontSize:"clamp(44px, 6vw, 76px)", fontWeight:800, color:"#fff", lineHeight:1.05, letterSpacing:"-1.5px", marginBottom:28, whiteSpace:"pre-line" }}>
            {s.title}
          </h1>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:32 }}>
            {[{ icon:"🏢", val:s.company },{ icon:"📍", val:s.location },{ icon:"💰", val:s.salary }].map(chip => (
              <div key={chip.val} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.12)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:20, padding:"6px 14px", fontSize:13, color:"rgba(255,255,255,0.9)" }}>
                <span>{chip.icon}</span>{chip.val}
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:14, alignItems:"center" }}>
            <button style={{ background:O, color:"white", border:"none", padding:"14px 32px", borderRadius:10, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 20px rgba(249,115,22,0.4)" }}>
              Voir l'offre →
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:20, padding:"8px 16px", fontSize:13, fontWeight:600, color:"white" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background: s.match >= 90 ? "#22C55E" : "#F59E0B", display:"inline-block" }}/>
              {s.match}% de compatibilité
            </div>
          </div>
        </div>
      </div>

      {/* Arrows */}
      {[{ id:"prev", symbol:"‹", dir:-1, pos:"left:28px" },{ id:"next", symbol:"›", dir:1, pos:"right:28px" }].map(a => (
        <button key={a.id} onClick={() => goTo(current + a.dir)} style={{
          position:"absolute", top:"50%", transform:"translateY(-50%)", zIndex:5,
          width:50, height:50, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.4)",
          background:"rgba(0,0,0,0.25)", backdropFilter:"blur(8px)",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", color:"white", fontSize:20, ...(a.id==="prev" ? { left:28 } : { right:28 }),
        }}>
          {a.symbol}
        </button>
      ))}

      {/* Controls */}
      <div style={{ position:"absolute", right:48, bottom:52, zIndex:5, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10 }}>
        <span style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.55)" }}>{current+1}/{total}</span>
        <div style={{ display:"flex", gap:6 }}>
          {SLIDES.map((_, i) => (
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
function Ticker() {
  const msgs = [...TICKER_MSGS, ...TICKER_MSGS];
  return (
    <div style={{ background:G_L, borderTop:`1px solid rgba(26,92,46,0.1)`, borderBottom:`1px solid rgba(26,92,46,0.1)`, overflow:"hidden", padding:"10px 0" }}>
      <style>{`@keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} } @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
      <div style={{ display:"flex", alignItems:"center" }}>
        <div style={{ background:G, color:"white", padding:"5px 18px", fontSize:10, fontWeight:700, letterSpacing:2, flexShrink:0 }}>EN DIRECT</div>
        <div style={{ overflow:"hidden", flex:1, WebkitMaskImage:"linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)" }}>
          <div style={{ display:"flex", gap:48, width:"max-content", animation:"ticker 38s linear infinite" }}>
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
  const [activeFilter, setActiveFilter] = useState("Tous");
  return (
    <div style={{ background:"#fff", padding:"40px 48px", borderBottom:`1px solid ${BORDER}` }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div style={{ display:"flex", gap:12, marginBottom:18 }}>
          <div style={{ flex:1, border:`2px solid ${BORDER}`, borderRadius:12, display:"flex", alignItems:"center", background:"#fff", padding:"8px 18px", gap:10, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
            <span style={{ color:"#9CA3AF", fontSize:16 }}>🔍</span>
            <input style={{ border:"none", background:"none", fontSize:15, flex:1, color:INK, fontFamily:"inherit", outline:"none" }} placeholder="Titre de poste, compétence, entreprise…" aria-label="Rechercher un poste"/>
          </div>
          <div style={{ width:220, border:`2px solid ${BORDER}`, borderRadius:12, display:"flex", alignItems:"center", background:"#fff", padding:"8px 18px", gap:10 }}>
            <span style={{ color:"#9CA3AF", fontSize:16 }}>📍</span>
            <input style={{ border:"none", background:"none", fontSize:15, flex:1, color:INK, fontFamily:"inherit", outline:"none" }} placeholder="Ville ou Remote" aria-label="Localisation"/>
          </div>
          <button style={{ background:G, color:"white", border:"none", padding:"0 28px", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", minHeight:50 }}>
            Rechercher
          </button>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              fontSize:12, fontWeight:500, padding:"7px 18px", borderRadius:20,
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
            jobs:      Math.floor(ease * targets.jobs),
            companies: Math.floor(ease * targets.companies),
            candidates:Math.floor(ease * targets.candidates),
            rate:      Math.floor(ease * targets.rate),
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
    { icon:"💼", val: counts.jobs.toLocaleString(),       suf:"+", label:"Offres Actives" },
    { icon:"🏢", val: counts.companies,                   suf:"+", label:"Entreprises" },
    { icon:"👥", val: counts.candidates.toLocaleString(), suf:"+", label:"Candidats" },
    { icon:"✓",  val: counts.rate,                        suf:"%", label:"Taux de placement" },
  ];

  return (
    <div ref={ref} style={{ background:`linear-gradient(135deg, ${G} 0%, ${G2} 100%)`, padding:"52px 48px" }}>
      <div style={{ maxWidth:1300, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign:"center", padding:"16px 0", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:44, fontWeight:800, color:"#fff", lineHeight:1, letterSpacing:"-1.5px" }}>
              {s.val}<span style={{ color:O, fontSize:30 }}>{s.suf}</span>
            </div>
            <div style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.75)", marginTop:8 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── JOB CARD ──────────────────────────────────────────────── */
function JobCard({ job, delay }) {
  const [ref, style] = useReveal(delay);
  const [saved, setSaved] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const barRef = useRef(null);
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

  return (
    <div ref={ref} style={{
      ...style,
      background:"#fff", border:`1.5px solid ${BORDER}`, borderRadius:14, padding:24,
      cursor:"pointer", position:"relative", overflow:"hidden",
      transition:"all 0.25s cubic-bezier(0.16,1,0.3,1)",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=G; e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 12px 36px rgba(26,92,46,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
    >
      {/* Top accent */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${G},${O})` }}/>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <div style={{ width:44, height:44, borderRadius:12, background:G_L, border:`1.5px solid rgba(26,92,46,0.13)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:G, flexShrink:0 }}>
            {job.logo}
          </div>
          <div>
            <div style={{ fontSize:12, color:MUTED, fontWeight:400 }}>{job.company}</div>
            {job.remote && <span style={{ fontSize:9, fontWeight:700, color:G, background:G_L, border:`1px solid rgba(26,92,46,0.2)`, borderRadius:8, padding:"1px 7px", letterSpacing:"0.5px" }}>REMOTE</span>}
          </div>
        </div>
        <button onClick={() => setSaved(s => !s)} style={{ background: saved ? O_L : "none", border:"none", cursor:"pointer", color: saved ? O : "#D1D5DB", fontSize:18, padding:4, borderRadius:6, lineHeight:1, transition:"all 0.2s" }} aria-label="Sauvegarder">
          {saved ? "♥" : "♡"}
        </button>
      </div>

      <h3 style={{ fontSize:15, fontWeight:700, color:INK, marginBottom:8, lineHeight:1.35 }}>{job.title}</h3>
      <div style={{ display:"flex", gap:14, fontSize:12, color:MUTED, marginBottom:10 }}>
        <span>📍 {job.location}</span>
        <span>⏱ {job.type}</span>
        <span>👥 {job.applicants}</span>
      </div>

      {/* Match bar */}
      <div style={{ marginBottom:12 }} ref={barRef}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
          <span style={{ color:MUTED, fontWeight:500 }}>Compatibilité IA</span>
          <span style={{ fontWeight:700, color:matchColor }}>{job.match}%</span>
        </div>
        <div style={{ height:4, background:"#F3F4F6", borderRadius:4 }}>
          <div style={{ height:"100%", borderRadius:4, background:barGrad, width: barVisible ? `${job.match}%` : "0%", transition:"width 1.2s ease" }}/>
        </div>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {job.tags.map(t => (
          <span key={t} style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background:G_L, color:G, fontWeight:600, border:`1px solid rgba(26,92,46,0.13)` }}>{t}</span>
        ))}
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:`1px solid ${BORDER}`, paddingTop:14 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:G }}>{job.salary}</div>
          <div style={{ fontSize:11, fontWeight:600, color:fresh.color, marginTop:2 }}>● {fresh.label}</div>
        </div>
        <button style={{ background:G, color:"white", border:"none", padding:"9px 20px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          Postuler →
        </button>
      </div>
    </div>
  );
}

/* ─── JOBS SECTION ──────────────────────────────────────────── */
function JobsSection() {
  const [ref, style] = useReveal(0);
  return (
    <section style={{ background:"#F9FAFB", padding:"80px 48px" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div ref={ref} style={{ ...style, display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:44 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:O, letterSpacing:"2.5px", marginBottom:6 }}>SÉLECTIONNÉS POUR VOUS</div>
            <h2 style={{ fontSize:34, fontWeight:800, color:INK, letterSpacing:"-0.5px" }}>Dernières Opportunités</h2>
            <p style={{ fontSize:14, color:MUTED, marginTop:4, fontWeight:300 }}>Offres filtrées par compatibilité avec votre profil</p>
          </div>
          <a href="#" style={{ fontSize:14, fontWeight:600, color:G, textDecoration:"none", display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>
            Voir les 10 000+ offres →
          </a>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18 }}>
          {JOBS.map((job, i) => <JobCard key={job.id} job={job} delay={[60,140,220,300,380,460][i]} />)}
        </div>
      </div>
    </section>
  );
}

/* ─── CATEGORIES ────────────────────────────────────────────── */
function CategoriesSection() {
  const [hRef, hStyle] = useReveal(0);
  return (
    <section style={{ background:"#fff", padding:"80px 48px" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div ref={hRef} style={{ ...hStyle, textAlign:"center", marginBottom:50 }}>
          <div style={{ fontSize:11, fontWeight:700, color:O, letterSpacing:"2.5px", marginBottom:6 }}>EXPLORER</div>
          <h2 style={{ fontSize:34, fontWeight:800, color:INK, letterSpacing:"-0.5px" }}>Parcourir par Secteur</h2>
          <p style={{ fontSize:14, color:MUTED, marginTop:4, fontWeight:300 }}>Survolez une carte pour voir le salaire moyen</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {CATEGORIES.map((cat, i) => {
            const [ref, style] = useReveal([60,140,220,300,380,460,540,620][i]);
            return (
              <div key={cat.name} ref={ref} style={{
                ...style,
                background:"#fff", border:`1.5px solid ${BORDER}`, borderRadius:14, padding:"24px 20px",
                cursor:"pointer", transition:"all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=G; e.currentTarget.style.transform="translateY(-5px)"; e.currentTarget.style.boxShadow="0 10px 28px rgba(26,92,46,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
              >
                <span style={{ fontSize:28, display:"block", marginBottom:12 }}>{cat.icon}</span>
                <div style={{ fontWeight:700, fontSize:15, color:INK, marginBottom:4 }}>{cat.name}</div>
                <div style={{ fontSize:12, color:MUTED, fontWeight:300 }}>{cat.count} offres</div>
                <div style={{ marginTop:12, borderTop:`1px dashed ${BORDER}`, paddingTop:10, fontSize:11, color:"#22C55E", fontWeight:700 }}>↑ {cat.trend} ce mois</div>
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
  const [hRef, hStyle] = useReveal(0);
  return (
    <section style={{ background:"#F9FAFB", padding:"80px 48px" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div ref={hRef} style={{ ...hStyle, textAlign:"center", marginBottom:50 }}>
          <div style={{ fontSize:11, fontWeight:700, color:O, letterSpacing:"2.5px", marginBottom:6 }}>RECRUTEURS</div>
          <h2 style={{ fontSize:34, fontWeight:800, color:INK, letterSpacing:"-0.5px" }}>Entreprises qui recrutent</h2>
          <p style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, color:MUTED, fontSize:14, fontWeight:300, marginTop:8 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"blink 1.3s infinite" }}/>
            Pulse vert = postes ouverts en ce moment
          </p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {COMPANIES.map((co, i) => {
            const [ref, style] = useReveal([60,140,220,300,380,460,540,620][i]);
            return (
              <div key={co.name} ref={ref} style={{
                ...style,
                background:"#fff", border:`1.5px solid ${BORDER}`, borderRadius:12, padding:"18px 20px",
                cursor:"pointer", display:"flex", alignItems:"center", gap:14, transition:"all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=G; e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 20px rgba(26,92,46,0.09)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
              >
                <div style={{ width:48, height:48, borderRadius:12, background:G_L, border:`1.5px solid rgba(26,92,46,0.13)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12, color:G, position:"relative", flexShrink:0 }}>
                  {co.abbr}
                  {co.hot && <span style={{ position:"absolute", top:-4, right:-4, width:11, height:11, borderRadius:"50%", background:"#22C55E", border:"2.5px solid white", animation:"blink 1.4s infinite" }}/>}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:INK }}>{co.name}</div>
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
  const [ref, style] = useReveal(0);
  return (
    <section style={{ background:`linear-gradient(135deg, ${O} 0%, #EA580C 100%)`, padding:"88px 48px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-80, right:-80, width:400, height:400, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:-100, left:-60, width:320, height:320, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }}/>
      <div ref={ref} style={{ ...style, maxWidth:1300, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"center", position:"relative", zIndex:1 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"2.5px", color:"rgba(255,255,255,0.8)", marginBottom:16 }}>POUR LES RECRUTEURS</div>
          <h2 style={{ fontSize:44, fontWeight:800, color:"white", letterSpacing:"-1px", lineHeight:1.1, marginBottom:20 }}>Recrutez les meilleurs<br/>talents d'Afrique</h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,0.85)", lineHeight:1.75, fontWeight:300, marginBottom:36, maxWidth:420 }}>
            Publiez une offre en moins de 5 minutes. Atteignez 50 000+ candidats qualifiés au Cameroun et au-delà. Matching IA inclus.
          </p>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:28 }}>
            <button style={{ background:"white", color:O, border:"none", padding:"14px 30px", borderRadius:10, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 20px rgba(0,0,0,0.15)" }}>
              Publier une offre →
            </button>
            <button style={{ background:"transparent", color:"white", border:"2px solid rgba(255,255,255,0.5)", padding:"14px 26px", borderRadius:10, fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              Voir les tarifs
            </button>
          </div>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {["Sans carte bancaire","1er post gratuit","Annulez à tout moment"].map(p => (
              <span key={p} style={{ fontSize:12, color:"rgba(255,255,255,0.8)", display:"flex", alignItems:"center", gap:5 }}><strong>✓</strong> {p}</span>
            ))}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[{ val:"5 min", label:"pour publier" },{ val:"50 000+", label:"candidats actifs" },{ val:"94%", label:"satisfaction" },{ val:"Gratuit", label:"pour commencer" }].map(s => (
            <div key={s.label} style={{ background:"rgba(255,255,255,0.12)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:14, padding:"22px 20px", textAlign:"center" }}>
              <div style={{ fontSize:28, fontWeight:800, color:"white", letterSpacing:"-0.5px" }}>{s.val}</div>
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
    <section style={{ background:"#fff", padding:"72px 48px", borderTop:`1px solid ${BORDER}` }}>
      <div ref={ref} style={{ ...style, maxWidth:560, margin:"0 auto", textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:14 }}>📬</div>
        <h3 style={{ fontSize:28, fontWeight:800, color:INK, letterSpacing:"-0.5px", marginBottom:10 }}>Offres dans votre boîte mail</h3>
        <p style={{ fontSize:14, color:MUTED, marginBottom:28, fontWeight:300, lineHeight:1.65 }}>
          Sélection personnalisée chaque semaine. Aucun spam. Désabonnement en 1 clic.
        </p>
        <div style={{ display:"flex", border:`2px solid ${BORDER}`, borderRadius:12, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.05)", background:"white" }}>
          <input style={{ flex:1, border:"none", background:"none", fontSize:15, color:INK, padding:"14px 20px", fontFamily:"inherit", outline:"none" }} type="email" placeholder="votre@email.com" aria-label="Adresse e-mail"/>
          <button style={{ background:G, color:"white", border:"none", padding:"0 24px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>S'abonner</button>
        </div>
        <p style={{ fontSize:12, color:"#D1D5DB", marginTop:12, fontWeight:300 }}>Rejoint par 12 400+ professionnels</p>
      </div>
    </section>
  );
}

/* ─── FOOTER ────────────────────────────────────────────────── */
function Footer({ logoSrc }) {
  return (
    <footer style={{ background:G2, padding:"60px 48px 28px" }}>
      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr 1fr 1fr", gap:40, marginBottom:48 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              {/* Logo */}
                      <div style={{ display:"flex", alignItems:"center"}}>
                        <div
                          style={{
                            width:70, height:60, borderRadius:8, overflow:"hidden",
                            display:"flex", alignItems:"center", justifyContent:"center"
                            }}
                        >
                          <img src={Kora_Logo} alt="Logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                        </div>
                        <div>
                                        <div style={{ fontWeight:800, fontSize:18, color:"white" }}>KORA</div>
                                        <div style={{ fontSize:9, color:O, fontWeight:600, letterSpacing:"1.5px" }}>UNLOCK YOUR CAREER</div>
                                      </div>
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
              <div style={{ fontSize:11, fontWeight:700, color:O, letterSpacing:1, marginBottom:18 }}>{col.title}</div>
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
      position:"fixed", bottom:28, right:28, zIndex:300, width:44, height:44, borderRadius:12,
      border:`2px solid rgba(26,92,46,0.2)`, background:"white", color:G, cursor:"pointer", fontSize:16,
      display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(0,0,0,0.12)",
    }} aria-label="Retour en haut">
      ↑
    </button>
  );
}

/* ─── APP ROOT ──────────────────────────────────────────────── */
export default function KoraLanding() {
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