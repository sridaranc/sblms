using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using HtmlAgilityPack;
using Microsoft.Extensions.Logging;

namespace SBLMS.Application.AiLeads;

public interface IWebScraperService
{
    Task<List<ScrapedCompanyData>> ScrapeCompanyDataAsync(List<WebSearchResult> searchResults);
}

public class ScrapedCompanyData
{
    public string Url { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Emails { get; set; } = new();
    public List<string> Phones { get; set; } = new();
    public string? LinkedInUrl { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? Industry { get; set; }
    public string? CompanySize { get; set; }
    public string RawText { get; set; } = string.Empty;
}

public class WebScraperService : IWebScraperService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WebScraperService> _logger;

    private static readonly Regex EmailRegex = new(
        @"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex PhoneRegex = new(
        @"[\+]?[\d\s\-\(\)]{7,20}",
        RegexOptions.Compiled);

    private static readonly Regex LinkedInRegex = new(
        @"https?://(?:www\.)?linkedin\.com/(?:company|in)/[a-zA-Z0-9\-_]+",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly string[] CommonPages = { "/contact", "/about", "/about-us", "/contact-us", "/team" };

    public WebScraperService(HttpClient httpClient, ILogger<WebScraperService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<List<ScrapedCompanyData>> ScrapeCompanyDataAsync(List<WebSearchResult> searchResults)
    {
        var results = new List<ScrapedCompanyData>();
        var semaphore = new SemaphoreSlim(10); // Scrape up to 10 sites concurrently
        var tasks = new List<Task<ScrapedCompanyData?>>();

        foreach (var searchResult in searchResults.Take(100))
        {
            tasks.Add(Task.Run(async () =>
            {
                await semaphore.WaitAsync();
                try
                {
                    var data = await ScrapeSinglePageAsync(searchResult.Link, searchResult.Title, searchResult.Snippet);
                    if (data != null)
                    {
                        try
                        {
                            var uri = new Uri(searchResult.Link);
                            var contactUrl = $"{uri.Scheme}://{uri.Host}/contact";
                            var contactData = await ScrapeSinglePageAsync(contactUrl, searchResult.Title, "");
                            if (contactData != null)
                            {
                                data.Emails = MergeUnique(data.Emails, contactData.Emails);
                                data.Phones = MergeUnique(data.Phones, contactData.Phones);
                                if (string.IsNullOrEmpty(data.Address) && !string.IsNullOrEmpty(contactData.Address))
                                    data.Address = contactData.Address;
                                if (string.IsNullOrEmpty(data.City) && !string.IsNullOrEmpty(contactData.City))
                                    data.City = contactData.City;
                            }
                        }
                        catch { }
                        return data;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Failed to scrape {Url}: {Message}", searchResult.Link, ex.Message);
                }
                finally
                {
                    semaphore.Release();
                }
                return null;
            }));
        }

        var completedData = await Task.WhenAll(tasks);
        foreach (var data in completedData)
        {
            if (data != null)
            {
                results.Add(data);
            }
        }

        _logger.LogInformation("Scraped {Count} company pages successfully", results.Count);
        return results;
    }

    private async Task<ScrapedCompanyData?> ScrapeSinglePageAsync(string url, string title, string snippet)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            request.Headers.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
            request.Headers.Add("Accept-Language", "en-US,en;q=0.9");
            request.Headers.Add("Accept-Encoding", "gzip, deflate");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode) return null;

            var html = await response.Content.ReadAsStringAsync();
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var bodyNode = doc.DocumentNode.SelectSingleNode("//body");
            var rawText = bodyNode?.InnerText?.Trim() ?? "";
            if (rawText.Length > 8000) rawText = rawText.Substring(0, 8000);

            var emails = ExtractEmails(html);
            var phones = ExtractPhones(doc);
            var linkedIn = ExtractLinkedIn(doc);
            var address = ExtractAddress(doc);
            var city = ExtractCity(doc);
            var country = ExtractCountry(doc);
            var industry = ExtractIndustry(doc, title);
            var companySize = ExtractCompanySize(rawText);
            var description = ExtractMetaDescription(doc);

            var contactPageUrl = FindContactPageUrl(url);
            if (!string.IsNullOrEmpty(contactPageUrl))
            {
                try
                {
                    var contactRequest = new HttpRequestMessage(HttpMethod.Get, contactPageUrl);
                    contactRequest.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
                    contactRequest.Headers.Add("Accept", "text/html,application/xhtml+xml");
                    var contactResponse = await _httpClient.SendAsync(contactRequest);
                    if (contactResponse.IsSuccessStatusCode)
                    {
                        var contactHtml = await contactResponse.Content.ReadAsStringAsync();
                        emails = MergeUnique(emails, ExtractEmails(contactHtml));
                        var contactDoc = new HtmlDocument();
                        contactDoc.LoadHtml(contactHtml);
                        phones = MergeUnique(phones, ExtractPhones(contactDoc));
                        if (string.IsNullOrEmpty(address)) address = ExtractAddress(contactDoc);
                        if (string.IsNullOrEmpty(city)) city = ExtractCity(contactDoc);
                    }
                }
                catch { }
            }

            return new ScrapedCompanyData
            {
                Url = url,
                Title = title,
                Description = description ?? snippet,
                Emails = emails,
                Phones = phones,
                LinkedInUrl = linkedIn,
                Address = address,
                City = city,
                Country = country,
                Industry = industry,
                CompanySize = companySize,
                RawText = rawText
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error scraping page {Url}", url);
            return null;
        }
    }

    private string? FindContactPageUrl(string baseUrl)
    {
        try
        {
            var uri = new Uri(baseUrl);
            var baseUri = $"{uri.Scheme}://{uri.Host}";

            foreach (var page in CommonPages)
            {
                return $"{baseUri}{page}";
            }
        }
        catch { }
        return null;
    }

    private List<string> ExtractEmails(string html)
    {
        var matches = EmailRegex.Matches(html);
        var emails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var blacklist = new[] {
            "example.com", "email.com", "domain.com", "sentry.io", "wixpress.com",
            "schema.org", "w3.org", "googleapis.com", "gstatic.com", "facebook.com",
            "twitter.com", "instagram.com", "youtube.com", "wordpress.org", "github.com",
            "cloudflare.com", "amazonaws.com", "your-email", "your.email", "test@test",
            "admin@example", "user@example", "name@example", "email@example"
        };

        foreach (Match match in matches)
        {
            var email = match.Value.ToLower();
            if (email.Length < 6 || email.Length > 100) continue;
            if (blacklist.Any(b => email.Contains(b))) continue;
            if (email.StartsWith(".") || email.EndsWith(".")) continue;
            if (email.Contains("..")) continue;

            var domain = email.Split('@').LastOrDefault() ?? "";
            if (string.IsNullOrEmpty(domain)) continue;
            var parts = domain.Split('.');
            if (parts.Length < 2) continue;
            if (parts.Last().Length < 2) continue;

            emails.Add(email);
        }

        return emails.ToList();
    }

    private List<string> ExtractPhones(HtmlDocument doc)
    {
        var phones = new HashSet<string>();

        var phoneNodes = doc.DocumentNode.SelectNodes("//a[contains(@href,'tel:')]");
        if (phoneNodes != null)
        {
            foreach (var node in phoneNodes)
            {
                var href = node.GetAttributeValue("href", "");
                var phone = href.Replace("tel:", "").Trim();
                if (phone.Length >= 7) phones.Add(phone);
            }
        }

        var textNodes = doc.DocumentNode.SelectNodes("//p|//div|//span|//li");
        if (textNodes != null)
        {
            foreach (var node in textNodes.Take(100))
            {
                var text = node.InnerText;
                var matches = PhoneRegex.Matches(text);
                foreach (Match match in matches)
                {
                    var phone = match.Value.Trim();
                    var digitsOnly = Regex.Replace(phone, @"[^\d]", "");
                    if (digitsOnly.Length >= 7 && digitsOnly.Length <= 15)
                    {
                        phones.Add(phone);
                    }
                }
            }
        }

        return phones.ToList();
    }

    private string? ExtractLinkedIn(HtmlDocument doc)
    {
        var html = doc.DocumentNode.OuterHtml;
        var match = LinkedInRegex.Match(html);
        return match.Success ? match.Value : null;
    }

    private string? ExtractAddress(HtmlDocument doc)
    {
        var addressNode = doc.DocumentNode.SelectSingleNode("//address");
        if (addressNode != null)
        {
            var text = addressNode.InnerText.Trim();
            if (text.Length > 5 && text.Length < 200) return text;
        }

        var schemaAddress = doc.DocumentNode.SelectSingleNode("//span[@itemprop='streetAddress']");
        if (schemaAddress != null) return schemaAddress.InnerText.Trim();

        var metaAddress = doc.DocumentNode.SelectSingleNode("//meta[@name='address']");
        if (metaAddress != null) return metaAddress.GetAttributeValue("content", "");

        return null;
    }

    private string? ExtractCity(HtmlDocument doc)
    {
        var cityNode = doc.DocumentNode.SelectSingleNode("//span[@itemprop='addressLocality']");
        if (cityNode != null) return cityNode.InnerText.Trim();

        var metaCity = doc.DocumentNode.SelectSingleNode("//meta[@name='city']");
        if (metaCity != null) return metaCity.GetAttributeValue("content", "");

        return null;
    }

    private string? ExtractCountry(HtmlDocument doc)
    {
        var countryNode = doc.DocumentNode.SelectSingleNode("//span[@itemprop='addressCountry']");
        if (countryNode != null) return countryNode.InnerText.Trim();

        var metaCountry = doc.DocumentNode.SelectSingleNode("//meta[@name='country']");
        if (metaCountry != null) return metaCountry.GetAttributeValue("content", "");

        return null;
    }

    private string? ExtractIndustry(HtmlDocument doc, string title)
    {
        var industryNode = doc.DocumentNode.SelectSingleNode("//meta[@name='industry']");
        if (industryNode != null) return industryNode.GetAttributeValue("content", "");

        var ogTitle = doc.DocumentNode.SelectSingleNode("//meta[@property='og:title']");
        if (ogTitle != null) return ogTitle.GetAttributeValue("content", "");

        return title;
    }

    private string? ExtractCompanySize(string rawText)
    {
        var sizePatterns = new[]
        {
            new Regex(@"(\d{1,5}[\+]?\s*(?:employees|team members|staff|people|professionals))", RegexOptions.IgnoreCase),
            new Regex(@"(?:team of|workforce of|staff of)\s*(\d{1,5})", RegexOptions.IgnoreCase),
            new Regex(@"(\d{1,5})\s*(?:-\s*\d{1,5})?\s*employees", RegexOptions.IgnoreCase)
        };

        foreach (var pattern in sizePatterns)
        {
            var match = pattern.Match(rawText);
            if (match.Success) return match.Value.Trim();
        }

        return null;
    }

    private string? ExtractMetaDescription(HtmlDocument doc)
    {
        var metaDesc = doc.DocumentNode.SelectSingleNode("//meta[@name='description']");
        if (metaDesc != null)
        {
            var content = metaDesc.GetAttributeValue("content", "");
            if (!string.IsNullOrEmpty(content) && content.Length > 20) return content;
        }

        var ogDesc = doc.DocumentNode.SelectSingleNode("//meta[@property='og:description']");
        if (ogDesc != null)
        {
            var content = ogDesc.GetAttributeValue("content", "");
            if (!string.IsNullOrEmpty(content) && content.Length > 20) return content;
        }

        return null;
    }

    private List<string> MergeUnique(List<string> existing, List<string> newItems)
    {
        var set = new HashSet<string>(existing, StringComparer.OrdinalIgnoreCase);
        foreach (var item in newItems)
        {
            set.Add(item);
        }
        return set.ToList();
    }
}
