import apiClient from './client';

export const loginUser = async (credentials) => {
  const response = await apiClient.post('/api/auth/login', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await apiClient.post('/api/auth/register', userData);
  return response.data;
};

/**
 * Submit employer verification / profile info after account creation.
 * Sent to the backend for admin review before the employer can post jobs.
 * Fields: contactName, phone, city, sector, website, jobTitle, bio, companyName
 */
export const updateEmployerVerificationInfo = async (data) => {
  const response = await apiClient.patch('/api/v1/employer/profile', data);
  return response.data;
};