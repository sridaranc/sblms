using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Auth.Commands.Login;

namespace SBLMS.Application.Features.Auth.Commands.RefreshToken;

public class RefreshTokenCommand : IRequest<Result<LoginResponse>>
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}
