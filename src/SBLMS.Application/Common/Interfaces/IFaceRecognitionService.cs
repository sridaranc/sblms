namespace SBLMS.Application.Common.Interfaces;

public interface IFaceRecognitionService
{
    Task<float[]> ExtractDescriptorAsync(string base64Image, CancellationToken cancellationToken = default);
}
