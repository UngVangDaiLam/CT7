namespace bt1.Category
{
    public class MockCategoryRepository : ICategoryRepository
    {
        private static readonly List<Category> _categories = new List<Category>
        {
            new Category
            {
                Id = 1,
                Name = "Thời trang",
                Description = "Áo, quần và các sản phẩm thời trang"
            },
            new Category
            {
                Id = 2,
                Name = "Giày dép",
                Description = "Giày sneaker, giày thể thao"
            },
            new Category
            {
                Id = 3,
                Name = "Phụ kiện",
                Description = "Túi, kính, đồng hồ, balo"
            }
        };

        public IEnumerable<Category> GetAll()
        {
            return _categories;
        }

        public Category? GetById(int id)
        {
            return _categories.FirstOrDefault(c => c.Id == id);
        }

        public void Add(Category category)
        {
            category.Id = _categories.Any()
                ? _categories.Max(c => c.Id) + 1
                : 1;

            _categories.Add(category);
        }

        public void Update(Category category)
        {
            var oldCategory = GetById(category.Id);

            if (oldCategory == null)
            {
                return;
            }

            oldCategory.Name = category.Name;
            oldCategory.Description = category.Description;
        }

        public void Delete(int id)
        {
            var category = GetById(id);

            if (category != null)
            {
                _categories.Remove(category);
            }
        }
    }
}