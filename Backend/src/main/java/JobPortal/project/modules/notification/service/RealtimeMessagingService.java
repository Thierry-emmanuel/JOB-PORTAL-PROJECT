package JobPortal.project.modules.notification.service;

import JobPortal.project.modules.application.dto.response.ApplicationResponse;
import JobPortal.project.modules.application.dto.response.InterviewResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Pushes structured realtime events to role-specific STOMP topics
 * so dashboards can refresh without polling.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RealtimeMessagingService {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishApplicationEvent(String event, ApplicationResponse application, Long employerId) {
        if (application == null) return;
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", event);
        payload.put("applicationId", application.id());
        payload.put("application", application);
        payload.put("timestamp", System.currentTimeMillis());

        try {
            if (application.seekerId() != null) {
                messagingTemplate.convertAndSend(
                        "/topic/applications/seeker/" + application.seekerId(), payload);
            }
            if (employerId != null) {
                messagingTemplate.convertAndSend(
                        "/topic/applications/employer/" + employerId, payload);
            }
        } catch (Exception e) {
            log.warn("Realtime application push failed: {}", e.getMessage());
        }
    }

    public void publishInterviewEvent(String event, InterviewResponse interview, Long seekerId, Long employerId) {
        if (interview == null) return;
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", event);
        payload.put("interviewId", interview.id());
        payload.put("interview", interview);
        payload.put("timestamp", System.currentTimeMillis());

        try {
            if (seekerId != null) {
                messagingTemplate.convertAndSend("/topic/interviews/seeker/" + seekerId, payload);
            }
            if (employerId != null) {
                messagingTemplate.convertAndSend("/topic/interviews/employer/" + employerId, payload);
            }
        } catch (Exception e) {
            log.warn("Realtime interview push failed: {}", e.getMessage());
        }
    }
}
