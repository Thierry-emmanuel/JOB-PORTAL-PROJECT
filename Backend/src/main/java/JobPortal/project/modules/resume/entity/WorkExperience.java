package JobPortal.project.modules.resume.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "work_experiences")
@Data
@NoArgsConstructor
public class WorkExperience {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id")
    private Resume resume;

    private String companyName;
    private String position;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean isCurrent;

    @Column(columnDefinition = "TEXT")
    private String description;
}



