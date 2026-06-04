using bt1.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace bt1.Controllers
{
    [ApiController]
    [Route("api/admin-products")]
    public class AdminProductApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminProductApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts()
        {
            try
            {
                var products = await _context.Products
                    .Include(p => p.Images)
                    .Include(p => p.Category)
                    .Include(p => p.Reviews)
                    .OrderByDescending(p => p.Id)
                    .Select(p => new
                    {
                        id = p.Id,
                        name = p.Name,
                        price = p.Price,
                        description = p.Description,
                        image = p.ImageUrl,
                        imageUrl = p.ImageUrl,

                        images = p.Images != null
                            ? p.Images.Select(i => i.Url).ToList()
                            : new List<string>(),

                        thumbnail = p.Thumbnail,
                        badge = p.Badge,
                        status = p.Status,
                        inStock = p.Status == "InStock",
                        stockQty = p.StockQty,
                        rating = p.Rating,
                        categoryId = p.CategoryId,
                        categoryName = p.Category != null ? p.Category.Name : "",
                        reviewCount = p.Reviews != null ? p.Reviews.Count : 0
                    })
                    .ToListAsync();

                return Ok(products);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Lỗi khi tải sản phẩm từ SQL Server.",
                    error = ex.Message
                });
            }
        }
    }
}