/**
 * KoraHero.jsx
 * ─────────────────────────────────────────────────────────────────
 * Fully dynamic Framer-Motion hero section.
 * All content (text, images, CTAs, transitions, overlay, stats)
 * is driven by the /api/public/hero response — nothing is hardcoded.
 *
 * Usage in KoraHome.jsx:
 *   import KoraHero from '../components/hero/KoraHero';
 *   <KoraHero />
 * ─────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building2, Users, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { fetchLiveHero } from '../../api/hero';
import '../../styles/kora-hero.css';

/* ── Fallback config (shown while loading or on error) ──────────── */
const FALLBACK = {
  headline:       'Find Your Dream Job in Cameroon',
  subheadline:    'Connecting top talent with leading employers across Africa.',
  ctaPrimary:     'Browse Jobs',
  ctaPrimaryUrl:  '/jobs',
  ctaSecondary:   'Post a Job',
  ctaSecondaryUrl:'/register',
  badgeText:      '1,200+ jobs available',
  backgroundType: 'gradient',
  gradientFrom:   '#1a1438',
  gradientTo:     '#1e3a5f',
  slides:         [],
  slideIntervalMs:4500,
  slideTransition:'fade',
  statsVisible:   true,
  statsDynamic:   false,
  statJobsLabel:  'Active Jobs',
  statCompaniesLabel:'Companies',
  statSeekersLabel:  'Job Seekers',
  liveJobCount:   1200,
  liveCompanyCount:  500,
  liveSeekerCount:   10000,
  layout:         'center',
  overlayOpacity: 0.58,
  textColor:      'light',
};

/* ── Framer variants per transition type ────────────────────────── */
const slideVariants = {
  fade: {
    enter: { opacity: 0 },
    center:{ opacity: 1, transition: { duration: 0.9, ease: 'easeInOut' } },
    exit:  { opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } },
  },
  slide: {
    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0.6 }),
    center:{ x: 0, opacity: 1, transition: { duration: 0.75, ease: [0.32, 0.72, 0, 1] } },
    exit:  (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0.6, transition: { duration: 0.55 } }),
  },
  zoom: {
    enter: { opacity: 0, scale: 1.06 },
    center:{ opacity: 1, scale: 1, transition: { duration: 1.1, ease: 'easeOut' } },
    exit:  { opacity: 0, scale: 0.97, transition: { duration: 0.55 } },
  },
};

/* ── Ken-Burns animation applied continuously to each slide image ── */
const kenBurns = {
  initial:  { scale: 1.08, x: 0, y: 0 },
  animate:  { scale: 1.0,  x: '-1%', y: '-0.5%' },
  transition:{ duration: 8, ease: 'linear', repeat: Infinity, repeatType: 'mirror' },
};

/* ── Text entrance stagger ──────────────────────────────────────── */
const textContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const textItem = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Stat counter animation ─────────────────────────────────────── */
function AnimatedCounter({ target, duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
          else setCount(target);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  const display = count >= 1000
    ? count >= 1000000
      ? `${(count / 1000000).toFixed(1)}M`
      : `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`
    : count.toString();

  return <span ref={ref}>{display}+</span>;
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function KoraHero() {
  const [config, setConfig]     = useState(FALLBACK);
  const [loading, setLoading]   = useState(true);
  const [slideIdx, setSlideIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused]     = useState(false);
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  /* Fetch live config */
  useEffect(() => {
    fetchLiveHero()
      .then(data => setConfig({ ...FALLBACK, ...data }))
      .catch(() => {/* keep fallback */})
      .finally(() => setLoading(false));
  }, []);

  /* Slideshow auto-advance */
  const slides = config.slides ?? [];
  const hasSlides = slides.length > 1;

  const advance = useCallback((dir = 1) => {
    setDirection(dir);
    setSlideIdx(i => (i + dir + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!hasSlides || paused) return;
    intervalRef.current = setInterval(() => advance(1), config.slideIntervalMs);
    return () => clearInterval(intervalRef.current);
  }, [hasSlides, paused, advance, config.slideIntervalMs]);

  /* Background resolver */
  const bgStyle = (() => {
    const type = config.backgroundType;
    if (type === 'image' && config.backgroundImageUrl) {
      return { backgroundImage: `url(${config.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return { background: `linear-gradient(145deg, ${config.gradientFrom} 0%, ${config.gradientTo} 100%)` };
  })();

  const textDark = config.textColor === 'dark';
  const isCenter = config.layout === 'center';
  const isSplit  = config.layout === 'split';

  const transition = config.slideTransition ?? 'fade';
  const variants   = slideVariants[transition] ?? slideVariants.fade;

  /* CTA nav helper */
  const go = (url) => {
    if (!url) return;
    if (url.startsWith('http')) window.open(url, '_blank');
    else navigate(url);
  };

  /* Stats */
  const stats = [
    {
      icon: <Briefcase size={16}/>,
      count: config.liveJobCount   ?? 1200,
      label: config.statJobsLabel  ?? 'Active Jobs',
    },
    {
      icon: <Building2 size={16}/>,
      count: config.liveCompanyCount ?? 500,
      label: config.statCompaniesLabel ?? 'Companies',
    },
    {
      icon: <Users size={16}/>,
      count: config.liveSeekerCount ?? 10000,
      label: config.statSeekersLabel ?? 'Job Seekers',
    },
  ];

  if (loading) {
    return (
      <div className="kh-root kh-loading" style={bgStyle}>
        <div className="kh-loader-ring"/>
      </div>
    );
  }

  return (
    <section
      className={`kh-root kh-layout-${config.layout}`}
      aria-label="Hero section"
    >
      {/* ── Background layer ───────────────────────────────────── */}
      <div className="kh-bg" style={!hasSlides ? bgStyle : {}}>
        {/* Slideshow */}
        {hasSlides && (
          <AnimatePresence mode="sync" custom={direction}>
            <motion.div
              key={slideIdx}
              className="kh-slide"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <motion.img
                src={slides[slideIdx].url}
                alt={slides[slideIdx].alt ?? ''}
                className="kh-slide-img"
                style={{ objectPosition: slides[slideIdx].position ?? 'center center' }}
                {...kenBurns}
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Gradient base (always shown, dims behind slides) */}
        <div
          className="kh-gradient-base"
          style={{ background: `linear-gradient(145deg, ${config.gradientFrom ?? '#1a1438'} 0%, ${config.gradientTo ?? '#1e3a5f'} 100%)` }}
        />

        {/* Overlay */}
        <div
          className="kh-overlay"
          style={{ opacity: config.overlayOpacity ?? 0.58 }}
        />

        {/* Grain texture */}
        <div className="kh-grain" aria-hidden="true"/>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className={`kh-content${isCenter ? ' center' : isSplit ? ' split' : ''} ${textDark ? 'dark' : 'light'}`}>

        {/* Badge */}
        {config.badgeText && (
          <motion.div
            className="kh-badge"
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <span className="kh-badge-dot" aria-hidden="true"/>
            {config.badgeText}
          </motion.div>
        )}

        {/* Headline + sub */}
        <motion.div
          className="kh-text-block"
          variants={textContainer}
          initial="hidden"
          animate="show"
        >
          <motion.h1 className="kh-headline" variants={textItem}>
            {config.headline}
          </motion.h1>
          {config.subheadline && (
            <motion.p className="kh-sub" variants={textItem}>
              {config.subheadline}
            </motion.p>
          )}
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="kh-ctas"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {config.ctaPrimary && (
            <motion.button
              className="kh-cta-primary"
              onClick={() => go(config.ctaPrimaryUrl)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {config.ctaPrimary}
            </motion.button>
          )}
          {config.ctaSecondary && (
            <motion.button
              className="kh-cta-secondary"
              onClick={() => go(config.ctaSecondaryUrl)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {config.ctaSecondary}
            </motion.button>
          )}
        </motion.div>

        {/* Stats bar */}
        {config.statsVisible && (
          <motion.div
            className="kh-stats"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.75 }}
          >
            {stats.map((s, i) => (
              <div key={i} className="kh-stat-item">
                <span className="kh-stat-icon">{s.icon}</span>
                <div>
                  <strong className="kh-stat-value">
                    <AnimatedCounter target={s.count} duration={1600 + i * 200}/>
                  </strong>
                  <span className="kh-stat-label">{s.label}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Slideshow controls ─────────────────────────────────── */}
      {hasSlides && (
        <>
          {/* Prev / Next */}
          <button className="kh-nav kh-nav-prev" onClick={() => advance(-1)} aria-label="Previous slide">
            <ChevronLeft size={22}/>
          </button>
          <button className="kh-nav kh-nav-next" onClick={() => advance(1)} aria-label="Next slide">
            <ChevronRight size={22}/>
          </button>

          {/* Dot indicators */}
          <div className="kh-dots" role="tablist" aria-label="Slide indicators">
            {slides.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === slideIdx}
                className={`kh-dot${i === slideIdx ? ' active' : ''}`}
                onClick={() => { setDirection(i > slideIdx ? 1 : -1); setSlideIdx(i); }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Play/Pause */}
          <button
            className="kh-playpause"
            onClick={() => setPaused(p => !p)}
            aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
          >
            {paused ? <Play size={14}/> : <Pause size={14}/>}
          </button>

          {/* Progress bar */}
          {!paused && (
            <motion.div
              key={slideIdx}
              className="kh-progress"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: (config.slideIntervalMs ?? 4500) / 1000, ease: 'linear' }}
              style={{ transformOrigin: 'left' }}
            />
          )}

          {/* Photo credit */}
          {slides[slideIdx]?.credit && (
            <p className="kh-credit">© {slides[slideIdx].credit}</p>
          )}
        </>
      )}
    </section>
  );
}