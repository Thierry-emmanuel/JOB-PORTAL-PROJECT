package JobPortal.project.modules.userprofile.controller;

import JobPortal.project.modules.userprofile.model.Employer;
import JobPortal.project.modules.userprofile.service.EmployerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Handles employer self-service profile and document endpoints.
 *
 * PATCH /api/v1/employer/profile   — update company identity info
 * POST  /api/v1/employer/documents — upload legal verification documents
 */
@RestController
@RequestMapping("/api/v1/employer")
@RequiredArgsConstructor
@Slf4j
public class EmployerProfileController {

    private final EmployerService employerService;

    // ─── Helpers ──────────────────────────────────────────────────

    private String currentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        return auth.getName();
    }

    private ResponseEntity<?> notFound(String email) {
        log.warn("[EmployerProfile] Employer not found for email: {}", email);
        return ResponseEntity.status(404).body("Employer profile not found");
    }

    // ─── PATCH /api/v1/employer/profile ───────────────────────────
    /**
     * Called at end of Step 2 to persist company identity & metadata.
     * Does NOT change isApproved — that remains admin-only.
     */
    @PatchMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> payload) {
        String email = currentUserEmail();
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        Optional<Employer> opt = employerService.getEmployerByEmail(email);
        if (opt.isEmpty()) return notFound(email);

        Employer emp = opt.get();

        // Company identity
        if (payload.containsKey("companyName"))              emp.setCompanyName(payload.get("companyName"));
        if (payload.containsKey("registrationNumber"))       emp.setRegistrationNumber(payload.get("registrationNumber"));
        if (payload.containsKey("taxIdentificationNumber"))  emp.setTaxIdentificationNumber(payload.get("taxIdentificationNumber"));
        if (payload.containsKey("companySize"))              emp.setCompanySize(payload.get("companySize"));
        if (payload.containsKey("companyAddress"))           emp.setCompanyAddress(payload.get("companyAddress"));

        // Contact / personal
        if (payload.containsKey("contactName"))  emp.setContactName(payload.get("contactName"));
        if (payload.containsKey("phone"))        emp.setPhone(payload.get("phone"));
        if (payload.containsKey("city"))         emp.setCity(payload.get("city"));
        if (payload.containsKey("sector"))       emp.setSector(payload.get("sector"));
        if (payload.containsKey("website"))      emp.setWebsite(payload.get("website"));
        if (payload.containsKey("jobTitle"))     emp.setJobTitle(payload.get("jobTitle"));
        if (payload.containsKey("bio"))          emp.setBio(payload.get("bio"));

        emp.computeProfileScore();
        Employer saved = employerService.saveEmployer(emp);
        log.info("[EmployerProfile] Profile updated for employer: {} (id={})", email, saved.getId());

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Profile updated successfully");
        res.put("profileScore", saved.getProfileScore());
        res.put("isApproved", saved.getIsApproved());
        res.put("documentsSubmitted", saved.getDocumentsSubmitted());
        return ResponseEntity.ok(res);
    }

    // ─── POST /api/v1/employer/documents ──────────────────────────
    /**
     * Receives multipart documents from Step 2 document upload form.
     * Files are stored on disk (or swap to cloud storage provider).
     * Marks documentsSubmitted = true and triggers admin notification.
     */
    @PostMapping("/documents")
    public ResponseEntity<?> uploadDocuments(
            @RequestParam(value = "rccm",            required = false) MultipartFile rccm,
            @RequestParam(value = "taxCertificate",  required = false) MultipartFile taxCertificate,
            @RequestParam(value = "companyStatutes", required = false) MultipartFile companyStatutes,
            @RequestParam(value = "representativeId",required = false) MultipartFile representativeId,
            @RequestParam(value = "companyName",     required = false) String companyName
    ) {
        String email = currentUserEmail();
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        Optional<Employer> opt = employerService.getEmployerByEmail(email);
        if (opt.isEmpty()) return notFound(email);

        Employer emp = opt.get();

        try {
            // Upload dir: uploads/employer-docs/{employerId}/
            Path uploadDir = Paths.get("uploads", "employer-docs", String.valueOf(emp.getId()));
            Files.createDirectories(uploadDir);

            if (rccm != null && !rccm.isEmpty()) {
                String name = saveFile(uploadDir, "rccm", rccm);
                emp.setRccmDocumentUrl(uploadDir.resolve(name).toString());
            }
            if (taxCertificate != null && !taxCertificate.isEmpty()) {
                String name = saveFile(uploadDir, "tax-cert", taxCertificate);
                emp.setTaxCertificateUrl(uploadDir.resolve(name).toString());
            }
            if (companyStatutes != null && !companyStatutes.isEmpty()) {
                String name = saveFile(uploadDir, "statutes", companyStatutes);
                emp.setCompanyStatutesUrl(uploadDir.resolve(name).toString());
            }
            if (representativeId != null && !representativeId.isEmpty()) {
                String name = saveFile(uploadDir, "rep-id", representativeId);
                emp.setRepresentativeIdUrl(uploadDir.resolve(name).toString());
            }

            // Mark documents submitted — account now pending admin review
            emp.setDocumentsSubmitted(true);
            employerService.saveEmployer(emp);

            // Notify admin team (fire-and-forget)
            try {
                employerService.notifyAdminDocumentsSubmitted(emp);
            } catch (Exception e) {
                log.warn("[EmployerProfile] Admin notification failed (non-fatal): {}", e.getMessage());
            }

            log.info("[EmployerProfile] Documents uploaded for employer {} (id={})", email, emp.getId());
            return ResponseEntity.ok(Map.of(
                    "message", "Documents uploaded successfully. Your account is pending review.",
                    "documentsSubmitted", true
            ));

        } catch (IOException e) {
            log.error("[EmployerProfile] Document upload IO error for {}: {}", email, e.getMessage());
            return ResponseEntity.status(500).body("File upload failed: " + e.getMessage());
        }
    }

    // ─── Helper: save multipart file with timestamped name ────────
    private String saveFile(Path dir, String prefix, MultipartFile file) throws IOException {
        String original  = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String ext       = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
        String filename  = prefix + "_" + Instant.now().getEpochSecond() + ext;
        Path   target    = dir.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        return filename;
    }
}