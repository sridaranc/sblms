using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.FaceEnrolment.Commands.RemoveFaceEnrolment;

public class RemoveFaceEnrolmentCommand : IRequest<Result<bool>>
{
    public Guid UserId { get; set; }
}
