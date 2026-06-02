using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace bt1.Product
{
    public class ProductReview
    {
        public int Id { get; set; }

        public int ProductId { get; set; }

        [Required]
        [StringLength(100)]
        public string CustomerName { get; set; } = "";

        [Required]
        [StringLength(150)]
        public string CustomerEmail { get; set; } = "";

        [Range(1, 5)]
        public int Rating { get; set; } = 5;

        [Required]
        [StringLength(1000)]
        public string Comment { get; set; } = "";

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public bool IsApproved { get; set; } = true;

        public Product? Product { get; set; }

        [NotMapped]
        public string Stars => new string('★', Rating) + new string('☆', 5 - Rating);
    }
}