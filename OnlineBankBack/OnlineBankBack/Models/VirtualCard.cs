using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OnlineBankBack.Models
{
    public class VirtualCard
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        
        [Required, StringLength(16)]
        public string CardNumber { get; set; } = string.Empty;

        [Required]
        public string CardHolderName { get; set; } = string.Empty;

        [Required, StringLength(5)]
        public string ExpiryDate { get; set; } = string.Empty; 

        [Required, StringLength(3)]
        public string CVV { get; set; } = string.Empty;

        public string? PinCode { get; set; }

        [MaxLength(50)]
        public string Nickname { get; set; } = "Main Virtual Card";

        
        public bool IsActive { get; set; } = true;

       
        public string Network { get; set; } = "NeoBank";

        
        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

       
        public decimal CurrentDailySpent { get; set; } = 0.00m;
    }
}
