using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CategoryModel = bt1.Category.Category;

namespace bt1.Product
{
    public class Product
    {
        public int Id { get; set; }

        [Required]
        [StringLength(150)]
        public string Name { get; set; } = "";

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [StringLength(1000)]
        public string Description { get; set; } = "";

        public string? ImageUrl { get; set; }

        public int CategoryId { get; set; }

        public CategoryModel? Category { get; set; }

        public List<ProductImage>? Images { get; set; }

        public List<ProductReview>? Reviews { get; set; }

        public string? Badge { get; set; }

        public string Status { get; set; } = "InStock";

        public int StockQty { get; set; }

        public int Rating { get; set; } = 5;

        public int Thumbnail { get; set; } = 0;

        [NotMapped]
        public bool InStock => Status == "InStock" && StockQty > 0;

        [NotMapped]
        public bool IsOutOfStock => Status == "OutOfStock" || StockQty <= 0;

        [NotMapped]
        public bool IsComingSoon => Status == "ComingSoon";

        [NotMapped]
        public decimal AverageRating =>
            Reviews != null && Reviews.Any()
                ? (decimal)Reviews.Average(r => r.Rating)
                : Rating;

        [NotMapped]
        public int ReviewCount => Reviews?.Count ?? 0;
    }
}