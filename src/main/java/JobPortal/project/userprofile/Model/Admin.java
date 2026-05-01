package JobPortal.project.userprofile.Model;

import JobPortal.project.auth.Enum.Role;
import JobPortal.project.auth.Model.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "admins")
public class Admin extends User {

    @Column
    private String phone;

    @Column
    private String department;

    @Column
    private String avatarUrl;

    // Defines the level of access: SUPER_ADMIN can manage other admins
    @Column(nullable = false)
    private String adminLevel = "STANDARD";

    // Tracks the number of actions performed by this admin
    @Column(nullable = false)
    private Integer actionsPerformed = 0;

    public Admin(String fullName, String email, String password) {
        super();
        this.setFullName(fullName);
        this.setEmail(email);
        this.setPassword(password);
        this.setRole(Role.ADMIN);
        this.setIsActive(true);
        this.adminLevel = "STANDARD";
    }

    public Admin(String fullName, String email, String password, String adminLevel) {
        super();
        this.setFullName(fullName);
        this.setEmail(email);
        this.setPassword(password);
        this.setRole(Role.ADMIN);
        this.setIsActive(true);
        this.adminLevel = adminLevel;
    }

    // Called each time the admin performs a moderation action
    public void incrementActionsPerformed() {
        this.actionsPerformed++;
    }

    public boolean isSuperAdmin() {
        return "SUPER_ADMIN".equals(this.adminLevel);
    }
}
