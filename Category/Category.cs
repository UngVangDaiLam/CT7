using System.ComponentModel.DataAnnotations;

namespace bt1.Category
{
    public class Category
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Tên danh mục không được để trống")]
        public string Name { get; set; } = "";

        public string? Description { get; set; }
    }
}