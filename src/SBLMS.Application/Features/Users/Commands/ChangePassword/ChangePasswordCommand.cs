using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Users.Commands.ChangePassword;

public class ChangePasswordCommand : IRequest<Result<bool>>
{
    public Guid UserId { get; set; }
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
