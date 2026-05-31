using System.ComponentModel.DataAnnotations;

namespace bt1.Product
{
    public class Product
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Tên sản phẩm không được để trống")]
        public string Name { get; set; } = "";

        [Range(1000, 100000000, ErrorMessage = "Giá sản phẩm phải lớn hơn 1.000")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Mô tả sản phẩm không được để trống")]
        public string Description { get; set; } = "";

        public string Image { get; set; } = "";

        public List<string> Images { get; set; } = new List<string>();

        public int Thumbnail { get; set; }

        public string? Badge { get; set; }

        public int Rating { get; set; } = 5;

        public bool InStock { get; set; } = true;

        public int StockQty { get; set; }

        public string Status { get; set; } = "ComingSoon";

        public int CategoryId { get; set; }


    }
}