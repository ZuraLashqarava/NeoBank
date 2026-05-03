using System.ComponentModel.DataAnnotations;

namespace OnlineBankBack.DTOs
{
    public class RegisterDto
    {
        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, RegularExpression(@"^\d{11}$", ErrorMessage = "Personal number must be exactly 11 digits.")]
        public string PersonalNumber { get; set; } = string.Empty;

        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required, RegularExpression(@"^\d{16}$", ErrorMessage = "Card number must be exactly 16 digits.")]
        public string CardNumber { get; set; } = string.Empty;

        [Required]
        public string CardHolderName { get; set; } = string.Empty;
    }
}
