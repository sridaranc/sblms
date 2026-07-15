namespace SBLMS.Application.Common.Interfaces;

public interface IFileService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string entityType, string entityId);
    Task<Stream> GetFileAsync(string filePath);
    Task DeleteFileAsync(string filePath);
    bool IsAllowedFileType(string fileName);
    bool IsAllowedFileSize(long fileSize, string entityType);
}
