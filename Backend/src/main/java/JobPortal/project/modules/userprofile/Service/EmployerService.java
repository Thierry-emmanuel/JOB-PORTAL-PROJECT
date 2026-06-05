package JobPortal.project.modules.userprofile.Service;

import JobPortal.project.modules.userprofile.Model.Employer;
import JobPortal.project.modules.userprofile.Repository.EmployerRepository;
import JobPortal.project.modules.notification.Event.NotificationEvent;
import JobPortal.project.enums.NotificationType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EmployerService {

    @Autowired
    private EmployerRepository employerRepository;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    // Get all Employers
    public List<Employer> getAllEmployers() {
        return employerRepository.findAll();
    }

    // Get an Employer by ID
    public Optional<Employer> getEmployerById(Long id) {
        return employerRepository.findById(id);
    }

    // Get an Employer by email
    public Optional<Employer> getEmployerByEmail(String email) {
        return employerRepository.findByEmail(email);
    }

    // Create a new Employer
    public Employer createEmployer(Employer employer) {
        if (employerRepository.existsByEmail(employer.getEmail())) {
            throw new RuntimeException("An Employer with this email already exists.");
        }
        // New employers are always pending approval by default
        employer.setIsApproved(false);
        employer.computeProfileScore();
        return employerRepository.save(employer);
    }

    // Update an existing Employer profile
    public Employer updateEmployer(Long id, Employer updatedData) {
        Employer existing = employerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employer not found with id: " + id));

        existing.setFullName(updatedData.getFullName());
        existing.setPhone(updatedData.getPhone());
        existing.setCity(updatedData.getCity());
        existing.setRegion(updatedData.getRegion());
        existing.setAvatarUrl(updatedData.getAvatarUrl());
        existing.setJobTitle(updatedData.getJobTitle());
        existing.setBio(updatedData.getBio());
        existing.setContactName(updatedData.getContactName());
        existing.setSector(updatedData.getSector());
        existing.setWebsite(updatedData.getWebsite());

        // Recompute score after update
        existing.computeProfileScore();

        return employerRepository.save(existing);
    }

    // Approve an Employer account (Admin action - FR07)
    public Employer approveEmployer(Long id) {
        Employer employer = employerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employer not found with id: " + id));
        boolean wasApproved = employer.getIsApproved();
        employer.setIsApproved(true);
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
                // Silently ignore or log notification publish errors
            }
        }
        return saved;
    }

    // Get all Employers pending approval
    public List<Employer> getPendingEmployers() {
        return employerRepository.findByIsApprovedAndIsActive(false, true);
    }

    // Get all approved Employers
    public List<Employer> getApprovedEmployers() {
        return employerRepository.findByIsApproved(true);
    }

    // Deactivate an Employer account
    public void deactivateEmployer(Long id) {
        Employer employer = employerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employer not found with id: " + id));
        employer.setIsActive(false);
        employerRepository.save(employer);
    }

    // Delete an Employer permanently
    public void deleteEmployer(Long id) {
        if (!employerRepository.existsById(id)) {
            throw new RuntimeException("Employer not found with id: " + id);
        }
        employerRepository.deleteById(id);
    }
}



