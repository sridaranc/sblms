using System.Diagnostics;
using System.Text;
using System.Text.Json;
using SBLMS.Application.Common.Interfaces;

namespace SBLMS.Infrastructure.Services;

public class FaceRecognitionService : IFaceRecognitionService
{
    public async Task<float[]> ExtractDescriptorAsync(string base64Image, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(base64Image))
            throw new ArgumentException("Image data is required.", nameof(base64Image));

        var scriptPath = FindScriptPath();
        var modelsPath = FindModelsPath();
        var workingDir = Path.GetDirectoryName(scriptPath) ?? string.Empty;

        var startInfo = new ProcessStartInfo
        {
            FileName = "node",
            Arguments = $"\"{scriptPath}\" - \"{modelsPath}\"",
            WorkingDirectory = workingDir,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = new Process { StartInfo = startInfo };

        try
        {
            process.Start();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Failed to start Node.js face extractor process. Make sure node is installed and in the system PATH.", ex);
        }

        // Write the base64 image to the process's standard input stream
        using (var writer = process.StandardInput)
        {
            await writer.WriteAsync(base64Image);
        }

        var outputTask = process.StandardOutput.ReadToEndAsync();
        var errorTask = process.StandardError.ReadToEndAsync();

        await process.WaitForExitAsync(cancellationToken);

        var output = await outputTask;
        var error = await errorTask;

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException($"Face extraction process failed with exit code {process.ExitCode}. Error: {error}");
        }

        if (string.IsNullOrWhiteSpace(output))
        {
            throw new InvalidOperationException("Face extraction process returned no output.");
        }

        try
        {
            using var doc = JsonDocument.Parse(output);
            var root = doc.RootElement;

            if (root.TryGetProperty("success", out var successProp) && successProp.GetBoolean())
            {
                if (root.TryGetProperty("descriptor", out var descriptorProp))
                {
                    var descriptor = JsonSerializer.Deserialize<float[]>(descriptorProp.GetRawText());
                    if (descriptor != null)
                        return descriptor;
                }
            }

            var errorMsg = root.TryGetProperty("error", out var errorProp) ? errorProp.GetString() : "Unknown error in face extractor script.";
            throw new InvalidOperationException(errorMsg);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException($"Failed to parse output from face extractor script: {output}", ex);
        }
    }

    private string FindScriptPath()
    {
        var baseDir = AppContext.BaseDirectory;
        var current = new DirectoryInfo(baseDir);

        while (current != null)
        {
            if (current.GetFiles("SBLMS.sln").Any())
            {
                var scriptPath = Path.Combine(current.FullName, "src", "SBLMS.Infrastructure", "FaceRecognition", "face-extractor.js");
                if (File.Exists(scriptPath))
                    return scriptPath;
            }
            current = current.Parent;
        }

        // Fallback to relative to execution assembly
        return Path.Combine(baseDir, "FaceRecognition", "face-extractor.js");
    }

    private string FindModelsPath()
    {
        var baseDir = AppContext.BaseDirectory;
        var current = new DirectoryInfo(baseDir);

        while (current != null)
        {
            if (current.GetFiles("SBLMS.sln").Any())
            {
                var modelsPath = Path.Combine(current.FullName, "frontend", "public", "models");
                if (Directory.Exists(modelsPath))
                    return modelsPath;
            }
            current = current.Parent;
        }

        // Fallback to relative to execution assembly
        return Path.Combine(baseDir, "models");
    }
}
