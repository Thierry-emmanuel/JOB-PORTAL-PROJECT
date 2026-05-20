package JobPortal.project.modules.userprofile.Controller;

import JobPortal.project.modules.userprofile.Model.Employer;
import JobPortal.project.modules.userprofile.Service.EmployerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/employers")
@CrossOrigin(origins = "*")
public class EmployerController {

    @Autowired
    private EmployerService employerService;

    // GET /api/v1/employers
    // Returns all Employers
    @GetMapping
    public ResponseEntity<List<Employer>> getAllEmployers() {
        List<Employer> employers = employerService.getAllEmployers();
        return ResponseEntity.ok(employers);
    }

    // GET /api/v1/employers/{id}
    // Returns a single Employer by ID
    @GetMapping("/{id}")
    public ResponseEntity<Employer> getEmployerById(@PathVariable Long id) {
        return employerService.getEmployerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/v1/employers
    // Creates a new Employer
    @PostMapping
    public ResponseEntity<Employer> createEmployer(@RequestBody Employer employer) {
        try {
            Employer created = employerService.createEmployer(employer);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    // PUT /api/v1/employers/{id}
    // Updates an existing Employer profile
    @PutMapping("/{id}")
    public ResponseEntity<Employer> updateEmployer(
            @PathVariable Long id,
            @RequestBody Employer updatedData) {
        try {
            Employer updated = employerService.updateEmployer(id, updatedData);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // PATCH /api/v1/employers/{id}/approve
    // Approves an Employer account - Admin action (FR07)
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/approve")
    public ResponseEntity<Employer> approveEmployer(@PathVariable Long id) {
        try {
            Employer approved = employerService.approveEmployer(id);
            return ResponseEntity.ok(approved);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // GET /api/v1/employers/pending
    // Returns all Employers pending approval
    @GetMapping("/pending")
    public ResponseEntity<List<Employer>> getPendingEmployers() {
        List<Employer> pending = employerService.getPendingEmployers();
        return ResponseEntity.ok(pending);
    }

    // GET /api/v1/employers/approved
    // Returns all approved Employers
    @GetMapping("/approved")
    public ResponseEntity<List<Employer>> getApprovedEmployers() {
        List<Employer> approved = employerService.getApprovedEmployers();
        return ResponseEntity.ok(approved);
    }

    // PATCH /api/v1/employers/{id}/deactivate
    // Deactivates an Employer account (soft delete)
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateEmployer(@PathVariable Long id) {
        try {
            employerService.deactivateEmployer(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE /api/v1/employers/{id}
    // Permanently deletes an Employer
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployer(@PathVariable Long id) {
        try {
            employerService.deleteEmployer(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}



