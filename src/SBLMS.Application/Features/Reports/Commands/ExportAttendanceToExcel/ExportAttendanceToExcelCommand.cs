using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Reports.Commands.ExportAttendanceToExcel;

public class ExportAttendanceToExcelCommand : IRequest<Result<byte[]>>
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
