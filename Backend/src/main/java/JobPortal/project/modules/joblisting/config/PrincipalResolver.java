package JobPortal.project.modules.joblisting.config;

import JobPortal.project.modules.auth.model.User;
import JobPortal.project.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Resolves the authenticated Spring Security principal (UserDetails)
 * to the application-level UUID used throughout the JobListing module.
 *
 * Sprint 1 uses Spring's built-in UserDetails where getUsername() returns
 * the user's email address. This component looks up the User entity by
 * email and converts the Long primary key to a UUID so the JobListing
 * service layer stays consistent.
 */
@Component
@RequiredArgsConstructor
public class PrincipalResolver {

    private final UserRepository userRepository;

    /**
     * Resolves a UserDetails principal to a UUID.
     * The UUID is derived from the User entity's Long id.
     */
    public UUID resolveId(UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Authenticated user not found: " + principal.getUsername()));
        // Convert Long id to a stable UUID using the numeric value
        return new UUID(0L, user.getId());
    }
}
