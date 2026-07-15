#r "nuget: HtmlAgilityPack, 1.11.54"
using System.Net.Http;
using System.Threading.Tasks;
using HtmlAgilityPack;

var _httpClient = new HttpClient();
var query = "IT companies India";
var searchUrl = $"https://search.yahoo.com/search?p={Uri.EscapeDataString(query)}";
var request = new HttpRequestMessage(HttpMethod.Get, searchUrl);
request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

var response = await _httpClient.SendAsync(request);
var html = await response.Content.ReadAsStringAsync();
var doc = new HtmlDocument();
doc.LoadHtml(html);
var resultLinks = doc.DocumentNode.SelectNodes("//div[contains(@class, 'algo-sr')]//a[contains(@class, 'd-ib')]");
if (resultLinks != null) {
    foreach(var link in resultLinks) {
        Console.WriteLine(link.GetAttributeValue("href", "") + " - " + link.InnerText);
    }
} else {
    Console.WriteLine("No results found in Yahoo.");
    Console.WriteLine(html.Substring(0, Math.Min(500, html.Length)));
}
