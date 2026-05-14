package JobPortal.project.modules.application.service;

import JobPortal.project.modules.application.model.Interview;
import JobPortal.project.modules.auth.repository.UserRepository;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventAttendee;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import jakarta.annotation.PostConstruct;
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
import java.util.Collections;
import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleCalendarService {

    private final OAuth2AuthorizedClientService authorizedClientService;
    private final UserRepository userRepository;

    /** Reuse one transport for all requests – creating it is expensive. */
    private NetHttpTransport httpTransport;

    @PostConstruct
    void init() {
        try {
            httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        } catch (GeneralSecurityException | IOException e) {
            log.error("Failed to initialize Google HTTP transport", e);
        }
    }

    /**
     * Creates a Google Calendar event for the given interview.
     *
     * @return the Calendar event ID, or {@code null} if the user is not authenticated via OAuth2.
     */
    public String createInterviewEvent(Interview interview) {
        Calendar service = getCalendarService();
        if (service == null) {
            log.debug("Skipping Calendar sync – no OAuth2 session for current user");
            return null;
        }

        try {
            String seekerEmail = userRepository.findById(interview.getApplication().getSeekerId())
                    .map(u -> u.getEmail())
                    .orElse(null);

            Event event = buildEvent(interview, seekerEmail);
            event = service.events().insert("primary", event).execute();
            log.info("Google Calendar event created: id={}, link={}", event.getId(), event.getHtmlLink());
            return event.getId();
        } catch (IOException e) {
            log.error("Failed to create Google Calendar event for interview {}", interview.getId(), e);
            return null;
        }
    }

    public void cancelInterviewEvent(String eventId) {
        if (eventId == null) return;
        Calendar service = getCalendarService();
        if (service == null) return;
        try {
            service.events().delete("primary", eventId).execute();
            log.info("Google Calendar event deleted: {}", eventId);
        } catch (IOException e) {
            log.error("Failed to delete Google Calendar event {}", eventId, e);
        }
    }

    // ─── Private helpers ────────────────────────────────────────────────────

    private Event buildEvent(Interview interview, String seekerEmail) {
        var startInstant = interview.getScheduledAt().atZone(ZoneId.systemDefault()).toInstant();
        var endInstant   = interview.getScheduledAt().plusHours(1).atZone(ZoneId.systemDefault()).toInstant();

        var start = new EventDateTime().setDateTime(new com.google.api.client.util.DateTime(Date.from(startInstant)));
        var end   = new EventDateTime().setDateTime(new com.google.api.client.util.DateTime(Date.from(endInstant)));

        Event event = new Event()
                .setSummary("Kora Interview: Job Opportunity")
                .setLocation(interview.getMeetingLink() != null ? interview.getMeetingLink() : "Kora Platform")
                .setDescription("Interview via Kora Job Portal. Platform: " + interview.getPlatform())
                .setStart(start)
                .setEnd(end);

        if (seekerEmail != null) {
            event.setAttendees(Collections.singletonList(new EventAttendee().setEmail(seekerEmail)));
        }
        return event;
    }

    private Calendar getCalendarService() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth instanceof OAuth2AuthenticationToken oauthToken)) return null;

        OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient(
                oauthToken.getAuthorizedClientRegistrationId(), oauthToken.getName());
        if (client == null || client.getAccessToken() == null) return null;
        if (httpTransport == null) return null;

        var token = new AccessToken(
                client.getAccessToken().getTokenValue(),
                Date.from(client.getAccessToken().getExpiresAt()));
        GoogleCredentials credentials = GoogleCredentials.create(token);

        return new Calendar.Builder(httpTransport, GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("Kora Job Portal")
                .build();
    }
}
