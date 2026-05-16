package JobPortal.project.modules.application.dto.response;





public record ApplicationStatsResponse(

        Long jobPostingId,

        Long seekerId,

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


