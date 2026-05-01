package JobPortal.project.auth.controller;

import JobPortal.project.auth.dto.LoginRequest;
import JobPortal.project.auth.dto.RegisterRequest;
import JobPortal.project.auth.dto.AuthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@lombok.RequiredArgsConstructor
public class AuthController {

    private final JobPortal.project.auth.service.AuthService authService;

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
        // Login logic will go here
        return ResponseEntity.ok(new AuthResponse("fake-jwt-token", loginRequest.getEmail(), "ROLE_JOB_SEEKER"));
    }
}
