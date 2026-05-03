using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OnlineBankBack.Models
{
    public enum StockTransactionType { Buy, Sell }

    public class StockTransaction
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [Required, MaxLength(20)]
        public string Symbol { get; set; } = string.Empty;

        [Required]
        public StockTransactionType Type { get; set; }

        [Column(TypeName = "decimal(18,6)")]
        public decimal Quantity { get; set; }

        [Column(TypeName = "decimal(18,6)")]
        public decimal PriceAtTransaction { get; set; }

        [Column(TypeName = "decimal(18,6)")]
        public decimal TotalAmount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
    }
}
