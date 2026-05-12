import apiClient from './client';

// ─── JobSeeker API ──────────────────────────────────────────────────────────

export const getJobSeekerProfile = async (id) => {
  const response = await apiClient.get(`/api/v1/jobseekers/${id}`);
  return response.data;
};

export const updateJobSeekerProfile = async (id, profileData) => {
  const response = await apiClient.put(`/api/v1/jobseekers/${id}`, profileData);
  return response.data;
};

// ─── Employer API ───────────────────────────────────────────────────────────

export const getEmployerProfile = async (id) => {
  const response = await apiClient.get(`/api/v1/employers/${id}`);
  return response.data;
};

export const updateEmployerProfile = async (id, profileData) => {
  const response = await apiClient.put(`/api/v1/employers/${id}`, profileData);
  return response.data;
};
