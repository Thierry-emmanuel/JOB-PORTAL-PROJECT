/**
 * cachedApi.js — Drop-in cached wrappers for all public read-only calls.
 *
 * Import from this file instead of directly from ./jobs, ./insights, ./hero
 * whenever you only need to READ data.  For mutations (POST/PUT/PATCH/DELETE)
 * keep importing directly from the original files.
 *
 * After a mutation that changes public data, call the relevant invalidate():
 *
 *   import { invalidateJobs } from '../api/cachedApi';
 *   await createJob(payload);
 *   invalidateJobs();         // next read will refetch
 */

import { cached, invalidate, TTL } from './cache';
import { getJobs, getJob, getJobDetail, getCategories, getCompanies, getLocations, getSkills } from './jobs';
import { fetchLiveHero } from './hero';
import { getSalaryByCategory, getDemandTrends } from './insights';

/* ─── Key builders ─────────────────────────────────────────── */
// Keys are deterministic strings so identical params share the same cache slot.

const jobsKey = (params) => `jobs:${JSON.stringify(params)}`;

/* ─── Jobs ─────────────────────────────────────────────────── */

/**
 * Cached getJobs.  Filters cause a shorter TTL (30 s) because the user
 * expects their filter results to feel fresh.
 */
export function cachedGetJobs(params = {}) {
  const hasFilters = !!(
    params.search || params.location || params.type ||
    params.category || params.experienceLevel || params.salaryMin || params.salaryMax
  );
  const ttl = hasFilters ? TTL.JOBS_FILTERED : TTL.JOBS;
  return cached(jobsKey(params), () => getJobs(params), ttl);
}

/** Bust ALL job list cache entries (call after createJob / updateJob). */
export const invalidateJobs = () => invalidate('jobs:');

/**
 * Cached single-job fetch.
 * TTL is 2 min — detail pages are read-only and rarely change mid-session.
 * saveJob / applyToJob don't need to bust this; those are mutations on
 * application data, not on the job posting itself.
 */
export function cachedGetJob(id) {
  return cached(`job:${id}`, () => getJob(id), 2 * 60_000);
}

/**
 * Cached view-only job detail (includes expired/draft jobs).
 * Same TTL as cachedGetJob.
 */
export function cachedGetJobDetail(id) {
  return cached(`job-detail:${id}`, () => getJobDetail(id), 2 * 60_000);
}

/** Bust a single job from cache (call after employer edits a job). */
export function invalidateJob(id) {
  invalidate(`job:${id}`);
  invalidate(`job-detail:${id}`);
}

/* ─── Categories ───────────────────────────────────────────── */

export function cachedGetCategories() {
  return cached('categories', getCategories, TTL.CATEGORIES);
}

export const invalidateCategories = () => invalidate('categories');

/* ─── Companies ────────────────────────────────────────────── */

export function cachedGetCompanies() {
  return cached('companies', getCompanies, TTL.COMPANIES);
}

export const invalidateCompanies = () => invalidate('companies');

/* ─── Hero config ──────────────────────────────────────────── */

export function cachedFetchLiveHero() {
  return cached('hero', fetchLiveHero, TTL.HERO);
}

export const invalidateHero = () => invalidate('hero');

/* ─── Insights ─────────────────────────────────────────────── */

export function cachedGetSalaryByCategory() {
  return cached('insights:salary', getSalaryByCategory, TTL.INSIGHTS);
}

export function cachedGetDemandTrends() {
  return cached('insights:trends', getDemandTrends, TTL.INSIGHTS);
}

export const invalidateInsights = () => invalidate('insights:');

/* ─── Reference data (locations, skills) ──────────────────── */

export function cachedGetLocations() {
  return cached('locations', getLocations, TTL.LOCATIONS);
}

export function cachedGetSkills() {
  return cached('skills', getSkills, TTL.SKILLS);
}

export const invalidateRefData = () => {
  invalidate('locations');
  invalidate('skills');
  invalidate('categories');
};