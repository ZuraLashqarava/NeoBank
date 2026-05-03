using System.ComponentModel.DataAnnotations;
using OnlineBankBack.Models;

namespace OnlineBankBack.DTOs
{
    public class GeneralPaymentDto
    {
        [Required, Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(4, MinimumLength = 4, ErrorMessage = "PIN must be exactly 4 digits.")]
        [RegularExpression(@"^\d{4}$", ErrorMessage = "PIN must contain only digits.")]
        public string PinCode { get; set; } = string.Empty;

        [Required]
        public TransactionCategory Category { get; set; }

        [Required, MaxLength(100)]
        public string RecipientLabel { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;
    }
}
