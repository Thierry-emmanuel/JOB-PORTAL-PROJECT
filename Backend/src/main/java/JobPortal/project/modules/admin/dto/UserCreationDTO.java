package JobPortal.project.modules.admin.dto;

import JobPortal.project.enums.Role;
import lombok.Data;

@Data
public class UserCreationDTO {
    private String email;
    private String password;
    private String fullName;
    private Role role;
    private String phone;
    private String city;
    private String region;
    
    // JobSeeker-specific
    private String profileSummary;
    private String portfolioUrl;
    private String linkedInUrl;
    private Boolean isOpenToWork;
    
    // Employer-specific
    private String companyName;
    private String jobTitle;
    private String bio;
    private Boolean isApproved;
    
    // Admin-specific
    private String department;
    private String adminLevel;
}