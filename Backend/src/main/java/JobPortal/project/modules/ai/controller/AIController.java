package JobPortal.project.modules.ai.controller;

import JobPortal.project.modules.ai.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping("/match")
    public Map<String, String> getMatch(@RequestBody Map<String, String> request) {
        String resume = request.get("resume");
        String description = request.get("description");
        
        String result = aiService.calculateMatchScore(resume, description);
        
        // Simple parsing of "SCORE: 85, REASON: text"
        String score = "0";
        String reason = "Error parsing AI response";
        
        try {
            if (result.contains("SCORE:") && result.contains("REASON:")) {
                score = result.split("REASON:")[0].replace("SCORE:", "").trim().replace("%", "");
                reason = result.split("REASON:")[1].trim();
            }
        } catch (Exception e) {
            // Fallback
        }

        return Map.of("score", score, "reason", reason);
    }
}
