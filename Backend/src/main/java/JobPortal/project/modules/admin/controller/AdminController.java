package JobPortal.project.modules.admin.controller;

import JobPortal.project.modules.admin.dto.CategoryDTO;
import JobPortal.project.modules.admin.dto.DashboardStatsDTO;
import JobPortal.project.modules.admin.dto.FAQDTO;
import JobPortal.project.modules.admin.dto.UserManagementDTO;
import JobPortal.project.modules.admin.dto.UserPageResponse;
import JobPortal.project.modules.admin.dto.UserCreationDTO;
import JobPortal.project.modules.admin.dto.UserUpdateDTO;
import JobPortal.project.modules.auth.model.User;
import JobPortal.project.modules.admin.service.AdminService;
import JobPortal.project.modules.cms.model.FAQ;
import JobPortal.project.modules.cms.service.FAQService;
import JobPortal.project.modules.job.model.Category;
import JobPortal.project.modules.job.service.CategoryService;
import JobPortal.project.modules.notification.service.NotificationService;
import JobPortal.project.modules.resume.entity.Skill;
import JobPortal.project.modules.resume.repository.SkillRepository;
import JobPortal.project.enums.Role;

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
    public ResponseEntity<UserPageResponse> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminService.getUsersPaged(page, size, role, active, search));
    }

    @PutMapping("/users/{id}/toggle-status")
    public ResponseEntity<UserManagementDTO> toggleUserStatus(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.toggleUserStatus(id));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody UserCreationDTO dto) {
        return ResponseEntity.ok(adminService.createUser(dto));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody UserUpdateDTO dto) {
        return ResponseEntity.ok(adminService.updateUser(id, dto));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
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
