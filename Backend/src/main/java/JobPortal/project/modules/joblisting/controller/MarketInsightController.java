package JobPortal.project.modules.joblisting.controller;

import JobPortal.project.modules.joblisting.dto.response.DemandTrendResponse;
import JobPortal.project.modules.joblisting.dto.response.SalaryAggregationResponse;
import JobPortal.project.modules.joblisting.service.MarketInsightService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/insights")
@RequiredArgsConstructor
public class MarketInsightController {

    private final MarketInsightService marketInsightService;

    @GetMapping("/salary-by-category")
    public ResponseEntity<List<SalaryAggregationResponse>> getSalaryByCategory() {
        return ResponseEntity.ok(marketInsightService.getAverageSalaryByCategory());
    }

    @GetMapping("/demand-trends")
    public ResponseEntity<List<DemandTrendResponse>> getDemandTrends() {
        return ResponseEntity.ok(marketInsightService.getDemandTrends());
    }
}
