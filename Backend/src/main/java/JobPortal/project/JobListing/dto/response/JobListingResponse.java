package JobPortal.project.JobListing.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import JobPortal.project.JobListing.enums.ExperienceLevel;
import JobPortal.project.JobListing.enums.JobType;
import JobPortal.project.JobListing.enums.PostingStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * Full detail response for a single job listing.
 * Returned by create, get-by-id, and update endpoints.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Full detail view of a job listing")
public record JobListingResponse(

    UUID            id,
    String          title,
    String          description,
    PostingStatus   status,
    JobType         jobType,
    BigDecimal      salaryMin,
    BigDecimal      salaryMax,
    ExperienceLevel experienceLevel,
    LocalDate       deadline,
    int             viewCount,
    String          qualificationNeeded,
    Boolean         requiresInterview,

    CategorySummary  category,
    CompanySummary   company,
    LocationSummary  location,
    Set<SkillSummary> skills,

    LocalDateTime   createdAt,
    LocalDateTime   updatedAt

) {

    @Schema(description = "Category reference")
    public record CategorySummary(UUID id, String name, String slug) {}

    @Schema(description = "Company reference")
    public record CompanySummary(Long id, String name, String logoUrl) {}

    @Schema(description = "Location reference")
    public record LocationSummary(UUID id, String city, String state, String country) {}

    @Schema(description = "Skill reference")
    public record SkillSummary(UUID id, String name) {}
}
