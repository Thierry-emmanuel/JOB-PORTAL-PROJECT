import { useRef } from 'react';

const JOB_TYPES = [
  { label: 'Full-time (CDI)', value: 'CDI' },
  { label: 'Contract (CDD)', value: 'CDD' },
  { label: 'Internship', value: 'INTERNSHIP' },
  { label: 'Freelance', value: 'FREELANCE' }
];

/**
 * JobFilters
 * @param {{ filters: object, onChange: function, onReset: function }} props
 */
export default function JobFilters({ filters, onChange, onReset }) {
  const searchRef = useRef(null);

  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value, page: 1 });
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleChange('search', e.target.value);
    }
  };

  return (
    <div className="jf-filters" role="search" aria-label="Job search and filters">
      {/* Search */}
      <div className="jf-search-wrap">
        <label htmlFor="jf-search" className="sr-only">Search jobs</label>
        <span className="jf-search-icon" aria-hidden="true">🔍</span>
        <input
          id="jf-search"
          ref={searchRef}
          type="search"
          className="jf-search-input"
          placeholder="Search by title, company, or skill…"
          defaultValue={filters.search}
          onKeyDown={handleSearchKeyDown}
          onChange={(e) => !e.target.value && handleChange('search', '')}
          aria-label="Search jobs"
        />
        <button
          className="jf-search-btn"
          onClick={() => handleChange('search', searchRef.current?.value || '')}
          aria-label="Submit search"
        >
          Search
        </button>
      </div>

      {/* Secondary filters row */}
      <div className="jf-controls">
        {/* Location */}
        <div className="jf-field">
          <label htmlFor="jf-location" className="jf-label">Location</label>
          <input
            id="jf-location"
            type="text"
            className="jf-input"
            placeholder="City or Remote"
            value={filters.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </div>

        {/* Job type */}
        <div className="jf-field">
          <label htmlFor="jf-type" className="jf-label">Job Type</label>
          <select
            id="jf-type"
            className="jf-select"
            value={filters.type}
            onChange={(e) => handleChange('type', e.target.value)}
            aria-label="Filter by job type"
          >
            <option value="">All types</option>
            {JOB_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <button className="jf-reset-btn" onClick={onReset} aria-label="Reset all filters">
          Reset
        </button>
      </div>
    </div>
  );
}