using Microsoft.Extensions.Configuration;
using SBLMS.Application.Common.Interfaces;

namespace SBLMS.Infrastructure.Services;

public class FileService : IFileService
{
    private readonly string _uploadPath;
    private readonly long _maxAttachmentSize = 10 * 1024 * 1024; // 10MB
    private readonly long _maxImageSize = 5 * 1024 * 1024; // 5MB
    private readonly string[] _allowedExtensions = { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".jpg", ".jpeg", ".png", ".gif" };

    public FileService(IConfiguration configuration)
    {
        _uploadPath = configuration["FileStorage:UploadPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        if (!Directory.Exists(_uploadPath))
            Directory.CreateDirectory(_uploadPath);
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string entityType, string entityId)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var entityPath = Path.Combine(_uploadPath, entityType, entityId);

        if (!Directory.Exists(entityPath))
            Directory.CreateDirectory(entityPath);

        var filePath = Path.Combine(entityPath, uniqueFileName);

        using var fileStreamOutput = new FileStream(filePath, FileMode.Create);
        await fileStream.CopyToAsync(fileStreamOutput);

        return Path.Combine(entityType, entityId, uniqueFileName);
    }

    public Task<Stream> GetFileAsync(string filePath)
    {
        var fullPath = Path.Combine(_uploadPath, filePath);
        if (!File.Exists(fullPath))
            throw new FileNotFoundException("File not found.", filePath);

        return Task.FromResult<Stream>(File.OpenRead(fullPath));
    }

    public Task DeleteFileAsync(string filePath)
    {
        var fullPath = Path.Combine(_uploadPath, filePath);
        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }

    public bool IsAllowedFileType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return _allowedExtensions.Contains(extension);
    }

    public bool IsAllowedFileSize(long fileSize, string entityType)
    {
        var maxSize = entityType.ToLower() == "profileimage" ? _maxImageSize : _maxAttachmentSize;
        return fileSize <= maxSize;
    }
}
