package JobPortal.project.modules.userprofile.model;

import JobPortal.project.enums.Role;
import JobPortal.project.modules.auth.model.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "job_seekers")
public class JobSeeker extends User {

    @Column
    private String phone;

    @Column
    private String city;

    @Column
    private String region;

    @Column(columnDefinition = "TEXT")
    private String profileSummary;

    @Column(columnDefinition = "LONGTEXT")
    private String avatarUrl;

    @Column
    private String linkedInUrl;

    @Column
    private String portfolioUrl;

    // Profile completeness score from 0 to 100
    @Column
    private Integer profileScore = 0;

    @Column(columnDefinition = "LONGTEXT")
    private String cvUrl;

    @Column
    private String cvFileName;

    @Column
    private Boolean isOpenToWork = true;

    @Convert(converter = JsonListConverter.class)
    @Column(columnDefinition = "LONGTEXT")
    private List<Object> experiences;

    @Convert(converter = JsonListConverter.class)
    @Column(columnDefinition = "LONGTEXT")
    private List<Object> education;

    @Convert(converter = JsonListConverter.class)
    @Column(columnDefinition = "LONGTEXT")
    private List<Object> skills;

    @Convert(converter = JsonListConverter.class)
    @Column(columnDefinition = "LONGTEXT")
    private List<Object> languages;

    public JobSeeker(String fullName, String email, String password) {
        super();
        this.setFullName(fullName);
        this.setEmail(email);
        this.setPassword(password);
        this.setRole(Role.JOB_SEEKER);
        this.setIsActive(true);
    }

    // Automatically computes profile completeness score
    public void computeProfileScore() {
        int score = 0;
        if (this.getFullName() != null)   score += 20;
        if (this.phone != null)           score += 10;
        if (this.city != null)            score += 10;
        if (this.profileSummary != null)  score += 20;
        if (this.avatarUrl != null)       score += 20;
        if (this.linkedInUrl != null)     score += 10;
        if (this.portfolioUrl != null)    score += 10;
        this.profileScore = score;
    }
}


