using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Reports.Commands.ExportMeetingsToExcel;

public class ExportMeetingsToExcelCommand : IRequest<Result<byte[]>>
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
