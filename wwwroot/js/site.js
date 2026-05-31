/**
 * ShopEasy – site.js (Single-Page / SPA version)
 * Tất cả logic: auth, products, cart, admin CRUD
 * Không dùng window.location.href – chỉ dùng showPage()
 */

// ===========================
// CONSTANTS & CONFIG
// ===========================
const STORAGE_KEYS = {
    products: 'HNTS_products',
    user: 'HNTS_user',
    cart: 'HNTS_cart',
    reviews: 'HNTS_reviews',
};

const ACCOUNTS = {
    admin: { username: 'admin', password: '123456', role: 'admin' },
    user:  { username: 'user',  password: '123456', role: 'user'  },
};

// Sản phẩm mẫu mặc định – có thêm images[], inStock, stockQty, thumbnail
const DEFAULT_PRODUCTS = [
    { id: 1, name: 'Áo Thun Premium Cotton', price: 299000,
      description: 'Áo thun chất liệu cotton cao cấp, thoáng mát, phù hợp mọi dịp.',
      image: 'https://picsum.photos/seed/shirt1/400/300',
      images: ['https://picsum.photos/seed/shirt1/400/300','https://picsum.photos/seed/shirt2/400/300','https://picsum.photos/seed/shirt3/400/300'],
      thumbnail: 0, badge: 'Hot', rating: 5, inStock: true, stockQty: 50 },

    { id: 2, name: 'Giày Sneaker Classic', price: 890000,
      description: 'Giày sneaker thiết kế cổ điển, êm ái, bền đẹp theo thời gian.',
      image: 'https://picsum.photos/seed/shoe1/400/300',
      images: ['https://picsum.photos/seed/shoe1/400/300','https://picsum.photos/seed/shoe2/400/300'],
      thumbnail: 0, badge: 'New', rating: 4, inStock: true, stockQty: 20 },

    { id: 3, name: 'Túi Tote Canvas', price: 199000,
      description: 'Túi tote vải canvas chắc chắn, phong cách tối giản, đa năng.',
      image: 'https://picsum.photos/seed/bag1/400/300',
      images: ['https://picsum.photos/seed/bag1/400/300'],
      thumbnail: 0, badge: 'Sale', rating: 4, inStock: false, stockQty: 0 },

    { id: 4, name: 'Đồng Hồ Minimalist', price: 1250000,
      description: 'Đồng hồ thiết kế tối giản, mặt kính sapphire chống xước.',
      image: 'https://picsum.photos/seed/watch1/400/300',
      images: ['https://picsum.photos/seed/watch1/400/300','https://picsum.photos/seed/watch2/400/300','https://picsum.photos/seed/watch3/400/300'],
      thumbnail: 0, badge: 'Hot', rating: 5, inStock: true, stockQty: 8 },

    { id: 5, name: 'Kính Mát UV400', price: 450000,
      description: 'Kính mát chống tia UV400, gọng nhẹ, phù hợp mọi khuôn mặt.',
      image: 'https://picsum.photos/seed/glass1/400/300',
      images: ['https://picsum.photos/seed/glass1/400/300'],
      thumbnail: 0, badge: 'New', rating: 4, inStock: true, stockQty: 30 },

    { id: 6, name: 'Balo Laptop 15"', price: 650000,
      description: 'Balo chống thấm nước, ngăn đựng laptop có đệm bảo vệ.',
      image: 'https://picsum.photos/seed/backpack1/400/300',
      images: ['https://picsum.photos/seed/backpack1/400/300','https://picsum.photos/seed/backpack2/400/300'],
      thumbnail: 0, badge: 'Sale', rating: 5, inStock: false, stockQty: 0 },

    { id: 7, name: 'Nón Bucket Trendy', price: 175000,
      description: 'Nón bucket phong cách streetwear, chất liệu vải dù nhẹ.',
      image: 'https://picsum.photos/seed/hat1/400/300',
      images: ['https://picsum.photos/seed/hat1/400/300'],
      thumbnail: 0, badge: 'New', rating: 3, inStock: true, stockQty: 100 },

    { id: 8, name: 'Áo Khoác Denim', price: 780000,
      description: 'Áo khoác denim dày dặn, wash màu vintage, bền đẹp theo năm tháng.',
      image: 'https://picsum.photos/seed/jacket1/400/300',
      images: ['https://picsum.photos/seed/jacket1/400/300','https://picsum.photos/seed/jacket2/400/300'],
      thumbnail: 0, badge: 'Hot', rating: 5, inStock: true, stockQty: 15 },
];

// ===========================
// SPA – HIỂN THỊ MÀN HÌNH
// ===========================

/**
 * showPage(page)
 * Ẩn tất cả section, sau đó hiện section tương ứng.
 * Trang chủ mặc định là user page (không cần đăng nhập).
 */
function showPage(page) {
    const loginPageEl = document.getElementById('login-page');
    const userPageEl = document.getElementById('user-page');
    const adminPageEl = document.getElementById('admin-page');

    if (loginPageEl) {
        loginPageEl.style.display = 'none';
    }

    if (userPageEl) {
        userPageEl.classList.remove('d-none');
        renderUserProducts(getProducts());
        updateCartCount();
        initNavbarScroll();
        initHamburger();
        updateNavbarAuthState();
    }

    if (adminPageEl) {
        adminPageEl.classList.remove('d-none');
        renderAdminProducts();
        updateStats();
    }
}

// ===========================
// PRODUCT MANAGEMENT
// ===========================

/** Khởi tạo sản phẩm mẫu nếu localStorage chưa có */
function initProducts() {
    if (!localStorage.getItem(STORAGE_KEYS.products)) {
        saveProducts(DEFAULT_PRODUCTS);
    }
}

/** Lấy danh sách sản phẩm từ localStorage */
function getProducts() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.products)) || [];
    } catch { return []; }
}

/** Lưu danh sách sản phẩm vào localStorage */
function saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
}

/** Tạo ID mới */
function generateId() {
    const products = getProducts();
    return products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
}

// ===========================
// FORMAT UTILITIES
// ===========================

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND', maximumFractionDigits: 0,
    }).format(amount);
}

function renderStars(rating) {
    return Array.from({ length: 5 }, (_, i) =>
        `<span class="star ${i < rating ? 'filled' : ''}">★</span>`
    ).join('');
}

function badgeClass(badge) {
    const map = {
        'Hot': 'badge-hot',
        'Sale': 'badge-sale',
        'New': 'badge-new',
        'Soon': 'badge-soon'
    };

    return map[badge] || 'badge-default';
}

// ===========================
// AUTH & LOGIN MODAL
// ===========================

/** Mở modal đăng nhập */
function showLoginModal() {
    const modal = document.getElementById('login-modal-overlay');
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Reset form và lỗi
    document.getElementById('login-form')?.reset();
    const err = document.getElementById('login-error');
    if (err) { err.textContent = ''; err.classList.remove('show'); }
}

/** Đóng modal đăng nhập */
function hideLoginModal() {
    const modal = document.getElementById('login-modal-overlay');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * handleLogin(event)
 * Xử lý đăng nhập: kiểm tra tài khoản, lưu sessionStorage, đóng modal
 */
function handleLogin(event) {
    if (event) event.preventDefault();

    const username = document.getElementById('username')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const errorEl = document.getElementById('login-error');

    if (!username || !password) {
        showLoginError('Vui lòng nhập đầy đủ thông tin.', errorEl);
        return;
    }

    const account = Object.values(ACCOUNTS).find(
        a => a.username === username && a.password === password
    );

    if (!account) {
        showLoginError('Tên đăng nhập hoặc mật khẩu không đúng.', errorEl);
        return;
    }

    sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify({
        username: account.username,
        role: account.role
    }));

    hideLoginModal();

    if (account.role === 'admin') {
        window.location.href = '/admin';
    } else {
        window.location.href = '/user';
    }
}

function showLoginError(msg, el) {
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3500);
}

/**
 * handleLogout()
 * Xóa session, quay về user page (không redirect đến login)
 */
function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEYS.user);

    if (window.location.pathname.toLowerCase().startsWith('/admin')) {
        window.location.href = '/';
        return;
    }

    showPage('user');
}

/** Lấy thông tin user đang đăng nhập */
function getCurrentUser() {
    try {
        return JSON.parse(sessionStorage.getItem(STORAGE_KEYS.user));
    } catch { return null; }
}

/**
 * updateNavbarAuthState()
 * Cập nhật hiển thị nút đăng nhập / đăng xuất + tên user trên navbar
 */
function updateNavbarAuthState() {
    const user = getCurrentUser();
    const loginWrap   = document.getElementById('nav-login-wrap');
    const logoutWrap  = document.getElementById('nav-logout-wrap');
    const usernameEl  = document.getElementById('nav-username');

    if (user) {
        if (loginWrap)  loginWrap.style.display  = 'none';
        if (logoutWrap) logoutWrap.style.display  = '';
        if (usernameEl) usernameEl.textContent    = `👤 ${user.username}`;
    } else {
        if (loginWrap)  loginWrap.style.display  = '';
        if (logoutWrap) logoutWrap.style.display  = 'none';
    }
}

// ===========================
// CART
// ===========================

function getCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.cart)) || []; }
    catch { return []; }
}

function saveCart(cart) {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
}

/**
 * addToCart(productId)
 * Không thêm được nếu hết hàng
 */
function addToCart(productId) {
    const product = getProducts().find(p => p.id === productId);
    if (!product || product.inStock === false) return;

    const cart     = getCart();
    const existing = cart.find(c => c.id === productId);
    
    // Kiểm tra số lượng tồn kho
    const currentQty = existing ? existing.qty : 0;
    const maxQty = product.stockQty ?? 999;
    if (currentQty >= maxQty) {
        showToast(`⚠️ Không thể thêm! Cửa hàng chỉ còn ${maxQty} sản phẩm tồn kho.`, 'error');
        return;
    }

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id: productId, qty: 1 });
    }
    saveCart(cart);
    updateCartCount();
    renderCartDrawer();
    openCartDrawer();
}

/** Cập nhật badge số lượng giỏ hàng trên navbar */
function updateCartCount() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    const total = getCart().reduce((sum, c) => sum + c.qty, 0);
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
}

/** Mở Drawer Giỏ hàng */
function openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer && overlay) {
        renderCartDrawer();
        drawer.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/** Đóng Drawer Giỏ hàng */
function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer && overlay) {
        drawer.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/** Render danh sách sản phẩm trong Drawer Giỏ hàng */
function renderCartDrawer() {
    const itemsContainer = document.getElementById('cart-drawer-items');
    const totalPriceEl = document.getElementById('cart-total-price');
    if (!itemsContainer || !totalPriceEl) return;

    const cart = getCart();
    const products = getProducts();

    if (cart.length === 0) {
        itemsContainer.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <p>Giỏ hàng của bạn đang trống.</p>
                <button class="btn-shop-now" onclick="closeCartDrawer()">Mua sắm ngay</button>
            </div>
        `;
        totalPriceEl.textContent = '0đ';
        return;
    }

    let totalPrice = 0;
    itemsContainer.innerHTML = cart.map(item => {
        const prod = products.find(p => p.id === item.id);
        if (!prod) return '';

        const itemPrice = prod.price * item.qty;
        totalPrice += itemPrice;
        const thumbnail = getProductThumbnail(prod);

        return `
            <div class="cart-item">
                <img class="cart-item-img" src="${thumbnail}" alt="${prod.name}" onerror="this.src='https://picsum.photos/seed/${prod.id}/100/100'">
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${prod.name}</h4>
                    <span class="cart-item-price">${formatCurrency(prod.price)}</span>
                    <div class="cart-item-qty-wrap">
                        <button class="qty-btn minus" onclick="updateCartDrawerQty(${item.id}, -1)">-</button>
                        <span class="qty-val">${item.qty}</span>
                        <button class="qty-btn plus" onclick="updateCartDrawerQty(${item.id}, 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Xóa sản phẩm">✕</button>
            </div>
        `;
    }).join('');

    totalPriceEl.textContent = formatCurrency(totalPrice);
}

/** Cập nhật số lượng sản phẩm trực tiếp trong Drawer */
function updateCartDrawerQty(productId, delta) {
    const cart = getCart();
    const existing = cart.find(c => c.id === productId);
    if (!existing) return;

    const product = getProducts().find(p => p.id === productId);
    if (!product) return;

    const newQty = existing.qty + delta;
    if (newQty <= 0) {
        removeFromCart(productId);
        return;
    }

    // Kiểm tra số lượng tồn kho
    const maxQty = product.stockQty ?? 999;
    if (delta > 0 && newQty > maxQty) {
        showToast(`⚠️ Cửa hàng chỉ còn ${maxQty} sản phẩm tồn kho cho mặt hàng này.`, 'error');
        return;
    }

    existing.qty = newQty;
    saveCart(cart);
    updateCartCount();
    renderCartDrawer();
}

/** Xóa sản phẩm khỏi giỏ */
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(c => c.id !== productId);
    saveCart(cart);
    updateCartCount();
    renderCartDrawer();
    showToast('🗑️ Đã xóa sản phẩm khỏi giỏ hàng.', 'error');
}

/** Thanh toán đơn hàng */
function checkoutCart() {
    const cart = getCart();
    if (cart.length === 0) {
        showToast('⚠️ Giỏ hàng trống!', 'error');
        return;
    }

    const products = getProducts();
    
    // Kiểm tra lại tồn kho một lần nữa trước khi thanh toán
    for (const item of cart) {
        const prod = products.find(p => p.id === item.id);
        if (!prod) continue;
        if (prod.inStock === false || (prod.stockQty !== undefined && prod.stockQty < item.qty)) {
            showToast(`⚠️ Sản phẩm "${prod.name}" không đủ số lượng tồn kho hoặc đã hết hàng.`, 'error');
            return;
        }
    }

    // Trừ tồn kho
    cart.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        if (prod) {
            if (prod.stockQty !== undefined) {
                prod.stockQty = Math.max(0, prod.stockQty - item.qty);
                if (prod.stockQty === 0) {
                    prod.inStock = false;
                }
            }
        }
    });

    saveProducts(products);
    saveCart([]); // Làm trống giỏ
    updateCartCount();
    closeCartDrawer();
    
    // Render lại giao diện
    const user = getCurrentUser();

    const isAdminPage = document.getElementById('admin-page') !== null;
    const isUserPage = document.getElementById('user-page') !== null;
    const isLoginPage = document.getElementById('login-form') !== null && !isAdminPage && !isUserPage;

    if (isAdminPage) {
        if (!user || user.role !== 'admin') {
            window.location.href = '/';
            return;
        }

        showPage('admin');
    }

    if (isUserPage) {
        if (!user) {
            window.location.href = '/';
            return;
        }

        showPage('user');
    }

    if (isLoginPage) {
        if (user && user.role === 'admin') {
            window.location.href = '/admin';
            return;
        }

        if (user && user.role === 'user') {
            window.location.href = '/user';
            return;
        }
    }

    showToast('🎉 Đặt hàng thành công! Cảm ơn bạn đã mua sắm tại HNTS.', 'success');
}

// ===========================
// PRODUCT REVIEWS & COMMENTS
// ===========================

let reviewingProductId = null;

function getReviews() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews)) || [];
    } catch {
        return [];
    }
}

function saveReviews(reviews) {
    localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
}

function getProductReviews(productId) {
    return getReviews().filter(r => r.productId === productId);
}

function getAverageRating(productId) {
    const reviews = getProductReviews(productId);

    if (reviews.length === 0) {
        return null;
    }

    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return total / reviews.length;
}

function openReviewModal(productId) {
    const user = getCurrentUser();

    if (!user) {
        showToast('🔒 Vui lòng đăng nhập để đánh giá sản phẩm.', 'error');
        showLoginModal();
        return;
    }

    reviewingProductId = productId;

    const product = getProducts().find(p => p.id === productId);
    const modal = document.getElementById('review-modal-overlay');

    if (!modal || !product) return;

    document.getElementById('review-product-name').textContent = product.name;
    document.getElementById('review-rating').value = '5';
    document.getElementById('review-comment').value = '';

    renderReviewList(productId);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReviewModal() {
    const modal = document.getElementById('review-modal-overlay');

    if (modal) {
        modal.classList.remove('active');
    }

    document.body.style.overflow = '';
    reviewingProductId = null;
}

function submitReview() {
    const user = getCurrentUser();

    if (!user) {
        showToast('🔒 Vui lòng đăng nhập để đánh giá.', 'error');
        return;
    }

    if (!reviewingProductId) return;

    const rating = parseInt(document.getElementById('review-rating')?.value) || 5;
    const comment = document.getElementById('review-comment')?.value?.trim();

    if (!comment) {
        showToast('⚠️ Vui lòng nhập nội dung bình luận.', 'error');
        return;
    }

    const reviews = getReviews();

    reviews.push({
        id: Date.now(),
        productId: reviewingProductId,
        username: user.username,
        rating: rating,
        comment: comment,
        createdAt: new Date().toLocaleString('vi-VN')
    });

    saveReviews(reviews);

    renderReviewList(reviewingProductId);
    renderUserProducts(getProducts());

    document.getElementById('review-comment').value = '';
    document.getElementById('review-rating').value = '5';

    showToast('✅ Cảm ơn bạn đã đánh giá sản phẩm!', 'success');
}

function renderReviewList(productId) {
    const wrap = document.getElementById('review-list');
    if (!wrap) return;

    const reviews = getProductReviews(productId);

    if (reviews.length === 0) {
        wrap.innerHTML = `
            <div class="review-empty">
                Chưa có đánh giá nào cho sản phẩm này.
            </div>
        `;
        return;
    }

    wrap.innerHTML = reviews.map(r => `
        <div class="review-item">
            <div class="review-head">
                <strong>👤 ${r.username}</strong>
                <span>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            </div>
            <div class="review-comment">${r.comment}</div>
            <div class="review-date">${r.createdAt}</div>
        </div>
    `).join('');
}

// ===========================
// THUMBNAIL HELPER
// ===========================

/** Lấy URL ảnh thumbnail của sản phẩm */
function getProductThumbnail(product) {
    if (product.images && product.images.length > 0) {
        const idx = product.thumbnail ?? 0;
        return product.images[Math.min(idx, product.images.length - 1)] || product.images[0];
    }
    return product.image || `https://picsum.photos/seed/${product.id}/400/300`;
}

/** Đổi ảnh chính của card sản phẩm khi click vào ảnh nhỏ phụ */
function changeCardThumbnail(imgEl, newSrc) {
    const card = imgEl.closest('.product-card');
    if (!card) return;
    const mainThumb = card.querySelector('.product-thumbnail');
    if (mainThumb) {
        mainThumb.src = newSrc;
    }
    // Thêm class active cho ảnh nhỏ này và bỏ ở các ảnh khác cùng strip
    const strip = imgEl.closest('.img-hover-strip');
    if (strip) {
        strip.querySelectorAll('img').forEach(img => img.classList.remove('active'));
    }
    imgEl.classList.add('active');
}

// ===========================
// USER PAGE – RENDER PRODUCTS
// ===========================

/**
 * renderUserProducts(products)
 * Hiển thị sản phẩm dạng card grid cho trang User
 * – Dùng thumbnail riêng cho từng sản phẩm
 * – Hiển thị trạng thái hết hàng, disable nút Mua ngay
 */
function renderUserProducts(products) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🛍️</div>
        <p>Chưa có sản phẩm nào.</p>
      </div>`;
        return;
    }

    grid.innerHTML = products.map(product => {
        const thumbnail = getProductThumbnail(product);

        const status = product.status || (product.inStock === false ? 'OutOfStock' : 'InStock');
        const isComingSoon = status === 'ComingSoon';
        const isOutOfStock = status === 'OutOfStock';
        const canBuy = status === 'InStock';

        const allImgs = (product.images && product.images.length > 0)
            ? product.images.slice(0, 5)
            : [thumbnail];

        return `
    <div class="col" role="listitem">
      <article class="product-card h-100${!canBuy ? ' out-of-stock' : ''}" data-id="${product.id}">
        <div class="product-img-wrap">
          <img src="${thumbnail}" alt="${product.name}" loading="lazy"
               onerror="this.src='https://picsum.photos/seed/${product.id}/400/300'" class="product-thumbnail">

          ${product.badge
                ? `<span class="product-badge ${badgeClass(product.badge)}">${product.badge}</span>`
                : ''}

          ${isComingSoon
                ? `<div class="out-of-stock-overlay coming-soon-overlay"><span>SẮP VỀ HÀNG</span></div>`
                : isOutOfStock
                    ? `<div class="out-of-stock-overlay"><span>HẾT HÀNG</span></div>`
                    : ''}

          ${allImgs.length > 1 && canBuy
                ? `<div class="img-hover-strip">${allImgs.map(img => {
                    const isActive = img === thumbnail;
                    return `<img src="${img}" alt="${product.name}" loading="lazy" class="${isActive ? 'active' : ''}"
                          onclick="changeCardThumbnail(this, '${img}')"
                          onerror="this.src='https://picsum.photos/seed/${product.id}/400/300'">`;
                }).join('')}</div>`
                : ''}
        </div>

        <div class="product-body">
          <div class="product-rating">${renderStars(product.rating || 0)}</div>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-desc">${product.description}</p>

          <div class="product-footer">
            <span class="product-price">${formatCurrency(product.price)}</span>

            <button class="btn-buy${!canBuy ? ' btn-buy-disabled' : ''}"
                    data-product-id="${product.id}"
                    ${!canBuy ? 'disabled' : ''}>
              ${isComingSoon ? '⏳ Sắp về hàng' : isOutOfStock ? '🚫 Hết hàng' : 'Mua ngay'}
            </button>
          </div>

          ${canBuy && product.stockQty !== undefined && product.stockQty > 0 && product.stockQty <= 10
                ? `<div class="stock-low">⚠️ Chỉ còn ${product.stockQty} sản phẩm!</div>`
                : ''}
        </div>
     
        <div class="product-review-summary">
            ${(() => {
                        const avg = getAverageRating(product.id);
                        const count = getProductReviews(product.id).length;

                        if (!avg) {
                            return `<span>Chưa có đánh giá</span>`;
                        }

                        return `<span>⭐ ${avg.toFixed(1)}/5 (${count} đánh giá)</span>`;
             })()}
        </div>

        <button class="btn-review" type="button" onclick="openReviewModal(${product.id})">
            💬 Đánh giá
        </button>

      </article>
    </div>`;
    }).join('');

    grid.querySelectorAll('.btn-buy:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.productId);
            const user = getCurrentUser();

            if (!user) {
                showToast('🔒 Vui lòng đăng nhập để mua hàng!', 'error');
                showLoginModal();
                return;
            }

            addToCart(id);

            const product = getProducts().find(p => p.id === id);
            showToast(`🛒 Đã thêm "${product?.name}" vào giỏ hàng!`, 'success');

            btn.textContent = '✓ Đã thêm';
            btn.style.background = '#22c55e';

            setTimeout(() => {
                btn.textContent = 'Mua ngay';
                btn.style.background = '';
            }, 1500);
        });
    });

    observeCards();
}

/** Scroll reveal cho product cards */
function observeCards() {
    const cards = document.querySelectorAll('#product-grid .col');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    entry.target.style.animationDelay = (i * 0.07) + 's';
                    entry.target.querySelector('.product-card')?.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });
        cards.forEach(card => observer.observe(card));
    } else {
        cards.forEach(col => col.querySelector('.product-card')?.classList.add('visible'));
    }
}

// ===========================
// ADMIN PAGE – RENDER PRODUCTS
// ===========================

/**
 * renderAdminProducts(filter)
 * Hiển thị bảng sản phẩm admin – có cột thumbnail, ảnh phụ, tồn kho
 */
function renderAdminProducts(filter) {
    const tbody = document.getElementById('admin-products-body');
    if (!tbody) return;

    let products = getProducts();
    if (filter) {
        const q = filter.toLowerCase();
        products = products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            (p.badge || '').toLowerCase().includes(q)
        );
    }

    if (products.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <div class="empty-icon">📦</div>
            <p>Không có sản phẩm nào${filter ? ' khớp với tìm kiếm' : ''}.</p>
          </div>
        </td>
      </tr>`;
    } else {
        tbody.innerHTML = products.map(product => {
            const thumbnail    = getProductThumbnail(product);
            const imgCount     = (product.images || [product.image]).filter(Boolean).length;
            const status = product.status || (product.inStock === false ? 'OutOfStock' : 'InStock');
            const isComingSoon = status === 'ComingSoon';
            const isOutOfStock = status === 'OutOfStock';
            return `
      <tr data-id="${product.id}"${isOutOfStock ? ' class="row-out-of-stock"' : ''}>
        <td>
          <div class="table-img-wrap">
            <img class="table-img" src="${thumbnail}" alt="${product.name}"
                 onerror="this.src='https://picsum.photos/seed/${product.id}/100/100'">
            ${imgCount > 1 ? `<span class="img-count-badge">+${imgCount - 1}</span>` : ''}
          </div>
        </td>
        <td class="table-name">${product.name}</td>
        <td class="table-price">${formatCurrency(product.price)}</td>
        <td class="table-desc">${product.description}</td>
        <td><span class="product-badge ${badgeClass(product.badge)}">${product.badge || '—'}</span></td>
        <td>
         ${isComingSoon
                    ? `<span class="stock-badge stock-coming">🟡 Sắp về hàng</span>`
                    : isOutOfStock
                        ? `<span class="stock-badge stock-out">🔴 Hết hàng</span>`
                        : `<span class="stock-badge stock-in">🟢 Còn hàng</span>
           ${product.stockQty !== undefined
                            ? `<small class="stock-qty">(${product.stockQty} cái)</small>`
                            : ''}`
         }
        </td>
        <td>
          <button class="btn-edit" onclick="editProduct(${product.id})">✏️ Sửa</button>
          <button class="btn-delete" onclick="deleteProduct(${product.id})">🗑 Xóa</button>
        </td>
      </tr>`;
        }).join('');
    }
    updateStats();
}

// ===========================
// ADMIN – STATS
// ===========================

/** Cập nhật 4 ô thống kê */
function updateStats() {
    const products   = getProducts();
    const totalEl    = document.getElementById('stat-total');
    const maxPriceEl = document.getElementById('stat-max-price');
    const totalValEl = document.getElementById('stat-total-value');
    const outStockEl = document.getElementById('stat-out-of-stock');

    if (totalEl)    totalEl.textContent    = products.length;
    if (maxPriceEl) maxPriceEl.textContent = products.length
        ? formatCurrency(Math.max(...products.map(p => p.price))) : '—';
    if (totalValEl) totalValEl.textContent = products.length
        ? formatCurrency(products.reduce((s, p) => s + p.price, 0)) : '—';
    if (outStockEl) outStockEl.textContent = products.filter(p => p.inStock === false).length;
}

// ===========================
// ADMIN – CRUD
// ===========================

let editingId   = null;
let adminImages = []; // Mảng ảnh hiện tại của sản phẩm đang thêm/sửa

/** Thêm sản phẩm mới */
function addProduct() {
    const data = getFormData();
    if (!data) return;

    const products = getProducts();
    products.push({ ...data, id: generateId(), rating: 5 });
    saveProducts(products);

    resetForm();
    renderAdminProducts(getSearchValue());
    showToast('✅ Thêm sản phẩm thành công!', 'success');
}

/**
 * editProduct(id)
 * Điền thông tin sản phẩm vào form, chuyển sang chế độ chỉnh sửa
 */
function editProduct(id) {
    const product = getProducts().find(p => p.id === id);
    if (!product) return;

    editingId = id;
    document.getElementById('prod-name').value  = product.name;
    document.getElementById('prod-price').value = product.price;
    document.getElementById('prod-desc').value  = product.description;
    document.getElementById('prod-badge').value = product.badge || '';

    // Stock fields
    const statusEl = document.getElementById('prod-status');
    const stockQtyEl = document.getElementById('prod-stock-qty');

    if (statusEl) {
        statusEl.value = product.status || (product.inStock === false ? 'OutOfStock' : 'InStock');
    }

    if (stockQtyEl) {
        stockQtyEl.value = product.stockQty ?? '';
    }

    toggleStockQty();

    // Multi-image
    adminImages = (product.images && product.images.length > 0)
        ? [...product.images]
        : (product.image ? [product.image] : []);
    renderAdminImagePreview(product.thumbnail ?? 0);

    document.getElementById('btn-add')?.classList.add('hidden');
    document.getElementById('btn-update')?.classList.remove('hidden');
    document.getElementById('btn-cancel')?.classList.remove('hidden');

    document.getElementById('product-form-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('prod-name')?.focus();

    const formTitle = document.getElementById('form-title');
    if (formTitle) formTitle.textContent = 'Chỉnh sửa sản phẩm';
}

/** Cập nhật sản phẩm đang sửa */
function updateProduct() {
    if (!editingId) return;
    const data = getFormData();
    if (!data) return;

    const products = getProducts();
    const idx      = products.findIndex(p => p.id === editingId);
    if (idx === -1) return;

    products[idx] = { ...products[idx], ...data };
    saveProducts(products);

    resetForm();
    renderAdminProducts(getSearchValue());
    showToast('✅ Cập nhật sản phẩm thành công!', 'success');
}

/** Xóa sản phẩm sau khi xác nhận */
function deleteProduct(id) {
    const product = getProducts().find(p => p.id === id);
    if (!product) return;
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${product.name}"?`)) return;

    const products = getProducts().filter(p => p.id !== id);
    saveProducts(products);
    renderAdminProducts(getSearchValue());
    showToast('🗑️ Đã xóa sản phẩm.', 'error');
}

/** Hủy chỉnh sửa */
function cancelEdit() { resetForm(); }

/** Lấy dữ liệu từ form (bao gồm multi-image và stock) */
function getFormData() {
    const name = document.getElementById('prod-name')?.value?.trim();
    const price = parseFloat(document.getElementById('prod-price')?.value);
    const desc = document.getElementById('prod-desc')?.value?.trim();
    const badge = document.getElementById('prod-badge')?.value;
    const status = document.getElementById('prod-status')?.value || 'InStock';
    const stockQty = parseInt(document.getElementById('prod-stock-qty')?.value) || 0;

    const thumbEl = document.querySelector('.admin-img-item.is-thumbnail');
    const thumbIdx = parseInt(thumbEl?.dataset?.index ?? '0') || 0;

    if (!name) {
        showToast('⚠️ Vui lòng nhập tên sản phẩm.', 'error');
        return null;
    }

    if (!price || isNaN(price) || price <= 0) {
        showToast('⚠️ Giá bán không hợp lệ.', 'error');
        return null;
    }

    if (!desc) {
        showToast('⚠️ Vui lòng nhập mô tả sản phẩm.', 'error');
        return null;
    }

    if (status === 'InStock' && stockQty <= 0) {
        showToast('⚠️ Sản phẩm còn hàng thì số lượng tồn kho phải lớn hơn 0.', 'error');
        return null;
    }

    const images = adminImages.length > 0
        ? adminImages
        : [`https://picsum.photos/seed/${Date.now()}/400/300`];

    const safeThumbIdx = Math.min(thumbIdx, images.length - 1);

    return {
        name,
        price,
        description: desc,
        image: images[safeThumbIdx] || images[0],
        images,
        thumbnail: safeThumbIdx,
        badge: status === 'ComingSoon' ? 'Soon' : badge,
        status: status,
        inStock: status === 'InStock',
        stockQty: status === 'InStock' ? stockQty : 0,
    };
}

/**
 * resetForm()
 * Reset về trạng thái Thêm mới
 */
function resetForm() {
    editingId   = null;
    adminImages = [];

    ['prod-name', 'prod-price', 'prod-desc', 'prod-img-file'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const badgeEl = document.getElementById('prod-badge');
    if (badgeEl) badgeEl.value = 'Hot';

    const inStockEl = document.getElementById('prod-in-stock');
    if (inStockEl) inStockEl.checked = true;

    const stockQtyEl = document.getElementById('prod-stock-qty');
    if (stockQtyEl) stockQtyEl.value = '';
    toggleStockQty();

    // Clear image previews
    const previewWrap = document.getElementById('admin-img-preview-wrap');
    if (previewWrap) previewWrap.innerHTML = '';

    document.getElementById('btn-add')?.classList.remove('hidden');
    document.getElementById('btn-update')?.classList.add('hidden');
    document.getElementById('btn-cancel')?.classList.add('hidden');

    const formTitle = document.getElementById('form-title');
    if (formTitle) formTitle.textContent = 'Thêm sản phẩm mới';
}

/** Toggle hiển thị input số lượng tồn kho theo trạng thái checkbox */
function toggleStockQty() {
    const statusEl = document.getElementById('prod-status');
    const qtyWrap = document.getElementById('stock-qty-wrap');

    const status = statusEl?.value || 'InStock';

    if (qtyWrap) {
        qtyWrap.style.display = status === 'InStock' ? '' : 'none';
    }
}

/** Render preview ảnh trong admin form */
function renderAdminImagePreview(thumbnailIdx = 0) {
    const wrap = document.getElementById('admin-img-preview-wrap');
    if (!wrap) return;
    if (adminImages.length === 0) { wrap.innerHTML = ''; return; }

    wrap.innerHTML = adminImages.map((img, i) => `
        <div class="admin-img-item${i === thumbnailIdx ? ' is-thumbnail' : ''}" data-index="${i}">
            <img src="${img}" alt="Ảnh ${i + 1}" loading="lazy">
            ${i === thumbnailIdx ? '<span class="thumb-label">★ Thumbnail</span>' : ''}
            <div class="admin-img-actions">
                <button type="button" class="img-set-thumb-btn"
                        onclick="setAdminThumbnail(${i})"
                        title="${i === thumbnailIdx ? 'Đang là thumbnail' : 'Đặt làm thumbnail'}">
                    ${i === thumbnailIdx ? '★' : '☆'}
                </button>
                <button type="button" class="img-remove-btn"
                        onclick="removeAdminImage(${i})" title="Xóa ảnh">✕</button>
            </div>
        </div>`
    ).join('');
}

/** Xóa ảnh khỏi danh sách */
function removeAdminImage(idx) {
    const currentThumb = parseInt(
        document.querySelector('.admin-img-item.is-thumbnail')?.dataset?.index ?? '0'
    ) || 0;
    adminImages.splice(idx, 1);
    const newThumb = Math.min(currentThumb, Math.max(0, adminImages.length - 1));
    renderAdminImagePreview(newThumb);
}

/** Đặt thumbnail cho sản phẩm */
function setAdminThumbnail(idx) {
    renderAdminImagePreview(idx);
}

function getSearchValue() {
    return document.getElementById('search-products')?.value?.trim() || '';
}

// ===========================
// TOAST NOTIFICATION
// ===========================

function showToast(message, type = 'success') {
    let toast = document.getElementById('toast-custom');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-custom';
        toast.className = 'toast-custom';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className   = `toast-custom ${type}`;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===========================
// NAVBAR SCROLL EFFECT
// ===========================

function initNavbarScroll() {
    const navbar = document.querySelector('#user-page .navbar');
    if (!navbar) return;
    const wrap = document.getElementById('user-scroll-wrap');
    if (!wrap) return;
    const onScroll = () => navbar.classList.toggle('scrolled', wrap.scrollTop > 20);
    wrap.removeEventListener('scroll', wrap._scrollHandler);
    wrap._scrollHandler = onScroll;
    wrap.addEventListener('scroll', onScroll, { passive: true });
}

// ===========================
// HAMBURGER MENU
// ===========================

function initHamburger() {
    const btn   = document.getElementById('hamburger');
    const links = document.getElementById('nav-links');
    if (!btn || !links) return;
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
        links.classList.toggle('open');
        newBtn.setAttribute('aria-expanded', links.classList.contains('open'));
    });
    links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => links.classList.remove('open'));
    });
}

// ===========================
// HELPER: scroll top user page
// ===========================
function scrollUserTop() {
    document.getElementById('user-scroll-wrap')?.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===========================
// PAGE INIT (DOMContentLoaded)
// ===========================

document.addEventListener('DOMContentLoaded', () => {

    // 1. Khởi tạo sản phẩm mẫu
    initProducts();

    // 2. Login modal – form submit
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);

    // Đóng modal khi click backdrop
    document.getElementById('login-modal-overlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) hideLoginModal();
    });

    // Nút × đóng modal
    document.getElementById('login-modal-close')?.addEventListener('click', hideLoginModal);

    // Nút Đăng nhập trên navbar user
    document.getElementById('nav-login-btn')?.addEventListener('click', showLoginModal);

    // 3. Đăng xuất (User + Admin)
    document.getElementById('user-logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('admin-logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('sidebar-logout')?.addEventListener('click', handleLogout);

    // 4. Admin CRUD
    document.getElementById('btn-add')?.addEventListener('click', addProduct);
    document.getElementById('btn-update')?.addEventListener('click', updateProduct);
    document.getElementById('btn-cancel')?.addEventListener('click', cancelEdit);

    // 5. Search admin
    document.getElementById('search-products')?.addEventListener('input', (e) => {
        renderAdminProducts(e.target.value.trim());
    });

    // 6. Hero CTA scroll
    document.getElementById('hero-cta')?.addEventListener('click', () => {
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // 7. Nav products link
    document.getElementById('nav-products')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // 8. Stock checkbox toggle
    document.getElementById('prod-status')?.addEventListener('change', toggleStockQty);

    // 9. IMAGE UPLOAD (nhiều ảnh, tối đa 5)
    const imageFileInput = document.getElementById('prod-img-file');
    if (imageFileInput) {
        imageFileInput.addEventListener('change', function () {
            const files     = Array.from(this.files);
            if (!files.length) return;

            const MAX_IMGS  = 5;
            const remaining = MAX_IMGS - adminImages.length;
            const toRead    = files.slice(0, remaining);

            if (toRead.length < files.length) {
                showToast(`⚠️ Chỉ có thể thêm tối đa ${MAX_IMGS} ảnh.`, 'error');
            }

            let loaded = 0;
            toRead.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    adminImages.push(e.target.result);
                    loaded++;
                    if (loaded === toRead.length) {
                        const thumbEl  = document.querySelector('.admin-img-item.is-thumbnail');
                        const thumbIdx = parseInt(thumbEl?.dataset?.index ?? '0') || 0;
                        renderAdminImagePreview(Math.min(thumbIdx, adminImages.length - 1));
                    }
                };
                reader.readAsDataURL(file);
            });

            // Reset input để có thể chọn lại cùng file
            this.value = '';
        });
    }

    // 9.5. CART DRAWER EVENTS
    const cartBtn = document.querySelector('.nav-cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openCartDrawer();
        });
    }

    document.getElementById('cart-drawer-close')?.addEventListener('click', closeCartDrawer);
    document.getElementById('cart-drawer-overlay')?.addEventListener('click', closeCartDrawer);
    document.getElementById('btn-checkout')?.addEventListener('click', checkoutCart);

    // 10. Khởi tạo trang – admin đã đăng nhập vào admin, còn lại vào user page
    const user = getCurrentUser();
    if (user && user.role === 'admin') {
        showPage('admin');
    } else {
        showPage('user'); // guest hoặc user đã đăng nhập đều vào user page
    }
});