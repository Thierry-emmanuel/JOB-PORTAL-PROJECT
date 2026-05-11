/**
 * EmployeeDashboard – unit tests
 *
 * Run with:  npx vitest run src/__tests__/EmployeeDashboard.test.jsx
 * Or in watch mode: npx vitest
 *
 * Dependencies (already in the project):
 *   vitest, @testing-library/react, @testing-library/jest-dom,
 *   @testing-library/user-event, jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import * as jobsApi from '../api/jobs';

/* ── Mocks ─────────────────────────────────────────────── */
vi.mock('../api/jobs', () => ({
  getUserApplications: vi.fn(),
  getUserInterviews:   vi.fn(),
  getJobs:             vi.fn(),
}));

vi.mock('../components/KoraNav', () => ({
  default: () => <nav data-testid="kora-nav" aria-label="Main navigation" />,
}));

vi.mock('../components/profile/ProfileSidebar', () => ({
  default: ({ profile, completion }) => (
    <aside data-testid="profile-sidebar">
      <span data-testid="sidebar-name">{profile.fullName}</span>
      <span data-testid="sidebar-completion">{completion}%</span>
    </aside>
  ),
}));

/* ── Fixtures ───────────────────────────────────────────── */
const MOCK_APPLICATIONS = {
  data: [
    {
      id: 'app-1',
      jobTitle:  'Frontend Engineer',
      company:   'TechCo',
      status:    'Under Review',
      appliedAt: '2025-07-21T00:00:00.000Z',
    },
    {
      id: 'app-2',
      jobTitle:  'Fullstack Developer',
      company:   'DataLabs',
      status:    'Interview Scheduled',
      appliedAt: '2025-07-18T00:00:00.000Z',
    },
  ],
  total: 2,
};

const MOCK_INTERVIEWS = {
  data: [
    {
      id: 'int-1',
      jobTitle: 'Frontend Engineer',
      company:  'TechCo',
      date:     '2025-08-25T00:00:00.000Z',
      time:     '10:00 AM',
      type:     'Video',
      meetLink: 'https://meet.google.com/abc-defg-hij',
    },
  ],
  total: 1,
};

const MOCK_JOBS = {
  data: [
    {
      id: 'job-1',
      title:    'Senior Frontend Engineer',
      company:  'Techwave',
      location: 'Remote',
      type:     'Full-time',
      salary:   '2.5M – 4M FCFA/mo',
      tags:     ['React', 'TypeScript'],
      logo:     null,
    },
  ],
  total: 1,
  totalPages: 1,
};

/* ── Helpers ────────────────────────────────────────────── */
function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/employee/dashboard']}>
      <EmployeeDashboard />
    </MemoryRouter>
  );
}

/* ── Tests ──────────────────────────────────────────────── */
describe('EmployeeDashboard', () => {
  beforeEach(() => {
    jobsApi.getUserApplications.mockResolvedValue(MOCK_APPLICATIONS);
    jobsApi.getUserInterviews.mockResolvedValue(MOCK_INTERVIEWS);
    jobsApi.getJobs.mockResolvedValue(MOCK_JOBS);
  });

  afterEach(() => vi.clearAllMocks());

  /* ── Structure ────────────────────────────────────────── */
  it('renders the KoraNav', () => {
    renderDashboard();
    expect(screen.getByTestId('kora-nav')).toBeInTheDocument();
  });

  it('renders the ProfileSidebar', () => {
    renderDashboard();
    expect(screen.getByTestId('profile-sidebar')).toBeInTheDocument();
  });

  it('passes the correct profile name to ProfileSidebar', () => {
    renderDashboard();
    expect(screen.getByTestId('sidebar-name').textContent).toBe(
      'Lena Dorcas Valmira BILOA EKASSI'
    );
  });

  it('passes a non-zero completion percentage to ProfileSidebar', () => {
    renderDashboard();
    const pct = parseInt(screen.getByTestId('sidebar-completion').textContent, 10);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThanOrEqual(100);
  });

  /* ── Welcome section ──────────────────────────────────── */
  it('renders the welcome greeting with the user first name', () => {
    renderDashboard();
    // First name is "Lena" from MOCK_PROFILE.fullName
    expect(screen.getByText(/Welcome back, Lena/i)).toBeInTheDocument();
  });

  it('renders the "Browse Jobs" link to /jobs', () => {
    renderDashboard();
    const link = screen.getByRole('link', { name: /Browse Jobs/i });
    expect(link).toHaveAttribute('href', '/jobs');
  });

  /* ── Stat cards ───────────────────────────────────────── */
  it('renders all four stat card labels', () => {
    renderDashboard();
    expect(screen.getByText('Applications Sent')).toBeInTheDocument();
    expect(screen.getByText('Saved Jobs')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Interviews')).toBeInTheDocument();
    expect(screen.getByText('Profile Complete')).toBeInTheDocument();
  });

  /* ── Recent Applications ──────────────────────────────── */
  it('renders application job titles after loading', async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    );
    expect(screen.getByText('Fullstack Developer')).toBeInTheDocument();
  });

  it('renders the correct application statuses as badges', async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText('Under Review')).toBeInTheDocument()
    );
    expect(screen.getByText('Interview Scheduled')).toBeInTheDocument();
  });

  it('shows empty state when no applications returned', async () => {
    jobsApi.getUserApplications.mockResolvedValue({ data: [], total: 0 });
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/No applications yet/i)).toBeInTheDocument()
    );
  });

  /* ── Upcoming Interviews ──────────────────────────────── */
  it('renders interview card with "Join Meeting" link', async () => {
    renderDashboard();
    const joinBtn = await screen.findByRole('link', { name: /join meeting/i });
    expect(joinBtn).toHaveAttribute(
      'href',
      'https://meet.google.com/abc-defg-hij'
    );
    expect(joinBtn).toHaveAttribute('target', '_blank');
  });

  it('shows empty state when no interviews returned', async () => {
    jobsApi.getUserInterviews.mockResolvedValue({ data: [], total: 0 });
    renderDashboard();
    await waitFor(() =>
      expect(
        screen.getByText(/No interviews scheduled yet/i)
      ).toBeInTheDocument()
    );
  });

  /* ── Jobs For You ─────────────────────────────────────── */
  it('renders recommended job titles after loading', async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument()
    );
  });

  it('getJobs is called with limit: 3', async () => {
    renderDashboard();
    await waitFor(() =>
      expect(jobsApi.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 3 })
      )
    );
  });

  /* ── Profile completion nudge ─────────────────────────── */
  it('shows completion nudge when profile < 80%', async () => {
    // MOCK_PROFILE scores 60 (phone + summary + experiences + education +
    // skills + languages, no photo, no CV)
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/Boost your visibility/i)).toBeInTheDocument()
    );
  });
});
