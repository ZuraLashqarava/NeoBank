using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OnlineBankBack.Models
{

    public enum TransactionCategory
    {
        OtherPerson,
        OwnAccount,
        Utilities,
        Transit,
        Games,
        Education,
        Charity,
        MobilePhone,
        CurrencyConversion
    }

    public enum TransactionStatus
    {
        Completed,
        Failed
    }

    public class Transaction
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid SenderId { get; set; }

        [ForeignKey("SenderId")]
        public virtual User Sender { get; set; } = null!;

        public Guid? RecipientId { get; set; }

        [ForeignKey("RecipientId")]
        public virtual User? Recipient { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public TransactionCategory Category { get; set; }

        [MaxLength(200)]
        public string Description { get; set; } = string.Empty;

        [MaxLength(100)]
        public string RecipientLabel { get; set; } = string.Empty;

        public TransactionStatus Status { get; set; } = TransactionStatus.Completed;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
