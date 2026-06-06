package JobPortal.project.modules.company.model;

import JobPortal.project.modules.company.enums.CompanySize;
import JobPortal.project.modules.userprofile.model.Employer;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "companies")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private String sector;

    @Column
    private String websiteUrl;

    @Column
    private String logoUrl;

    @Column
    private String city;

    @Column
    private String country;

    @Column
    private String contactEmail;

    @Column
    private String contactPhone;

    @Enumerated(EnumType.STRING)
    @Column
    private CompanySize companySize;

    // Average rating computed from all CompanyRatings
    @Column
    private Double averageRating = 0.0;

    // Number of ratings received
    @Column
    private Integer ratingCount = 0;

    @Column(name = "likes_count")
    private Integer likesCount = 0;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // One Employer can have multiple companies
    @ManyToOne
    @JoinColumn(name = "employer_id", nullable = false)
    private Employer employer;

    // One Company can have multiple ratings
    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CompanyRating> ratings = new ArrayList<>();

    // One Company can have multiple likes
    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CompanyLike> likes = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Recomputes the average rating from all ratings
    public void computeAverageRating() {
        if (ratings == null || ratings.isEmpty()) {
            this.averageRating = 0.0;
            this.ratingCount = 0;
        } else {
            double sum = ratings.stream()
                    .mapToDouble(CompanyRating::getRating)
                    .sum();
            this.ratingCount = ratings.size();
            this.averageRating = sum / this.ratingCount;
        }
    }
}



