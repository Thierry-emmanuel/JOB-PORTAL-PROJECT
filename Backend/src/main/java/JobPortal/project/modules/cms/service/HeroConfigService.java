package JobPortal.project.modules.cms.service;

import JobPortal.project.modules.cms.dto.HeroConfigDTO;
import JobPortal.project.modules.cms.model.HeroConfig;
import JobPortal.project.modules.cms.repository.HeroConfigRepository;
import JobPortal.project.modules.joblisting.enums.PostingStatus;
import JobPortal.project.modules.joblisting.repository.JobListingRepository;
import JobPortal.project.modules.auth.repository.UserRepository;
import JobPortal.project.enums.Role;
import JobPortal.project.modules.company.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HeroConfigService {

    private final HeroConfigRepository heroConfigRepository;
    private final JobListingRepository  jobListingRepository;
    private final UserRepository        userRepository;
    private final CompanyRepository     companyRepository;

    /* ─── Public: get live hero (used by homepage, no auth required) ── */
    @Transactional(readOnly = true)
    public HeroConfigDTO.Response getLiveHero() {
        HeroConfig cfg = heroConfigRepository.findFirstByIsActiveTrue()
                .orElseGet(this::buildDefault);
        return toResponse(cfg);
    }

    /* ─── Admin: get current config for editing ───────────────────── */
    @Transactional(readOnly = true)
    public HeroConfigDTO.Response getAdminHero() {
        HeroConfig cfg = heroConfigRepository.findById(1L)
                .orElseGet(this::buildDefault);
        return toResponse(cfg);
    }

    /* ─── Admin: save / upsert (always id=1) ─────────────────────── */
    @Transactional
    public HeroConfigDTO.Response saveHero(HeroConfigDTO.Request req, String editorEmail) {
        HeroConfig cfg = heroConfigRepository.findById(1L)
                .orElse(HeroConfig.builder().id(1L).build());

        applyRequest(cfg, req);
        cfg.setUpdatedBy(editorEmail);

        HeroConfig saved = heroConfigRepository.save(cfg);
        return toResponse(saved);
    }

    /* ─── Admin: reset to defaults ────────────────────────────────── */
    @Transactional
    public HeroConfigDTO.Response resetToDefaults(String editorEmail) {
        HeroConfig defaults = buildDefault();
        defaults.setId(1L);
        defaults.setUpdatedBy(editorEmail);
        HeroConfig saved = heroConfigRepository.save(defaults);
        return toResponse(saved);
    }

    /* ════════════════════════════════════════════════════════════════ */
    /*  Private helpers                                                  */
    /* ════════════════════════════════════════════════════════════════ */

    private void applyRequest(HeroConfig cfg, HeroConfigDTO.Request r) {
        if (r.getHeadline()          != null) cfg.setHeadline(r.getHeadline());
        if (r.getSubheadline()       != null) cfg.setSubheadline(r.getSubheadline());
        if (r.getCtaPrimary()        != null) cfg.setCtaPrimary(r.getCtaPrimary());
        if (r.getCtaPrimaryUrl()     != null) cfg.setCtaPrimaryUrl(r.getCtaPrimaryUrl());
        if (r.getCtaSecondary()      != null) cfg.setCtaSecondary(r.getCtaSecondary());
        if (r.getCtaSecondaryUrl()   != null) cfg.setCtaSecondaryUrl(r.getCtaSecondaryUrl());
        if (r.getBadgeText()         != null) cfg.setBadgeText(r.getBadgeText());
        if (r.getBackgroundType()    != null) cfg.setBackgroundType(r.getBackgroundType());
        if (r.getGradientFrom()      != null) cfg.setGradientFrom(r.getGradientFrom());
        if (r.getGradientTo()        != null) cfg.setGradientTo(r.getGradientTo());
        if (r.getBackgroundImageUrl()!= null) cfg.setBackgroundImageUrl(r.getBackgroundImageUrl());
        if (r.getSlides()            != null) cfg.setSlides(toEntitySlides(r.getSlides()));
        if (r.getSlideIntervalMs()   != null) cfg.setSlideIntervalMs(r.getSlideIntervalMs());
        if (r.getSlideTransition()   != null) cfg.setSlideTransition(r.getSlideTransition());
        if (r.getStatsVisible()      != null) cfg.setStatsVisible(r.getStatsVisible());
        if (r.getStatsDynamic()      != null) cfg.setStatsDynamic(r.getStatsDynamic());
        if (r.getStatJobsLabel()     != null) cfg.setStatJobsLabel(r.getStatJobsLabel());
        if (r.getStatCompaniesLabel()!= null) cfg.setStatCompaniesLabel(r.getStatCompaniesLabel());
        if (r.getStatSeekersLabel()  != null) cfg.setStatSeekersLabel(r.getStatSeekersLabel());
        if (r.getLayout()            != null) cfg.setLayout(r.getLayout());
        if (r.getOverlayOpacity()    != null) cfg.setOverlayOpacity(r.getOverlayOpacity());
        if (r.getTextColor()         != null) cfg.setTextColor(r.getTextColor());
        if (r.getIsActive()          != null) cfg.setIsActive(r.getIsActive());
        if (r.getKenBurnsEffect()    != null) cfg.setKenBurnsEffect(r.getKenBurnsEffect());
        if (r.getAutoplayPause()     != null) cfg.setAutoplayPause(r.getAutoplayPause());
        if (r.getTextAnimation()     != null) cfg.setTextAnimation(r.getTextAnimation());
    }

    private HeroConfigDTO.Response toResponse(HeroConfig cfg) {
        // Resolve live counts when statsDynamic flag is true
        Long liveJobs     = null;
        Long liveCompanies= null;
        Long liveSeekers  = null;

        if (Boolean.TRUE.equals(cfg.getStatsDynamic())) {
            try { liveJobs      = jobListingRepository.countByStatus(PostingStatus.ACTIVE); } catch (Exception ignored) {}
            try { liveCompanies = companyRepository.count(); }                               catch (Exception ignored) {}
            try { liveSeekers   = userRepository.countByRole(Role.JOB_SEEKER); }            catch (Exception ignored) {}
        }

        return HeroConfigDTO.Response.builder()
                .id(cfg.getId())
                .headline(cfg.getHeadline())
                .subheadline(cfg.getSubheadline())
                .ctaPrimary(cfg.getCtaPrimary())
                .ctaPrimaryUrl(cfg.getCtaPrimaryUrl())
                .ctaSecondary(cfg.getCtaSecondary())
                .ctaSecondaryUrl(cfg.getCtaSecondaryUrl())
                .badgeText(cfg.getBadgeText())
                .backgroundType(cfg.getBackgroundType())
                .gradientFrom(cfg.getGradientFrom())
                .gradientTo(cfg.getGradientTo())
                .backgroundImageUrl(cfg.getBackgroundImageUrl())
                .slides(toDTOSlides(cfg.getSlides()))
                .slideIntervalMs(cfg.getSlideIntervalMs())
                .slideTransition(cfg.getSlideTransition())
                .statsVisible(cfg.getStatsVisible())
                .statsDynamic(cfg.getStatsDynamic())
                .statJobsLabel(cfg.getStatJobsLabel())
                .statCompaniesLabel(cfg.getStatCompaniesLabel())
                .statSeekersLabel(cfg.getStatSeekersLabel())
                .liveJobCount(liveJobs)
                .liveCompanyCount(liveCompanies)
                .liveSeekerCount(liveSeekers)
                .layout(cfg.getLayout())
                .overlayOpacity(cfg.getOverlayOpacity())
                .textColor(cfg.getTextColor())
                .isActive(cfg.getIsActive())
                .kenBurnsEffect(cfg.getKenBurnsEffect())
                .autoplayPause(cfg.getAutoplayPause())
                .textAnimation(cfg.getTextAnimation())
                .updatedAt(cfg.getUpdatedAt())
                .updatedBy(cfg.getUpdatedBy())
                .build();
    }

    private List<HeroConfig.HeroSlide> toEntitySlides(List<HeroConfigDTO.Slide> dtos) {
        if (dtos == null) return null;
        return dtos.stream()
                .map(d -> HeroConfig.HeroSlide.builder()
                        .url(d.getUrl()).alt(d.getAlt())
                        .credit(d.getCredit()).position(d.getPosition())
                        .build())
                .collect(Collectors.toList());
    }

    private List<HeroConfigDTO.Slide> toDTOSlides(List<HeroConfig.HeroSlide> slides) {
        if (slides == null) return List.of();
        return slides.stream()
                .map(s -> HeroConfigDTO.Slide.builder()
                        .url(s.getUrl()).alt(s.getAlt())
                        .credit(s.getCredit()).position(s.getPosition())
                        .build())
                .collect(Collectors.toList());
    }

    /** Sensible out-of-the-box defaults (used if no row exists yet) */
    private HeroConfig buildDefault() {
        return HeroConfig.builder()
                .id(1L)
                .headline("Find Your Dream Job in Cameroon")
                .subheadline("Connecting top talent with leading employers across Africa. Your next opportunity starts here.")
                .ctaPrimary("Browse Jobs")
                .ctaPrimaryUrl("/jobs")
                .ctaSecondary("Post a Job")
                .ctaSecondaryUrl("/register")
                .badgeText("1,200+ jobs available now")
                .backgroundType("slideshow")
                .gradientFrom("#1a1438")
                .gradientTo("#1e3a5f")
                .slides(List.of(
                        HeroConfig.HeroSlide.builder().url("https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=1600&q=80").alt("Professionals collaborating").position("center center").build(),
                        HeroConfig.HeroSlide.builder().url("https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&q=80").alt("Team at work").position("center top").build(),
                        HeroConfig.HeroSlide.builder().url("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1600&q=80").alt("Woman in office").position("center center").build()
                ))
                .slideIntervalMs(4500)
                .slideTransition("fade")
                .statsVisible(true)
                .statsDynamic(true)
                .statJobsLabel("Active Jobs")
                .statCompaniesLabel("Companies")
                .statSeekersLabel("Job Seekers")
                .layout("center")
                .overlayOpacity(0.58)
                .textColor("light")
                .isActive(true)
                .kenBurnsEffect(true)
                .autoplayPause(true)
                .textAnimation("fadeUp")
                .build();
    }
}