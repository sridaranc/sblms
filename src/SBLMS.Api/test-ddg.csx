#r "nuget: HtmlAgilityPack, 1.11.54"
using System.Net.Http;
using System.Threading.Tasks;
using HtmlAgilityPack;

var _httpClient = new HttpClient();
var query = "IT companies India";
var searchUrl = $"https://html.duckduckgo.com/html/?q={Uri.EscapeDataString(query)}";
var request = new HttpRequestMessage(HttpMethod.Get, searchUrl);
request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
request.Headers.Add("Accept", "text/html,application/xhtml+xml");

var response = await _httpClient.SendAsync(request);
var html = await response.Content.ReadAsStringAsync();
Console.WriteLine(html.Substring(0, Math.Min(500, html.Length)));
