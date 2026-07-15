using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.FaceEnrolment.Commands.EnrolFace;

public class EnrolFaceCommand : IRequest<Result<EnrolFaceResponse>>
{
    public Guid UserId { get; set; }
    public float[] FaceDescriptor { get; set; } = Array.Empty<float>();
    public string? Notes { get; set; }
}

public class EnrolFaceResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public bool IsActive { get; set; }
    public DateTime EnrolledAt { get; set; }
}
