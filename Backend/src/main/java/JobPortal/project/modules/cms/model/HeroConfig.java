package JobPortal.project.modules.cms.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Stores the single, live hero-section configuration for the KORA homepage.
 * Only one row (id=1) is used; the service upserts it on every save.
 *
 * Slide images are persisted as a JSON column so no extra table is needed.
 * Each slide: { url, alt, credit }
 */
@Entity
@Table(name = "hero_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeroConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /* ── Text content ─────────────────────────────────────────────── */
    @Column(nullable = false, length = 200)
    private String headline;

    @Column(length = 400)
    private String subheadline;

    @Column(name = "cta_primary",   length = 80)
    private String ctaPrimary;

    @Column(name = "cta_primary_url", length = 200)
    private String ctaPrimaryUrl;

    @Column(name = "cta_secondary", length = 80)
    private String ctaSecondary;

    @Column(name = "cta_secondary_url", length = 200)
    private String ctaSecondaryUrl;

    @Column(name = "badge_text", length = 120)
    private String badgeText;

    /* ── Background ───────────────────────────────────────────────── */
    /** "gradient" | "image" | "video" | "slideshow" */
    @Column(name = "background_type", length = 30)
    private String backgroundType;

    /** Used when backgroundType = "gradient" */
    @Column(name = "gradient_from", length = 30)
    private String gradientFrom;

    @Column(name = "gradient_to", length = 30)
    private String gradientTo;

    /** Used when backgroundType = "image" */
    @Column(name = "background_image_url", length = 500)
    private String backgroundImageUrl;

    /* ── Slideshow slides (JSON array) ────────────────────────────── */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "slides", columnDefinition = "json")
    private List<HeroSlide> slides;

    /* ── Slide transition settings ────────────────────────────────── */
    /** Milliseconds between auto-advances */
    @Column(name = "slide_interval_ms")
    @Builder.Default
    private Integer slideIntervalMs = 4000;

    /** "fade" | "slide" | "zoom" */
    @Column(name = "slide_transition", length = 20)
    @Builder.Default
    private String slideTransition = "fade";

    /* ── Stats bar ────────────────────────────────────────────────── */
    @Column(name = "stats_visible")
    @Builder.Default
    private Boolean statsVisible = true;

    /** Whether stats come from real DB counts or from static overrides */
    @Column(name = "stats_dynamic")
    @Builder.Default
    private Boolean statsDynamic = true;

    @Column(name = "stat_jobs_label",    length = 60)  private String statJobsLabel;
    @Column(name = "stat_companies_label", length = 60) private String statCompaniesLabel;
    @Column(name = "stat_seekers_label", length = 60)  private String statSeekersLabel;

    /* ── Layout ───────────────────────────────────────────────────── */
    /** "center" | "left" | "split" */
    @Column(name = "layout", length = 20)
    @Builder.Default
    private String layout = "center";

    /** Show dark overlay on background */
    @Column(name = "overlay_opacity")
    @Builder.Default
    private Double overlayOpacity = 0.55;

    /** Text colour on hero: "light" | "dark" */
    @Column(name = "text_color", length = 10)
    @Builder.Default
    private String textColor = "light";

    /* ── Motion / Animation ──────────────────────────────────────────── */
    /** Apply subtle Ken Burns zoom to slideshow images */
    @Column(name = "ken_burns_effect")
    @Builder.Default
    private Boolean kenBurnsEffect = true;

    /** Pause slideshow auto-advance when user hovers over hero */
    @Column(name = "autoplay_pause")
    @Builder.Default
    private Boolean autoplayPause = true;

    /** Hero text entry animation: none | fadeUp | slideUp | fadeIn | zoomIn */
    @Column(name = "text_animation", length = 20)
    @Builder.Default
    private String textAnimation = "fadeUp";

    /* ── Visibility ───────────────────────────────────────────────── */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @PrePersist @PreUpdate
    void touch() { this.updatedAt = LocalDateTime.now(); }

    /* ── Embedded slide ───────────────────────────────────────────── */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HeroSlide {
        private String url;       // image URL (absolute or relative)
        private String alt;       // accessibility alt text
        private String credit;    // optional photo credit
        private String position;  // CSS object-position, e.g. "center top"
    }
}