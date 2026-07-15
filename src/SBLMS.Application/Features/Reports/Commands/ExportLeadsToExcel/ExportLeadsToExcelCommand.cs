using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Reports.Commands.ExportLeadsToExcel;

public class ExportLeadsToExcelCommand : IRequest<Result<byte[]>>
{
}
