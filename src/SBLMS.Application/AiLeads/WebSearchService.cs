using System.Net.Http.Json;
using System.Text.Json;
using HtmlAgilityPack;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace SBLMS.Application.AiLeads;

public interface IWebSearchService
{
    Task<List<WebSearchResult>> SearchCompaniesAsync(string query, int maxResults = 10);
}

public class WebSearchResult
{
    public string Title { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
    public string Snippet { get; set; } = string.Empty;
}

public class GoogleCustomSearchService : IWebSearchService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<GoogleCustomSearchService> _logger;

    public GoogleCustomSearchService(HttpClient httpClient, IConfiguration config, ILogger<GoogleCustomSearchService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    public async Task<List<WebSearchResult>> SearchCompaniesAsync(string query, int maxResults = 10)
    {
        var braveKey = _config["Search:Brave:ApiKey"];
        if (!string.IsNullOrEmpty(braveKey))
        {
            var braveResults = await SearchBraveAsync(query, maxResults, braveKey);
            if (braveResults.Count > 0) return braveResults;
        }

        var googleKey = _config["GoogleSearch:ApiKey"];
        var cx = _config["GoogleSearch:SearchEngineId"];
        if (!string.IsNullOrEmpty(googleKey) && !string.IsNullOrEmpty(cx))
        {
            var googleResults = await SearchGoogleCseAsync(query, maxResults, googleKey, cx);
            if (googleResults.Count > 0) return googleResults;
        }

        _logger.LogInformation("Using Yahoo fallback search");
        return await SearchYahooAsync(query, maxResults);
    }

    private async Task<List<WebSearchResult>> SearchBraveAsync(string query, int maxResults, string apiKey)
    {
        try
        {
            var results = new List<WebSearchResult>();
            for (int offset = 0; offset < maxResults && results.Count < maxResults; offset += 20)
            {
                var count = Math.Min(maxResults - results.Count, 20);
                var url = $"https://api.search.brave.com/res/v1/web/search?q={Uri.EscapeDataString(query)}&count={count}&offset={offset}";
                _logger.LogInformation("Searching Brave for: {Query} (offset={Offset})", query, offset);

                var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("Accept", "application/json");
                request.Headers.Add("Accept-Encoding", "gzip");
                request.Headers.Add("X-Subscription-Token", apiKey);

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Brave API error: {Status}", response.StatusCode);
                    break;
                }

                var doc = JsonDocument.Parse(content);
                if (doc.RootElement.TryGetProperty("web", out var web) &&
                    web.TryGetProperty("results", out var webResults))
                {
                    foreach (var item in webResults.EnumerateArray())
                    {
                        results.Add(new WebSearchResult
                        {
                            Title = item.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "",
                            Link = item.TryGetProperty("url", out var u) ? u.GetString() ?? "" : "",
                            Snippet = item.TryGetProperty("description", out var d) ? d.GetString() ?? "" : ""
                        });
                        if (results.Count >= maxResults) break;
                    }
                }
                else
                {
                    break;
                }
            }

            _logger.LogInformation("Found {Count} results from Brave Search", results.Count);
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error searching Brave for: {Query}", query);
            return new List<WebSearchResult>();
        }
    }

    private async Task<List<WebSearchResult>> SearchGoogleCseAsync(string query, int maxResults, string apiKey, string cx)
    {
        try
        {
            var results = new List<WebSearchResult>();
            for (int start = 1; start <= maxResults && results.Count < maxResults; start += 10)
            {
                var num = Math.Min(maxResults - results.Count, 10);
                var url = $"https://www.googleapis.com/customsearch/v1?key={apiKey}&cx={cx}&q={Uri.EscapeDataString(query)}&num={num}&start={start}";
                _logger.LogInformation("Searching Google CSE for: {Query} (start={Start})", query, start);

                var response = await _httpClient.GetFromJsonAsync<JsonElement>(url);

                if (response.TryGetProperty("items", out var items))
                {
                    foreach (var item in items.EnumerateArray())
                    {
                        results.Add(new WebSearchResult
                        {
                            Title = item.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "",
                            Link = item.TryGetProperty("link", out var l) ? l.GetString() ?? "" : "",
                            Snippet = item.TryGetProperty("snippet", out var s) ? s.GetString() ?? "" : ""
                        });
                        if (results.Count >= maxResults) break;
                    }
                }
                else
                {
                    break;
                }
            }
            _logger.LogInformation("Found {Count} results from Google CSE", results.Count);
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error searching Google CSE for: {Query}", query);
            return new List<WebSearchResult>();
        }
    }

    private async Task<List<WebSearchResult>> SearchYahooAsync(string query, int maxResults)
    {
        try
        {
            _logger.LogInformation("Searching Yahoo for: {Query}", query);

            var searchUrl = $"https://search.yahoo.com/search?p={Uri.EscapeDataString(query)}";
            var request = new HttpRequestMessage(HttpMethod.Get, searchUrl);
            request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode) return new List<WebSearchResult>();

            var html = await response.Content.ReadAsStringAsync();
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var results = new List<WebSearchResult>();
            var seenUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var resultNodes = doc.DocumentNode.SelectNodes("//div[contains(@class, 'algo-sr')]");
            if (resultNodes != null)
            {
                foreach (var node in resultNodes)
                {
                    if (results.Count >= maxResults) break;

                    var linkNode = node.SelectSingleNode(".//h3[contains(@class, 'title')]/a") ?? node.SelectSingleNode(".//a");
                    if (linkNode == null) continue;

                    var href = linkNode.GetAttributeValue("href", "");
                    var title = linkNode.InnerText.Trim();

                    if (string.IsNullOrEmpty(title) || string.IsNullOrEmpty(href)) continue;

                    href = ExtractActualYahooUrl(href);
                    
                    if (string.IsNullOrEmpty(href) || !href.StartsWith("http") || href.Contains("yahoo.com")) continue;
                    if (seenUrls.Contains(href)) continue;
                    seenUrls.Add(href);

                    var snippetNode = node.SelectSingleNode(".//div[contains(@class, 'compText')]");
                    var snippet = snippetNode?.InnerText?.Trim() ?? "";

                    results.Add(new WebSearchResult
                    {
                        Title = title,
                        Link = href,
                        Snippet = snippet
                    });
                }
            }

            _logger.LogInformation("Found {Count} results from Yahoo", results.Count);
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error searching Yahoo for: {Query}", query);
            return new List<WebSearchResult>();
        }
    }

    private static string ExtractActualYahooUrl(string href)
    {
        if (href.Contains("/RU="))
        {
            var match = System.Text.RegularExpressions.Regex.Match(href, @"/RU=([^/]+)/");
            if (match.Success)
            {
                return Uri.UnescapeDataString(match.Groups[1].Value);
            }
        }
        return href;
    }
}
