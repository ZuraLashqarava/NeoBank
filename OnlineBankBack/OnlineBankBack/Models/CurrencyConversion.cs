using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OnlineBankBack.Models
{
    public class CurrencyConversion
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [Required, MaxLength(10)]
        public string FromCurrency { get; set; } = string.Empty;

        [Required, MaxLength(10)]
        public string ToCurrency { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal SourceAmount { get; set; }

        [Column(TypeName = "decimal(18,6)")]
        public decimal ConvertedAmount { get; set; }

        [Column(TypeName = "decimal(18,6)")]
        public decimal ExchangeRate { get; set; }

        public Guid? TransactionId { get; set; }

        [ForeignKey("TransactionId")]
        public virtual Transaction? Transaction { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
