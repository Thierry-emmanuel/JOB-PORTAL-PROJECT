package JobPortal.project.modules.application.service;

import JobPortal.project.modules.application.model.Interview;
import JobPortal.project.modules.auth.repository.UserRepository;
import JobPortal.project.modules.auth.Model.User;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.ConferenceData;
import com.google.api.services.calendar.model.ConferenceSolutionKey;
import com.google.api.services.calendar.model.CreateConferenceRequest;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventAttendee;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.UserCredentials;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleCalendarService {

    private final OAuth2AuthorizedClientService authorizedClientService;
    private final UserRepository userRepository;

    @org.springframework.beans.factory.annotation.Value("${app.google.calendar.client-id:}")
    private String centralClientId;

    @org.springframework.beans.factory.annotation.Value("${app.google.calendar.client-secret:}")
    private String centralClientSecret;

    @org.springframework.beans.factory.annotation.Value("${app.google.calendar.refresh-token:}")
    private String centralRefreshToken;

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
     * For VIDEO interviews the event will include a ConferenceData request so
     * Google automatically provisions a real Google Meet room and returns its URL.
     *
     * Side-effect: if the event comes back with a Meet URI, that URI is written
     * directly onto {@code interview.meetingLink} so the caller can persist it.
     *
     * @return the Calendar event ID, or {@code null} if the user is not
     *         authenticated via OAuth2 or an error occurs.
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

            // Request a real Google Meet conference for VIDEO interviews.
            boolean isVideo = interview.getType() != null &&
                    interview.getType().name().equals("VIDEO");
            Calendar.Events.Insert insertRequest = service.events().insert("primary", event);
            if (isVideo) {
                // conferenceDataVersion=1 tells the API to honour the ConferenceData block.
                insertRequest.setConferenceDataVersion(1);
            }

            Event created = insertRequest.execute();
            log.info("Google Calendar event created: id={}, link={}", created.getId(), created.getHtmlLink());

            // Extract the Google Meet URL from the conference entry points
            // and store it on the interview so candidates can join directly.
            if (isVideo && created.getConferenceData() != null
                    && created.getConferenceData().getEntryPoints() != null) {
                created.getConferenceData().getEntryPoints().stream()
                        .filter(ep -> "video".equals(ep.getEntryPointType()))
                        .map(ep -> ep.getUri())
                        .filter(uri -> uri != null && !uri.isBlank())
                        .findFirst()
                        .ifPresent(meetUri -> {
                            interview.setMeetingLink(meetUri);
                            interview.setPlatform("Google Meet");
                            log.info("Real Google Meet link assigned to interview {}: {}",
                                    interview.getId(), meetUri);
                        });
            }

            return created.getId();
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

        boolean isVideo = interview.getType() != null &&
                interview.getType().name().equals("VIDEO");
        boolean isInPerson = interview.getType() != null &&
                interview.getType().name().equals("IN_PERSON");

        String locationStr;
        if (isInPerson && interview.getMeetingLink() != null) {
            locationStr = interview.getMeetingLink(); // physical address stored in meetingLink
        } else if (!isInPerson && interview.getMeetingLink() != null) {
            locationStr = interview.getMeetingLink();
        } else {
            locationStr = "Kora Platform";
        }

        String description = "Interview via Kora Job Portal.";
        if (interview.getPlatform() != null) {
            description += " Platform: " + interview.getPlatform();
        }
        if (isInPerson && interview.getMeetingLink() != null) {
            description += "\nLocation: " + interview.getMeetingLink();
        }

        Event event = new Event()
                .setSummary("Kora Interview: Job Opportunity")
                .setLocation(locationStr)
                .setDescription(description)
                .setStart(start)
                .setEnd(end);

        // Attach a ConferenceData request for VIDEO interviews so Google
        // provisions a real Google Meet room on event creation.
        if (isVideo) {
            ConferenceSolutionKey key = new ConferenceSolutionKey().setType("hangoutsMeet");
            CreateConferenceRequest confReq = new CreateConferenceRequest()
                    .setRequestId(UUID.randomUUID().toString())
                    .setConferenceSolutionKey(key);
            event.setConferenceData(new ConferenceData().setCreateRequest(confReq));
        }

        if (seekerEmail != null) {
            event.setAttendees(Collections.singletonList(new EventAttendee().setEmail(seekerEmail)));
        }
        return event;
    }

    private Calendar getCalendarService() {
        // 1. Try to use central Google Calendar credentials if present
        if (centralClientId != null && !centralClientId.isBlank() &&
                centralClientSecret != null && !centralClientSecret.isBlank() &&
                centralRefreshToken != null && !centralRefreshToken.isBlank()) {
            log.info("getCalendarService: Using central Google Calendar credentials");
            if (httpTransport == null) {
                log.error("getCalendarService: httpTransport is null");
                return null;
            }
            try {
                GoogleCredentials credentials = UserCredentials.newBuilder()
                        .setClientId(centralClientId)
                        .setClientSecret(centralClientSecret)
                        .setRefreshToken(centralRefreshToken)
                        .build();
                return new Calendar.Builder(httpTransport, GsonFactory.getDefaultInstance(),
                        new HttpCredentialsAdapter(credentials))
                        .setApplicationName("Kora Job Portal")
                        .build();
            } catch (Exception e) {
                log.error("Failed to build Calendar service using central credentials, falling back to per-user auth", e);
            }
        }

        // 2. Fall back to existing per-user OAuth credentials
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            log.debug("getCalendarService: Authentication is null and no central credentials configured");
            return null;
        }

        String principalName = null;
        if (auth instanceof OAuth2AuthenticationToken oauthToken) {
            principalName = oauthToken.getName();
            log.debug("getCalendarService: Found OAuth2AuthenticationToken with principal name: {}", principalName);
        } else {
            String email = auth.getName();
            if (email != null && !email.isBlank()) {
                log.debug("getCalendarService: Checking JWT authentication for email: {}", email);
                var userOpt = userRepository.findByEmail(email);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    if (user.getProvider() == User.Provider.GOOGLE) {
                        principalName = user.getProviderId();
                        log.debug("getCalendarService: Found Google provider user with providerId: {}", principalName);
                    } else {
                        log.debug("getCalendarService: User provider is not GOOGLE, it is: {}", user.getProvider());
                    }
                } else {
                    log.debug("getCalendarService: No user found in repository for email: {}", email);
                }
            }
        }

        if (principalName == null) {
            log.debug("getCalendarService: No Google provider principal name resolved, defaulting to auth.getName(): {}", auth.getName());
            principalName = auth.getName();
        }

        if (principalName == null) {
            return null;
        }

        OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient("google", principalName);
        if (client == null) {
            log.debug("getCalendarService: No OAuth2AuthorizedClient found for registrationId 'google' with principalName: {}", principalName);
            // Try email as fallback
            if (auth.getName() != null && !auth.getName().equals(principalName)) {
                log.debug("getCalendarService: Retrying client load using auth.getName() as principalName: {}", auth.getName());
                client = authorizedClientService.loadAuthorizedClient("google", auth.getName());
            }
        }

        if (client == null) {
            log.warn("getCalendarService: Failed to resolve OAuth2AuthorizedClient for user: {}", auth.getName());
            return null;
        }

        if (client.getAccessToken() == null) {
            log.warn("getCalendarService: Google AccessToken is null for user: {}", auth.getName());
            return null;
        }

        if (httpTransport == null) {
            log.error("getCalendarService: httpTransport is null");
            return null;
        }

        log.info("getCalendarService: Successfully resolved Google OAuth2 credentials for: {}", auth.getName());
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
