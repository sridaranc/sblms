namespace SBLMS.Application.Common.Models;

public class PaginatedList<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;

    public static async Task<PaginatedList<T>> CreateAsync(
        IQueryable<T> source, int pageNumber, int pageSize)
    {
        var count = await System.Threading.Tasks.Task.FromResult(source.Count());
        var items = await System.Threading.Tasks.Task.FromResult(
            source.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList());

        return new PaginatedList<T>
        {
            Items = items,
            TotalCount = count,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }
}
