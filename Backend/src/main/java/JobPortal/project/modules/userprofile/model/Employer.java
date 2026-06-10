package JobPortal.project.modules.userprofile.model;

import JobPortal.project.enums.Role;
import JobPortal.project.modules.auth.model.User;
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

    @Column(columnDefinition = "LONGTEXT")
    private String avatarUrl;

    @Column
    private String jobTitle;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column
    private String contactName;

    @Column
    private String sector;

    @Column
    private String website;

    // ── New legal/company fields ───────────────────────────────────
    @Column
    private String companyName;

    @Column
    private String companySize;

    @Column
    private String companyAddress;

    /** RCCM — Registre du Commerce et du Crédit Mobilier number */
    @Column
    private String registrationNumber;

    /** NIU — Numéro d'Identification Unique (tax ID) */
    @Column
    private String taxIdentificationNumber;

    // ── Document storage URLs (set after file upload) ─────────────
    @Column(columnDefinition = "TEXT")
    private String rccmDocumentUrl;

    @Column(columnDefinition = "TEXT")
    private String taxCertificateUrl;

    @Column(columnDefinition = "TEXT")
    private String companyStatutesUrl;

    @Column(columnDefinition = "TEXT")
    private String representativeIdUrl;

    // ── Approval state ────────────────────────────────────────────
    /** false until Admin reviews and approves the account (FR07) */
    @Column(nullable = false)
    private Boolean isApproved = false;

    /** Documents submitted; waiting for admin review */
    @Column(nullable = false)
    private Boolean documentsSubmitted = false;

    // ── Profile completeness score ─────────────────────────────────
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
        this.documentsSubmitted = false;
    }

    /** Computes profile completeness score (0–100) */
    public void computeProfileScore() {
        int score = 0;
        if (this.getFullName() != null)        score += 15;
        if (this.phone != null)                score += 10;
        if (this.city != null)                 score += 10;
        if (this.jobTitle != null)             score += 10;
        if (this.bio != null)                  score += 10;
        if (this.companyName != null)          score += 15;
        if (this.registrationNumber != null)   score += 10;
        if (this.taxIdentificationNumber != null) score += 10;
        if (this.avatarUrl != null)            score += 10;
        this.profileScore = score;
    }
}