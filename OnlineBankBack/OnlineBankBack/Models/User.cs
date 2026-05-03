using System.ComponentModel.DataAnnotations;

namespace OnlineBankBack.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PersonalNumber { get; set; }

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public string Currency { get; set; } = "USD"; 

        
        public virtual Wallet Wallet { get; set; }

       
        public virtual ICollection<ExternalCard> LinkedCards { get; set; } = new List<ExternalCard>();

        
        public virtual ICollection<VirtualCard> IssuedCards { get; set; } = new List<VirtualCard>();

        
        public virtual ICollection<Portfolio> Portfolio { get; set; } = new List<Portfolio>();
    }
}
