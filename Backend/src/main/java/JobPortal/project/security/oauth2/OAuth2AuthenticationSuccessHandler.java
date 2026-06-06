package JobPortal.project.security.oauth2;

import JobPortal.project.security.jwt.JwtUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final org.slf4j.Logger log = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    private final JwtUtils jwtUtils;
    private final String frontendUrl;

    public OAuth2AuthenticationSuccessHandler(
            JwtUtils jwtUtils,
            @Value("${app.cors.allowed-origin:http://localhost:5173}") String frontendUrl) {
        this.jwtUtils = jwtUtils;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {

        // Derive the frontend base URL from the session-stored origin (most reliable)
        // or fall back to the configured frontendUrl property.
        String resolvedFrontendUrl = resolveFrontendUrl(request);

        String token = jwtUtils.generateJwtToken(authentication);

        String redirectUrl = UriComponentsBuilder.fromUriString(resolvedFrontendUrl + "/oauth2/redirect")
                .queryParam("token", token)
                .build().toUriString();

        log.info("[OAuth2] Success — redirecting to: {}", resolvedFrontendUrl + "/oauth2/redirect");
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    /**
     * Reads the origin that initiated the OAuth2 flow from the session
     * (stored by OAuth2OriginCaptureFilter). Falls back to the configured
     * app.cors.allowed-origin property if not found.
     */
    private String resolveFrontendUrl(HttpServletRequest request) {
        jakarta.servlet.http.HttpSession session = request.getSession(false);
        if (session != null) {
            String origin = (String) session.getAttribute("oauth2_origin");
            if (origin != null && !origin.isBlank()) {
                log.debug("[OAuth2] Using session-stored origin: {}", origin);
                return origin;
            }
        }
        log.debug("[OAuth2] Using configured frontendUrl: {}", frontendUrl);
        return frontendUrl;
    }
}
