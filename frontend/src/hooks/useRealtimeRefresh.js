/**
 * useRealtimeRefresh.js
 * ─────────────────────────────────────────────────────────────────────
 * Subscribes to `kora:realtime` CustomEvents (dispatched by
 * NotificationContext's STOMP layer) and calls `onRefresh` when a
 * relevant event arrives.
 *
 * Regression prevention
 * ─────────────────────
 * • Event set names are unchanged — all existing callers still work.
 * • The hook only re-registers the listener when `onRefresh` identity
 *   or scope flags change, preventing infinite loops.
 * • HTTP fallback paths in each hook/page remain untouched.
 * ─────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';

/* ── Application-related realtime event names ───────────────────── */
const APPLICATION_EVENTS = new Set([
  'APPLICATION_CREATED',        // new submission → employer dashboard
  'APPLICATION_STATUS_CHANGED', // status update  → employee dashboard
  'APPLICATION_STATUS',         // legacy alias
  'NEW_APPLICATION',            // legacy alias
]);

/* ── Interview-related realtime event names ─────────────────────── */
const INTERVIEW_EVENTS = new Set([
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_RESCHEDULED',
  'INTERVIEW_CANCELLED',
  'INTERVIEW_RESULT',
  'INTERVIEW_COMPLETED',
]);

/* ── Admin / platform-level event names ─────────────────────────── */
const ADMIN_EVENTS = new Set([
  'USER_CREATED',
  'USER_SUSPENDED',
  'JOB_APPROVED',
  'JOB_FLAGGED',
  'EMPLOYER_APPROVED',
]);

/**
 * useRealtimeRefresh
 *
 * @param {() => void}  onRefresh  - Callback to trigger on matching event.
 *                                   Should be wrapped in useCallback to
 *                                   prevent excess re-registrations.
 * @param {object}      scope      - Flags controlling which event types trigger.
 *   @param {boolean}   [scope.applications=true]
 *   @param {boolean}   [scope.interviews=true]
 *   @param {boolean}   [scope.admin=false]
 */
export default function useRealtimeRefresh(
  onRefresh,
  scope = { applications: true, interviews: true, admin: false },
) {
  /* Stable ref to latest callback so the event listener never stales */
  const callbackRef = useRef(onRefresh);
  useEffect(() => { callbackRef.current = onRefresh; }, [onRefresh]);

  /* Destructure scope flags for effect dependencies */
  const { applications = true, interviews = true, admin = false } = scope;

  useEffect(() => {
    const handler = (e) => {
      /* Support both event shapes: { event: '...' } and { type: '...' } */
      const eventName = e.detail?.event || e.detail?.type;
      if (!eventName) return;

      const wantsApp   = applications && APPLICATION_EVENTS.has(eventName);
      const wantsIv    = interviews   && INTERVIEW_EVENTS.has(eventName);
      const wantsAdmin = admin        && ADMIN_EVENTS.has(eventName);

      if (wantsApp || wantsIv || wantsAdmin) {
        callbackRef.current?.();
      }
    };

    window.addEventListener('kora:realtime', handler);
    return () => window.removeEventListener('kora:realtime', handler);
  }, [applications, interviews, admin]);
}