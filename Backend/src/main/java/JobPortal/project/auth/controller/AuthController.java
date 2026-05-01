package JobPortal.project.auth.controller;

import JobPortal.project.auth.dto.LoginRequest;
import JobPortal.project.auth.dto.RegisterRequest;
import JobPortal.project.auth.dto.AuthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest signUpRequest) {
        // Implementation
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        // Implementation
        return ResponseEntity.ok(new AuthResponse("fake-jwt-token", loginRequest.getEmail(), "ROLE_JOB_SEEKER"));
    }
}
