using Microsoft.AspNetCore.Mvc;

namespace bt1.Controllers
{
    public class AdminController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}