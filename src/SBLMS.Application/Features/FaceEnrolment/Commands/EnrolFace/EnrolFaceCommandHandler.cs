using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Domain.Entities;

namespace SBLMS.Application.Features.FaceEnrolment.Commands.EnrolFace;

public class EnrolFaceCommandHandler : IRequestHandler<EnrolFaceCommand, Result<EnrolFaceResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public EnrolFaceCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<EnrolFaceResponse>> Handle(EnrolFaceCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(request.UserId, cancellationToken);
        if (user == null)
            return Result<EnrolFaceResponse>.Failure("User not found.");

        var existingEnrolment = await _context.FaceEnrolments
            .FirstOrDefaultAsync(fe => fe.UserId == request.UserId && fe.IsActive, cancellationToken);

        if (existingEnrolment != null)
            return Result<EnrolFaceResponse>.Failure("User already has an active face enrolment. Use update instead.");

        var faceDescriptorJson = JsonSerializer.Serialize(request.FaceDescriptor);

        var faceEnrolment = new Domain.Entities.FaceEnrolment
        {
            UserId = request.UserId,
            FaceDescriptor = faceDescriptorJson,
            IsActive = true,
            EnrolledAt = DateTime.UtcNow,
            Notes = request.Notes
        };

        _context.FaceEnrolments.Add(faceEnrolment);

        user.FaceDescriptor = faceDescriptorJson;
        user.HasFaceDescriptor = true;
        user.FaceEnrolledAt = DateTime.UtcNow;
        _context.Users.Update(user);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<EnrolFaceResponse>.Success(new EnrolFaceResponse
        {
            Id = faceEnrolment.Id,
            UserId = faceEnrolment.UserId,
            IsActive = faceEnrolment.IsActive,
            EnrolledAt = faceEnrolment.EnrolledAt ?? DateTime.UtcNow
        }, "Face enrolled successfully.");
    }
}
