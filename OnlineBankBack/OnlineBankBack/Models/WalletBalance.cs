using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OnlineBankBack.Models
{
    public class WalletBalance
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid WalletId { get; set; }

        [ForeignKey("WalletId")]
        public virtual Wallet Wallet { get; set; } = null!;

        [Required, MaxLength(10)]
        public string Currency { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Balance { get; set; } = 0.00m;
    }
}
