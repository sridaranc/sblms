using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Reports.Commands.ExportClientsToExcel;

public class ExportClientsToExcelCommand : IRequest<Result<byte[]>>
{
}
