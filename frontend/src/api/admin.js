import apiClient from './client';

// ─── Employers ───────────────────────────────────────────────────────────────

export const fetchEmployers = async (filter = 'all') => {
  const endpoint =
    filter === 'pending'
      ? '/api/employers/pending'
      : filter === 'approved'
      ? '/api/employers/approved'
      : '/api/employers';
  const { data } = await apiClient.get(endpoint);
  return Array.isArray(data) ? data : data.content ?? [];
};

export const approveEmployer = async (id) => {
  const { data } = await apiClient.patch(`/api/employers/${id}/approve`);
  return data;
};

export const suspendEmployer = async (id) => {
  const { data } = await apiClient.patch(`/api/employers/${id}/deactivate`);
  return data;
};

export const deleteEmployer = async (id) => {
  const { data } = await apiClient.delete(`/api/employers/${id}`);
  return data;
};

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export const fetchAdminJobs = async ({ status = '', page = 0, size = 20 } = {}) => {
  const params = new URLSearchParams({ page, size });
  if (status) params.set('status', status);
  const { data } = await apiClient.get(`/api/admin/jobs?${params}`);
  return data.data || data;
};

export const approveJob = async (id) => {
  const { data } = await apiClient.patch(`/api/admin/jobs/${id}/approve`, { status: 'ACTIVE' });
  return data.data || data;
};

export const flagJob = async (id, reason = '') => {
  const { data } = await apiClient.patch(`/api/admin/jobs/${id}/approve`, {
    status: 'DRAFT',
    reason,
  });
  return data.data || data;
};

export const deleteJob = async (id) => {
  const { data } = await apiClient.delete(`/api/admin/jobs/${id}`);
  return data.data || data;
};

// ─── Job Seekers ──────────────────────────────────────────────────────────────

export const fetchJobSeekers = async () => {
  const { data } = await apiClient.get('/api/job-seekers');
  return Array.isArray(data) ? data : data.content ?? [];
};

export const suspendJobSeeker = async (id) => {
  const { data } = await apiClient.patch(`/api/job-seekers/${id}/deactivate`);
  return data;
};

// ─── Market / Reports ─────────────────────────────────────────────────────────

export const fetchMarketInsights = async () => {
  try {
    const { data } = await apiClient.get('/api/market/insights');
    return data;
  } catch {
    return null;
  }
};

// ─── Overview Stats (derived) ─────────────────────────────────────────────────

export const fetchOverviewStats = async () => {
  const [jobsResp, seekersResp, employersResp] = await Promise.allSettled([
    apiClient.get('/api/admin/jobs?size=1'),
    apiClient.get('/api/job-seekers'),
    apiClient.get('/api/employers'),
  ]);

  const totalJobs =
    jobsResp.status === 'fulfilled'
      ? jobsResp.value.data?.data?.totalElements ?? jobsResp.value.data?.totalElements ?? jobsResp.value.data?.length ?? 0
      : 0;

  const seekers =
    seekersResp.status === 'fulfilled'
      ? Array.isArray(seekersResp.value.data)
        ? seekersResp.value.data
        : seekersResp.value.data?.content ?? []
      : [];

  const employers =
    employersResp.status === 'fulfilled'
      ? Array.isArray(employersResp.value.data)
        ? employersResp.value.data
        : employersResp.value.data?.content ?? []
      : [];

  const pendingApprovals = employers.filter(
    (e) => e.status === 'PENDING' || !e.isActive
  ).length;

  return {
    totalUsers: seekers.length + employers.length,
    activeJobs: totalJobs,
    pendingApprovals,
    totalApplications: 0, // placeholder — no direct endpoint
    seekers,
    employers,
  };
};