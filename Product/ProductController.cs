using Microsoft.AspNetCore.Mvc;

namespace bt1.Product
{
    public class ProductController : Controller
    {
        private readonly IProductRepository _productRepository;

        public ProductController(IProductRepository productRepository)
        {
            _productRepository = productRepository;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            var products = _productRepository.GetAll();
            return Json(products);
        }

        [HttpGet]
        public IActionResult GetById(int id)
        {
            var product = _productRepository.GetById(id);

            if (product == null)
            {
                return NotFound();
            }

            return Json(product);
        }

        [HttpPost]
        public IActionResult Add([FromBody] Product product)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _productRepository.Add(product);

            return Json(new
            {
                success = true,
                message = "Thêm sản phẩm thành công",
                product
            });
        }

        [HttpPost]
        public IActionResult Update([FromBody] Product product)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var oldProduct = _productRepository.GetById(product.Id);

            if (oldProduct == null)
            {
                return NotFound();
            }

            _productRepository.Update(product);

            return Json(new
            {
                success = true,
                message = "Cập nhật sản phẩm thành công",
                product
            });
        }

        [HttpPost]
        public IActionResult Delete(int id)
        {
            var product = _productRepository.GetById(id);

            if (product == null)
            {
                return NotFound();
            }

            _productRepository.Delete(id);

            return Json(new
            {
                success = true,
                message = "Xóa sản phẩm thành công"
            });
        }
    }
}