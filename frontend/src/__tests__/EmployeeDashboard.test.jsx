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
import * as profilesApi from '../api/profiles';
import * as interviewsApi from '../api/interviews';
import { invalidate } from '../api/cache';

/* ── Mocks ─────────────────────────────────────────────── */
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, fullName: 'Lena Dorcas Valmira BILOA EKASSI', email: 'lena@example.com' },
    token: 'mock-token',
  }),
}));

vi.mock('../api/jobs', () => ({
  getUserApplications: vi.fn(),
  getUserInterviews:   vi.fn(),
  getJobs:             vi.fn(),
}));

vi.mock('../api/profiles', () => ({
  getJobSeekerProfile: vi.fn(),
  updateJobSeekerProfile: vi.fn(),
}));

vi.mock('../api/interviews', () => ({
  getInterviewsBySeeker: vi.fn(),
  cancelInterview:       vi.fn(),
}));

vi.mock('@stomp/stompjs', () => ({
  Client: class {
    activate = vi.fn();
    deactivate = vi.fn();
    subscribe = vi.fn();
  },
}));

vi.mock('sockjs-client', () => ({
  default: vi.fn(),
}));

vi.mock('../components/KoraNav', () => ({
  default: () => <nav data-testid="kora-nav" aria-label="Main navigation" />,
}));

vi.mock('../layouts/EmployeeLayout', () => ({
  default: ({ profile, completion, children }) => (
    <div data-testid="employee-layout">
      <aside data-testid="profile-sidebar">
        <span data-testid="sidebar-name">{profile?.fullName}</span>
        <span data-testid="sidebar-completion">{completion}%</span>
      </aside>
      <main>{children}</main>
    </div>
  ),
}));

/* ── Fixtures ───────────────────────────────────────────── */
const MOCK_APPLICATIONS = {
  data: [
    {
      id: 'app-1',
      jobPostingId: '1',
      jobTitle:  'Frontend Engineer',
      company:   'TechCo',
      status:    'Under Review',
      appliedAt: '2025-07-21T00:00:00.000Z',
    },
    {
      id: 'app-2',
      jobPostingId: '2',
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
      scheduledAt: '2025-08-25T10:00:00.000Z',
      type:     'VIDEO',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
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
    jobsApi.getUserApplications.mockResolvedValue(MOCK_APPLICATIONS.data);
    interviewsApi.getInterviewsBySeeker.mockResolvedValue(MOCK_INTERVIEWS.data);
    jobsApi.getJobs.mockResolvedValue(MOCK_JOBS);
    profilesApi.getJobSeekerProfile.mockResolvedValue({
      fullName: 'Lena Dorcas Valmira BILOA EKASSI',
      email: 'lena@example.com',
      phone: '123456',
      profileSummary: 'Summary text',
      cvUrl: null,
      experiences: [{ id: 1 }],
      education: [{ id: 1 }],
      skills: ['React', 'CSS', 'JS'],
      languages: ['French'],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    invalidate();
  });

  /* ── Structure ────────────────────────────────────────── */

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

  it('passes a non-zero completion percentage to ProfileSidebar', async () => {
    renderDashboard();
    await waitFor(() => {
      const pct = parseInt(screen.getByTestId('sidebar-completion').textContent, 10);
      expect(pct).toBeGreaterThan(0);
      expect(pct).toBeLessThanOrEqual(100);
    });
  });

  /* ── Welcome section ──────────────────────────────────── */
  it('renders the welcome greeting with the user first name', () => {
    renderDashboard();
    // First name is "Lena" from MOCK_PROFILE.fullName
    expect(screen.getByRole('heading', { level: 1, name: /Lena/i })).toBeInTheDocument();
  });

  it('renders the "Browse Jobs" link to /employee/jobs', () => {
    renderDashboard();
    const link = screen.getByRole('link', { name: /Browse all jobs/i });
    expect(link).toHaveAttribute('href', '/employee/jobs');
  });

  /* ── Stat cards ───────────────────────────────────────── */
  it('renders all four stat card labels', () => {
    renderDashboard();
    expect(screen.getByText('Applications')).toBeInTheDocument();
    expect(screen.getAllByText('Saved Jobs')[0]).toBeInTheDocument();
    expect(screen.getByText('Interviews')).toBeInTheDocument();
    expect(screen.getByText('Profile Score')).toBeInTheDocument();
  });

  /* ── Recent Applications ──────────────────────────────── */
  it('renders application job ids after loading', async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText('Job #1')).toBeInTheDocument()
    );
    expect(screen.getByText('Job #2')).toBeInTheDocument();
  });

  it('renders the correct application statuses as badges', async () => {
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText('Under Review')).toBeInTheDocument()
    );
    expect(screen.getByText('Interview Scheduled')).toBeInTheDocument();
  });

  it('shows empty state when no applications returned', async () => {
    jobsApi.getUserApplications.mockResolvedValue([]);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/No applications yet/i)).toBeInTheDocument()
    );
  });

  /* ── Upcoming Interviews ──────────────────────────────── */
  it('renders interview card with "Join Meeting" link', async () => {
    renderDashboard();
    const joinBtn = await screen.findByRole('link', { name: /Join Google Meet/i });
    expect(joinBtn).toHaveAttribute(
      'href',
      'https://meet.google.com/abc-defg-hij'
    );
    expect(joinBtn).toHaveAttribute('target', '_blank');
  });

  it('shows empty state when no interviews returned', async () => {
    interviewsApi.getInterviewsBySeeker.mockResolvedValue([]);
    renderDashboard();
    await waitFor(() =>
      expect(
        screen.getByText(/No interviews scheduled/i)
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

  it('getJobs is called with limit: 6', async () => {
    renderDashboard();
    await waitFor(() =>
      expect(jobsApi.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 6 })
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
