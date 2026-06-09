package JobPortal.project.modules.admin.dto;

import java.util.List;

public record UserPageResponse(
        List<UserManagementDTO> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {}
