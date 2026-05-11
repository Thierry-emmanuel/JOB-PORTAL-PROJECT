package JobPortal.project.modules.application.dto.response;

import java.util.List;


public record ApplicationPageResponse(

        List<ApplicationResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {}


