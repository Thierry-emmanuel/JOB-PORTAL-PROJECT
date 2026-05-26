import apiClient from './client';

// ─── Overview Stats ─────────────────────────────────────────────────────────
export const fetchOverviewStats = async () => {
  const { data } = await apiClient.get('/api/admin/stats');
  return data;
};

// ─── Users (all roles) ───────────────────────────────────────────────────────
export const fetchAdminUsers = async () => {
  const { data } = await apiClient.get('/api/admin/users');
  return Array.isArray(data) ? data : [];
};

export const toggleUserStatus = async (id) => {
  const { data } = await apiClient.put(`/api/admin/users/${id}/toggle-status`);
  return data;
};

// ─── Employers ───────────────────────────────────────────────────────────────
export const fetchEmployers = async (filter = 'all') => {
  const endpoint =
    filter === 'pending'   ? '/api/v1/employers/pending'  :
    filter === 'approved'  ? '/api/v1/employers/approved' :
    '/api/v1/employers';
  const { data } = await apiClient.get(endpoint);
  return Array.isArray(data) ? data : data.content ?? [];
};

export const approveEmployer   = async (id) => { const { data } = await apiClient.patch(`/api/v1/employers/${id}/approve`);     return data; };
export const suspendEmployer   = async (id) => { await apiClient.patch(`/api/v1/employers/${id}/deactivate`); };
export const deleteEmployer    = async (id) => { await apiClient.delete(`/api/v1/employers/${id}`); };

// ─── Job Seekers ─────────────────────────────────────────────────────────────
export const fetchJobSeekers   = async () => { const { data } = await apiClient.get('/api/v1/jobseekers'); return Array.isArray(data) ? data : data.content ?? []; };
export const suspendJobSeeker  = async (id) => { await apiClient.patch(`/api/v1/jobseekers/${id}/deactivate`); };

// ─── Jobs ────────────────────────────────────────────────────────────────────
export const fetchAdminJobs = async ({ status = '', page = 0, size = 20 } = {}) => {
  const params = new URLSearchParams({ page, size });
  if (status) params.set('status', status);
  const { data } = await apiClient.get(`/api/admin/jobs?${params}`);
  return data.data ?? data;
};

export const approveJob = async (id) => {
  const { data } = await apiClient.patch(`/api/admin/jobs/${id}/approve`, { status: 'ACTIVE', reason: 'Approved by administrator' });
  return data.data ?? data;
};

export const flagJob = async (id, reason = '') => {
  const r = reason.length >= 10 ? reason : 'Flagged by platform administrator';
  const { data } = await apiClient.patch(`/api/admin/jobs/${id}/approve`, { status: 'DRAFT', reason: r });
  return data.data ?? data;
};

export const deleteJob = async (id) => { await apiClient.delete(`/api/admin/jobs/${id}`); };

// ─── Applications ────────────────────────────────────────────────────────────
export const fetchAllApplications = async ({ status = '', page = 0, size = 20 } = {}) => {
  const params = new URLSearchParams({ page, size });
  if (status) params.set('status', status);
  const { data } = await apiClient.get(`/api/v1/applications?${params}`);
  return data;
};

export const updateApplicationStatus = async (id, status) => {
  const { data } = await apiClient.patch(`/api/v1/applications/${id}/status`, { status });
  return data;
};

// ─── Categories ──────────────────────────────────────────────────────────────
export const fetchCategories      = async ()           => { const { data } = await apiClient.get('/api/admin/categories');            return Array.isArray(data) ? data : []; };
export const createCategory       = async (dto)        => { const { data } = await apiClient.post('/api/admin/categories', dto);       return data; };
export const deleteCategory       = async (id)         => { await apiClient.delete(`/api/admin/categories/${id}`); };

// ─── Skills ──────────────────────────────────────────────────────────────────
export const fetchSkills          = async ()           => { const { data } = await apiClient.get('/api/admin/skills');                 return Array.isArray(data) ? data : []; };
export const createSkill          = async (skill)      => { const { data } = await apiClient.post('/api/admin/skills', skill);         return data; };
export const deleteSkill          = async (id)         => { await apiClient.delete(`/api/admin/skills/${id}`); };

// ─── FAQs ────────────────────────────────────────────────────────────────────
export const fetchFAQs            = async ()           => { const { data } = await apiClient.get('/api/admin/faqs');                   return Array.isArray(data) ? data : []; };
export const createFAQ            = async (dto)        => { const { data } = await apiClient.post('/api/admin/faqs', dto);             return data; };
export const updateFAQ            = async (id, dto)    => { const { data } = await apiClient.put(`/api/admin/faqs/${id}`, dto);        return data; };
export const deleteFAQ            = async (id)         => { await apiClient.delete(`/api/admin/faqs/${id}`); };

// ─── Notifications ───────────────────────────────────────────────────────────
export const broadcastNotification = async ({ title, message, targetRole }) => {
  const params = new URLSearchParams({ title, message });
  if (targetRole) params.set('targetRole', targetRole);
  await apiClient.post(`/api/admin/notifications/broadcast?${params}`);
};

// ─── Market Insights ─────────────────────────────────────────────────────────
export const fetchMarketInsights = async () => {
  try { const { data } = await apiClient.get('/api/v1/insights'); return data; }
  catch { return null; }
};