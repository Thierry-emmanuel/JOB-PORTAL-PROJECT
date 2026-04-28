package JobPortal.project.company;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/companies")
@CrossOrigin(origins = "*")
public class CompanyController {

    @Autowired
    private CompanyService companyService;

    // GET /api/v1/companies
    // Returns all companies
    @GetMapping
    public ResponseEntity<List<Company>> getAllCompanies() {
        List<Company> companies = companyService.getAllCompanies();
        return ResponseEntity.ok(companies);
    }

    // GET /api/v1/companies/{id}
    // Returns a single company by ID
    @GetMapping("/{id}")
    public ResponseEntity<Company> getCompanyById(@PathVariable Long id) {
        return companyService.getCompanyById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/v1/companies/employer/{employerId}
    // Returns all companies belonging to a specific Employer
    @GetMapping("/employer/{employerId}")
    public ResponseEntity<List<Company>> getCompaniesByEmployer(@PathVariable Long employerId) {
        try {
            List<Company> companies = companyService.getCompaniesByEmployer(employerId);
            return ResponseEntity.ok(companies);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // POST /api/v1/companies/{employerId}
    // Creates a new company for a specific Employer
    @PostMapping("/{employerId}")
    public ResponseEntity<Company> createCompany(
            @PathVariable Long employerId,
            @RequestBody Company company) {
        try {
            Company created = companyService.createCompany(company, employerId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(null);
        }
    }

    // PUT /api/v1/companies/{id}
    // Updates an existing company
    @PutMapping("/{id}")
    public ResponseEntity<Company> updateCompany(
            @PathVariable Long id,
            @RequestBody Company updatedData) {
        try {
            Company updated = companyService.updateCompany(id, updatedData);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // POST /api/v1/companies/{companyId}/rate/{jobSeekerId}
    // Adds a rating to a company from a JobSeeker
    @PostMapping("/{companyId}/rate/{jobSeekerId}")
    public ResponseEntity<Company> addRating(
            @PathVariable Long companyId,
            @PathVariable Long jobSeekerId,
            @RequestParam Double rating,
            @RequestParam(required = false) String comment) {
        try {
            Company rated = companyService.addRating(companyId, jobSeekerId, rating, comment);
            return ResponseEntity.ok(rated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(null);
        }
    }

    // GET /api/v1/companies/sector/{sector}
    // Returns all companies in a specific sector
    @GetMapping("/sector/{sector}")
    public ResponseEntity<List<Company>> getCompaniesBySector(@PathVariable String sector) {
        List<Company> companies = companyService.getCompaniesBySector(sector);
        return ResponseEntity.ok(companies);
    }

    // GET /api/v1/companies/top-rated?minRating=4.0
    // Returns all companies with a rating above minRating
    @GetMapping("/top-rated")
    public ResponseEntity<List<Company>> getTopRatedCompanies(
            @RequestParam(defaultValue = "4.0") Double minRating) {
        List<Company> companies = companyService.getTopRatedCompanies(minRating);
        return ResponseEntity.ok(companies);
    }

    // PATCH /api/v1/companies/{id}/deactivate
    // Deactivates a company (soft delete)
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateCompany(@PathVariable Long id) {
        try {
            companyService.deactivateCompany(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE /api/v1/companies/{id}
    // Permanently deletes a company
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCompany(@PathVariable Long id) {
        try {
            companyService.deleteCompany(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
