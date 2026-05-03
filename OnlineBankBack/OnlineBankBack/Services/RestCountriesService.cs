using System.Text.Json;

namespace OnlineBankBack.Services
{
    public class CountryCallingCode
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Flag { get; set; } = string.Empty;
    }

    public class RestCountriesService
    {
        private readonly HttpClient _httpClient;
        private const string BaseUrl = "https://restcountries.com/v3.1";

        public RestCountriesService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<List<CountryCallingCode>> GetCallingCodesAsync()
        {
            var response = await _httpClient.GetAsync($"{BaseUrl}/all?fields=name,idd,flag");
            if (!response.IsSuccessStatusCode) return new List<CountryCallingCode>();

            var json = await response.Content.ReadAsStringAsync();
            var root = JsonSerializer.Deserialize<JsonElement>(json);

            var result = new List<CountryCallingCode>();

            foreach (var country in root.EnumerateArray())
            {
                if (!country.TryGetProperty("idd", out var idd)) continue;
                if (!idd.TryGetProperty("root", out var rootProp)) continue;

                var rootStr = rootProp.GetString();
                if (string.IsNullOrWhiteSpace(rootStr)) continue;

                var suffixes = new List<string> { "" };
                if (idd.TryGetProperty("suffixes", out var suffixArray) && suffixArray.ValueKind == JsonValueKind.Array)
                {
                    var list = new List<string>();
                    foreach (var s in suffixArray.EnumerateArray())
                    {
                        var sv = s.GetString();
                        if (!string.IsNullOrWhiteSpace(sv)) list.Add(sv);
                    }
                    if (list.Count > 0) suffixes = list;
                }

                var name = country.TryGetProperty("name", out var nameProp) &&
                           nameProp.TryGetProperty("common", out var common)
                    ? common.GetString() ?? string.Empty
                    : string.Empty;

                var flag = country.TryGetProperty("flag", out var flagProp)
                    ? flagProp.GetString() ?? string.Empty
                    : string.Empty;

                foreach (var suffix in suffixes)
                {
                    var code = rootStr + suffix;
                    result.Add(new CountryCallingCode
                    {
                        Name = name,
                        Code = code,
                        Flag = flag
                    });
                    break;
                }
            }

            return result
                .Where(c => !string.IsNullOrWhiteSpace(c.Name))
                .OrderBy(c => c.Name)
                .ToList();
        }
    }
}