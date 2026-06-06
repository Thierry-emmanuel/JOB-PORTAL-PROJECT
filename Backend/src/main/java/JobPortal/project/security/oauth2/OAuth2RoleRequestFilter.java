package JobPortal.project.security.oauth2;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

/**
 * Captures the role and originating frontend URL when the OAuth2 flow begins.
 * Both are stored in the HTTP session so they survive the Google redirect roundtrip.
 *
 * Triggered by requests to: /oauth2/authorization/{provider}?role=EMPLOYER|JOB_SEEKER&origin=https://...
 */
public class OAuth2RoleRequestFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        if (uri != null && uri.startsWith("/oauth2/authorization/")) {

            HttpSession session = request.getSession(true);

            // 1. Store the selected role (EMPLOYER or JOB_SEEKER)
            String role = request.getParameter("role");
            if (role != null && !role.isBlank()) {
                session.setAttribute("oauth2_role", role);
            } else {
                session.removeAttribute("oauth2_role");
            }

            // 2. Store the originating frontend URL so the success handler
            //    can redirect back to the correct frontend (localhost vs Vercel).
            //    Priority: explicit ?origin= param > Referer header > Origin header
            String origin = request.getParameter("origin");

            if (origin == null || origin.isBlank()) {
                String referer = request.getHeader("Referer");
                if (referer != null && !referer.isBlank()) {
                    try {
                        java.net.URI refererUri = new java.net.URI(referer);
                        origin = refererUri.getScheme() + "://" + refererUri.getAuthority();
                    } catch (Exception ignored) { }
                }
            }

            if (origin == null || origin.isBlank()) {
                origin = request.getHeader("Origin");
            }

            if (origin != null && !origin.isBlank()) {
                session.setAttribute("oauth2_origin", origin);
            }
        }

        filterChain.doFilter(request, response);
    }
}
