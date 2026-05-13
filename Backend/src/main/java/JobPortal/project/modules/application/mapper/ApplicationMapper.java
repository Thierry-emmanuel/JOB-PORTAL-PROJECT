package JobPortal.project.modules.application.mapper;

import JobPortal.project.modules.application.dto.request.CreateApplicationRequest;
import JobPortal.project.modules.application.dto.response.ApplicationResponse;
import JobPortal.project.modules.application.model.Application;
import org.mapstruct.*;

import java.util.List;



@Mapper(
        componentModel        = "spring",
        uses                  = InterviewMapper.class,          // delegates interview field
        nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS,
        unmappedTargetPolicy  = ReportingPolicy.IGNORE
)
public interface ApplicationMapper {

    // ------------------------------------------------------------------ //
    //  Entity → Response                                                   //
    // ------------------------------------------------------------------ //


    @Mapping(target = "terminal",      expression = "java(application.isTerminal())")
    @Mapping(target = "withdrawable",  expression = "java(application.isWithdrawable())")
    @Mapping(target = "hasInterview",  expression = "java(application.hasInterview())")
    @Mapping(target = "interview",     source     = "interview")   // delegated to InterviewMapper#toSummaryResponse
    ApplicationResponse toResponse(Application application);


    List<ApplicationResponse> toResponseList(List<Application> applications);

    // ------------------------------------------------------------------ //
    //  Request → Entity                                                    //
    // ------------------------------------------------------------------ //

    @Mapping(target = "id",            ignore = true)
    @Mapping(target = "seekerId",      source = "seekerId")
    @Mapping(target = "jobPostingId",  source = "request.jobPostingId")
    @Mapping(target = "coverLetter",   source = "request.coverLetter")
    @Mapping(target = "expectedSalary",source = "request.expectedSalary")
    @Mapping(target = "status",        ignore = true)   // defaults to APPLIED via @Builder.Default
    @Mapping(target = "interview",     ignore = true)
    @Mapping(target = "appliedAt",     ignore = true)
    @Mapping(target = "lastUpdatedAt", ignore = true)
    Application toEntity(CreateApplicationRequest request, Long seekerId);
}


