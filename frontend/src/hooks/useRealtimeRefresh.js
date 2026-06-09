import { useEffect } from 'react';

const APPLICATION_EVENTS = new Set([
  'APPLICATION_CREATED',
  'APPLICATION_STATUS_CHANGED',
  'NEW_APPLICATION',
  'APPLICATION_STATUS',
]);

const INTERVIEW_EVENTS = new Set([
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_RESCHEDULED',
  'INTERVIEW_CANCELLED',
  'INTERVIEW_RESULT',
]);

/**
 * Subscribe to kora:realtime CustomEvents (dispatched from NotificationContext STOMP).
 * @param {() => void} onRefresh
 * @param {{ applications?: boolean, interviews?: boolean }} scope
 */
export default function useRealtimeRefresh(onRefresh, scope = { applications: true, interviews: true }) {
  useEffect(() => {
    if (!onRefresh) return;

    const handler = (e) => {
      const event = e.detail?.event || e.detail?.type;
      if (!event) return;
      const wantsApp = scope.applications && APPLICATION_EVENTS.has(event);
      const wantsIv = scope.interviews && INTERVIEW_EVENTS.has(event);
      if (wantsApp || wantsIv) onRefresh();
    };

    window.addEventListener('kora:realtime', handler);
    return () => window.removeEventListener('kora:realtime', handler);
  }, [onRefresh, scope.applications, scope.interviews]);
}
