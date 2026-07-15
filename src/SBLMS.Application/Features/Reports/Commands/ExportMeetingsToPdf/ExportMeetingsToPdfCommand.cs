using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Reports.Commands.ExportMeetingsToPdf;

public class ExportMeetingsToPdfCommand : IRequest<Result<byte[]>>
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
