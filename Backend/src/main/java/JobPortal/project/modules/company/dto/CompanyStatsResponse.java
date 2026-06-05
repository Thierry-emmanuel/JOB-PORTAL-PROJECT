package JobPortal.project.modules.company.dto;

public record CompanyStatsResponse(
        Long companyId,
        double recruitmentRate,
        long totalApplications,
        long totalHired,
        boolean hasLiked,
        long likesCount,
        double averageRating,
        int ratingCount,
        String recommendationMessage
) {}
