/**
 * cache.js — Shared in-memory TTL cache for public/read-only API calls.
 *
 * WHY THIS EXISTS
 * ---------------
 * The Spring Boot backend is deployed on Render's free tier, which spins
 * the JVM down after 15 min of inactivity. The first request after a cold
 * start can take 15–30 s. Without caching, every page navigation that
 * happens to call the same endpoint hits the network again, burning extra
 * latency and triggering slow-start warnings.
 *
 * STRATEGY
 * --------
 * • All public, read-only calls (jobs, categories, companies, insights,
 *   hero config) are routed through this module's `cached()` helper.
 * • Each entry has a configurable TTL (default 60 s).  After expiry the
 *   next caller refetches transparently.
 * • Write / mutation operations (POST/PUT/PATCH/DELETE) NEVER go through
 *   the cache — they always hit the network.
 * • The cache lives only for the current browser tab session. It resets
 *   on page refresh (intentional — keeps data fresh without stale-data bugs).
 * • There is a request-deduplication layer: if two components mount at the
 *   same time and both call the same endpoint, only ONE network request is
 *   made; both callers await the same Promise.
 *
 * TTLS BY DATA TYPE
 * -----------------
 * | Data               | TTL    | Rationale                        |
 * |--------------------|--------|----------------------------------|
 * | Hero config        | 5 min  | Admin can update, but rarely     |
 * | Categories         | 5 min  | Stable reference data            |
 * | Companies list     | 5 min  | Stable reference data            |
 * | Salary/trends      | 5 min  | Computed aggregates, slow-moving |
 * | Jobs (no filters)  | 60 s   | New postings may appear          |
 * | Jobs (with filters)| 30 s   | User-driven, shorter felt need   |
 * | Locations/Skills   | 10 min | Very stable reference data       |
 *
 * USAGE
 * -----
 *   import { cached, invalidate, TTL } from './cache';
 *
 *   // Wrap any async function that returns data:
 *   const jobs = await cached('jobs:page1', () => getJobs({ page:1 }), TTL.JOBS);
 *
 *   // After a mutation, bust the relevant prefix:
 *   invalidate('jobs:');  // clears all keys that start with 'jobs:'
 */

/* ── Storage ───────────────────────────────────────────────── */
const _store  = new Map();   // key → { value, expiresAt }
const _inflight = new Map(); // key → Promise  (dedup layer)

/* ── TTL constants (milliseconds) ─────────────────────────── */
export const TTL = {
  HERO:       5 * 60_000,   // 5 min
  CATEGORIES: 5 * 60_000,
  COMPANIES:  5 * 60_000,
  INSIGHTS:   5 * 60_000,
  LOCATIONS:  10 * 60_000,
  SKILLS:     10 * 60_000,
  JOBS:       60_000,        // 60 s
  JOBS_FILTERED: 30_000,     // 30 s
};

/* ── Core helpers ──────────────────────────────────────────── */

/** Return cached value or null if missing / expired. */
function _get(key) {
  const hit = _store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) { _store.delete(key); return null; }
  return hit.value;
}

/** Store a value with TTL. */
function _set(key, value, ttlMs) {
  _store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/* ── Public API ────────────────────────────────────────────── */

/**
 * cached(key, fetcher, ttlMs?)
 *
 * Returns a cached value if fresh, otherwise calls `fetcher()`, stores the
 * result, and returns it.  Concurrent callers with the same key share one
 * in-flight Promise (no duplicate network requests).
 *
 * @param {string}   key      - Cache key (use ':' as namespace separator)
 * @param {Function} fetcher  - Async fn that returns the data
 * @param {number}   ttlMs    - How long to keep the value (default: TTL.JOBS)
 */
export async function cached(key, fetcher, ttlMs = TTL.JOBS) {
  // 1. Cache hit
  const hit = _get(key);
  if (hit !== null) return hit;

  // 2. Dedup: if another caller already launched this request, piggyback
  if (_inflight.has(key)) return _inflight.get(key);

  // 3. Launch the request
  const promise = fetcher()
    .then((value) => {
      _set(key, value, ttlMs);
      _inflight.delete(key);
      return value;
    })
    .catch((err) => {
      _inflight.delete(key);
      throw err;
    });

  _inflight.set(key, promise);
  return promise;
}

/**
 * invalidate(prefix?)
 *
 * Remove all keys that start with `prefix`.
 * Pass no argument to clear the entire cache.
 *
 * @param {string} [prefix] - e.g. 'jobs:', 'hero', ''
 */
export function invalidate(prefix = '') {
  if (!prefix) { _store.clear(); return; }
  for (const key of _store.keys()) {
    if (key.startsWith(prefix)) _store.delete(key);
  }
}

/**
 * peek(key) — Inspect cache without triggering a fetch.
 * Useful for debug panels or preloading checks.
 */
export function peek(key) {
  return _get(key);
}