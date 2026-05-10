package JobPortal.project.application.dto.response;

import java.util.List;

public record InterviewPageResponse(

        List<InterviewResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {}