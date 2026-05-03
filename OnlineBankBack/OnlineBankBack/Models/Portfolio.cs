using System.ComponentModel.DataAnnotations;

namespace OnlineBankBack.Models
{
    public class Portfolio
    {
        [Key]
        public Guid Id { get; set; }

        public string TickerSymbol { get; set; }       

        [MaxLength(100)]
        public string CompanyName { get; set; } = string.Empty;   

        public decimal Quantity { get; set; }

        public decimal AveragePurchasePrice { get; set; }

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;  

        public Guid UserId { get; set; }
    }
}
