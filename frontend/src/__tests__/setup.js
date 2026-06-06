// src/__tests__/setup.js
import '@testing-library/jest-dom';
import { vi } from 'vitest';

const mockT = (key) => {
  const translations = {
    'common.back': 'Back',
    'common.go_back': 'Go back',
    'common.retry': 'Retry',
    'common.of': 'of',
    'jobs.find_next_role': 'Find Your Next Role',
    'jobs.loading_opportunities': 'Loading opportunities…',
    'jobs.jobs_available': 'Jobs Available',
    'jobs.loading_jobs': 'Loading jobs…',
    'jobs.showing': 'Showing',
    'jobs.jobs': 'jobs',
    'jobs.error_load_jobs': 'Failed to load jobs. Please try again.',
    'jobs.no_jobs_match': 'No jobs match your search',
    'jobs.adjust_filters': 'Adjust your filters and try again.',
    'jobs.clear_filters': 'Clear filters',
  };
  return translations[key] || key;
};

const mockI18n = {
  changeLanguage: vi.fn(),
  language: 'en',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: mockI18n,
  }),
}));