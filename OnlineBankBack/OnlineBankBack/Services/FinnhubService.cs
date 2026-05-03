using System.Text.Json;

namespace OnlineBankBack.Services
{
    public class FinnhubService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private const string BaseUrl = "https://finnhub.io/api/v1";

        public FinnhubService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Finnhub:ApiKey"]!;
        }

        
        public async Task<JsonElement?> GetQuoteAsync(string symbol)
        {
            var url = $"{BaseUrl}/quote?symbol={symbol.ToUpper()}&token={_apiKey}";
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<JsonElement>(json);
        }

        
        public async Task<JsonElement?> SearchStocksAsync(string query)
        {
            var url = $"{BaseUrl}/search?q={query}&token={_apiKey}";
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<JsonElement>(json);
        }

        
        public async Task<JsonElement?> GetCompanyProfileAsync(string symbol)
        {
            var url = $"{BaseUrl}/stock/profile2?symbol={symbol.ToUpper()}&token={_apiKey}";
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<JsonElement>(json);
        }

       
        public async Task<JsonElement?> GetMarketNewsAsync(string category = "general")
        {
            var url = $"{BaseUrl}/news?category={category}&token={_apiKey}";
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<JsonElement>(json);
        }

        public async Task<JsonElement?> GetCandlesAsync(string symbol, string resolution, long from, long to)
        {
            
            var interval = resolution switch
            {
                "1" => "1m",
                "5" => "5m",
                "15" => "15m",
                "30" => "30m",
                "60" => "1h",
                "D" => "1d",
                "W" => "1wk",
                "M" => "1mo",
                _ => "1d"
            };

            var url = $"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval={interval}&period1={from}&period2={to}";

            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("User-Agent", "Mozilla/5.0");

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Yahoo Candle Error: {response.StatusCode} - {errorContent}");
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            var root = JsonSerializer.Deserialize<JsonElement>(json);

            if (root.TryGetProperty("chart", out var chart) &&
                chart.TryGetProperty("result", out var result) &&
                result.ValueKind == JsonValueKind.Null)
            {
                return null;
            }

            return root;
        }
    }
}