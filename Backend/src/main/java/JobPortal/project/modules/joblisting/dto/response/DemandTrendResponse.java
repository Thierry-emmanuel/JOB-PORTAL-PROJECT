package JobPortal.project.modules.joblisting.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DemandTrendResponse {
    private String period; // e.g. "2023-10" or "OCT 2023"
    private Long jobCount;
}
