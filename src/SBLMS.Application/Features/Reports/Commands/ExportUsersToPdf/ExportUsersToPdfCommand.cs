using MediatR;
using SBLMS.Application.Common.Models;

namespace SBLMS.Application.Features.Reports.Commands.ExportUsersToPdf;

public class ExportUsersToPdfCommand : IRequest<Result<byte[]>>
{
}
