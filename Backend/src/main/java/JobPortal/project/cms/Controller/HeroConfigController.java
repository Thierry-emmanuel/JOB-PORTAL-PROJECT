package JobPortal.project.cms.Controller;

import JobPortal.project.cms.DTO.HeroConfigDTO;
import JobPortal.project.cms.Service.HeroConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Hero configuration endpoints.
 *
 * Public  GET  /api/public/hero          — homepage fetches live config
 * Admin   GET  /api/admin/hero           — editor loads current config
 * Admin   PUT  /api/admin/hero           — editor saves config
 * Admin   POST /api/admin/hero/reset     — revert to defaults
 */
@RestController
@RequiredArgsConstructor
public class HeroConfigController {

    private final HeroConfigService heroConfigService;

    /* ── Public: homepage hero (no auth) ───────────────────────────── */
    @GetMapping("/api/public/hero")
    public ResponseEntity<HeroConfigDTO.Response> getLiveHero() {
        return ResponseEntity.ok(heroConfigService.getLiveHero());
    }

    /* ── Admin: load config into editor ────────────────────────────── */
    @GetMapping("/api/admin/hero")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HeroConfigDTO.Response> getAdminHero() {
        return ResponseEntity.ok(heroConfigService.getAdminHero());
    }

    /* ── Admin: save / upsert ───────────────────────────────────────── */
    @PutMapping("/api/admin/hero")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HeroConfigDTO.Response> saveHero(
            @RequestBody HeroConfigDTO.Request request,
            @AuthenticationPrincipal UserDetails principal) {

        String editor = principal != null ? principal.getUsername() : "admin";
        return ResponseEntity.ok(heroConfigService.saveHero(request, editor));
    }

    /* ── Admin: reset to defaults ───────────────────────────────────── */
    @PostMapping("/api/admin/hero/reset")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HeroConfigDTO.Response> resetHero(
            @AuthenticationPrincipal UserDetails principal) {

        String editor = principal != null ? principal.getUsername() : "admin";
        return ResponseEntity.ok(heroConfigService.resetToDefaults(editor));
    }
}