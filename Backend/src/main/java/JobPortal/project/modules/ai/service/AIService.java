package JobPortal.project.modules.ai.service;

import com.google.cloud.vertexai.VertexAI;
import com.google.cloud.vertexai.api.GenerateContentResponse;
import com.google.cloud.vertexai.generativeai.GenerativeModel;
import com.google.cloud.vertexai.generativeai.ResponseHandler;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class AIService {

    @Value("${google.cloud.project-id}")
    private String projectId;

    @Value("${google.cloud.location:us-central1}")
    private String location;

    private VertexAI vertexAI;
    private GenerativeModel model;

    @PostConstruct
    public void init() {
        if (projectId != null && !projectId.equals("YOUR_GCP_PROJECT_ID")) {
            this.vertexAI = new VertexAI(projectId, location);
            this.model = new GenerativeModel("gemini-1.5-flash", vertexAI);
        }
    }

    @PreDestroy
    public void cleanup() {
        if (vertexAI != null) {
            vertexAI.close();
        }
    }

    @Cacheable(value = "aiMatchScores", key = "#resumeText.hashCode() + '-' + #jobDescription.hashCode()")
    public String calculateMatchScore(String resumeText, String jobDescription) {
        if (model == null) {
            return "SCORE: 0, REASON: AI Service not configured. Please set GCP Project ID.";
        }
        
        try {
            String prompt = String.format(
                "Compare the following resume against the job description. " +
                "Provide a match percentage (0-100) and a brief reason (max 2 sentences). " +
                "Format: SCORE: [number], REASON: [text].\n\n" +
                "RESUME:\n%s\n\nJOB DESCRIPTION:\n%s",
                resumeText, jobDescription
            );

            GenerateContentResponse response = model.generateContent(prompt);
            return ResponseHandler.getText(response);
        } catch (Exception e) {
            return "SCORE: 0, REASON: AI Service unavailable or error occurred.";
        }
    }
}
