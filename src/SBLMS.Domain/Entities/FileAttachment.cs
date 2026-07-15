using SBLMS.Domain.Common;

namespace SBLMS.Domain.Entities;

public class FileAttachment : BaseEntity
{
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public Guid UploadedBy { get; set; }

    public User Uploader { get; set; } = null!;
}
