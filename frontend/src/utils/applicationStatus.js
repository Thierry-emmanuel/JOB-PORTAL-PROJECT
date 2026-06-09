/** UI status when backend keeps SHORTLISTED but an interview exists. */
export function getApplicationDisplayStatus(app) {
  if (!app?.status) return 'APPLIED';
  if (
    app.status === 'SHORTLISTED'
    && (app.interview?.id || app.hasInterview)
  ) {
    return 'INTERVIEW_SCHEDULED';
  }
  return app.status;
}
