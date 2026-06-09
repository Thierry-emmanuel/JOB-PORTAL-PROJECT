import apiClient from './client';

/**
 * Interview API Service
 * Base path: /api/v1/interviews
 * Matches InterviewController endpoints exactly.
 */

function normalizeInterview(iv) {
  if (!iv || typeof iv !== 'object') return iv;
  const type = iv.type ?? iv.interviewType;
  return {
    ...iv,
    type,
    interviewType: type,
    location: type === 'IN_PERSON' ? (iv.meetingLink || iv.platform || iv.location) : iv.location,
  };
}

function normalizeList(data) {
  const list = data?.content ?? (Array.isArray(data) ? data : []);
  return list.map(normalizeInterview);
}

function toLocalDateTime(value) {
  if (!value) return value;
  if (typeof value === 'string' && value.length === 16) return `${value}:00`;
  return value;
}

export function getApiErrorMessage(err, fallback = 'Request failed.') {
  const d = err?.response?.data;
  if (typeof d === 'string') return d;
  return d?.detail || d?.message || d?.error || err?.message || fallback;
}

/* ─── Schedule ───────────────────────────────────────────── */

/**
 * Schedule a new interview for an application.
 * POST /api/v1/interviews/applications/{applicationId}
 * Body: ScheduleInterviewRequest { scheduledAt, type, platform, meetingLink, notes }
 */
export const scheduleInterview = async (applicationId, data) => {
  const payload = {
    ...data,
    scheduledAt: toLocalDateTime(data.scheduledAt),
  };
  const response = await apiClient.post(
    `/api/v1/interviews/applications/${applicationId}`,
    payload,
  );
  return normalizeInterview(response.data);
};

/* ─── Read ───────────────────────────────────────────────── */

export const getInterviewById = async (id) => {
  const response = await apiClient.get(`/api/v1/interviews/${id}`);
  return response.data;
};

export const getInterviewsBySeeker = async (seekerId) => {
  const response = await apiClient.get(`/api/v1/interviews/seekers/${seekerId}`, {
    params: { page: 0, size: 100 },
  });
  return normalizeList(response.data);
};

export const getPendingInterviewsBySeeker = async (seekerId) => {
  const response = await apiClient.get(
    `/api/v1/interviews/seekers/${seekerId}/pending`,
  );
  return response.data?.content ?? response.data ?? [];
};

export const getInterviewsByEmployer = async (employerId) => {
  const response = await apiClient.get(
    `/api/v1/interviews/employers/${employerId}`,
    { params: { page: 0, size: 100 } },
  );
  return normalizeList(response.data);
};

export const getInterviewsByJobPosting = async (jobPostingId) => {
  const response = await apiClient.get(
    `/api/v1/interviews/job-postings/${jobPostingId}`,
  );
  return response.data?.content ?? response.data ?? [];
};

/* ─── Update ─────────────────────────────────────────────── */

/**
 * Reschedule an interview.
 * PATCH /api/v1/interviews/{id}/reschedule
 * Body: RescheduleInterviewRequest { scheduledAt, reason? }
 */
export const rescheduleInterview = async (id, data) => {
  const payload = {
    ...data,
    newScheduledAt: toLocalDateTime(data.newScheduledAt ?? data.scheduledAt),
  };
  const response = await apiClient.patch(
    `/api/v1/interviews/${id}/reschedule`,
    payload,
  );
  return normalizeInterview(response.data);
};

/**
 * Record the interview result.
 * PATCH /api/v1/interviews/{id}/result
 * Body: RecordInterviewResultRequest { result: 'PASSED'|'FAILED'|'NO_SHOW', feedback? }
 */
export const recordInterviewResult = async (id, data) => {
  const response = await apiClient.patch(
    `/api/v1/interviews/${id}/result`,
    data,
  );
  return response.data;
};

/**
 * Add feedback to an interview (employer facing).
 * PATCH /api/v1/interviews/{id}/feedback
 * Body: AddFeedbackRequest { feedback }
 */
export const addInterviewFeedback = async (id, feedback) => {
  const response = await apiClient.patch(
    `/api/v1/interviews/${id}/feedback`,
    { feedback },
  );
  return response.data;
};

/* ─── Delete ─────────────────────────────────────────────── */

/**
 * Cancel / delete an interview.
 * DELETE /api/v1/interviews/{id}
 */
export const cancelInterview = async (id) => {
  await apiClient.delete(`/api/v1/interviews/${id}`);
};