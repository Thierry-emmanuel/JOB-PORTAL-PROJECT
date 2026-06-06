package JobPortal.project.modules.joblisting.exception;

/**
 * Thrown when the authenticated user attempts an operation they do not own or are
 * not permitted to perform (IDOR prevention, unverified account, etc.).
 * Maps to HTTP 403 in {@link GlobalExceptionHandler}.
 */
public class JobListingAccessDeniedException extends RuntimeException {
    public JobListingAccessDeniedException(String message) {
        super(message);
    }
}
