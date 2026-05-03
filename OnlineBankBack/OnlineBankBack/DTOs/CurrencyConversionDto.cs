using System.ComponentModel.DataAnnotations;

namespace OnlineBankBack.DTOs
{
    public class ConvertCurrencyDto
    {
        [Required, MaxLength(10)]
        public string FromCurrency { get; set; } = string.Empty;

        [Required, MaxLength(10)]
        public string ToCurrency { get; set; } = string.Empty;

        [Required, Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
        public decimal Amount { get; set; }
    }

    public class ExchangeRatePreviewDto
    {
        [Required, MaxLength(10)]
        public string FromCurrency { get; set; } = string.Empty;

        [Required, MaxLength(10)]
        public string ToCurrency { get; set; } = string.Empty;
    }

    public class ExchangeRateResponseDto
    {
        public string FromCurrency { get; set; } = string.Empty;
        public string FromCurrencyName { get; set; } = string.Empty;
        public string ToCurrency { get; set; } = string.Empty;
        public string ToCurrencyName { get; set; } = string.Empty;
        public decimal Rate { get; set; }
        public string LastRefreshed { get; set; } = string.Empty;
    }

    public class ConversionResultDto
    {
        public Guid ConversionId { get; set; }
        public Guid TransactionId { get; set; }
        public string FromCurrency { get; set; } = string.Empty;
        public string ToCurrency { get; set; } = string.Empty;
        public decimal SourceAmount { get; set; }
        public decimal ConvertedAmount { get; set; }
        public decimal ExchangeRate { get; set; }
        public decimal NewWalletBalance { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ConversionHistoryDto
    {
        public Guid Id { get; set; }
        public string FromCurrency { get; set; } = string.Empty;
        public string ToCurrency { get; set; } = string.Empty;
        public decimal SourceAmount { get; set; }
        public decimal ConvertedAmount { get; set; }
        public decimal ExchangeRate { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
