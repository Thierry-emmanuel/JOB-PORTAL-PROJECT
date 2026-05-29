package JobPortal.project.security.oauth2;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

public class OAuth2RoleRequestFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String uri = request.getRequestURI();
        if (uri != null && uri.startsWith("/oauth2/authorization/")) {
            String role = request.getParameter("role");
            if (role != null) {
                HttpSession session = request.getSession(true);
                session.setAttribute("oauth2_role", role);
            } else {
                HttpSession session = request.getSession(false);
                if (session != null) {
                    session.removeAttribute("oauth2_role");
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
