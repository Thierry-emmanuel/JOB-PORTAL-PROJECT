package JobPortal.project.JobListing.dto.response;

import JobPortal.project.JobListing.enums.ExperienceLevel;
import JobPortal.project.JobListing.enums.JobType;
import JobPortal.project.JobListing.enums.PostingStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lightweight summary used in paginated list responses.
 * Does not include description or skills to reduce payload size.
 */
@Schema(description = "Lightweight summary of a job listing for list views")
public record JobListingSummary(

    UUID            id,
    String          title,
    PostingStatus   status,
    JobType         jobType,
    BigDecimal      salaryMin,
    BigDecimal      salaryMax,
    ExperienceLevel experienceLevel,
    LocalDate       deadline,
    int             viewCount,

    String          categoryName,
    String          companyName,
    String          companyLogoUrl,
    String          locationCity,
    String          locationCountry,

    LocalDateTime   createdAt

) {}
