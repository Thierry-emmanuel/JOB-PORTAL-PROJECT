package JobPortal.project.admin.Controller;

import JobPortal.project.admin.DTO.CategoryDTO;
import JobPortal.project.admin.DTO.DashboardStatsDTO;
import JobPortal.project.admin.DTO.FAQDTO;
import JobPortal.project.admin.DTO.JobManagementDTO;
import JobPortal.project.admin.DTO.UserManagementDTO;
import JobPortal.project.admin.Service.AdminService;
import JobPortal.project.cms.Model.FAQ;
import JobPortal.project.cms.Service.FAQService;
import JobPortal.project.job.Enum.JobStatus;
import JobPortal.project.job.Model.Category;
import JobPortal.project.job.Model.Job;
import JobPortal.project.job.Service.CategoryService;
import JobPortal.project.job.Service.JobService;
import JobPortal.project.notification.Service.NotificationService;
import JobPortal.project.resume.entity.Skill;
import JobPortal.project.resume.repository.SkillRepository;
import JobPortal.project.auth.Enum.Role;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final JobService jobService;
    private final CategoryService categoryService;
    private final FAQService faqService;
    private final SkillRepository skillRepository;
    private final NotificationService notificationService;

    // ==========================================
    // 1. DASHBOARD & USERS
    // ==========================================
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserManagementDTO>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PutMapping("/users/{id}/toggle-status")
    public ResponseEntity<UserManagementDTO> toggleUserStatus(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.toggleUserStatus(id));
    }

    // ==========================================
    // 2. JOB MODERATION
    // ==========================================
    @GetMapping("/jobs")
    public ResponseEntity<List<JobManagementDTO>> getAllJobs() {
        List<JobManagementDTO> dtos = jobService.getAllJobs().stream().map(job -> new JobManagementDTO(
                job.getId(),
                job.getTitle(),
                job.getCompany() != null ? job.getCompany().getName() : "Unknown",
                job.getCategory() != null ? job.getCategory().getName() : "Uncategorized",
                job.getLocation(),
                job.getStatus(),
                job.getCreatedAt()
        )).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/jobs/{id}/approve")
    public ResponseEntity<Job> approveJob(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.updateJobStatus(id, JobStatus.APPROVED));
    }

    @PutMapping("/jobs/{id}/reject")
    public ResponseEntity<Job> rejectJob(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.updateJobStatus(id, JobStatus.REJECTED));
    }

    @DeleteMapping("/jobs/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id) {
        jobService.deleteJob(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // 3. MASTER DATA: CATEGORIES
    // ==========================================
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody CategoryDTO dto) {
        Category category = new Category();
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        return ResponseEntity.ok(categoryService.createCategory(category));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // 4. MASTER DATA: SKILLS
    // ==========================================
    @GetMapping("/skills")
    public ResponseEntity<List<Skill>> getAllSkills() {
        return ResponseEntity.ok(skillRepository.findAll());
    }

    @PostMapping("/skills")
    public ResponseEntity<Skill> createSkill(@RequestBody Skill skill) {
        return ResponseEntity.ok(skillRepository.save(skill));
    }

    @DeleteMapping("/skills/{id}")
    public ResponseEntity<Void> deleteSkill(@PathVariable Long id) {
        skillRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // 5. CMS: FAQS
    // ==========================================
    @GetMapping("/faqs")
    public ResponseEntity<List<FAQ>> getAllFAQs() {
        return ResponseEntity.ok(faqService.getAllFAQs());
    }

    @PostMapping("/faqs")
    public ResponseEntity<FAQ> createFAQ(@RequestBody FAQDTO dto) {
        FAQ faq = new FAQ();
        faq.setQuestion(dto.getQuestion());
        faq.setAnswer(dto.getAnswer());
        faq.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        return ResponseEntity.ok(faqService.createFAQ(faq));
    }

    @PutMapping("/faqs/{id}")
    public ResponseEntity<FAQ> updateFAQ(@PathVariable Long id, @RequestBody FAQDTO dto) {
        FAQ faq = new FAQ();
        faq.setQuestion(dto.getQuestion());
        faq.setAnswer(dto.getAnswer());
        faq.setIsActive(dto.getIsActive());
        return ResponseEntity.ok(faqService.updateFAQ(id, faq));
    }

    @DeleteMapping("/faqs/{id}")
    public ResponseEntity<Void> deleteFAQ(@PathVariable Long id) {
        faqService.deleteFAQ(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // 6. SYSTEM NOTIFICATIONS
    // ==========================================
    @PostMapping("/notifications/broadcast")
    public ResponseEntity<Void> broadcastNotification(@RequestParam String title, 
                                                      @RequestParam String message, 
                                                      @RequestParam(required = false) Role targetRole) {
        notificationService.sendBroadcastNotification(title, message, targetRole);
        return ResponseEntity.ok().build();
    }
}
