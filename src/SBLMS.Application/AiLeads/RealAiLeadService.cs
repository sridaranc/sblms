using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace SBLMS.Application.AiLeads;

public class RealAiLeadService : IAiLeadService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<RealAiLeadService> _logger;
    private readonly IWebSearchService _webSearch;
    private readonly IWebScraperService _webScraper;

    public RealAiLeadService(HttpClient httpClient, IConfiguration config, ILogger<RealAiLeadService> logger, IWebSearchService webSearch, IWebScraperService webScraper)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
        _webSearch = webSearch;
        _webScraper = webScraper;
    }

    public async Task<List<AiLeadResultDto>> SearchLeadsAsync(string keywords, string country, string? industry, string? prompt, string provider)
    {
        var searchQuery = $"{keywords} companies {country}";
        if (!string.IsNullOrEmpty(industry)) searchQuery += $" {industry}";

        _logger.LogInformation("Step 1: Searching web for real companies matching: {Query}", searchQuery);
        var searchResults = await _webSearch.SearchCompaniesAsync(searchQuery, maxResults: 100);

        string aiPrompt;
        if (searchResults.Count == 0)
        {
            _logger.LogWarning("No web search results found. Falling back to AI-only search.");
            aiPrompt = BuildFallbackAiPrompt(keywords, country, industry, prompt);
        }
        else
        {
            _logger.LogInformation("Step 2: Scraping {Count} company websites for real contact data", searchResults.Count);
            var scrapedData = await _webScraper.ScrapeCompanyDataAsync(searchResults);
            aiPrompt = BuildPromptWithScrapedData(keywords, country, industry, prompt, searchResults, scrapedData);
        }

        return provider.ToLower() switch
        {
            "groq" or "llama" => await CallGroqAsync(aiPrompt, keywords, country),
            "gemini" or "google gemini" => await CallGeminiAsync(aiPrompt, keywords, country),
            "huggingface" => await CallHuggingFaceAsync(aiPrompt, keywords, country),
            "openai" or "chatgpt" => await CallOpenAiAsync(aiPrompt, keywords, country),
            "ollama" or "local" => await CallOllamaAsync(aiPrompt, keywords, country),
            "openrouter" => await CallOpenRouterAsync(aiPrompt, keywords, country),
            _ => throw new Exception($"Provider '{provider}' is not supported. Use: Groq, Gemini, HuggingFace, OpenAI, Ollama, or OpenRouter.")
        };
    }

    private string BuildPromptWithScrapedData(string keywords, string country, string? industry, string? prompt, List<WebSearchResult> searchResults, List<ScrapedCompanyData> scrapedData)
    {
        var searchContext = searchResults.Count > 0
            ? $"\n\nREAL COMPANIES FOUND FROM WEB SEARCH:\n{string.Join("\n", searchResults.Select(r => $"- {r.Title} | {r.Link}"))}"
            : "\n\nNo web search results available.";

        var scrapedContext = scrapedData.Count > 0
            ? $"\n\nREAL DATA SCRAPED FROM COMPANY WEBSITES:\n{string.Join("\n", scrapedData.Select(s => $@"
Company: {s.Title}
Website: {s.Url}
Description: {s.Description}
Emails found: {(s.Emails.Count > 0 ? string.Join(", ", s.Emails) : "NONE")}
Phones found: {(s.Phones.Count > 0 ? string.Join(", ", s.Phones) : "NONE")}
LinkedIn: {s.LinkedInUrl ?? "NONE"}
Address: {s.Address ?? "NONE"}
City: {s.City ?? "NONE"}
Country: {s.Country ?? "NONE"}
Industry: {s.Industry ?? "NONE"}
Company Size: {s.CompanySize ?? "NONE"}"))}"
            : "\n\nNo scraped data available.";

        var industryContext = !string.IsNullOrEmpty(industry) ? $"in the {industry} industry " : "";
        var additionalPrompt = !string.IsNullOrEmpty(prompt) ? $"\nAdditional requirements: {prompt}" : "";

        return $@"TASK: Generate a comprehensive list of 5 to 15 HIGHLY RELEVANT and REAL B2B leads matching the keywords: '{keywords}' located in '{country}' {industryContext}based on the web search results, scraped data, and your knowledge base.
{additionalPrompt}

{searchContext}
{scrapedContext}

RULES FOR DATA ACCURACY AND UPDATES:
1. Include all the real companies found in the search results and scraped data above.
2. Use your knowledge base to provide recent updates of data (such as LinkedIn URL, founded year, estimated revenue range, headquarters address, and emails/phones) for each company.
3. If the search and scraped results contain fewer than 5 companies, supplement the list with other real, well-known companies matching the keywords/industry in '{country}' from your knowledge base to reach a minimum of 5 to 15 leads.
4. Do NOT return fictional companies. Every company returned must be real and verifiable. Quality is more important than quantity.
5. Return the results as a single valid JSON object with a ""leads"" array.

JSON format for the response:
{{
  ""leads"": [
    {{""companyName"": ""company name"", ""contactPerson"": null, ""emailAddress"": ""ALL public contact emails separated by commas, or null"", ""contactPersonEmail"": null, ""phone"": ""ALL public phone numbers separated by commas, or null"", ""mobile"": null, ""address"": ""FULL street address including suite/building, or null"", ""city"": ""city name or null"", ""state"": ""state/province or null"", ""country"": ""{country}"", ""postalCode"": ""postal code or null"", ""website"": ""official website URL"", ""natureOfBusiness"": ""detailed description of business"", ""industry"": ""{industry ?? "relevant industry"}"", ""companySize"": ""estimated size (e.g., 10-50, 100-500) or null"", ""linkedinUrl"": ""LinkedIn company page URL or null"", ""foundedYear"": 2015, ""revenueRange"": ""$10M-$50M""}}
  ]
}}

Return ONLY the JSON object. Nothing else.";
    }

    private string BuildFallbackAiPrompt(string keywords, string country, string? industry, string? prompt)
    {
        var industryContext = !string.IsNullOrEmpty(industry) ? $"in the {industry} industry " : "";
        var additionalPrompt = !string.IsNullOrEmpty(prompt) ? $"\nAdditional requirements: {prompt}" : "";

        return $@"TASK: Generate a list of 5-15 HIGHLY RELEVANT and REAL, well-known companies {industryContext}matching the keywords: '{keywords}' located in '{country}'.
{additionalPrompt}

RULES:
- Find real companies that actually exist in '{country}' based on your knowledge base.
- Do NOT make up completely fictional companies. Only return real, verifiable business names. Quality is more important than quantity.
- Provide their official website URL.
- Use your knowledge base to provide recent updates of data (such as LinkedIn URL, founded year, estimated revenue range, headquarters address, and public contact emails/phones) for each company.
- For natureOfBusiness, describe what the company does in detail.
- For country, use '{country}'.
- Generate at least 5 and up to 15 unique real companies to reach the target list size.
- Return the results as a single valid JSON object with a ""leads"" array.

JSON format for the response:
{{
  ""leads"": [
    {{""companyName"": ""company name"", ""contactPerson"": null, ""emailAddress"": ""ALL public contact emails separated by commas, or null"", ""contactPersonEmail"": null, ""phone"": ""ALL public phone numbers separated by commas, or null"", ""mobile"": null, ""address"": ""FULL street address including suite/building, or null"", ""city"": ""city name or null"", ""state"": ""state/province or null"", ""country"": ""{country}"", ""postalCode"": ""postal code or null"", ""website"": ""official website URL"", ""natureOfBusiness"": ""description of business"", ""industry"": ""{industry ?? "relevant industry"}"", ""companySize"": ""estimated size (e.g., 10-50, 100-500) or null"", ""linkedinUrl"": ""LinkedIn company page URL or null"", ""foundedYear"": 2015, ""revenueRange"": ""$10M-$50M""}}
  ]
}}

Return ONLY the JSON object. Nothing else.";
    }

    private async Task<List<AiLeadResultDto>> CallGroqAsync(string prompt, string keywords, string country)
    {
        var apiKey = _config["AIProviders:Groq:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
            throw new Exception("Groq API key not configured. Add your free key to appsettings.json under AIProviders:Groq:ApiKey. Get free key at https://console.groq.com");

        try
        {
            var request = new
            {
                model = "llama-3.3-70b-versatile",
                messages = new[]
                {
                    new { role = "system", content = "You are a B2B lead generation expert. Return ONLY a valid JSON object with a 'leads' array. No markdown. No code blocks. No explanations." },
                    new { role = "user", content = prompt }
                },
                temperature = 0.3,
                max_tokens = 4000,
                top_p = 0.9,
                response_format = new { type = "json_object" }
            };

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            _logger.LogInformation("Calling Groq API for keywords={Keywords}, country={Country}", keywords, country);
            var response = await _httpClient.PostAsJsonAsync("https://api.groq.com/openai/v1/chat/completions", request);
            var content = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var json = JsonDocument.Parse(content);
                var message = json.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
                _logger.LogInformation("Groq response received ({Length} chars), parsing...", message?.Length ?? 0);
                return ParseAiResponse(message);
            }

            _logger.LogError("Groq API error: {Status} - {Content}", response.StatusCode, content);
            throw new Exception($"Groq API error: {response.StatusCode}. {content}");
        }
        catch (Exception ex) when (!(ex.Message.Contains("API key not configured") || ex.Message.Contains("Groq API error")))
        {
            _logger.LogError(ex, "Error calling Groq API");
            throw new Exception($"Failed to call Groq API: {ex.Message}");
        }
    }

    private async Task<List<AiLeadResultDto>> CallGeminiAsync(string prompt, string keywords, string country)
    {
        var apiKey = _config["AIProviders:Gemini:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
            throw new Exception("Gemini API key not configured. Add your free key to appsettings.json under AIProviders:Gemini:ApiKey. Get free key at https://aistudio.google.com/apikey");

        try
        {
            var request = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = $"System: You are a B2B lead generation expert. Return ONLY a valid JSON object with a 'leads' array. No markdown. No code blocks.\n\nUser: {prompt}" }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.3,
                    maxOutputTokens = 4000,
                    topP = 0.9,
                    responseMimeType = "application/json"
                }
            };

            _httpClient.DefaultRequestHeaders.Clear();
            _logger.LogInformation("Calling Gemini API for keywords={Keywords}, country={Country}", keywords, country);
            var response = await _httpClient.PostAsJsonAsync($"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}", request);
            var content = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var json = JsonDocument.Parse(content);
                var message = json.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();
                _logger.LogInformation("Gemini response received ({Length} chars), parsing...", message?.Length ?? 0);
                return ParseAiResponse(message);
            }

            _logger.LogError("Gemini API error: {Status} - {Content}", response.StatusCode, content);
            throw new Exception($"Gemini API error: {response.StatusCode}. {content}");
        }
        catch (Exception ex) when (!(ex.Message.Contains("API key not configured") || ex.Message.Contains("Gemini API error")))
        {
            _logger.LogError(ex, "Error calling Gemini API");
            throw new Exception($"Failed to call Gemini API: {ex.Message}");
        }
    }

    private async Task<List<AiLeadResultDto>> CallHuggingFaceAsync(string prompt, string keywords, string country)
    {
        var apiKey = _config["AIProviders:HuggingFace:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
            throw new Exception("HuggingFace API key not configured. Add your free key to appsettings.json under AIProviders:HuggingFace:ApiKey. Get free key at https://huggingface.co/settings/tokens");

        try
        {
            var request = new
            {
                model = "mistralai/Mixtral-8x7B-Instruct-v0.1",
                messages = new[]
                {
                    new { role = "system", content = "You are a B2B lead generation expert. Return ONLY a valid JSON object with a 'leads' array. No markdown. No code blocks." },
                    new { role = "user", content = prompt }
                },
                temperature = 0.3,
                max_tokens = 4000
            };

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            _logger.LogInformation("Calling HuggingFace API for keywords={Keywords}, country={Country}", keywords, country);
            var response = await _httpClient.PostAsJsonAsync("https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1/v1/chat/completions", request);
            var content = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var json = JsonDocument.Parse(content);
                var message = json.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
                _logger.LogInformation("HuggingFace response received ({Length} chars), parsing...", message?.Length ?? 0);
                return ParseAiResponse(message);
            }

            _logger.LogError("HuggingFace API error: {Status} - {Content}", response.StatusCode, content);
            throw new Exception($"HuggingFace API error: {response.StatusCode}. {content}");
        }
        catch (Exception ex) when (!(ex.Message.Contains("API key not configured") || ex.Message.Contains("HuggingFace API error")))
        {
            _logger.LogError(ex, "Error calling HuggingFace API");
            throw new Exception($"Failed to call HuggingFace API: {ex.Message}");
        }
    }

    private async Task<List<AiLeadResultDto>> CallOpenAiAsync(string prompt, string keywords, string country)
    {
        var apiKey = _config["AIProviders:OpenAI:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
            throw new Exception("OpenAI API key not configured. Add your key to appsettings.json under AIProviders:OpenAI:ApiKey. Get key at https://platform.openai.com/api-keys");

        try
        {
            var request = new
            {
                model = "gpt-4o-mini",
                messages = new[]
                {
                    new { role = "system", content = "You are a B2B lead generation expert. Return ONLY a valid JSON object with a 'leads' array. No markdown. No code blocks." },
                    new { role = "user", content = prompt }
                },
                temperature = 0.3,
                max_tokens = 4000,
                response_format = new { type = "json_object" }
            };

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            _logger.LogInformation("Calling OpenAI API for keywords={Keywords}, country={Country}", keywords, country);
            var response = await _httpClient.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", request);
            var content = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var json = JsonDocument.Parse(content);
                var message = json.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
                _logger.LogInformation("OpenAI response received ({Length} chars), parsing...", message?.Length ?? 0);
                return ParseAiResponse(message);
            }

            _logger.LogError("OpenAI API error: {Status} - {Content}", response.StatusCode, content);
            throw new Exception($"OpenAI API error: {response.StatusCode}. {content}");
        }
        catch (Exception ex) when (!(ex.Message.Contains("API key not configured") || ex.Message.Contains("OpenAI API error")))
        {
            _logger.LogError(ex, "Error calling OpenAI API");
            throw new Exception($"Failed to call OpenAI API: {ex.Message}");
        }
    }

    private async Task<List<AiLeadResultDto>> CallOllamaAsync(string prompt, string keywords, string country)
    {
        var baseUrl = _config["AIProviders:Ollama:BaseUrl"] ?? "http://localhost:11434";
        var model = _config["AIProviders:Ollama:Model"] ?? "llama3.1";

        try
        {
            var request = new
            {
                model = model,
                messages = new[]
                {
                    new { role = "system", content = "You are a B2B lead data processor. Return ONLY a valid JSON object with a 'leads' array. No markdown. No code blocks. No explanations." },
                    new { role = "user", content = prompt }
                },
                stream = false,
                format = "json",
                options = new
                {
                    temperature = 0.3,
                    num_predict = 4000
                }
            };

            _httpClient.DefaultRequestHeaders.Clear();

            _logger.LogInformation("Calling Ollama ({Model}) for keywords={Keywords}, country={Country}", model, keywords, country);
            var response = await _httpClient.PostAsJsonAsync($"{baseUrl}/api/chat", request);
            var content = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var json = JsonDocument.Parse(content);
                var message = json.RootElement.GetProperty("message").GetProperty("content").GetString();
                _logger.LogInformation("Ollama response received ({Length} chars), parsing...", message?.Length ?? 0);
                return ParseAiResponse(message);
            }

            _logger.LogError("Ollama API error: {Status} - {Content}", response.StatusCode, content);
            throw new Exception($"Ollama API error: {response.StatusCode}. {content}. Make sure Ollama is running: ollama serve");
        }
        catch (Exception ex) when (!(ex.Message.Contains("Ollama API error")))
        {
            _logger.LogError(ex, "Error calling Ollama");
            throw new Exception($"Failed to call Ollama: {ex.Message}. Make sure Ollama is installed and running: ollama pull {model} && ollama serve");
        }
    }

    private async Task<List<AiLeadResultDto>> CallOpenRouterAsync(string prompt, string keywords, string country)
    {
        var apiKey = _config["AIProviders:OpenRouter:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
            throw new Exception("OpenRouter API key not configured. Add your key to appsettings.json under AIProviders:OpenRouter:ApiKey. Get free key at https://openrouter.ai");

        try
        {
            var model = _config["AIProviders:OpenRouter:Model"] ?? "meta-llama/llama-3-8b-instruct:free";
            var request = new
            {
                model = model,
                messages = new[]
                {
                    new { role = "system", content = "You are a B2B lead generation expert. Return ONLY a valid JSON object with a 'leads' array. No markdown. No code blocks." },
                    new { role = "user", content = prompt }
                },
                temperature = 0.3,
                max_tokens = 4000,
                response_format = new { type = "json_object" }
            };

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
            _httpClient.DefaultRequestHeaders.Add("HTTP-Referer", "http://localhost:5080");
            _httpClient.DefaultRequestHeaders.Add("X-Title", "SBLMS Lead Search");

            _logger.LogInformation("Calling OpenRouter ({Model}) for keywords={Keywords}, country={Country}", model, keywords, country);
            var response = await _httpClient.PostAsJsonAsync("https://openrouter.ai/api/v1/chat/completions", request);
            var content = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var json = JsonDocument.Parse(content);
                var message = json.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
                _logger.LogInformation("OpenRouter response received ({Length} chars), parsing...", message?.Length ?? 0);
                return ParseAiResponse(message);
            }

            _logger.LogError("OpenRouter API error: {Status} - {Content}", response.StatusCode, content);
            throw new Exception($"OpenRouter API error: {response.StatusCode}. {content}");
        }
        catch (Exception ex) when (!(ex.Message.Contains("API key not configured") || ex.Message.Contains("OpenRouter API error")))
        {
            _logger.LogError(ex, "Error calling OpenRouter API");
            throw new Exception($"Failed to call OpenRouter API: {ex.Message}");
        }
    }

    private List<AiLeadResultDto> ParseAiResponse(string? aiResponse)
    {
        if (string.IsNullOrEmpty(aiResponse))
            throw new Exception("AI returned empty response. Try again or use a different provider.");

        var jsonStr = aiResponse.Trim();

        // Remove markdown code blocks if any (though JSON mode should prevent this)
        if (jsonStr.StartsWith("```json")) jsonStr = jsonStr.Substring(7);
        else if (jsonStr.StartsWith("```")) jsonStr = jsonStr.Substring(3);
        if (jsonStr.EndsWith("```")) jsonStr = jsonStr.Substring(0, jsonStr.LastIndexOf("```"));
        jsonStr = jsonStr.Trim();

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        List<AiLeadResultDto>? results = null;

        try
        {
            var parsedObj = JsonDocument.Parse(jsonStr);
            if (parsedObj.RootElement.TryGetProperty("leads", out var leadsElement))
            {
                results = JsonSerializer.Deserialize<List<AiLeadResultDto>>(leadsElement.GetRawText(), options);
            }
            else
            {
                // Fallback if the AI still returned an array directly despite instructions
                if (parsedObj.RootElement.ValueKind == JsonValueKind.Array)
                {
                    results = JsonSerializer.Deserialize<List<AiLeadResultDto>>(parsedObj.RootElement.GetRawText(), options);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse AI JSON object response. Raw: {Response}", aiResponse?.Substring(0, Math.Min(500, aiResponse?.Length ?? 0)));
            throw new Exception($"AI returned invalid JSON. Response starts with: {aiResponse?.Substring(0, Math.Min(100, aiResponse?.Length ?? 0))}");
        }

        if (results == null)
            throw new Exception("AI returned no parseable results.");

        var validated = results.Where(r => !string.IsNullOrWhiteSpace(r.CompanyName)).ToList();

        foreach (var r in validated)
        {
            if (!string.IsNullOrEmpty(r.EmailAddress) && !IsValidEmail(r.EmailAddress))
            {
                _logger.LogWarning("Invalid email {Email} for {Company}, setting to null", r.EmailAddress, r.CompanyName);
                r.EmailAddress = null;
            }
            if (!string.IsNullOrEmpty(r.ContactPersonEmail) && !IsValidEmail(r.ContactPersonEmail))
            {
                r.ContactPersonEmail = null;
            }
        }

        _logger.LogInformation("Parsed {Count} validated companies from AI response", validated.Count);
        return validated;
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }

    private string RepairTruncatedJsonArray(string truncatedJson)
    {
        _logger.LogWarning("AI response appears to be truncated. Attempting to repair JSON array...");
        
        var lastCloseBrace = truncatedJson.LastIndexOf('}');
        if (lastCloseBrace < 0)
        {
            return "[]"; // Cannot repair, return empty array
        }
        
        var repaired = truncatedJson.Substring(0, lastCloseBrace + 1);
        
        // Remove trailing commas if any
        repaired = repaired.TrimEnd();
        if (repaired.EndsWith(","))
        {
            repaired = repaired.Substring(0, repaired.Length - 1).TrimEnd();
        }
        
        repaired += "\n]";
        _logger.LogInformation("Successfully repaired truncated JSON array. Length reduced from {Original} to {Repaired} chars.", truncatedJson.Length, repaired.Length);
        return repaired;
    }
}
