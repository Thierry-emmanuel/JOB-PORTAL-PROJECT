package JobPortal.project.modules.userprofile.Model;

import JobPortal.project.enums.Role;
import JobPortal.project.modules.auth.Model.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "employers")
public class Employer extends User {

    @Column
    private String phone;

    @Column
    private String city;

    @Column
    private String region;

    @Column
    private String avatarUrl;

    @Column
    private String jobTitle;

    @Column(columnDefinition = "TEXT")
    private String bio;

    // Set to false until Admin approves the account (FR07)
    @Column(nullable = false)
    private Boolean isApproved = false;

    // Profile completeness score from 0 to 100
    @Column
    private Integer profileScore = 0;

    public Employer(String fullName, String email, String password) {
        super();
        this.setFullName(fullName);
        this.setEmail(email);
        this.setPassword(password);
        this.setRole(Role.EMPLOYER);
        this.setIsActive(true);
        this.isApproved = false;
    }

    // Automatically computes profile completeness score
    public void computeProfileScore() {
        int score = 0;
        if (this.getFullName() != null) score += 20;
        if (this.phone != null)         score += 15;
        if (this.city != null)          score += 15;
        if (this.jobTitle != null)      score += 20;
        if (this.bio != null)           score += 20;
        if (this.avatarUrl != null)     score += 10;
        this.profileScore = score;
    }
}



