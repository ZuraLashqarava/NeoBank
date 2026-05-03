using System.ComponentModel.DataAnnotations;

namespace OnlineBankBack.DTOs
{
    public class TransferToPersonDto
    {
        [Required]
        public string RecipientPersonalNumber { get; set; } = string.Empty;

        [Required, Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(4, MinimumLength = 4, ErrorMessage = "PIN must be exactly 4 digits.")]
        [RegularExpression(@"^\d{4}$", ErrorMessage = "PIN must contain only digits.")]
        public string PinCode { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;
    }
}
