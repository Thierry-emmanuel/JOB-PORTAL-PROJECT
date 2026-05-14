package JobPortal.project.JobListing.service;

import JobPortal.project.JobListing.dto.response.DemandTrendResponse;
import JobPortal.project.JobListing.dto.response.SalaryAggregationResponse;

import java.util.List;

public interface MarketInsightService {
    
    /**
     * Get average salary by job category.
     */
    List<SalaryAggregationResponse> getAverageSalaryByCategory();
    
    /**
     * Get active job listing trends over time (grouped by year/month).
     */
    List<DemandTrendResponse> getDemandTrends();
}
