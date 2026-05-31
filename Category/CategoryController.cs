using Microsoft.AspNetCore.Mvc;

namespace bt1.Category
{
    public class CategoryController : Controller
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoryController(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            var categories = _categoryRepository.GetAll();

            return Json(categories);
        }

        [HttpGet]
        public IActionResult GetById(int id)
        {
            var category = _categoryRepository.GetById(id);

            if (category == null)
            {
                return NotFound();
            }

            return Json(category);
        }

        [HttpPost]
        public IActionResult Add([FromBody] Category category)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _categoryRepository.Add(category);

            return Json(new
            {
                success = true,
                message = "Thêm danh mục thành công",
                category
            });
        }

        [HttpPost]
        public IActionResult Update([FromBody] Category category)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var oldCategory = _categoryRepository.GetById(category.Id);

            if (oldCategory == null)
            {
                return NotFound();
            }

            _categoryRepository.Update(category);

            return Json(new
            {
                success = true,
                message = "Cập nhật danh mục thành công",
                category
            });
        }

        [HttpPost]
        public IActionResult Delete(int id)
        {
            var category = _categoryRepository.GetById(id);

            if (category == null)
            {
                return NotFound();
            }

            _categoryRepository.Delete(id);

            return Json(new
            {
                success = true,
                message = "Xóa danh mục thành công"
            });
        }
    }
}