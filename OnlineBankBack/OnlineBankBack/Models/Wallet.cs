using System.ComponentModel.DataAnnotations;

namespace OnlineBankBack.Models
{
    public class Wallet
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        public virtual ICollection<WalletBalance> Balances { get; set; } = new List<WalletBalance>();
    }
}
