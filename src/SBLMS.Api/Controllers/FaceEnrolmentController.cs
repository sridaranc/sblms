using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SBLMS.Application.Common.Interfaces;
using SBLMS.Application.Common.Models;
using SBLMS.Application.Features.FaceEnrolment.Commands.EnrolFace;
using SBLMS.Application.Features.FaceEnrolment.Commands.UpdateFaceEnrolment;
using SBLMS.Application.Features.FaceEnrolment.Commands.RemoveFaceEnrolment;
using SBLMS.Application.Features.FaceEnrolment.Queries.GetFaceEnrolments;
using SBLMS.Application.Features.FaceEnrolment.Queries.GetFaceEnrolmentByUserId;
using SBLMS.Application.Features.FaceEnrolment.Queries.VerifyFaceEnrolment;

namespace SBLMS.Api.Controllers;

[ApiController]
[Route("api/face-enrolment")]
[Authorize]
public class FaceEnrolmentController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IFaceRecognitionService _faceRecognitionService;

    public FaceEnrolmentController(IMediator mediator, IFaceRecognitionService faceRecognitionService)
    {
        _mediator = mediator;
        _faceRecognitionService = faceRecognitionService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(Result<List<FaceEnrolmentResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFaceEnrolments()
    {
        var result = await _mediator.Send(new GetFaceEnrolmentsQuery());
        return Ok(result);
    }

    [HttpGet("{userId}")]
    [ProducesResponseType(typeof(Result<FaceEnrolmentByUserIdResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<FaceEnrolmentByUserIdResponse>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFaceEnrolment(Guid userId)
    {
        var result = await _mediator.Send(new GetFaceEnrolmentByUserIdQuery { UserId = userId });
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Result<EnrolFaceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<EnrolFaceResponse>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> EnrolFace([FromBody] EnrolFaceCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("enrol-image")]
    [DisableRequestSizeLimit]
    [RequestSizeLimit(10_000_000)]
    [ProducesResponseType(typeof(Result<EnrolFaceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<EnrolFaceResponse>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> EnrolFaceWithImage([FromBody] EnrolFaceWithImageRequest request)
    {
        if (string.IsNullOrEmpty(request.ImageBase64))
            return BadRequest(Result<EnrolFaceResponse>.Failure("Image data is required."));

        var descriptor = await _faceRecognitionService.ExtractDescriptorAsync(request.ImageBase64);
        if (descriptor == null || descriptor.Length == 0)
            return BadRequest(Result<EnrolFaceResponse>.Failure("Face detection failed. No face found in image."));

        var command = new EnrolFaceCommand
        {
            UserId = request.UserId,
            FaceDescriptor = descriptor,
            Notes = request.Notes
        };

        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{userId}")]
    [ProducesResponseType(typeof(Result<UpdateFaceEnrolmentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<UpdateFaceEnrolmentResponse>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateFaceEnrolment(Guid userId, [FromBody] UpdateFaceEnrolmentRequest request)
    {
        var command = new UpdateFaceEnrolmentCommand
        {
            UserId = userId,
            FaceDescriptor = request.FaceDescriptor,
            Notes = request.Notes
        };
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{userId}/update-image")]
    [DisableRequestSizeLimit]
    [RequestSizeLimit(10_000_000)]
    [ProducesResponseType(typeof(Result<UpdateFaceEnrolmentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<UpdateFaceEnrolmentResponse>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateFaceEnrolmentWithImage(Guid userId, [FromBody] UpdateFaceEnrolmentWithImageRequest request)
    {
        if (string.IsNullOrEmpty(request.ImageBase64))
            return BadRequest(Result<UpdateFaceEnrolmentResponse>.Failure("Image data is required."));

        var descriptor = await _faceRecognitionService.ExtractDescriptorAsync(request.ImageBase64);
        if (descriptor == null || descriptor.Length == 0)
            return BadRequest(Result<UpdateFaceEnrolmentResponse>.Failure("Face detection failed. No face found in image."));

        var command = new UpdateFaceEnrolmentCommand
        {
            UserId = userId,
            FaceDescriptor = descriptor,
            Notes = request.Notes
        };

        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{userId}")]
    [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveFaceEnrolment(Guid userId)
    {
        var result = await _mediator.Send(new RemoveFaceEnrolmentCommand { UserId = userId });
        if (!result.IsSuccess)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("{userId}/verify")]
    [ProducesResponseType(typeof(Result<FaceEnrolmentVerificationResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> VerifyFaceEnrolment(Guid userId)
    {
        var result = await _mediator.Send(new VerifyFaceEnrolmentQuery { UserId = userId });
        return Ok(result);
    }
}

public class UpdateFaceEnrolmentRequest
{
    public float[] FaceDescriptor { get; set; } = Array.Empty<float>();
    public string? Notes { get; set; }
}

public class EnrolFaceWithImageRequest
{
    public Guid UserId { get; set; }
    public string ImageBase64 { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class UpdateFaceEnrolmentWithImageRequest
{
    public string ImageBase64 { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
