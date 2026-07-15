using SBLMS.Domain.Common;

namespace SBLMS.Domain.Entities;

public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Hierarchy { get; set; } = 0;
    public bool IsSystemRole { get; set; } = false;

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
