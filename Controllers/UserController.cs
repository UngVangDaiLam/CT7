using Microsoft.AspNetCore.Mvc;

namespace bt1.Controllers
{
    public class UserController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}