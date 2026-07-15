using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Auth.Commands.Logout;

public class LogoutCommand : IRequest<Result<bool>>
{
    public string RefreshToken { get; set; } = string.Empty;
}
