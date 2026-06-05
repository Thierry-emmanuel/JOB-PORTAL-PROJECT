package JobPortal.project.modules.userprofile.Service;

import JobPortal.project.modules.userprofile.Model.Admin;
import JobPortal.project.modules.userprofile.Model.Employer;
import JobPortal.project.modules.userprofile.Model.JobSeeker;
import JobPortal.project.modules.userprofile.Repository.AdminRepository;
import JobPortal.project.modules.userprofile.Repository.EmployerRepository;
import JobPortal.project.modules.userprofile.Repository.JobSeekerRepository;
import JobPortal.project.modules.notification.Event.NotificationEvent;
import JobPortal.project.enums.NotificationType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AdminService {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private EmployerRepository employerRepository;

    @Autowired
    private JobSeekerRepository jobSeekerRepository;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    // Get all Admins
    public List<Admin> getAllAdmins() {
        return adminRepository.findAll();
    }

    // Get an Admin by ID
    public Optional<Admin> getAdminById(Long id) {
        return adminRepository.findById(id);
    }

    // Get an Admin by email
    public Optional<Admin> getAdminByEmail(String email) {
        return adminRepository.findByEmail(email);
    }

    // Create a new Admin
    public Admin createAdmin(Admin admin) {
        if (adminRepository.existsByEmail(admin.getEmail())) {
            throw new RuntimeException("An Admin with this email already exists.");
        }
        return adminRepository.save(admin);
    }

    // Update an existing Admin profile
    public Admin updateAdmin(Long id, Admin updatedData) {
        Admin existing = adminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin not found with id: " + id));

        existing.setFullName(updatedData.getFullName());
        existing.setPhone(updatedData.getPhone());
        existing.setDepartment(updatedData.getDepartment());
        existing.setAvatarUrl(updatedData.getAvatarUrl());

        return adminRepository.save(existing);
    }

    // Approve an Employer account (FR07 - FR31)
    public Employer approveEmployer(Long employerId, Long adminId) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found with id: " + adminId));

        Employer employer = employerRepository.findById(employerId)
                .orElseThrow(() -> new RuntimeException("Employer not found with id: " + employerId));

        boolean wasApproved = employer.getIsApproved();
        employer.setIsApproved(true);
        admin.incrementActionsPerformed();

        adminRepository.save(admin);
        Employer saved = employerRepository.save(employer);

        if (!wasApproved) {
            try {
                eventPublisher.publishEvent(new NotificationEvent(
                    this,
                    saved,
                    "Employer Profile Verified & Approved",
                    "Hello " + saved.getFullName() + ",\n\nCongratulations! Your employer profile has been successfully verified and approved by the Kora administration. You can now publish job listings and schedule interviews.",
                    NotificationType.WELCOME
                ));
            } catch (Exception e) {
                // Ignore or log notification publisher exceptions
            }
        }

        return saved;
    }

    // Suspend a JobSeeker account (FR31)
    public void suspendJobSeeker(Long jobSeekerId, Long adminId) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found with id: " + adminId));

        JobSeeker jobSeeker = jobSeekerRepository.findById(jobSeekerId)
                .orElseThrow(() -> new RuntimeException("JobSeeker not found with id: " + jobSeekerId));

        jobSeeker.setIsActive(false);
        admin.incrementActionsPerformed();

        adminRepository.save(admin);
        jobSeekerRepository.save(jobSeeker);
    }

    // Suspend an Employer account (FR31)
    public void suspendEmployer(Long employerId, Long adminId) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found with id: " + adminId));

        Employer employer = employerRepository.findById(employerId)
                .orElseThrow(() -> new RuntimeException("Employer not found with id: " + employerId));

        employer.setIsActive(false);
        admin.incrementActionsPerformed();

        adminRepository.save(admin);
        employerRepository.save(employer);
    }

    // Get all Super Admins
    public List<Admin> getSuperAdmins() {
        return adminRepository.findByAdminLevel("SUPER_ADMIN");
    }

    // Get the most active Admin
    public Optional<Admin> getMostActiveAdmin() {
        return adminRepository.findTopByOrderByActionsPerformedDesc();
    }

    // Delete an Admin permanently (only a SUPER_ADMIN can do this)
    public void deleteAdmin(Long adminId, Long requestingAdminId) {
        Admin requestingAdmin = adminRepository.findById(requestingAdminId)
                .orElseThrow(() -> new RuntimeException("Admin not found with id: " + requestingAdminId));

        if (!requestingAdmin.isSuperAdmin()) {
            throw new RuntimeException("Only a SUPER_ADMIN can delete another Admin.");
        }

        if (!adminRepository.existsById(adminId)) {
            throw new RuntimeException("Admin not found with id: " + adminId);
        }

        adminRepository.deleteById(adminId);
    }
}



