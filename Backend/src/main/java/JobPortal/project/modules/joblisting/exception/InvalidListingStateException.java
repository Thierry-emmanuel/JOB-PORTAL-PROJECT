package JobPortal.project.modules.joblisting.exception;

/**
 * Thrown when a requested status transition is not permitted by the
 * posting lifecycle state machine.
 * Maps to HTTP 422 (Unprocessable Entity) in {@link GlobalExceptionHandler}.
 */
public class InvalidListingStateException extends RuntimeException {
    public InvalidListingStateException(String message) {
        super(message);
    }
}
