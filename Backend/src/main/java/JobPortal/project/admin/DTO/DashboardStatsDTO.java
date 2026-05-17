package JobPortal.project.admin.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private long totalUsers;
    private long totalJobSeekers;
    private long totalEmployers;
    private long totalAdmins;
    private long activeUsers;
}
