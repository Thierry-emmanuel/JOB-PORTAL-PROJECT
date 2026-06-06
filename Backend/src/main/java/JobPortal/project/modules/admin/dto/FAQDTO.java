package JobPortal.project.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FAQDTO {
    private Long id;
    private String question;
    private String answer;
    private Boolean isActive;
}
