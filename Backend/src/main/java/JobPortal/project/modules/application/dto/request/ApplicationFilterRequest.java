package JobPortal.project.modules.application.dto.request;

import JobPortal.project.modules.application.enums.ApplicationStatus;




public record ApplicationFilterRequest(

        Long seekerId,

        Long jobPostingId,

        Long employerId,

        ApplicationStatus status,

        int page,

        int size
) {
    /** Canonical defaults: first page, 20 items. */
    public ApplicationFilterRequest {
        if (page < 0)  page = 0;
        if (size <= 0) size = 20;
        if (size > 100) size = 100;
    }
}


