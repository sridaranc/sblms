namespace SBLMS.Application.Features.Roles.DTOs;

public class RoleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Hierarchy { get; set; }
    public bool IsSystemRole { get; set; }
}

public class RolePermissionsDto
{
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public List<string> PermissionIds { get; set; } = new();
}
