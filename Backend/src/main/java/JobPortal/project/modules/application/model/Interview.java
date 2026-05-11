package JobPortal.project.modules.application.model;

import JobPortal.project.modules.application.enums.InterviewResult;
import JobPortal.project.modules.application.enums.InterviewType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "interviews",
        indexes = {
                @Index(name = "idx_interview_application_id", columnList = "application_id"),
                @Index(name = "idx_interview_scheduled_at",   columnList = "scheduled_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "CHAR(36)")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "application_id",
            nullable = false,
            updatable = false,
            columnDefinition = "CHAR(36)",
            foreignKey = @ForeignKey(name = "fk_interview_application")
    )
    private Application application;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private InterviewType type;

    @Column(name = "platform", length = 100)
    private String platform;

    @Column(name = "meeting_link", length = 512)
    private String meetingLink;

    @Column(name = "feed_back", columnDefinition = "TEXT")
    private String feedBack;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", length = 20)
    private InterviewResult result;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Transient
    public boolean isCompleted() {
        return result != null;
    }

    @Transient
    public boolean isPending() {
        return result == null && LocalDateTime.now().isBefore(scheduledAt);
    }
}


