using System.ComponentModel.DataAnnotations;

namespace OnlineBankBack.Models
{
    public class ExternalCard
    {
        [Key]
        public Guid Id { get; set; }
        public string CardHolderName { get; set; }
        public string LastFour { get; set; }
        public Guid UserId { get; set; }
    }
}
