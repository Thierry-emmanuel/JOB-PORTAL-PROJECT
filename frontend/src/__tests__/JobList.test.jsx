/**
 * JobList – unit tests
 *
 * Run with:  npx vitest run src/__tests__/JobList.test.jsx
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import JobList from '../pages/jobs/JobList';
import * as jobsApi from '../api/jobs';

/* ── Mocks ─────────────────────────────────────────────── */
vi.mock('../api/jobs', () => ({
  getJobs: vi.fn(),
}));

vi.mock('../components/KoraNav', () => ({
  default: () => <nav data-testid="kora-nav" />,
}));

vi.mock('../components/jobs/CompanyModal', () => ({
  default: () => null,
}));

vi.mock('../components/jobs/JobFilters', () => ({
  default: ({ onChange }) => (
    <div data-testid="job-filters">
      <button
        onClick={() => onChange({ search: 'React', location: '', type: '' })}
        data-testid="filter-apply-btn"
      >
        Apply Filter
      </button>
      <button
        onClick={() => onChange({ search: '', location: '', type: '' })}
        data-testid="filter-reset-btn"
      >
        Reset Filter
      </button>
    </div>
  ),
}));

vi.mock('../components/jobs/JobCard', () => ({
  default: ({ job }) => (
    <article data-testid="job-card" aria-label={job.title}>
      <h3>{job.title}</h3>
      <p>{job.company}</p>
    </article>
  ),
}));

vi.mock('../components/jobs/Pagination', () => ({
  default: ({ currentPage, totalPages, onPageChange }) => (
    <nav data-testid="pagination">
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        data-testid="next-page-btn"
      >
        Next
      </button>
    </nav>
  ),
}));

/* ── Fixtures ───────────────────────────────────────────── */
const MOCK_PAGE_1 = {
  data: [
    { id: '1', title: 'Frontend Engineer', company: 'TechCo',  location: 'Remote',   type: 'Full-time', salary: '$80k', tags: ['React'], logo: null, saved: false, applied: false },
    { id: '2', title: 'Backend Developer',  company: 'DataCo',  location: 'Austin',   type: 'Contract',  salary: '$70/hr', tags: ['Node'], logo: null, saved: false, applied: false },
    { id: '3', title: 'DevOps Engineer',    company: 'CloudCo', location: 'New York', type: 'Full-time', salary: '$90k', tags: ['AWS'], logo: null, saved: false, applied: false },
  ],
  total: 3,
  totalPages: 1,
};

const MOCK_PAGE_2_OF_2 = {
  data: [
    { id: '4', title: 'Data Scientist', company: 'ML Co', location: 'Remote', type: 'Full-time', salary: '$100k', tags: ['Python'], logo: null, saved: false, applied: false },
  ],
  total: 7,
  totalPages: 2,
};

/* ── Helpers ────────────────────────────────────────────── */
function renderJobList() {
  return render(
    <MemoryRouter initialEntries={['/jobs']}>
      <JobList />
    </MemoryRouter>
  );
}

/* ── Tests ──────────────────────────────────────────────── */
describe('JobList', () => {
  beforeEach(() => {
    jobsApi.getJobs.mockResolvedValue(MOCK_PAGE_1);
  });
  afterEach(() => vi.clearAllMocks());

  /* ── Structure ────────────────────────────────────────── */

  it('renders the page heading "Find Your Next Role"', () => {
    renderJobList();
    expect(
      screen.getByRole('heading', { name: /Find Your Next Role/i })
    ).toBeInTheDocument();
  });

  it('renders the JobFilters component', () => {
    renderJobList();
    expect(screen.getByTestId('job-filters')).toBeInTheDocument();
  });

  /* ── Loading skeleton ─────────────────────────────────── */
  it('shows loading skeletons while fetching', () => {
    // delay resolution so we can inspect the loading state
    jobsApi.getJobs.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(MOCK_PAGE_1), 500))
    );
    renderJobList();
    // Skeletons are aria-hidden divs; check the loading text instead
    expect(screen.getByText('Loading jobs…')).toBeInTheDocument();
  });

  /* ── Success state ────────────────────────────────────── */
  it('renders job cards after loading', async () => {
    renderJobList();
    const cards = await screen.findAllByTestId('job-card');
    expect(cards).toHaveLength(3);
  });

  it('renders correct job titles', async () => {
    renderJobList();
    await screen.findByText('Frontend Engineer');
    expect(screen.getByText('Backend Developer')).toBeInTheDocument();
    expect(screen.getByText('DevOps Engineer')).toBeInTheDocument();
  });

  it('shows result count after loading', async () => {
    renderJobList();
    await waitFor(() =>
      expect(screen.getByText((content, element) => {
        return element.tagName.toLowerCase() === 'p' && element.textContent.includes('Showing 3 of 3');
      })).toBeInTheDocument()
    );
  });

  /* ── Pagination ───────────────────────────────────────── */
  it('does NOT render pagination when only 1 page', async () => {
    renderJobList();
    await screen.findAllByTestId('job-card');
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });

  it('renders pagination when totalPages > 1', async () => {
    jobsApi.getJobs.mockResolvedValue(MOCK_PAGE_2_OF_2);
    renderJobList();
    await screen.findAllByTestId('job-card');
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  /* ── Empty state ──────────────────────────────────────── */
  it('shows empty state when no jobs returned', async () => {
    jobsApi.getJobs.mockResolvedValue({ data: [], total: 0, totalPages: 0 });
    renderJobList();
    await waitFor(() =>
      expect(screen.getByText('No jobs match your search')).toBeInTheDocument()
    );
  });

  /* ── Error state ──────────────────────────────────────── */
  it('shows error message and Retry button on failure', async () => {
    jobsApi.getJobs.mockRejectedValue(new Error('Network error'));
    renderJobList();
    await waitFor(() =>
      expect(
        screen.getByText('Failed to load jobs. Please try again.')
      ).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('retries fetch when Retry button is clicked', async () => {
    jobsApi.getJobs
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(MOCK_PAGE_1);

    renderJobList();
    const retryBtn = await screen.findByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() =>
      expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    );
    expect(jobsApi.getJobs).toHaveBeenCalledTimes(2);
  });

  /* ── API call spec ────────────────────────────────────── */
  it('calls getJobs with page:1 and limit:6 on mount', async () => {
    renderJobList();
    await waitFor(() =>
      expect(jobsApi.getJobs).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 6 })
      )
    );
  });

  it('resets to page 1 when filters change', async () => {
    renderJobList();
    await screen.findAllByTestId('job-card');

    fireEvent.click(screen.getByTestId('filter-apply-btn'));

    await waitFor(() =>
      expect(jobsApi.getJobs).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, search: 'React' })
      )
    );
  });
});
