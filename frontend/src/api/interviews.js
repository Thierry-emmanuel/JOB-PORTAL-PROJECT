import apiClient from './client';

/**
 * Interview API Service
 * Base path: /api/v1/interviews
 */

export const scheduleInterview = async (applicationId, data) => {
  const response = await apiClient.post(`/api/v1/interviews/applications/${applicationId}`, data);
  return response.data;
};

export const getInterviewById = async (id) => {
  const response = await apiClient.get(`/api/v1/interviews/${id}`);
  return response.data;
};

export const getInterviewsBySeeker = async (seekerId) => {
  const response = await apiClient.get(`/api/v1/interviews/seekers/${seekerId}`);
  return response.data;
};

export const getInterviewsByJobPosting = async (jobPostingId) => {
  const response = await apiClient.get(`/api/v1/interviews/job-postings/${jobPostingId}`);
  return response.data;
};

export const rescheduleInterview = async (id, data) => {
  const response = await apiClient.patch(`/api/v1/interviews/${id}/reschedule`, data);
  return response.data;
};

export const recordInterviewResult = async (id, data) => {
  const response = await apiClient.patch(`/api/v1/interviews/${id}/result`, data);
  return response.data;
};

export const cancelInterview = async (id) => {
  await apiClient.delete(`/api/v1/interviews/${id}`);
};

export const getPendingInterviewsBySeeker = async (seekerId) => {
  const response = await apiClient.get(`/api/v1/interviews/seekers/${seekerId}/pending`);
  return response.data;
};
