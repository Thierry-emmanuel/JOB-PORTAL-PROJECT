import apiClient from './client';

export const getJobs = async (params) => {
  const { data } = await apiClient.get('/api/jobs', { params });
  return data;
};

export const getJob = async (id) => {
  const { data } = await apiClient.get(`/api/jobs/${id}`);
  return data;
};

export const applyToJob = async (id, formData) => {
  const { data } = await apiClient.post(`/api/jobs/${id}/apply`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const rateJob = async (id, rating) => {
  const { data } = await apiClient.post(`/api/jobs/${id}/rate`, { rating });
  return data;
};

export const getUserApplications = async (seekerId) => {
  const { data } = await apiClient.get(`/api/v1/applications/seekers/${seekerId}/with-interviews`);
  return data.content || data;
};

export const getUserInterviews = async (seekerId) => {
  const { data } = await apiClient.get(`/api/v1/interviews/seekers/${seekerId}`);
  return data.content || data;
};

export const saveJob = async (id) => {
  const { data } = await apiClient.post(`/api/jobs/${id}/save`);
  return data;
};

const jobsService = {
  getJobs,
  getJob,
  applyToJob,
  rateJob,
  getUserApplications,
  getUserInterviews,
  saveJob
};

export default jobsService;