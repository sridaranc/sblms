using FluentValidation;

namespace SBLMS.Application.Features.Meetings.DTOs;

public class CreateMeetingDtoValidator : AbstractValidator<CreateMeetingDto>
{
    public CreateMeetingDtoValidator()
    {
        RuleFor(x => x.LeadId)
            .NotEmpty().WithMessage("Lead ID is required.");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.ScheduledDate)
            .NotEmpty().WithMessage("Scheduled date is required.")
            .GreaterThanOrEqualTo(DateTime.UtcNow).WithMessage("Scheduled date must be in the future.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");

        RuleFor(x => x.Location)
            .MaximumLength(500).WithMessage("Location must not exceed 500 characters.");

        RuleFor(x => x.MeetingUrl)
            .MaximumLength(500).WithMessage("Meeting URL must not exceed 500 characters.");
    }
}

public class UpdateMeetingDtoValidator : AbstractValidator<UpdateMeetingDto>
{
    public UpdateMeetingDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.ScheduledDate)
            .NotEmpty().WithMessage("Scheduled date is required.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");

        RuleFor(x => x.Location)
            .MaximumLength(500).WithMessage("Location must not exceed 500 characters.");

        RuleFor(x => x.MeetingUrl)
            .MaximumLength(500).WithMessage("Meeting URL must not exceed 500 characters.");
    }
}
