using System.ComponentModel.DataAnnotations;

namespace OnlineBankBack.DTOs
{
    public class TransferToOwnAccountDto
    {
        [Required, Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
        public decimal Amount { get; set; }

        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;
    }
}
