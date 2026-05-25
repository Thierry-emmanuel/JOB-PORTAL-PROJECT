package JobPortal.project.JobListing.exception;

import JobPortal.project.JobListing.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Centralised exception handling for the Job Listing module.
 *
 * <p>Translates domain exceptions to structured HTTP responses using the
 * standard {@link ApiResponse} envelope so clients always receive a
 * consistent error shape.
 */
@RestControllerAdvice(basePackages = "JobPortal.project.JobListing")
@Slf4j
public class GlobalExceptionHandler {

    /** 404 – resource missing */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        log.warn("[JobListing] ResourceNotFound: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /** 403 – ownership / permission violation */
    @ExceptionHandler(JobListingAccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(JobListingAccessDeniedException ex) {
        log.warn("[JobListing] AccessDenied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /** 422 – invalid state transition */
    @ExceptionHandler(InvalidListingStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidState(InvalidListingStateException ex) {
        log.warn("[JobListing] InvalidState: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /** 400 – Bean Validation failures: collects all field errors */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            errors.put(fe.getField(), fe.getDefaultMessage());
        }
        log.warn("[JobListing] Validation failed: {}", errors);
        return ResponseEntity.badRequest()
                .body(new JobPortal.project.JobListing.dto.response.ApiResponse<>(
                        false, "Validation failed", errors, java.time.LocalDateTime.now()));
    }

    /** 500 – catch-all for unexpected errors */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
        log.error("[JobListing] Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred. Please try again later."));
    }
}
