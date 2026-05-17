package JobPortal.project.admin.DTO;

import JobPortal.project.auth.Enum.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserManagementDTO {
    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
