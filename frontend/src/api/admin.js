import apiClient from './client';

// ─── Employers ────────────────────────────────────────────────────────────────
// Backend: /api/v1/employers  (EmployerController)

export const fetchEmployers = async (filter = 'all') => {
  const endpoint =
    filter === 'pending'
      ? '/api/v1/employers/pending'
      : filter === 'approved'
      ? '/api/v1/employers/approved'
      : '/api/v1/employers';
  const { data } = await apiClient.get(endpoint);
  return Array.isArray(data) ? data : data.content ?? [];
};

export const approveEmployer = async (id) => {
  const { data } = await apiClient.patch(`/api/v1/employers/${id}/approve`);
  return data;
};

export const suspendEmployer = async (id) => {
  await apiClient.patch(`/api/v1/employers/${id}/deactivate`);
};

export const deleteEmployer = async (id) => {
  await apiClient.delete(`/api/v1/employers/${id}`);
};

// ─── Jobs ──────────────────────────────────────────────────────────────────────
// Backend: /api/admin/jobs  (AdminJobListingController)
// Response shape: ApiResponse<Page<JobListingSummary>>
//   → { success, message, data: { content: [...], totalPages, ... } }

export const fetchAdminJobs = async ({ status = '', page = 0, size = 20 } = {}) => {
  const params = new URLSearchParams({ page, size });
  if (status) params.set('status', status);
  const { data } = await apiClient.get(`/api/admin/jobs?${params}`);
  // Unwrap ApiResponse envelope: data.data is the Page object
  return data.data ?? data;
};

export const approveJob = async (id) => {
  const { data } = await apiClient.patch(`/api/admin/jobs/${id}/approve`, { status: 'ACTIVE' });
  return data.data ?? data;
};

export const flagJob = async (id, reason = '') => {
  const { data } = await apiClient.patch(`/api/admin/jobs/${id}/approve`, {
    status: 'DRAFT',
    reason,
  });
  return data.data ?? data;
};

export const deleteJob = async (id) => {
  await apiClient.delete(`/api/admin/jobs/${id}`);
};

// ─── Job Seekers ──────────────────────────────────────────────────────────────
// Backend: /api/v1/jobseekers  (JobSeekerController)

export const fetchJobSeekers = async () => {
  const { data } = await apiClient.get('/api/v1/jobseekers');
  return Array.isArray(data) ? data : data.content ?? [];
};

export const suspendJobSeeker = async (id) => {
  await apiClient.patch(`/api/v1/jobseekers/${id}/deactivate`);
};

// ─── Admin Users (all roles) ──────────────────────────────────────────────────
// Backend: /api/admin/users  (AdminController)

export const fetchAdminUsers = async () => {
  const { data } = await apiClient.get('/api/admin/users');
  return Array.isArray(data) ? data : [];
};

export const toggleUserStatus = async (id) => {
  const { data } = await apiClient.put(`/api/admin/users/${id}/toggle-status`);
  return data;
};

// ─── Market / Reports ─────────────────────────────────────────────────────────
// Backend: /api/v1/insights  (MarketInsightController)

export const fetchMarketInsights = async () => {
  try {
    const { data } = await apiClient.get('/api/v1/insights');
    return data;
  } catch {
    return null;
  }
};

// ─── Overview Stats ───────────────────────────────────────────────────────────
// Backend: /api/admin/stats  (AdminController → AdminService)

export const fetchOverviewStats = async () => {
  const { data } = await apiClient.get('/api/admin/stats');
  return data;
};