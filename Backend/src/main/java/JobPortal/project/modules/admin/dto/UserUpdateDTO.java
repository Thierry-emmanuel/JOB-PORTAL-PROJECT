package JobPortal.project.modules.admin.dto;

import lombok.Data;

@Data
public class UserUpdateDTO {
    private String fullName;
    private String email;
    private String password; // Optional password update
    private String phone;
    private String city;
    private String region;
    private Boolean isActive;
    
    // JobSeeker-specific
    private String profileSummary;
    private String portfolioUrl;
    private String linkedInUrl;
    private Boolean isOpenToWork;
    
    // Employer-specific
    private String jobTitle;
    private String bio;
    private Boolean isApproved;
    
    // Admin-specific
    private String department;
    private String adminLevel;
}
