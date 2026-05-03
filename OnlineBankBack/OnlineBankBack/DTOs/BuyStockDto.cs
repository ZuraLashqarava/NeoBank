using System.ComponentModel.DataAnnotations;

namespace OnlineBankBack.DTOs
{
    public class BuyStockDto
    {
        [Required]
        public string Symbol { get; set; } = string.Empty;

        [Required, Range(0.0001, double.MaxValue, ErrorMessage = "Quantity must be greater than zero.")]
        public decimal Quantity { get; set; }
    }
}
