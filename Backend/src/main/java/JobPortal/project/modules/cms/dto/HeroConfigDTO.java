package JobPortal.project.modules.cms.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

/** ─────────────────────────────────────────────────────────
 *  DTOs for the Hero Configuration API
 *  ───────────────────────────────────────────────────────── */
public class HeroConfigDTO {

    /* ── Slide ──────────────────────────────────────────── */
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Slide {
        private String url;
        private String alt;
        private String credit;
        private String position;   // e.g. "center top"
    }

    /* ── Request (admin → backend) ──────────────────────── */
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Request {
        private String  headline;
        private String  subheadline;
        private String  ctaPrimary;
        private String  ctaPrimaryUrl;
        private String  ctaSecondary;
        private String  ctaSecondaryUrl;
        private String  badgeText;

        private String  backgroundType;   // gradient | image | slideshow
        private String  gradientFrom;
        private String  gradientTo;
        private String  backgroundImageUrl;

        private List<Slide> slides;
        private Integer     slideIntervalMs;
        private String      slideTransition;   // fade | slide | zoom

        private Boolean statsVisible;
        private Boolean statsDynamic;
        private String  statJobsLabel;
        private String  statCompaniesLabel;
        private String  statSeekersLabel;

        private String  layout;           // center | left | split
        private Double  overlayOpacity;
        private String  textColor;        // light | dark
        private Boolean isActive;

        /* ── Motion ────────────────────────────────────────────── */
        private Boolean kenBurnsEffect;   // subtle zoom on slides
        private Boolean autoplayPause;    // pause on hover
        private String  textAnimation;    // none | fadeUp | slideUp | fadeIn | zoomIn
    }

    /* ── Response (backend → frontend) ─────────────────── */
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long    id;
        private String  headline;
        private String  subheadline;
        private String  ctaPrimary;
        private String  ctaPrimaryUrl;
        private String  ctaSecondary;
        private String  ctaSecondaryUrl;
        private String  badgeText;

        private String  backgroundType;
        private String  gradientFrom;
        private String  gradientTo;
        private String  backgroundImageUrl;

        private List<Slide> slides;
        private Integer     slideIntervalMs;
        private String      slideTransition;

        private Boolean statsVisible;
        private Boolean statsDynamic;
        private String  statJobsLabel;
        private String  statCompaniesLabel;
        private String  statSeekersLabel;

        /* Resolved live counts (filled by service when statsDynamic=true) */
        private Long    liveJobCount;
        private Long    liveCompanyCount;
        private Long    liveSeekerCount;

        private String  layout;
        private Double  overlayOpacity;
        private String  textColor;
        private Boolean isActive;

        /* ── Motion ────────────────────────────────────────────── */
        private Boolean kenBurnsEffect;
        private Boolean autoplayPause;
        private String  textAnimation;

        private LocalDateTime updatedAt;
        private String        updatedBy;
    }
}