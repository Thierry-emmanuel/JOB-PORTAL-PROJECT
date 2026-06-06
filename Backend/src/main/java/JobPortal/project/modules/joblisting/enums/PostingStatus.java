package JobPortal.project.modules.joblisting.enums;

/**
 * Lifecycle status for a {@link JobPortal.project.modules.joblisting.entity.JobListing}.
 *
 * <ul>
 *   <li>DRAFT   – saved but not yet published; not visible to job seekers</li>
 *   <li>ACTIVE  – publicly visible; accepting applications</li>
 *   <li>EXPIRED – past deadline; auto-set by nightly scheduler</li>
 *   <li>DELETED – soft-deleted by employer or admin; retained for audit</li>
 * </ul>
 */
public enum PostingStatus {
    DRAFT,
    ACTIVE,
    EXPIRED,
    DELETED
}
