package JobPortal.project.admin.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private long totalUsers;
    private long totalJobSeekers;
    private long totalEmployers;
    private long totalAdmins;
    private long activeUsers;

    // Additional real-time metrics
    private long activeJobs;
    private long expiredJobs;
    private long deletedJobs;
    private long totalApplications;
    private int hireRate;

    // Detailed breakdowns
    private Map<String, Long> applicationsByCategory;
    private Map<String, Long> applicationStatusBreakdown;
    private UserGrowthDTO usersOverTime;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserGrowthDTO {
        private List<String> labels;
        private List<Long> jobSeekers;
        private List<Long> employers;
    }
}

