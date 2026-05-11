package JobPortal.project.modules.application.dto.response;

import java.util.UUID;



public record ApplicationStatsResponse(

        UUID jobPostingId,

        UUID seekerId,

        long totalApplications,
        long applied,
        long shortlisted,
        long rejected,
        long hired,

        long interviewsScheduled,
        long interviewsPassed,
        long interviewsFailed,
        long interviewsNoShow
) {}


