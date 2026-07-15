namespace SBLMS.Domain.Common;

public abstract class AuditableEntity : BaseEntity
{
    public Guid? CreatedBy { get; set; }
    public Guid? LastModifiedBy { get; set; }
}
