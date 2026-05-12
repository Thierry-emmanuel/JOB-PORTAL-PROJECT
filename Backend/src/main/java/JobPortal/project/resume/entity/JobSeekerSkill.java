package JobPortal.project.resume.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "job_seeker_skills")
@Data
@NoArgsConstructor
public class JobSeekerSkill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id")
    private Resume resume;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "skill_id")
    private Skill skill;

    @Enumerated(EnumType.STRING)
    private ProficiencyLevel proficiencyLevel;

    public enum ProficiencyLevel { BEGINNER, INTERMEDIATE, ADVANCED, EXPERT }
}
