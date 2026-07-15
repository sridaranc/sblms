using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Reports.Commands.ExportClientsToPdf;

public class ExportClientsToPdfCommand : IRequest<Result<byte[]>>
{
}
