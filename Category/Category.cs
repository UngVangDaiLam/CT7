using System.ComponentModel.DataAnnotations;
using ProductModel = bt1.Product.Product;

namespace bt1.Category
{
    public class Category
    {
        public int Id { get; set; }

        [Required, StringLength(50)]
        public string Name { get; set; } = "";

        public List<ProductModel>? Products { get; set; }
    }
}