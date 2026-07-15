using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.FaceEnrolment.Queries.VerifyFaceEnrolment;

public class VerifyFaceEnrolmentQuery : IRequest<Result<FaceEnrolmentVerificationResponse>>
{
    public Guid UserId { get; set; }
}

public class FaceEnrolmentVerificationResponse
{
    public bool IsEnrolled { get; set; }
    public bool IsActive { get; set; }
    public DateTime? EnrolledAt { get; set; }
    public DateTime? LastVerifiedAt { get; set; }
    public int VerificationCount { get; set; }
    public float[]? FaceDescriptor { get; set; }
}
