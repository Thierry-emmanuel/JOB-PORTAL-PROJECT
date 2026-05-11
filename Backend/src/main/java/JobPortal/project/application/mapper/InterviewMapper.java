package JobPortal.project.application.mapper;

import JobPortal.project.application.dto.request.RescheduleInterviewRequest;
import JobPortal.project.application.dto.request.ScheduleInterviewRequest;
import JobPortal.project.application.dto.response.InterviewResponse;
import JobPortal.project.application.dto.response.InterviewSummaryResponse;
import JobPortal.project.application.model.Interview;
import org.mapstruct.*;

import java.util.List;

@Mapper(
        componentModel        = "spring",
        nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS,
        unmappedTargetPolicy  = ReportingPolicy.IGNORE
)
public interface InterviewMapper {

    // ------------------------------------------------------------------ //
    //  Entity → Full Response                                              //
    // ------------------------------------------------------------------ //

    @Mapping(target = "applicationId",  source = "application.id")
    @Mapping(target = "seekerId",       source = "application.seekerId")
    @Mapping(target = "jobPostingId",   source = "application.jobPostingId")
    @Mapping(target = "feedback",       source = "feedBack")          // field name normalisation
    @Mapping(target = "completed",      expression = "java(interview.isCompleted())")
    @Mapping(target = "pending",        expression = "java(interview.isPending())")
    InterviewResponse toResponse(Interview interview);

    List<InterviewResponse> toResponseList(List<Interview> interviews);

    // ------------------------------------------------------------------ //
    //  Entity → Summary Response (embedded in ApplicationResponse)        //
    // ------------------------------------------------------------------ //

    @Mapping(target = "completed", expression = "java(interview.isCompleted())")
    @Mapping(target = "pending",   expression = "java(interview.isPending())")
    InterviewSummaryResponse toSummaryResponse(Interview interview);

    // ------------------------------------------------------------------ //
    //  Request → Entity                                                    //
    // ------------------------------------------------------------------ //

    @Mapping(target = "id",          ignore = true)
    @Mapping(target = "application", ignore = true)  // set by service after mapping
    @Mapping(target = "feedBack",    ignore = true)
    @Mapping(target = "result",      ignore = true)
    @Mapping(target = "createdAt",   ignore = true)
    @Mapping(target = "updatedAt",   ignore = true)
    Interview toEntity(ScheduleInterviewRequest request);

    @Mapping(target = "id",          ignore = true)
    @Mapping(target = "application", ignore = true)
    @Mapping(target = "type",        ignore = true)
    @Mapping(target = "platform",    ignore = true)
    @Mapping(target = "meetingLink", ignore = true)   // updated manually in service when non-null
    @Mapping(target = "feedBack",    ignore = true)
    @Mapping(target = "result",      ignore = true)
    @Mapping(target = "createdAt",   ignore = true)
    @Mapping(target = "updatedAt",   ignore = true)
    @Mapping(target = "scheduledAt", source = "newScheduledAt")
    void applyReschedule(RescheduleInterviewRequest request, @MappingTarget Interview interview);
}