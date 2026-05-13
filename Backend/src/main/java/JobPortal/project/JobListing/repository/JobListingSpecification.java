package JobPortal.project.JobListing.repository;

import JobPortal.project.JobListing.entity.JobListing;
import JobPortal.project.JobListing.enums.ExperienceLevel;
import JobPortal.project.JobListing.enums.JobType;
import JobPortal.project.JobListing.enums.PostingStatus;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Composable JPA Specifications for the advanced job search endpoint.
 *
 * <p>All predicates are AND-combined. Any null parameter is omitted,
 * making every filter optional. Status is always fixed to ACTIVE for
 * public searches; admin searches bypass this class and use a JPQL query.
 *
 * <p>Usage:
 * <pre>{@code
 *   Specification<JobListing> spec = JobListingSpecification.buildFilter(params);
 *   Page<JobListing> page = repository.findAll(spec, pageable);
 * }</pre>
 */
public class JobListingSpecification implements Specification<JobListing> {

    private final SearchParams params;

    private JobListingSpecification(SearchParams params) {
        this.params = params;
    }

    /** Entry point: builds a composite Specification from the supplied params. */
    public static Specification<JobListing> buildFilter(SearchParams params) {
        return new JobListingSpecification(params);
    }

    @Override
    public Predicate toPredicate(Root<JobListing> root,
                                 CriteriaQuery<?> query,
                                 CriteriaBuilder cb) {

        List<Predicate> predicates = new ArrayList<>();

        // Public search always restricted to ACTIVE listings
        predicates.add(cb.equal(root.get("status"), PostingStatus.ACTIVE));

        // ── Keyword: searches title, description, and skill names ──────────────
        if (StringUtils.hasText(params.keyword())) {
            String pattern = "%" + params.keyword().toLowerCase() + "%";
            Join<Object, Object> skills = root.join("skills", JoinType.LEFT);
            predicates.add(cb.or(
                cb.like(cb.lower(root.get("title")),       pattern),
                cb.like(cb.lower(root.get("description")), pattern),
                cb.like(cb.lower(skills.get("name")),      pattern)
            ));
            query.distinct(true); // avoid duplicates from the skills join
        }

        // ── Category UUID ──────────────────────────────────────────────────────
        if (params.categoryId() != null) {
            predicates.add(cb.equal(root.get("category").get("id"), params.categoryId()));
        }

        // ── Contract type ──────────────────────────────────────────────────────
        if (params.jobType() != null) {
            predicates.add(cb.equal(root.get("jobType"), params.jobType()));
        }

        // ── City (partial, case-insensitive) ───────────────────────────────────
        if (StringUtils.hasText(params.city())) {
            predicates.add(cb.like(
                cb.lower(root.get("location").get("city")),
                "%" + params.city().toLowerCase() + "%"
            ));
        }

        // ── Experience level ───────────────────────────────────────────────────
        if (params.experienceLevel() != null) {
            predicates.add(cb.equal(root.get("experienceLevel"), params.experienceLevel()));
        }

        // ── Salary range (overlapping range logic) ─────────────────────────────
        if (params.salaryMin() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("salaryMax"), params.salaryMin()));
        }
        if (params.salaryMax() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("salaryMin"), params.salaryMax()));
        }

        return cb.and(predicates.toArray(new Predicate[0]));
    }

    // ── SearchParams value object ──────────────────────────────────────────────

    /**
     * Immutable parameter bag for a job search query.
     * Every field is nullable; null means "no filter on this field".
     */
    public record SearchParams(
        String keyword,
        UUID categoryId,
        JobType jobType,
        String city,
        ExperienceLevel experienceLevel,
        BigDecimal salaryMin,
        BigDecimal salaryMax
    ) {
        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private String keyword;
            private UUID categoryId;
            private JobType jobType;
            private String city;
            private ExperienceLevel experienceLevel;
            private BigDecimal salaryMin;
            private BigDecimal salaryMax;

            public Builder keyword(String v)                 { keyword = v;          return this; }
            public Builder categoryId(UUID v)                { categoryId = v;        return this; }
            public Builder jobType(JobType v)                { jobType = v;           return this; }
            public Builder city(String v)                    { city = v;              return this; }
            public Builder experienceLevel(ExperienceLevel v){ experienceLevel = v;   return this; }
            public Builder salaryMin(BigDecimal v)           { salaryMin = v;         return this; }
            public Builder salaryMax(BigDecimal v)           { salaryMax = v;         return this; }

            public SearchParams build() {
                return new SearchParams(keyword, categoryId, jobType, city,
                        experienceLevel, salaryMin, salaryMax);
            }
        }
    }
}
