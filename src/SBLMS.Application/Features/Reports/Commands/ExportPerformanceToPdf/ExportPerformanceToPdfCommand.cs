using MediatR;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.Reports.DTOs;

namespace SBLMS.Application.Features.Reports.Commands.ExportPerformanceToPdf;

public class ExportPerformanceToPdfCommand : IRequest<Result<byte[]>>
{
}
