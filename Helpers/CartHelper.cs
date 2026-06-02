using bt1.Models;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;

namespace bt1.Helpers
{
    public static class CartHelper
    {
        private const string CART_SESSION_KEY = "ShoppingCart";

        /// <summary>
        /// Lấy giỏ hàng từ session
        /// </summary>
        public static List<CartItem> GetCart(ISession session)
        {
            try
            {
                var json = session.GetString(CART_SESSION_KEY);
                return string.IsNullOrEmpty(json)
                    ? new List<CartItem>()
                    : JsonConvert.DeserializeObject<List<CartItem>>(json) ?? new List<CartItem>();
            }
            catch
            {
                return new List<CartItem>();
            }
        }

        /// <summary>
        /// Lưu giỏ hàng vào session
        /// </summary>
        public static void SaveCart(ISession session, List<CartItem> cart)
        {
            var json = JsonConvert.SerializeObject(cart);
            session.SetString(CART_SESSION_KEY, json);
        }

        /// <summary>
        /// Thêm sản phẩm vào giỏ
        /// </summary>
        public static void AddToCart(ISession session, int productId, string productName,
            decimal price, string imageUrl, int quantity = 1)
        {
            var cart = GetCart(session);
            var existing = cart.FirstOrDefault(c => c.ProductId == productId);

            if (existing != null)
            {
                existing.Quantity += quantity;
            }
            else
            {
                cart.Add(new CartItem
                {
                    ProductId = productId,
                    ProductName = productName,
                    Price = price,
                    ImageUrl = imageUrl,
                    Quantity = quantity
                });
            }

            SaveCart(session, cart);
        }

        /// <summary>
        /// Xóa sản phẩm khỏi giỏ
        /// </summary>
        public static void RemoveFromCart(ISession session, int productId)
        {
            var cart = GetCart(session);
            cart = cart.Where(c => c.ProductId != productId).ToList();
            SaveCart(session, cart);
        }

        /// <summary>
        /// Cập nhật số lượng sản phẩm
        /// </summary>
        public static void UpdateQuantity(ISession session, int productId, int quantity)
        {
            var cart = GetCart(session);
            var item = cart.FirstOrDefault(c => c.ProductId == productId);

            if (item != null)
            {
                if (quantity <= 0)
                {
                    RemoveFromCart(session, productId);
                }
                else
                {
                    item.Quantity = quantity;
                    SaveCart(session, cart);
                }
            }
        }

        /// <summary>
        /// Xóa toàn bộ giỏ hàng
        /// </summary>
        public static void ClearCart(ISession session)
        {
            session.Remove(CART_SESSION_KEY);
        }

        /// <summary>
        /// Tính tổng giá tiền
        /// </summary>
        public static decimal GetTotal(ISession session)
        {
            return GetCart(session).Sum(c => c.TotalPrice);
        }

        /// <summary>
        /// Lấy tổng số lượng sản phẩm
        /// </summary>
        public static int GetItemCount(ISession session)
        {
            return GetCart(session).Sum(c => c.Quantity);
        }
    }
}