using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Auth.Commands.Login;

namespace SBLMS.Application.Features.Auth.Commands.FaceLogin;

public class FaceLoginCommand : IRequest<Result<LoginResponse>>
{
    public float[] FaceDescriptor { get; set; } = Array.Empty<float>();
    public double? Threshold { get; set; } = 0.6;
}

public class FaceLoginWithImageCommand : IRequest<Result<LoginResponse>>
{
    public string ImageBase64 { get; set; } = string.Empty;
    public double? Threshold { get; set; } = 0.6;
}
