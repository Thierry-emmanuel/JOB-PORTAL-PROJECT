/**
 * Extract a human-readable message from axios/API error responses.
 * Handles ProblemDetail, JobListing ApiResponse validation maps, and plain strings.
 */
export function extractApiError(err, fallback = 'Request failed. Please try again.') {
  const d = err?.response?.data;
  if (!d) return err?.message || fallback;
  if (typeof d === 'string') return d;
  if (d.detail) return d.detail;

  const nested = d.data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const fieldMsgs = Object.values(nested).filter(Boolean);
    if (fieldMsgs.length) return fieldMsgs.join(' ');
  }

  if (d.message && d.message !== 'Validation failed') return d.message;
  if (d.error) return d.error;
  return fallback;
}
