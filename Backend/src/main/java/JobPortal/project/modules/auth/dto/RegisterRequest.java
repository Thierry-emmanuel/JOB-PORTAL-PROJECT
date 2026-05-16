package JobPortal.project.modules.auth.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String role; // e.g., ROLE_JOB_SEEKER or ROLE_EMPLOYER
}



