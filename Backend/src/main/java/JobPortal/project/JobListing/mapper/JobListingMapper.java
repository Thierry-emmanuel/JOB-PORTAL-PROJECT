package JobPortal.project.JobListing.mapper;

import JobPortal.project.JobListing.dto.response.CategoryResponse;
import JobPortal.project.JobListing.dto.response.JobListingResponse;
import JobPortal.project.JobListing.dto.response.JobListingSummary;
import JobPortal.project.JobListing.entity.JobCategory;
import JobPortal.project.JobListing.entity.JobListing;
import JobPortal.project.modules.company.Model.Company;
import JobPortal.project.modules.company.Repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

/**
 * Manual mapper between {@link JobListing} entities and their DTO projections.
 */
@Component
@RequiredArgsConstructor
public class JobListingMapper {

    private final CompanyRepository companyRepository;

    /**
     * Maps to the full detail response.
     * Call only after the entity's associations (category, location, skills) are loaded.
     */
    public JobListingResponse toResponse(JobListing jl) {
        Company company = jl.getCompanyId() == null ? null : companyRepository.findById(jl.getCompanyId()).orElse(null);

        return new JobListingResponse(
            jl.getId(),
            jl.getTitle(),
            jl.getDescription(),
            jl.getStatus(),
            jl.getJobType(),
            jl.getSalaryMin(),
            jl.getSalaryMax(),
            jl.getExperienceLevel(),
            jl.getDeadline(),
            jl.getViewCount() == null ? 0 : jl.getViewCount(),
            jl.getCategory() == null ? null : new JobListingResponse.CategorySummary(
                jl.getCategory().getId(),
                jl.getCategory().getName(),
                jl.getCategory().getSlug()
            ),
            company == null ? null : new JobListingResponse.CompanySummary(
                company.getId(),
                company.getName(),
                company.getLogoUrl()
            ),
            jl.getLocation() == null ? null : new JobListingResponse.LocationSummary(
                jl.getLocation().getId(),
                jl.getLocation().getCity(),
                jl.getLocation().getState(),
                jl.getLocation().getCountry()
            ),
            jl.getSkills() == null ? null : jl.getSkills().stream()
                .map(s -> new JobListingResponse.SkillSummary(s.getId(), s.getName()))
                .collect(Collectors.toSet()),
            jl.getCreatedAt(),
            jl.getUpdatedAt()
        );
    }

    /**
     * Maps to the lightweight summary used in paginated list responses.
     * Does NOT include description or skill details.
     */
    public JobListingSummary toSummary(JobListing jl) {
        Company company = jl.getCompanyId() == null ? null : companyRepository.findById(jl.getCompanyId()).orElse(null);

        return new JobListingSummary(
            jl.getId(),
            jl.getTitle(),
            jl.getStatus(),
            jl.getJobType(),
            jl.getSalaryMin(),
            jl.getSalaryMax(),
            jl.getExperienceLevel(),
            jl.getDeadline(),
            jl.getViewCount() == null ? 0 : jl.getViewCount(),
            jl.getCategory()  == null ? null : jl.getCategory().getName(),
            company == null ? null : company.getName(),
            company == null ? null : company.getLogoUrl(),
            jl.getLocation()  == null ? null : jl.getLocation().getCity(),
            jl.getLocation()  == null ? null : jl.getLocation().getCountry(),
            jl.getCreatedAt()
        );
    }

    /** Maps a JobCategory to its reference response DTO. */
    public CategoryResponse toCategoryResponse(JobCategory cat) {
        return new CategoryResponse(
            cat.getId(),
            cat.getName(),
            cat.getSlug(),
            cat.getIconUrl(),
            cat.getDescription()
        );
    }
}
