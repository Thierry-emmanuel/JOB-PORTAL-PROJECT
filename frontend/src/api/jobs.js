/**
 * Jobs API helper
 * Set VITE_API_BASE_URL in your .env file, e.g.:
 *   VITE_API_BASE_URL=http://localhost:5000
 * If not set, the mock service is used automatically.
 */

import apiClient from './client';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// ─── Toggle mock mode ────────────────────────────────────────────────────────
export const useMock = true; // Forced mock for jobs until backend is implemented

// ─── Mock data ───────────────────────────────────────────────────────────────
const MOCK_JOBS = [
  {
    id: '1', title: 'Senior Frontend Engineer', company: 'Techwave Inc.',
    location: 'Remote', type: 'Full-time', salary: '$90k – $120k',
    description: 'Build beautiful, performant UIs with React and TypeScript.',
    tags: ['React', 'TypeScript', 'Tailwind'], postedAt: '2025-07-20',
    logo: null, saved: false, applied: false,
    companyInfo: { size: '200–500', industry: 'SaaS', website: 'https://techwave.io' },
  },
  {
    id: '2', title: 'Full Stack Developer', company: 'Buildify',
    location: 'New York, NY', type: 'Full-time', salary: '$80k – $105k',
    description: 'Work across the stack on a fast-growing construction-tech platform.',
    tags: ['Node.js', 'React', 'PostgreSQL'], postedAt: '2025-07-22',
    logo: null, saved: true, applied: false,
    companyInfo: { size: '50–200', industry: 'Construction Tech', website: 'https://buildify.com' },
  },
  {
    id: '3', title: 'Backend Engineer – Python', company: 'DataStream',
    location: 'Austin, TX', type: 'Contract', salary: '$70/hr',
    description: 'Design and maintain data pipelines and REST APIs.',
    tags: ['Python', 'Django', 'AWS'], postedAt: '2025-07-18',
    logo: null, saved: false, applied: true,
    companyInfo: { size: '10–50', industry: 'Data Analytics', website: 'https://datastream.ai' },
  },
  {
    id: '4', title: 'UI/UX Designer (Hybrid)', company: 'Creativa Studio',
    location: 'Los Angeles, CA', type: 'Part-time', salary: '$50k – $65k',
    description: 'Craft user experiences for web and mobile products.',
    tags: ['Figma', 'Prototyping', 'User Research'], postedAt: '2025-07-25',
    logo: null, saved: false, applied: false,
    companyInfo: { size: '10–50', industry: 'Design Agency', website: 'https://creativa.studio' },
  },
  {
    id: '5', title: 'DevOps Engineer', company: 'CloudNest',
    location: 'Remote', type: 'Full-time', salary: '$95k – $130k',
    description: 'Manage CI/CD pipelines, Kubernetes clusters and cloud infra.',
    tags: ['Kubernetes', 'Terraform', 'GCP'], postedAt: '2025-07-15',
    logo: null, saved: false, applied: false,
    companyInfo: { size: '500+', industry: 'Cloud Infrastructure', website: 'https://cloudnest.io' },
  },
  {
    id: '6', title: 'Mobile Developer – React Native', company: 'AppForge',
    location: 'Chicago, IL', type: 'Full-time', salary: '$85k – $110k',
    description: 'Build cross-platform mobile apps for iOS and Android.',
    tags: ['React Native', 'Expo', 'Firebase'], postedAt: '2025-07-28',
    logo: null, saved: false, applied: false,
    companyInfo: { size: '50–200', industry: 'Mobile Apps', website: 'https://appforge.dev' },
  },
];

const MOCK_APPLICATIONS = [
  { id: 'app1', jobId: '3', jobTitle: 'Backend Engineer – Python', company: 'DataStream', status: 'Under Review', appliedAt: '2025-07-19' },
  { id: 'app2', jobId: '1', jobTitle: 'Senior Frontend Engineer', company: 'Techwave Inc.', status: 'Interview Scheduled', appliedAt: '2025-07-21' },
];

const MOCK_INTERVIEWS = [
  {
    id: 'int1', jobTitle: 'Senior Frontend Engineer', company: 'Techwave Inc.',
    date: '2025-08-25', time: '10:00 AM EST', type: 'Video',
    meetLink: 'https://meet.google.com/abc-defg-hij',
  },
  {
    id: 'int2', jobTitle: 'Backend Engineer – Python', company: 'DataStream',
    date: '2025-08-28', time: '12:00 PM EST', type: 'In-person',
    meetLink: null,
  },
];

// Simulate network delay
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// ─── Mock service ─────────────────────────────────────────────────────────────
const mockService = {
  async getJobs({ search = '', location = '', type = '', page = 1, limit = 6 } = {}) {
    await delay();
    let results = [...MOCK_JOBS];
    if (search) results = results.filter(j =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );
    if (location) results = results.filter(j => j.location.toLowerCase().includes(location.toLowerCase()));
    if (type) results = results.filter(j => j.type === type);
    const total = results.length;
    const data = results.slice((page - 1) * limit, page * limit);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getJob(id) {
    await delay();
    const job = MOCK_JOBS.find(j => j.id === id);
    if (!job) throw new Error('Job not found');
    return job;
  },

  async applyToJob(id, _formData) {
    await delay(600);
    const job = MOCK_JOBS.find(j => j.id === id);
    if (!job) throw new Error('Job not found');
    job.applied = true;
    return { success: true, applicationId: 'app_' + Date.now() };
  },

  async rateJob(id, rating) {
    await delay();
    return { success: true, id, rating };
  },

  async getUserApplications() {
    await delay();
    return { data: MOCK_APPLICATIONS, total: MOCK_APPLICATIONS.length };
  },

  async getUserInterviews() {
    await delay();
    return { data: MOCK_INTERVIEWS, total: MOCK_INTERVIEWS.length };
  },

  async saveJob(id) {
    await delay(200);
    const job = MOCK_JOBS.find(j => j.id === id);
    if (job) job.saved = !job.saved;
    return { success: true, saved: job?.saved };
  },
};

// ─── Real API calls ───────────────────────────────────────────────────────────
const realService = {
  async getJobs(params) {
    const { data } = await apiClient.get('/api/jobs', { params });
    return data;
  },
  async getJob(id) {
    const { data } = await apiClient.get(`/api/jobs/${id}`);
    return data;
  },
  async applyToJob(id, formData) {
    const { data } = await apiClient.post(`/api/jobs/${id}/apply`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  async rateJob(id, rating) {
    const { data } = await apiClient.post(`/api/jobs/${id}/rate`, { rating });
    return data;
  },
  async getUserApplications() {
    const { data } = await apiClient.get('/api/user/applications');
    return data;
  },
  async getUserInterviews() {
    const { data } = await apiClient.get('/api/user/interviews');
    return data;
  },
  async saveJob(id) {
    const { data } = await apiClient.post(`/api/jobs/${id}/save`);
    return data;
  },
};

// ─── Exported service (auto-switches between mock and real) ──────────────────
const jobsService = useMock ? mockService : realService;

export const getJobs = (params) => jobsService.getJobs(params);
export const getJob = (id) => jobsService.getJob(id);
export const applyToJob = (id, formData) => jobsService.applyToJob(id, formData);
export const rateJob = (id, rating) => jobsService.rateJob(id, rating);
export const getUserApplications = () => jobsService.getUserApplications();
export const getUserInterviews = () => jobsService.getUserInterviews();
export const saveJob = (id) => jobsService.saveJob(id);

export default jobsService;