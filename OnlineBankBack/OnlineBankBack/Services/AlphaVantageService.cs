using System.Text.Json;

namespace OnlineBankBack.Services
{
    public class AlphaVantageService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private const string BaseUrl = "https://www.alphavantage.co/query";

        public AlphaVantageService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["AlphaVantage:ApiKey"]!;
        }

        public async Task<ExchangeRateResult?> GetExchangeRateAsync(string fromCurrency, string toCurrency)
        {
            var url = $"{BaseUrl}?function=CURRENCY_EXCHANGE_RATE&from_currency={fromCurrency.ToUpper()}&to_currency={toCurrency.ToUpper()}&apikey={_apiKey}";

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();
            var root = JsonSerializer.Deserialize<JsonElement>(json);

            if (!root.TryGetProperty("Realtime Currency Exchange Rate", out var rateData))
                return null;

            if (!rateData.TryGetProperty("5. Exchange Rate", out var rateProp))
                return null;

            if (!decimal.TryParse(rateProp.GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var rate))
                return null;

            return new ExchangeRateResult
            {
                FromCurrency = rateData.TryGetProperty("1. From_Currency Code", out var from) ? from.GetString() ?? fromCurrency : fromCurrency,
                FromCurrencyName = rateData.TryGetProperty("2. From_Currency Name", out var fromName) ? fromName.GetString() ?? string.Empty : string.Empty,
                ToCurrency = rateData.TryGetProperty("3. To_Currency Code", out var to) ? to.GetString() ?? toCurrency : toCurrency,
                ToCurrencyName = rateData.TryGetProperty("4. To_Currency Name", out var toName) ? toName.GetString() ?? string.Empty : string.Empty,
                Rate = rate,
                LastRefreshed = rateData.TryGetProperty("6. Last Refreshed", out var refreshed) ? refreshed.GetString() ?? string.Empty : string.Empty
            };
        }

        public async Task<JsonElement?> GetStockQuoteAsync(string symbol)
        {
            var url = $"{BaseUrl}?function=GLOBAL_QUOTE&symbol={symbol.ToUpper()}&apikey={_apiKey}";
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return null;
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<JsonElement>(json);
        }
    }

    public class ExchangeRateResult
    {
        public string FromCurrency { get; set; } = string.Empty;
        public string FromCurrencyName { get; set; } = string.Empty;
        public string ToCurrency { get; set; } = string.Empty;
        public string ToCurrencyName { get; set; } = string.Empty;
        public decimal Rate { get; set; }
        public string LastRefreshed { get; set; } = string.Empty;
    }
}