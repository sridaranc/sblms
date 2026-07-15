using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Reports.Commands.ExportUsersToExcel;

public class ExportUsersToExcelCommand : IRequest<Result<byte[]>>
{
}
