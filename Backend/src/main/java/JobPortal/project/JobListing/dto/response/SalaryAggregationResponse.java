package JobPortal.project.JobListing.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalaryAggregationResponse {
    private String category;
    private Double avgSalaryMin;
    private Double avgSalaryMax;
    private Long jobCount;
}
