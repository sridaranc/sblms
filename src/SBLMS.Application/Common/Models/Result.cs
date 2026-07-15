namespace SBLMS.Application.Common.Models;

public class Result<T>
{
    public bool IsSuccess { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    public static Result<T> Success(T data, string? message = null)
    {
        return new Result<T>
        {
            IsSuccess = true,
            Data = data,
            Message = message
        };
    }

    public static Result<T> Success(string? message = null)
    {
        return new Result<T>
        {
            IsSuccess = true,
            Message = message
        };
    }

    public static Result<T> Failure(string message)
    {
        return new Result<T>
        {
            IsSuccess = false,
            Message = message,
            Errors = new List<string> { message }
        };
    }

    public static Result<T> Failure(List<string> errors)
    {
        return new Result<T>
        {
            IsSuccess = false,
            Message = string.Join(", ", errors),
            Errors = errors
        };
    }
}
