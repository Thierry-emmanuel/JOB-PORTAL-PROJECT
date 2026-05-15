package JobPortal.project.admin.DTO;

import JobPortal.project.job.Enum.JobStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobManagementDTO {
    private Long id;
    private String title;
    private String companyName;
    private String categoryName;
    private String location;
    private JobStatus status;
    private LocalDateTime createdAt;
}
