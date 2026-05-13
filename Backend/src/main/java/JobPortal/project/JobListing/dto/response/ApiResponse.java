package JobPortal.project.JobListing.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * Standard envelope for every REST response in the Job Listing module.
 *
 * <pre>
 * {
 *   "success": true,
 *   "message": "Job listing created successfully",
 *   "data":    { ... },
 *   "timestamp": "2026-05-12T10:00:00"
 * }
 * </pre>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Standard API response envelope")
public record ApiResponse<T>(

    @Schema(description = "Whether the request succeeded")
    boolean success,

    @Schema(description = "Human-readable result message")
    String message,

    @Schema(description = "Response payload (null on error)")
    T data,

    @Schema(description = "Server timestamp of the response")
    LocalDateTime timestamp

) {

    /** Successful response with data. */
    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data, LocalDateTime.now());
    }

    /** Successful response without a data payload (e.g. delete). */
    public static <T> ApiResponse<T> ok(String message) {
        return new ApiResponse<>(true, message, null, LocalDateTime.now());
    }

    /** Error response. */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null, LocalDateTime.now());
    }
}
