using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Attendance.Commands.CheckIn;

public class CheckInCommand : IRequest<Result<CheckInResponse>>
{
    public float[] FaceDescriptor { get; set; } = Array.Empty<float>();
    public string? ImageBase64 { get; set; }
    public string? Location { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool FaceVerified { get; set; }
    public double? FaceDistance { get; set; }
}

public class CheckInResponse
{
    public Guid Id { get; set; }
    public DateTime CheckInTime { get; set; }
    public string? Location { get; set; }
    public bool FaceVerified { get; set; }
    public string Status { get; set; } = string.Empty;
}
