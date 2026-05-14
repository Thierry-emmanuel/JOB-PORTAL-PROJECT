package JobPortal.project.modules.application.service;

import JobPortal.project.modules.application.model.Interview;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventAttendee;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleCalendarService {

    private final OAuth2AuthorizedClientService authorizedClientService;
    private final JobPortal.project.modules.auth.repository.UserRepository userRepository;

    /**
     * Creates a Google Calendar event for the given interview.
     * @param interview The interview entity with scheduled time and details.
     * @return The created Google Calendar Event ID, or null if sync failed.
     */
    public String createInterviewEvent(Interview interview) {
        try {
            Calendar service = getCalendarService();
            if (service == null) {
                log.warn("Could not initialize Google Calendar service (no valid OAuth2 client found)");
                return null;
            }

            // Fetch seeker email
            String seekerEmail = userRepository.findById(interview.getApplication().getSeekerId())
                    .map(JobPortal.project.modules.auth.Model.User::getEmail)
                    .orElse("candidate@kora.com");

            Event event = new Event()
                    .setSummary("Kora Interview: Job Opportunity")
                    .setLocation(interview.getMeetingLink() != null ? interview.getMeetingLink() : "Kora Platform")
                    .setDescription("Job Interview scheduled via Kora Job Portal.\nPlatform: " + interview.getPlatform());

            // Convert LocalDateTime to Google DateTime
            com.google.api.client.util.DateTime startDateTime = new com.google.api.client.util.DateTime(
                    Date.from(interview.getScheduledAt().atZone(ZoneId.systemDefault()).toInstant())
            );
            event.setStart(new EventDateTime().setDateTime(startDateTime));

            // Assume 1 hour duration
            com.google.api.client.util.DateTime endDateTime = new com.google.api.client.util.DateTime(
                    Date.from(interview.getScheduledAt().plusHours(1).atZone(ZoneId.systemDefault()).toInstant())
            );
            event.setEnd(new EventDateTime().setDateTime(endDateTime));

            // Add attendees (Interviewer and Candidate)
            EventAttendee candidate = new EventAttendee().setEmail(seekerEmail);
            event.setAttendees(Collections.singletonList(candidate));

            event = service.events().insert("primary", event).execute();
            log.info("Google Calendar event created: {}", event.getHtmlLink());
            return event.getId();

        } catch (Exception e) {
            log.error("Failed to create Google Calendar event", e);
            return null;
        }
    }

    public void cancelInterviewEvent(String eventId) {
        if (eventId == null) return;
        try {
            Calendar service = getCalendarService();
            if (service != null) {
                service.events().delete("primary", eventId).execute();
                log.info("Google Calendar event cancelled: {}", eventId);
            }
        } catch (Exception e) {
            log.error("Failed to cancel Google Calendar event: {}", eventId, e);
        }
    }

    private Calendar getCalendarService() throws GeneralSecurityException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof OAuth2AuthenticationToken)) {
            return null;
        }

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient(
                oauthToken.getAuthorizedClientRegistrationId(),
                oauthToken.getName()
        );

        if (client == null || client.getAccessToken() == null) {
            return null;
        }

        String tokenValue = client.getAccessToken().getTokenValue();
        AccessToken accessToken = new AccessToken(tokenValue, Date.from(client.getAccessToken().getExpiresAt()));
        GoogleCredentials credentials = GoogleCredentials.create(accessToken);

        return new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("Kora Job Portal")
                .build();
    }
}
