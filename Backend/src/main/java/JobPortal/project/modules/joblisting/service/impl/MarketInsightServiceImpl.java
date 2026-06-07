package JobPortal.project.modules.joblisting.service.impl;

import JobPortal.project.modules.joblisting.dto.response.DemandTrendResponse;
import JobPortal.project.modules.joblisting.dto.response.SalaryAggregationResponse;
import JobPortal.project.modules.joblisting.repository.JobListingRepository;
import JobPortal.project.modules.joblisting.service.MarketInsightService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarketInsightServiceImpl implements MarketInsightService {

    private final JobListingRepository jobListingRepository;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "marketInsights", key = "'salaryByCategory'")
    public List<SalaryAggregationResponse> getAverageSalaryByCategory() {
        return jobListingRepository.getAverageSalaryByCategory();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "marketInsights", key = "'demandTrends'")
    public List<DemandTrendResponse> getDemandTrends() {
        List<Object[]> rawTrends = jobListingRepository.getDemandTrendsRaw();

        return rawTrends.stream().map(row -> {
            Integer year = (Integer) row[0];
            Integer month = (Integer) row[1];
            Long count = (Long) row[2];

            String period = year + "-" + String.format("%02d", month);
            return new DemandTrendResponse(period, count);
        }).collect(Collectors.toList());
    }
}