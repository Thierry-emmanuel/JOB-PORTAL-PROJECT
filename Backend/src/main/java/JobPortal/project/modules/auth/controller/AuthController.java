package JobPortal.project.modules.auth.controller;

import JobPortal.project.modules.auth.dto.LoginRequest;
import JobPortal.project.modules.auth.dto.RegisterRequest;
import JobPortal.project.modules.auth.dto.AuthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@lombok.RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class AuthController {

    private final JobPortal.project.modules.auth.service.AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest signUpRequest) {
        try {
            authService.registerUser(signUpRequest);
            return ResponseEntity.ok("User registered successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse response = authService.authenticateUser(loginRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("[Auth] Login failed for email '{}' — {}: {}",
                    loginRequest.getEmail(),
                    e.getClass().getSimpleName(),
                    e.getMessage());
            return ResponseEntity.status(401).body("Error: Invalid email or password");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            org.springframework.security.core.context.SecurityContext context = org.springframework.security.core.context.SecurityContextHolder.getContext();
            org.springframework.security.core.Authentication authentication = context.getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body("Error: Not authenticated");
            }

            Object principal = authentication.getPrincipal();
            String email;
            if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
            } else {
                email = principal.toString();
            }

            AuthResponse response = authService.getCurrentUser(email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }
}



