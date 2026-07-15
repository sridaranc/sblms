using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.FaceEnrolment.Queries.GetFaceEnrolments;

public class GetFaceEnrolmentsQuery : IRequest<Result<List<FaceEnrolmentResponse>>>
{
}

public class FaceEnrolmentResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Role { get; set; }
    public bool IsActive { get; set; }
    public DateTime? EnrolledAt { get; set; }
    public DateTime? LastVerifiedAt { get; set; }
    public int VerificationCount { get; set; }
    public bool HasFaceDescriptor { get; set; }
    public float[]? FaceDescriptor { get; set; }
}
