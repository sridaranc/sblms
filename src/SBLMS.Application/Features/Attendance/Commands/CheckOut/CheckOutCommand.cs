using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Attendance.Commands.CheckOut;

public class CheckOutCommand : IRequest<Result<CheckOutResponse>>
{
    public float[] FaceDescriptor { get; set; } = Array.Empty<float>();
    public string? ImageBase64 { get; set; }
    public string? Location { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool FaceVerified { get; set; }
    public double? FaceDistance { get; set; }
}

public class CheckOutResponse
{
    public Guid Id { get; set; }
    public DateTime CheckInTime { get; set; }
    public DateTime CheckOutTime { get; set; }
    public string? Location { get; set; }
    public bool FaceVerified { get; set; }
    public decimal? HoursWorked { get; set; }
}
