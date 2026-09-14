// Shop Platform - Complete Client Application Logic with Customer Profile & OTP Login

// Initialize persistent Device ID
if (!localStorage.getItem("shop_device_id")) {
  localStorage.setItem("shop_device_id", "DEV-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Date.now().toString(36).toUpperCase());
}

const state = {
  lang: localStorage.getItem("shop_lang") || "ml",
  deviceId: localStorage.getItem("shop_device_id"),
  categories: [],
  selectedCategory: "all",
  products: [],
  cart: JSON.parse(localStorage.getItem("shop_cart") || "[]"),
  settings: {},
  // Customer Auth
  customerToken: localStorage.getItem("customer_token") || null,
  customerUser: JSON.parse(localStorage.getItem("customer_user") || "null"),
  otpPhonePending: "",
  // Admin Auth
  adminToken: localStorage.getItem("admin_token") || null,
  adminUser: null,
  activeAdminTab: "products",
  selectedPaymentMethod: "UPI",
  lastCompletedOrder: null
};

// Bilingual Dictionaries
const i18n = {
  ml: {
    shopName: "വിപണി സൂപ്പർമാർക്കറ്റ്",
    shopTagline: "ഗുണമേന്മയുള്ള സാധനങ്ങൾ, വേഗത്തിൽ",
    trackOrders: "ഓർഡറുകൾ",
    cart: "കാർട്ട്",
    allCategories: "എല്ലാം (All)",
    inStockOnly: "സ്റ്റോക്കുള്ളവ മാത്രം",
    sortNewest: "പുതിയവ (Newest)",
    sortPriceAsc: "വില: കുറഞ്ഞത് ആദ്യം",
    sortPriceDesc: "വില: കൂടിയത് ആദ്യം",
    sortName: "പേര് അടിസ്ഥാനത്തിൽ (A-Z)",
    addToCart: "കാർട്ടിൽ ചേർക്കുക",
    buyNow: "ഇപ്പോൾ വാങ്ങുക",
    inStock: "സ്റ്റോക്കുണ്ട്",
    lowStock: "അവസാന സാധനങ്ങൾ",
    outOfStock: "സ്റ്റോക്കില്ല",
    yourCart: "ഷോപ്പിംഗ് കാർട്ട്",
    subtotal: "സബ്ടോട്ടൽ (Subtotal):",
    deliveryCharge: "ഡെലിവറി ചാർജ്:",
    freeDelivery: "സൗജന്യം",
    discount: "ഡിസ്കൗണ്ട്:",
    grandTotal: "ആകെ നൽകേണ്ട തുക:",
    proceedToCheckout: "ഓർഡർ നൽകി പണമടയ്ക്കുക",
    cartEmpty: "കാർട്ടിൽ സാധനങ്ങളൊന്നുമില്ല!",
    addedToCart: "കാർട്ടിലേക്ക് ചേർത്തു!",
    orderPlaced: "ഓർഡർ വിജയകരമായി നൽകി!",
    adminPortal: "അഡ്മിൻ",
    viewStore: "സ്റ്റോറിലേക്ക് മടങ്ങുക",
    addNewProduct: "പുതിയ ഉൽപ്പന്നം ചേർക്കുക",
    logout: "ലോഗൗട്ട്",
    totalRevenue: "ആകെ വിറ്റുവരവ്",
    totalOrders: "ആകെ ഓർഡറുകൾ",
    pendingOrders: "തീർപ്പാക്കാനുള്ളവ",
    activeProducts: "ഉൽപ്പന്നങ്ങൾ",
    lowStockAlerts: "കുറഞ്ഞ സ്റ്റോക്ക്",
    productsTab: "ഉൽപ്പന്നങ്ങൾ",
    ordersTab: "ഓർഡറുകൾ തത്സമയം",
    settingsTab: "സ്റ്റോർ ക്രമീകരണങ്ങൾ"
  },
  en: {
    shopName: "Vipani Supermarket",
    shopTagline: "Quality goods delivered to your doorstep",
    trackOrders: "Track Orders",
    cart: "Cart",
    allCategories: "All Categories",
    inStockOnly: "In-Stock Only",
    sortNewest: "Newest Arrivals",
    sortPriceAsc: "Price: Low to High",
    sortPriceDesc: "Price: High to Low",
    sortName: "Name (A to Z)",
    addToCart: "Add to Cart",
    buyNow: "Buy Now",
    inStock: "In Stock",
    lowStock: "Few Left",
    outOfStock: "Out of Stock",
    yourCart: "Shopping Cart",
    subtotal: "Subtotal:",
    deliveryCharge: "Delivery Fee:",
    freeDelivery: "FREE",
    discount: "Discount:",
    grandTotal: "Grand Total:",
    proceedToCheckout: "Proceed to Online Payment",
    cartEmpty: "Your cart is empty!",
    addedToCart: "Added to cart!",
    orderPlaced: "Order placed successfully!",
    adminPortal: "Admin",
    viewStore: "Back to Store",
    addNewProduct: "Add New Product",
    logout: "Logout",
    totalRevenue: "Total Revenue",
    totalOrders: "Total Orders",
    pendingOrders: "Pending Orders",
    activeProducts: "Active Products",
    lowStockAlerts: "Low Stock Alerts",
    productsTab: "Products",
    ordersTab: "Live Orders",
    settingsTab: "Store Settings"
  }
};

function t(key) {
  const dict = i18n[state.lang] || i18n.ml;
  return dict[key] || key;
}

// Toast Notifications
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>${type === "success" ? "✅" : type === "error" ? "⚠️" : "ℹ️"}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal Helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("active");
}

function getProductSvg(emoji, label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" width="100%" height="100%">
    <rect width="300" height="240" rx="16" fill="#0f766e"/>
    <circle cx="150" cy="105" r="55" fill="rgba(255,255,255,0.2)"/>
    <text x="150" y="122" font-size="62" text-anchor="middle" dominant-baseline="middle">${emoji || "📦"}</text>
    <rect x="30" y="180" width="240" height="34" rx="8" fill="rgba(0,0,0,0.2)"/>
    <text x="150" y="202" font-family="sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">${label || "Shop Item"}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// Load Settings
async function loadSettings() {
  try {
    const res = await fetch("/api/settings");
    state.settings = await res.json();
    if (state.settings.shop_name) {
      document.getElementById("header-shop-name").textContent = state.settings.shop_name;
      document.title = state.settings.shop_name;
    }
    if (state.settings.shop_tagline) {
      document.getElementById("header-shop-tagline").textContent = state.settings.shop_tagline;
    }
    if (state.settings.upi_id) {
      const shopUpi = document.getElementById("co-shop-upi");
      if (shopUpi) shopUpi.textContent = state.settings.upi_id;
    }
  } catch (err) {
    console.error("Failed to load settings:", err);
  }
}

// Load Categories
async function loadCategories() {
  try {
    const res = await fetch("/api/categories");
    state.categories = await res.json();
    renderCategories();
    populateCategoryDropdown();
  } catch (err) {
    console.error("Failed to load categories:", err);
  }
}

function renderCategories() {
  const container = document.getElementById("categories-container");
  container.innerHTML = `
    <button class="category-chip ${state.selectedCategory === "all" ? "active" : ""}" data-slug="all">
      <span class="category-icon">✨</span>
      <span>${state.lang === "ml" ? "എല്ലാം (All)" : "All Items"}</span>
    </button>
  `;

  state.categories.forEach(cat => {
    const chip = document.createElement("button");
    chip.className = `category-chip ${state.selectedCategory === cat.slug ? "active" : ""}`;
    chip.dataset.slug = cat.slug;
    chip.innerHTML = `
      <span class="category-icon">${cat.icon || "📦"}</span>
      <span>${state.lang === "ml" && cat.name_ml ? cat.name_ml : cat.name} (${cat.product_count})</span>
    `;
    chip.onclick = () => {
      state.selectedCategory = cat.slug;
      renderCategories();
      loadProducts();
    };
    container.appendChild(chip);
  });

  container.firstElementChild.onclick = () => {
    state.selectedCategory = "all";
    renderCategories();
    loadProducts();
  };
}

function populateCategoryDropdown() {
  const select = document.getElementById("pf-category");
  if (!select) return;
  select.innerHTML = `<option value="">-- കാറ്റഗറി തിരഞ്ഞെടുക്കുക --</option>` +
    state.categories.map(c => `<option value="${c.id}">${c.name_ml ? c.name_ml + " (" + c.name + ")" : c.name}</option>`).join("");
}

// Load Products
async function loadProducts() {
  try {
    const search = document.getElementById("search-input").value.trim();
    const sort = document.getElementById("sort-select").value;
    const inStock = document.getElementById("filter-stock-only").checked;

    let url = `/api/products?sort=${sort}`;
    if (state.selectedCategory && state.selectedCategory !== "all") {
      url += `&category=${state.selectedCategory}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (inStock) {
      url += `&in_stock=true`;
    }

    const res = await fetch(url);
    state.products = await res.json();
    renderProducts();
  } catch (err) {
    console.error("Failed to load products:", err);
  }
}

function renderProducts() {
  const grid = document.getElementById("product-grid");
  const countLabel = document.getElementById("products-count-label");

  countLabel.textContent = `${state.products.length} ${state.lang === "ml" ? "ഉൽപ്പന്നങ്ങൾ ലഭ്യമാണ്" : "products found"}`;

  if (state.products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">🔍</div>
        <h3>സാധനങ്ങളൊന്നും കണ്ടെത്താനായില്ല</h3>
        <p style="font-size: 0.9rem;">മറ്റൊരു വാക്ക് തിരഞ്ഞു നോക്കുക അല്ലെങ്കിൽ കാറ്റഗറി മാറ്റുക.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = "";
  state.products.forEach(p => {
    const cartItem = state.cart.find(c => c.productId === p.id);
    const inCartQty = cartItem ? cartItem.quantity : 0;
    const discountPercent = (p.mrp && p.mrp > p.price) ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

    let stockBadgeClass = "in-stock";
    let stockText = state.lang === "ml" ? "സ്റ്റോക്കുണ്ട്" : "In Stock";
    if (p.stock <= 0) {
      stockBadgeClass = "out-stock";
      stockText = state.lang === "ml" ? "സ്റ്റോക്കില്ല" : "Out of Stock";
    } else if (p.stock <= 5) {
      stockBadgeClass = "low-stock";
      stockText = state.lang === "ml" ? `${p.stock} ബാക്കി മാത്രം` : `Only ${p.stock} left`;
    }

    const displayName = state.lang === "ml" && p.name_ml ? p.name_ml : p.name;
    const displayCat = state.lang === "ml" && p.category_name_ml ? p.category_name_ml : (p.category_name || "General");

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="card-img-wrap" onclick="viewProductDetail(${p.id})">
        <img class="card-img" src="${p.image_url || getProductSvg("📦", p.name)}" alt="${displayName}" loading="lazy">
        ${discountPercent > 0 ? `<span class="discount-badge">${discountPercent}% OFF</span>` : ""}
        <span class="stock-badge-tag ${stockBadgeClass}">${stockText}</span>
      </div>
      <div class="card-body">
        <div class="card-category">${displayCat}</div>
        <h3 class="card-title" onclick="viewProductDetail(${p.id})">${displayName}</h3>
        <div class="card-desc">${p.description || ""}</div>
        <div class="card-footer">
          <div class="price-box">
            <span class="current-price">₹${p.price}</span>
            ${p.mrp && p.mrp > p.price ? `<span class="mrp-price">₹${p.mrp}</span>` : ""}
          </div>
          <div>
            ${p.stock <= 0 ? `
              <button class="btn btn-secondary btn-sm" disabled style="opacity: 0.6;">${t("outOfStock")}</button>
            ` : inCartQty > 0 ? `
              <div class="qty-control">
                <button class="qty-btn" onclick="updateCartQty(${p.id}, -1)">-</button>
                <span class="qty-number">${inCartQty}</span>
                <button class="qty-btn" onclick="updateCartQty(${p.id}, 1)">+</button>
              </div>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="addToCart(${p.id}, 1)">
                🛒 ${t("addToCart")}
              </button>
            `}
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Product Details Modal
function viewProductDetail(productId) {
  const p = state.products.find(item => item.id === productId);
  if (!p) return;

  const displayName = state.lang === "ml" && p.name_ml ? p.name_ml : p.name;
  const displayCat = state.lang === "ml" && p.category_name_ml ? p.category_name_ml : (p.category_name || "General");
  const discountPercent = (p.mrp && p.mrp > p.price) ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

  document.getElementById("pm-img").src = p.image_url || getProductSvg("📦", p.name);
  document.getElementById("pm-category").textContent = displayCat;
  document.getElementById("pm-name").textContent = displayName;
  document.getElementById("pm-price").textContent = `₹${p.price}`;
  document.getElementById("pm-mrp").textContent = p.mrp ? `₹${p.mrp}` : "";
  document.getElementById("pm-unit").textContent = p.unit ? `(${p.unit})` : "";
  document.getElementById("pm-desc").textContent = p.description || "വിവരണം ലഭ്യമല്ല.";

  const discountBadge = document.getElementById("pm-discount");
  if (discountPercent > 0) {
    discountBadge.style.display = "inline-block";
    discountBadge.textContent = `${discountPercent}% ലാഭിക്കാം!`;
  } else {
    discountBadge.style.display = "none";
  }

  const stockBadge = document.getElementById("pm-stock-badge");
  if (p.stock <= 0) {
    stockBadge.className = "stock-badge-tag out-stock";
    stockBadge.textContent = "Out of Stock";
  } else if (p.stock <= 5) {
    stockBadge.className = "stock-badge-tag low-stock";
    stockBadge.textContent = `Only ${p.stock} left`;
  } else {
    stockBadge.className = "stock-badge-tag in-stock";
    stockBadge.textContent = "In Stock";
  }

  const addBtn = document.getElementById("pm-add-cart-btn");
  if (p.stock <= 0) {
    addBtn.disabled = true;
    addBtn.textContent = "Out of Stock";
  } else {
    addBtn.disabled = false;
    addBtn.innerHTML = `🛒 ${t("addToCart")}`;
    addBtn.onclick = () => {
      addToCart(p.id, 1);
      closeModal("product-modal");
      openCartDrawer();
    };
  }

  openModal("product-modal");
}

// Cart Operations
function addToCart(productId, qty = 1) {
  const p = state.products.find(item => item.id === productId);
  if (!p || p.stock <= 0) return;

  const existing = state.cart.find(c => c.productId === productId);
  if (existing) {
    if (existing.quantity + qty > p.stock) {
      showToast(`സ്റ്റോക്ക് പരിമിതമാണ്! പരമാവധി: ${p.stock}`, "error");
      return;
    }
    existing.quantity += qty;
  } else {
    state.cart.push({
      productId: p.id,
      name: p.name,
      name_ml: p.name_ml,
      price: p.price,
      mrp: p.mrp,
      unit: p.unit,
      image_url: p.image_url,
      quantity: qty
    });
  }

  saveCart();
  renderProducts();
  renderCartDrawer();
  showToast(`${state.lang === "ml" && p.name_ml ? p.name_ml : p.name} കാർട്ടിൽ ചേർത്തു!`, "success");
}

function updateCartQty(productId, delta) {
  const itemIndex = state.cart.findIndex(c => c.productId === productId);
  if (itemIndex === -1) return;

  const p = state.products.find(prod => prod.id === productId);
  const current = state.cart[itemIndex];

  if (delta > 0) {
    if (p && current.quantity + delta > p.stock) {
      showToast(`സ്റ്റോക്ക് പരിമിതമാണ്! പരമാവധി: ${p.stock}`, "error");
      return;
    }
    current.quantity += delta;
  } else {
    current.quantity += delta;
    if (current.quantity <= 0) {
      state.cart.splice(itemIndex, 1);
    }
  }

  saveCart();
  renderProducts();
  renderCartDrawer();
}

function saveCart() {
  localStorage.setItem("shop_cart", JSON.stringify(state.cart));
  updateCartBadge();
}

function updateCartBadge() {
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cart-badge-count").textContent = totalItems;
  document.getElementById("cart-drawer-count").textContent = totalItems;
}

function renderCartDrawer() {
  const container = document.getElementById("cart-items-container");
  const subtotalEl = document.getElementById("cart-subtotal");
  const deliveryFeeEl = document.getElementById("cart-delivery-fee");
  const grandTotalEl = document.getElementById("cart-grand-total");
  const checkoutBtn = document.getElementById("checkout-btn");
  const hintEl = document.getElementById("cart-delivery-hint");

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">🛒</div>
        <h4>${t("cartEmpty")}</h4>
        <p style="font-size: 0.8rem; margin-top: 0.25rem;">ഷോപ്പിൽ നിന്ന് ആവശ്യമുള്ള സാധനങ്ങൾ തിരഞ്ഞെടുക്കുക.</p>
      </div>
    `;
    subtotalEl.textContent = "₹0";
    deliveryFeeEl.textContent = "₹0";
    grandTotalEl.textContent = "₹0";
    checkoutBtn.disabled = true;
    hintEl.style.display = "none";
    return;
  }

  checkoutBtn.disabled = false;
  container.innerHTML = "";

  let subtotal = 0;
  state.cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img src="${item.image_url || getProductSvg("📦", item.name)}" class="cart-item-img" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-title">${state.lang === "ml" && item.name_ml ? item.name_ml : item.name}</div>
        <div class="cart-item-price">₹${item.price} ${item.unit ? `(${item.unit})` : ""}</div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" onclick="updateCartQty(${item.productId}, -1)">-</button>
        <span class="qty-number">${item.quantity}</span>
        <button class="qty-btn" onclick="updateCartQty(${item.productId}, 1)">+</button>
      </div>
      <div style="font-weight: 800; font-size: 0.95rem; min-width: 55px; text-align: right;">
        ₹${itemTotal}
      </div>
    `;
    container.appendChild(div);
  });

  const freeThreshold = Number(state.settings.free_delivery_threshold || 500);
  const standardFee = Number(state.settings.standard_delivery_fee || 40);
  const deliveryFee = subtotal >= freeThreshold ? 0 : standardFee;
  const grandTotal = subtotal + deliveryFee;

  subtotalEl.textContent = `₹${subtotal}`;
  if (deliveryFee === 0) {
    deliveryFeeEl.innerHTML = `<span style="color: #16a34a;">${t("freeDelivery")}</span>`;
    hintEl.textContent = "🎉 നിങ്ങൾക്ക് ഈ ഓർഡറിന് സൗജന്യ ഡെലിവറി ലഭിക്കുന്നുണ്ട്!";
    hintEl.style.color = "#16a34a";
  } else {
    deliveryFeeEl.textContent = `₹${deliveryFee}`;
    const diff = freeThreshold - subtotal;
    hintEl.textContent = `💡 ഇനിയും ₹${diff} ന്റെ സാധനം കൂടി ചേർത്താൽ ഡെലിവറി തികച്ചും സൗജന്യമാണ്!`;
    hintEl.style.color = "var(--primary)";
  }
  hintEl.style.display = "block";
  grandTotalEl.textContent = `₹${grandTotal}`;
}

function openCartDrawer() {
  document.getElementById("cart-drawer").classList.add("active");
  renderCartDrawer();
}

function closeCartDrawer() {
  document.getElementById("cart-drawer").classList.remove("active");
}

// Customer Auth & OTP Logic
function updateCustomerUI() {
  const label = document.getElementById("customer-btn-label");
  if (state.customerUser && state.customerToken) {
    label.textContent = state.customerUser.name || state.customerUser.phone;
  } else {
    label.textContent = "ലോഗിൻ / ഒടിപി";
  }
}

async function verifyCustomerProfile() {
  if (!state.customerToken) return;
  try {
    const res = await fetch("/api/user/profile", {
      headers: { "Authorization": `Bearer ${state.customerToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      state.customerUser = data.user;
      localStorage.setItem("customer_user", JSON.stringify(data.user));
      updateCustomerUI();
    } else {
      // Token invalid or blocked
      state.customerToken = null;
      state.customerUser = null;
      localStorage.removeItem("customer_token");
      localStorage.removeItem("customer_user");
      updateCustomerUI();
    }
  } catch (err) {
    console.error("Customer profile load error:", err);
  }
}

document.getElementById("nav-customer-btn").addEventListener("click", () => {
  if (state.customerToken && state.customerUser) {
    openCustomerProfileModal();
  } else {
    openOtpLoginModal();
  }
});

function openOtpLoginModal() {
  document.getElementById("otp-step-phone").style.display = "block";
  document.getElementById("otp-step-code").style.display = "none";
  document.getElementById("otp-phone-input").value = "";
  document.getElementById("otp-code-input").value = "";
  openModal("otp-login-modal");
}

// Send OTP
document.getElementById("otp-send-btn").addEventListener("click", async () => {
  const phone = document.getElementById("otp-phone-input").value.trim();
  if (!phone || phone.length < 10) {
    showToast("ദയവായി സാധുവായ 10-അക്ക മൊബൈൽ നമ്പർ നൽകുക", "error");
    return;
  }

  const btn = document.getElementById("otp-send-btn");
  btn.disabled = true;
  btn.textContent = "അയക്കുന്നു...";

  try {
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, device_id: state.deviceId })
    });

    const data = await res.json();
    btn.disabled = false;
    btn.textContent = "📩 ഒടിപി അയക്കുക (Get OTP)";

    if (!res.ok) {
      showToast(data.error || "ഒടിപി അയക്കുന്നതിൽ പിഴവുണ്ടായി", "error");
      return;
    }

    state.otpPhonePending = data.phone;
    document.getElementById("otp-sent-phone-display").textContent = data.phone;

    // Handle existing vs new customer name field
    const nameGroup = document.getElementById("otp-name-group");
    const welcomeExisting = document.getElementById("otp-welcome-existing");
    const existingNameSpan = document.getElementById("otp-existing-user-name");
    const nameInput = document.getElementById("otp-name-input");

    if (data.has_name && data.user_name) {
      if (nameGroup) nameGroup.style.display = "none";
      if (welcomeExisting) welcomeExisting.style.display = "block";
      if (existingNameSpan) existingNameSpan.textContent = data.user_name;
      if (nameInput) nameInput.value = data.user_name;
    } else {
      if (nameGroup) nameGroup.style.display = "block";
      if (welcomeExisting) welcomeExisting.style.display = "none";
      if (nameInput) nameInput.value = "";
    }

    // Display simulated SMS box
    const smsBox = document.getElementById("simulated-sms-box");
    const smsText = document.getElementById("simulated-sms-text");
    smsText.textContent = `നിങ്ങളുടെ വിപണി OTP: ${data.otp}`;
    smsBox.onclick = () => {
      document.getElementById("otp-code-input").value = data.otp;
      showToast("OTP ഓട്ടോ-ഫിൽ ചെയ്തു!", "info");
    };

    document.getElementById("otp-step-phone").style.display = "none";
    document.getElementById("otp-step-code").style.display = "block";
    showToast(`OTP ${data.phone} എന്ന നമ്പറിലേക്ക് അയച്ചു!`, "success");

  } catch (err) {
    btn.disabled = false;
    btn.textContent = "📩 ഒടിപി അയക്കുക (Get OTP)";
    console.error("OTP send error:", err);
    showToast("സെർവറുമായി ബന്ധപ്പെടാൻ സാധിച്ചില്ല", "error");
  }
});

document.getElementById("otp-back-btn").addEventListener("click", () => {
  document.getElementById("otp-step-phone").style.display = "block";
  document.getElementById("otp-step-code").style.display = "none";
});

// Verify OTP
document.getElementById("otp-verify-btn").addEventListener("click", async () => {
  const otp = document.getElementById("otp-code-input").value.trim();
  const name = document.getElementById("otp-name-input").value.trim();

  if (!otp || otp.length < 4) {
    showToast("4-അക്ക ഒടിപി കോഡ് നൽകുക", "error");
    return;
  }

  const btn = document.getElementById("otp-verify-btn");
  btn.disabled = true;
  btn.textContent = "പരിശോധിക്കുന്നു...";

  try {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: state.otpPhonePending,
        otp,
        device_id: state.deviceId,
        name: name || undefined
      })
    });

    const data = await res.json();
    btn.disabled = false;
    btn.textContent = "✅ പരിശോധിച്ച് ലോഗിൻ ചെയ്യുക";

    if (!res.ok) {
      showToast(data.error || "ഒടിപി പരിശോധന പരാജയപ്പെട്ടു", "error");
      return;
    }

    state.customerToken = data.token;
    state.customerUser = data.user;
    localStorage.setItem("customer_token", data.token);
    localStorage.setItem("customer_user", JSON.stringify(data.user));

    updateCustomerUI();
    closeModal("otp-login-modal");
    showToast(`സ്വാഗതം, ${data.user.name || data.user.phone}!`, "success");

  } catch (err) {
    btn.disabled = false;
    btn.textContent = "✅ പരിശോധിച്ച് ലോഗിൻ ചെയ്യുക";
    console.error("OTP verify error:", err);
    showToast("സെർവറുമായി ബന്ധപ്പെടാൻ സാധിച്ചില്ല", "error");
  }
});

// Customer Profile Modal & Order History
function openCustomerProfileModal() {
  if (!state.customerUser) return;
  document.getElementById("cp-name").value = state.customerUser.name || "";
  document.getElementById("cp-phone").value = state.customerUser.phone || "";
  document.getElementById("cp-device-id").value = state.deviceId || "";
  document.getElementById("cp-address").value = state.customerUser.address || "";
  document.getElementById("cp-city").value = state.customerUser.city || "Kochi";
  document.getElementById("cp-pincode").value = state.customerUser.pincode || "";

  switchCustomerTab("profile");
  openModal("customer-profile-modal");
}

function switchCustomerTab(tab) {
  const profileTabBtn = document.getElementById("cp-tab-profile-btn");
  const ordersTabBtn = document.getElementById("cp-tab-orders-btn");
  const profileView = document.getElementById("cp-tab-profile");
  const ordersView = document.getElementById("cp-tab-orders");

  if (tab === "profile") {
    profileTabBtn.classList.add("active");
    ordersTabBtn.classList.remove("active");
    profileView.style.display = "block";
    ordersView.style.display = "none";
  } else {
    profileTabBtn.classList.remove("active");
    ordersTabBtn.classList.add("active");
    profileView.style.display = "none";
    ordersView.style.display = "block";
    loadCustomerPurchaseHistory();
  }
}

// Save Customer Profile
document.getElementById("customer-profile-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("cp-name").value.trim();
  const address = document.getElementById("cp-address").value.trim();
  const city = document.getElementById("cp-city").value.trim();
  const pincode = document.getElementById("cp-pincode").value.trim();

  try {
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.customerToken}`
      },
      body: JSON.stringify({ name, address, city, pincode, device_id: state.deviceId })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "പ്രൊഫൈൽ സേവ് ചെയ്യാൻ സാധിച്ചില്ല", "error");
      return;
    }

    state.customerUser = data.user;
    localStorage.setItem("customer_user", JSON.stringify(data.user));
    updateCustomerUI();
    showToast("പ്രൊഫൈൽ വിവരങ്ങൾ പുതുക്കി!", "success");

  } catch (err) {
    console.error("Profile update error:", err);
  }
});

// Customer Logout
document.getElementById("customer-logout-btn").addEventListener("click", () => {
  state.customerToken = null;
  state.customerUser = null;
  localStorage.removeItem("customer_token");
  localStorage.removeItem("customer_user");
  updateCustomerUI();
  closeModal("customer-profile-modal");
  showToast("ലോഗൗട്ട് ചെയ്തു", "info");
});

// Load Customer Purchase History (Master List)
async function loadCustomerPurchaseHistory() {
  const container = document.getElementById("cp-orders-list-container");
  const countLabel = document.getElementById("cp-orders-count-label");
  const listView = document.getElementById("cp-orders-list-view");
  const detailView = document.getElementById("cp-order-detail-view");

  if (listView) listView.style.display = "block";
  if (detailView) detailView.style.display = "none";

  container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem;">നിങ്ങളുടെ ഓർഡറുകൾ തിരയുന്നു...</p>`;

  try {
    const res = await fetch("/api/user/orders", {
      headers: { "Authorization": `Bearer ${state.customerToken}` }
    });
    const orders = await res.json();
    state.customerOrders = Array.isArray(orders) ? orders : [];

    if (!res.ok || state.customerOrders.length === 0) {
      if (countLabel) countLabel.textContent = "ഓർഡറുകളൊന്നും കണ്ടെത്തിയില്ല (0 Orders)";
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🛍️</div>
          <h4>ഇതുവരെ ഓർഡറുകളൊന്നും നൽകിയിട്ടില്ല</h4>
          <p style="font-size: 0.85rem; margin-top: 0.25rem;">ഷോപ്പിൽ നിന്ന് നിങ്ങൾക്ക് ഇഷ്ടപ്പെട്ട സാധനങ്ങൾ ഓർഡർ ചെയ്യുക.</p>
        </div>
      `;
      return;
    }

    if (countLabel) {
      countLabel.textContent = `ആകെ ${state.customerOrders.length} ഓർഡറുകൾ (Total ${state.customerOrders.length} Orders)`;
    }

    container.innerHTML = state.customerOrders.map(ord => {
      const itemsCount = (ord.items || []).reduce((sum, i) => sum + i.quantity, 0);
      const itemsPreview = (ord.items || []).map(i => i.product_name).slice(0, 2).join(", ") +
        ((ord.items || []).length > 2 ? ` (+${(ord.items || []).length - 2} items)` : "");

      const dateStr = new Date(ord.created_at).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      return `
        <div class="order-list-item" onclick="viewCustomerOrderDetail('${ord.id}')" title="വിശദാംശങ്ങൾ കാണാൻ ക്ലിക്ക് ചെയ്യുക">
          <div class="order-list-left">
            <div class="order-list-id">
              <span>📦 ${ord.id}</span>
              <span class="status-badge status-${ord.status.toLowerCase()}">${ord.status}</span>
            </div>
            <div class="order-list-date">
              📅 ${dateStr}
            </div>
            <div class="order-list-items-preview">
              🛒 <b>${itemsCount} സാധനങ്ങൾ:</b> ${itemsPreview}
            </div>
          </div>
          <div class="order-list-right">
            <div class="order-list-total">₹${ord.total_amount}</div>
            <div style="font-size: 0.75rem; color: #16a34a; font-weight: 700;">
              ${ord.payment_method} (${ord.payment_status})
            </div>
            <button class="btn btn-secondary btn-sm" style="margin-top: 0.35rem; padding: 0.25rem 0.65rem;" onclick="event.stopPropagation(); viewCustomerOrderDetail('${ord.id}')">
              വിശദാംശങ്ങൾ ➔
            </button>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error("Order history error:", err);
    container.innerHTML = `<p style="color: #dc2626; text-align: center; padding: 2rem;">ഓർഡറുകൾ ലോഡ് ചെയ്യുന്നതിൽ പിശകുണ്ടായി.</p>`;
  }
}

function showCustomerOrdersList() {
  const listView = document.getElementById("cp-orders-list-view");
  const detailView = document.getElementById("cp-order-detail-view");
  if (listView) listView.style.display = "block";
  if (detailView) detailView.style.display = "none";
}

function viewCustomerOrderDetail(orderId) {
  const ord = (state.customerOrders || []).find(o => o.id === orderId);
  if (!ord) return;

  const listView = document.getElementById("cp-orders-list-view");
  const detailView = document.getElementById("cp-order-detail-view");

  if (listView) listView.style.display = "none";
  if (detailView) detailView.style.display = "block";

  const statuses = ["Pending", "Processing", "Shipped", "Delivered"];
  const currentIdx = statuses.indexOf(ord.status);

  const dateStr = new Date(ord.created_at).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  detailView.innerHTML = `
    <div style="margin-bottom: 1.25rem;">
      <button class="btn btn-secondary btn-sm" onclick="showCustomerOrdersList()" style="display: inline-flex; align-items: center; gap: 0.4rem;">
        ← എല്ലാ ഓർഡറുകളിലേക്കും മടങ്ങുക (Back to All Orders)
      </button>
    </div>

    <!-- Order Header -->
    <div style="background: #f8fafc; border: 1.5px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
        <div>
          <span style="font-weight: 800; font-size: 1.25rem; color: var(--primary);">${ord.id}</span>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">തീയതി: ${dateStr}</div>
        </div>
        <span class="status-badge status-${ord.status.toLowerCase()}" style="font-size: 0.9rem; padding: 0.35rem 0.85rem;">
          ${ord.status}
        </span>
      </div>

      <!-- Stepper Tracking -->
      <div style="display: flex; justify-content: space-between; position: relative; margin: 1.5rem 0 1rem; font-size: 0.75rem; font-weight: 600;">
        <div style="position: absolute; top: 10px; left: 8%; right: 8%; height: 4px; background: #e2e8f0; z-index: 1;">
          <div style="height: 100%; width: ${currentIdx <= 0 ? "10%" : currentIdx === 1 ? "40%" : currentIdx === 2 ? "75%" : "100%"}; background: var(--primary); transition: width 0.4s ease;"></div>
        </div>
        <div style="z-index: 2; text-align: center;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: ${currentIdx >= 0 ? "var(--primary)" : "#cbd5e1"}; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.25rem;">1</div>
          <div>ഓർഡർ ലഭിച്ചു</div>
        </div>
        <div style="z-index: 2; text-align: center;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: ${currentIdx >= 1 ? "var(--primary)" : "#cbd5e1"}; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.25rem;">2</div>
          <div>പാക്കിങ് നടക്കുന്നു</div>
        </div>
        <div style="z-index: 2; text-align: center;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: ${currentIdx >= 2 ? "var(--primary)" : "#cbd5e1"}; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.25rem;">3</div>
          <div>ഡെലിവറിക്ക് അയച്ചു</div>
        </div>
        <div style="z-index: 2; text-align: center;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: ${currentIdx >= 3 ? "var(--primary)" : "#cbd5e1"}; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.25rem;">4</div>
          <div>ഡെലിവറി പൂർത്തിയായി</div>
        </div>
      </div>
    </div>

    <!-- Two-column info -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
      <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem;">
        <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">📍 ഡെലിവറി വിലാസം</h4>
        <div style="font-size: 0.875rem;"><b>${ord.customer_name}</b></div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">ഫോൺ: ${ord.customer_phone}</div>
        <div style="font-size: 0.85rem; margin-top: 0.35rem; color: #334155;">
          ${ord.shipping_address}, ${ord.city} - ${ord.pincode}
        </div>
      </div>

      <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem;">
        <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">💳 പേയ്‌മെന്റ് വിവരങ്ങൾ</h4>
        <div style="font-size: 0.85rem;">രീതി: <b>${ord.payment_method}</b></div>
        <div style="font-size: 0.85rem; margin-top: 0.2rem;">സ്റ്റാറ്റസ്: <b style="color: #15803d;">${ord.payment_status}</b></div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem; font-family: monospace;">Ref: ${ord.payment_ref}</div>
      </div>
    </div>

    <!-- Items table -->
    <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin-bottom: 1.25rem;">
      <div style="padding: 0.75rem 1rem; background: #f8fafc; font-weight: 700; font-size: 0.9rem; border-bottom: 1px solid var(--border);">
        🛍️ വാങ്ങിയ സാധനങ്ങൾ (${(ord.items || []).length} ഇനങ്ങൾ)
      </div>
      <table class="table" style="margin: 0;">
        <thead>
          <tr>
            <th>ഇനം</th>
            <th style="text-align: center;">അളവ്</th>
            <th style="text-align: right;">വില</th>
            <th style="text-align: right;">ആകെ തുക</th>
          </tr>
        </thead>
        <tbody>
          ${(ord.items || []).map(i => `
            <tr>
              <td><b>${i.product_name}</b></td>
              <td style="text-align: center;">${i.quantity}</td>
              <td style="text-align: right;">₹${i.unit_price}</td>
              <td style="text-align: right; font-weight: 700;">₹${i.total_price}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <!-- Price Summary Box -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem 1.25rem;">
      <button class="btn btn-primary" onclick="showInvoice('${ord.id}')">
        🧾 ബിൽ കാണുക / പ്രിന്റ് ചെയ്യുക (Print Invoice)
      </button>

      <div style="width: 240px; font-size: 0.875rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span style="color: var(--text-muted);">സബ്ടോട്ടൽ:</span>
          <b>₹${ord.subtotal}</b>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span style="color: var(--text-muted);">ഡെലിവറി ചാർജ്:</span>
          <b>${ord.delivery_fee === 0 ? "<span style='color:#16a34a;'>FREE</span>" : "₹" + ord.delivery_fee}</b>
        </div>
        ${ord.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; color: #16a34a;">
            <span>ഡിസ്കൗണ്ട്:</span>
            <b>-₹${ord.discount}</b>
          </div>
        ` : ""}
        <div style="display: flex; justify-content: space-between; padding-top: 0.4rem; border-top: 1.5px solid #0f172a; font-weight: 800; font-size: 1.15rem; color: var(--primary);">
          <span>ആകെ തുക:</span>
          <span>₹${ord.total_amount}</span>
        </div>
      </div>
    </div>
  `;
}

// Checkout Pre-Fill & Open
function openCheckoutModal() {
  if (state.cart.length === 0) {
    showToast(t("cartEmpty"), "error");
    return;
  }
  closeCartDrawer();

  let subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const freeThreshold = Number(state.settings.free_delivery_threshold || 500);
  const standardFee = Number(state.settings.standard_delivery_fee || 40);
  const deliveryFee = subtotal >= freeThreshold ? 0 : standardFee;
  const grandTotal = subtotal + deliveryFee;

  document.getElementById("co-total-amount").textContent = `₹${grandTotal}`;
  document.getElementById("co-submit-label").textContent = `₹${grandTotal} പണമടച്ച് ഓർഡർ കൺഫേം ചെയ്യുക`;

  // Pre-fill user details if logged in
  const loggedBanner = document.getElementById("checkout-logged-banner");
  if (state.customerUser) {
    loggedBanner.style.display = "block";
    if (state.customerUser.name) document.getElementById("co-name").value = state.customerUser.name;
    if (state.customerUser.phone) document.getElementById("co-phone").value = state.customerUser.phone;
    if (state.customerUser.address) document.getElementById("co-address").value = state.customerUser.address;
    if (state.customerUser.city) document.getElementById("co-city").value = state.customerUser.city;
    if (state.customerUser.pincode) document.getElementById("co-pincode").value = state.customerUser.pincode;
  } else {
    loggedBanner.style.display = "none";
  }

  openModal("checkout-modal");
}

// Payment Selection
document.querySelectorAll(".payment-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".payment-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    state.selectedPaymentMethod = card.dataset.method;

    document.getElementById("payment-panel-upi").style.display = state.selectedPaymentMethod === "UPI" ? "block" : "none";
    document.getElementById("payment-panel-card").style.display = state.selectedPaymentMethod === "CARD" ? "block" : "none";
    document.getElementById("payment-panel-netbanking").style.display = state.selectedPaymentMethod === "NETBANKING" ? "block" : "none";
    document.getElementById("payment-panel-cod").style.display = state.selectedPaymentMethod === "COD" ? "block" : "none";

    const submitLabel = document.getElementById("co-submit-label");
    const totalText = document.getElementById("co-total-amount").textContent;
    if (state.selectedPaymentMethod === "COD") {
      submitLabel.textContent = "ഓർഡർ കൺഫേം ചെയ്യുക (Cash on Delivery)";
    } else {
      submitLabel.textContent = `${totalText} പണമടച്ച് ഓർഡർ കൺഫേം ചെയ്യുക`;
    }
  });
});

// Checkout Form Submission
document.getElementById("checkout-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const customerName = document.getElementById("co-name").value.trim();
  const customerPhone = document.getElementById("co-phone").value.trim();
  const address = document.getElementById("co-address").value.trim();
  const city = document.getElementById("co-city").value.trim();
  const pincode = document.getElementById("co-pincode").value.trim();

  if (!customerName || !customerPhone || !address) {
    showToast("ദയവായി നിങ്ങളുടെ പേരും ഫോൺ നമ്പറും വിലാസവും നൽകുക", "error");
    return;
  }

  closeModal("checkout-modal");
  document.getElementById("payment-processing-step").style.display = "block";
  document.getElementById("payment-success-step").style.display = "none";
  openModal("payment-result-modal");

  const orderPayload = {
    customer_name: customerName,
    customer_phone: customerPhone,
    shipping_address: address,
    city: city,
    pincode: pincode,
    payment_method: state.selectedPaymentMethod,
    items: state.cart.map(c => ({
      product_id: c.productId,
      product_name: c.name,
      quantity: c.quantity
    }))
  };

  const headers = { "Content-Type": "application/json" };
  if (state.customerToken) {
    headers["Authorization"] = `Bearer ${state.customerToken}`;
  }

  try {
    await new Promise(r => setTimeout(r, 1400));

    const res = await fetch("/api/orders", {
      method: "POST",
      headers,
      body: JSON.stringify(orderPayload)
    });

    const data = await res.json();
    if (!res.ok) {
      closeModal("payment-result-modal");
      showToast(data.error || "ഓർഡർ സമർപ്പിക്കുന്നതിൽ പിഴവുണ്ടായി", "error");
      return;
    }

    state.lastCompletedOrder = data.order;

    document.getElementById("payment-processing-step").style.display = "none";
    document.getElementById("payment-success-step").style.display = "block";

    document.getElementById("res-order-id").textContent = data.order.id;
    document.getElementById("res-txn-id").textContent = data.order.payment_ref;
    document.getElementById("res-amount").textContent = `₹${data.order.total_amount} (${data.order.payment_method})`;

    state.cart = [];
    saveCart();
    loadProducts();
    localStorage.setItem("last_used_phone", customerPhone);

    // If customer is logged in, refresh their profile address
    if (state.customerToken) {
      verifyCustomerProfile();
    }

    showToast("ഓർഡർ വിജയകരമായി ലഭിച്ചു!", "success");

  } catch (err) {
    console.error("Order error:", err);
    closeModal("payment-result-modal");
    showToast("സെർവറുമായി ബന്ധപ്പെടാൻ സാധിച്ചില്ല.", "error");
  }
});

// View Digital Bill / Invoice
document.getElementById("res-view-invoice-btn").addEventListener("click", () => {
  closeModal("payment-result-modal");
  if (state.lastCompletedOrder) {
    showInvoice(state.lastCompletedOrder.id);
  }
});

document.getElementById("res-track-order-btn").addEventListener("click", () => {
  closeModal("payment-result-modal");
  openModal("track-modal");
  if (state.lastCompletedOrder) {
    document.getElementById("track-search-input").value = state.lastCompletedOrder.customer_phone || state.lastCompletedOrder.id;
    searchOrders();
  }
});

async function showInvoice(orderId) {
  try {
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();
    if (!res.ok) {
      showToast("ഇൻവോയ്സ് കാണാൻ സാധിച്ചില്ല", "error");
      return;
    }

    const { order, items, settings } = data;
    const dateFormatted = new Date(order.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const invoiceArea = document.getElementById("invoice-printable-area");
    invoiceArea.innerHTML = `
      <div class="invoice-box">
        <div class="invoice-header">
          <div>
            <h2 style="color: var(--primary); font-size: 1.4rem; font-weight: 800;">${settings.shop_name || "വിപണി സൂപ്പർമാർക്കറ്റ്"}</h2>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">${settings.shop_address || "Kerala, India"}</div>
            <div style="font-size: 0.8rem; color: #64748b;">Phone: ${settings.shop_phone || "+91 98470 12345"}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.1rem; font-weight: 800; color: #0f172a;">റീറ്റെയ്ൽ ഇൻവോയ്സ്</div>
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary); margin-top: 0.2rem;">${order.id}</div>
            <div style="font-size: 0.75rem; color: #64748b;">Date: ${dateFormatted}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; font-size: 0.85rem; background: #f8fafc; padding: 0.75rem; border-radius: 8px;">
          <div>
            <div style="font-weight: 700; color: var(--primary); margin-bottom: 0.2rem;">ഉപഭോക്താവിന്റെ വിവരങ്ങൾ:</div>
            <div><b>${order.customer_name}</b></div>
            <div>Phone: ${order.customer_phone}</div>
            <div>Address: ${order.shipping_address}, ${order.city} - ${order.pincode}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; color: var(--primary); margin-bottom: 0.2rem;">പേയ്‌മെന്റ് വിവരങ്ങൾ:</div>
            <div>രീതി: <b>${order.payment_method}</b></div>
            <div>സ്റ്റാറ്റസ്: <b style="color: #15803d;">${order.payment_status}</b></div>
            <div style="font-size: 0.75rem; color: #64748b;">Txn Ref: ${order.payment_ref}</div>
          </div>
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>ഇനം (Product)</th>
              <th style="text-align: center;">അളവ് (Qty)</th>
              <th style="text-align: right;">നിരക്ക് (Price)</th>
              <th style="text-align: right;">തുക (Total)</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><b>${item.product_name}</b></td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">₹${item.unit_price}</td>
                <td style="text-align: right; font-weight: 700;">₹${item.total_price}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
          <div style="width: 250px; font-size: 0.9rem;">
            <div style="display: flex; justify-content: space-between; padding: 0.25rem 0;">
              <span style="color: #64748b;">സബ്ടോട്ടൽ:</span>
              <b>₹${order.subtotal}</b>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.25rem 0;">
              <span style="color: #64748b;">ഡെലിവറി ചാർജ്:</span>
              <b>${order.delivery_fee === 0 ? "FREE" : "₹" + order.delivery_fee}</b>
            </div>
            ${order.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; color: #16a34a;">
                <span>ഡിസ്കൗണ്ട്:</span>
                <b>-₹${order.discount}</b>
              </div>
            ` : ""}
            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-top: 2px solid #0f172a; font-size: 1.15rem; font-weight: 800; color: var(--primary);">
              <span>ആകെ തുക:</span>
              <span>₹${order.total_amount}</span>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1; font-size: 0.8rem; color: #64748b;">
          ❤️ ഞങ്ങളുടെ ഷോപ്പിൽ നിന്ന് സാധനങ്ങൾ വാങ്ങിയതിന് നന്ദി! വീണ്ടും സന്ദർശിക്കുക.
        </div>
      </div>
    `;

    openModal("invoice-modal");
  } catch (err) {
    console.error("Invoice fetch error:", err);
  }
}

// Order Tracking & Navigation
document.getElementById("nav-track-btn").addEventListener("click", () => {
  if (state.customerToken && state.customerUser) {
    // If logged in, directly show the Master-Detail orders view in profile modal
    openCustomerProfileModal();
    switchCustomerTab("orders");
  } else {
    // If not logged in, open track modal and auto-search if phone was previously used
    openModal("track-modal");
    const savedPhone = localStorage.getItem("last_used_phone") || "";
    if (savedPhone) {
      document.getElementById("track-search-input").value = savedPhone;
      searchOrders();
    }
  }
});

document.getElementById("track-search-btn").addEventListener("click", searchOrders);
document.getElementById("track-search-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchOrders();
});

async function searchOrders() {
  const query = document.getElementById("track-search-input").value.trim();
  const container = document.getElementById("track-results-container");
  const listView = document.getElementById("track-modal-list-view");
  const detailView = document.getElementById("track-modal-detail-view");

  if (listView) listView.style.display = "block";
  if (detailView) detailView.style.display = "none";

  if (!query) {
    container.innerHTML = `<p style="color: #dc2626; text-align: center; padding: 1.5rem;">ദയവായി ഒരു മൊബൈൽ നമ്പറോ ഓർഡർ ഐഡിയോ നൽകുക.</p>`;
    return;
  }

  container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem;">ഓർഡറുകൾ തിരയുന്നു...</p>`;

  try {
    let url = `/api/orders?`;
    if (query.startsWith("ORD-")) {
      url += `order_id=${encodeURIComponent(query)}`;
    } else {
      url += `phone=${encodeURIComponent(query)}`;
    }

    const res = await fetch(url);
    const orders = await res.json();
    state.searchedOrders = Array.isArray(orders) ? orders : [];

    if (!res.ok || state.searchedOrders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <h4>ഓർഡറുകളൊന്നും കണ്ടെത്താനായില്ല</h4>
          <p style="font-size: 0.85rem; margin-top: 0.25rem;">നൽകിയ ഫോൺ നമ്പറോ ഓർഡർ നമ്പറോ (${query}) ശരിയാണോ എന്ന് പരിശോധിക്കുക.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.75rem; padding-bottom: 0.4rem; border-bottom: 1px solid var(--border);">
        കണ്ടെത്തിയ ഓർഡറുകൾ: ${state.searchedOrders.length} എണ്ണം (Found ${state.searchedOrders.length} Orders)
      </div>
      ` + state.searchedOrders.map(ord => {
        const itemsCount = (ord.items || []).reduce((sum, i) => sum + i.quantity, 0);
        const itemsPreview = (ord.items || []).map(i => i.product_name).slice(0, 2).join(", ") +
          ((ord.items || []).length > 2 ? ` (+${(ord.items || []).length - 2} items)` : "");

        const dateStr = new Date(ord.created_at).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });

        return `
          <div class="order-list-item" onclick="viewTrackOrderDetail('${ord.id}')" title="വിശദാംശങ്ങൾ കാണാൻ ക്ലിക്ക് ചെയ്യുക">
            <div class="order-list-left">
              <div class="order-list-id">
                <span>📦 ${ord.id}</span>
                <span class="status-badge status-${ord.status.toLowerCase()}">${ord.status}</span>
              </div>
              <div class="order-list-date">
                📅 ${dateStr}
              </div>
              <div class="order-list-items-preview">
                🛒 <b>${itemsCount || (ord.items || []).length || 1} സാധനങ്ങൾ:</b> ${itemsPreview || "ഓർഡർ ഇനങ്ങൾ"}
              </div>
            </div>
            <div class="order-list-right">
              <div class="order-list-total">₹${ord.total_amount}</div>
              <div style="font-size: 0.75rem; color: #16a34a; font-weight: 700;">
                ${ord.payment_method} (${ord.payment_status})
              </div>
              <button class="btn btn-secondary btn-sm" style="margin-top: 0.35rem; padding: 0.25rem 0.65rem;" onclick="event.stopPropagation(); viewTrackOrderDetail('${ord.id}')">
                വിശദാംശങ്ങൾ ➔
              </button>
            </div>
          </div>
        `;
      }).join("");

  } catch (err) {
    console.error("Order tracking error:", err);
    container.innerHTML = `<p style="color: #dc2626; text-align: center; padding: 2rem;">തിരയുന്നതിൽ പിശകുണ്ടായി.</p>`;
  }
}

function showTrackOrdersList() {
  const listView = document.getElementById("track-modal-list-view");
  const detailView = document.getElementById("track-modal-detail-view");
  if (listView) listView.style.display = "block";
  if (detailView) detailView.style.display = "none";
}

function viewTrackOrderDetail(orderId) {
  const ord = (state.searchedOrders || []).find(o => o.id === orderId);
  if (!ord) return;

  const listView = document.getElementById("track-modal-list-view");
  const detailView = document.getElementById("track-modal-detail-view");

  if (listView) listView.style.display = "none";
  if (detailView) detailView.style.display = "block";

  const statuses = ["Pending", "Processing", "Shipped", "Delivered"];
  const currentIdx = statuses.indexOf(ord.status);

  const dateStr = new Date(ord.created_at).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  detailView.innerHTML = `
    <div style="margin-bottom: 1.25rem;">
      <button class="btn btn-secondary btn-sm" onclick="showTrackOrdersList()" style="display: inline-flex; align-items: center; gap: 0.4rem;">
        ← എല്ലാ ഓർഡറുകളിലേക്കും മടങ്ങുക (Back to Orders List)
      </button>
    </div>

    <!-- Order Header -->
    <div style="background: #f8fafc; border: 1.5px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
        <div>
          <span style="font-weight: 800; font-size: 1.25rem; color: var(--primary);">${ord.id}</span>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">തീയതി: ${dateStr}</div>
        </div>
        <span class="status-badge status-${ord.status.toLowerCase()}" style="font-size: 0.9rem; padding: 0.35rem 0.85rem;">
          ${ord.status}
        </span>
      </div>

      <!-- Stepper Tracking -->
      <div style="display: flex; justify-content: space-between; position: relative; margin: 1.5rem 0 1rem; font-size: 0.75rem; font-weight: 600;">
        <div style="position: absolute; top: 10px; left: 8%; right: 8%; height: 4px; background: #e2e8f0; z-index: 1;">
          <div style="height: 100%; width: ${currentIdx <= 0 ? "10%" : currentIdx === 1 ? "40%" : currentIdx === 2 ? "75%" : "100%"}; background: var(--primary); transition: width 0.4s ease;"></div>
        </div>
        <div style="z-index: 2; text-align: center;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: ${currentIdx >= 0 ? "var(--primary)" : "#cbd5e1"}; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.25rem;">1</div>
          <div>ഓർഡർ ലഭിച്ചു</div>
        </div>
        <div style="z-index: 2; text-align: center;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: ${currentIdx >= 1 ? "var(--primary)" : "#cbd5e1"}; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.25rem;">2</div>
          <div>പാക്കിങ് നടക്കുന്നു</div>
        </div>
        <div style="z-index: 2; text-align: center;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: ${currentIdx >= 2 ? "var(--primary)" : "#cbd5e1"}; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.25rem;">3</div>
          <div>ഡെലിവറിക്ക് അയച്ചു</div>
        </div>
        <div style="z-index: 2; text-align: center;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: ${currentIdx >= 3 ? "var(--primary)" : "#cbd5e1"}; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.25rem;">4</div>
          <div>ഡെലിവറി പൂർത്തിയായി</div>
        </div>
      </div>
    </div>

    <!-- Two-column info -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
      <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem;">
        <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">📍 ഡെലിവറി വിലാസം</h4>
        <div style="font-size: 0.875rem;"><b>${ord.customer_name}</b></div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">ഫോൺ: ${ord.customer_phone}</div>
        <div style="font-size: 0.85rem; margin-top: 0.35rem; color: #334155;">
          ${ord.shipping_address}, ${ord.city} - ${ord.pincode}
        </div>
      </div>

      <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem;">
        <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">💳 പേയ്‌മെന്റ് വിവരങ്ങൾ</h4>
        <div style="font-size: 0.85rem;">രീതി: <b>${ord.payment_method}</b></div>
        <div style="font-size: 0.85rem; margin-top: 0.2rem;">സ്റ്റാറ്റസ്: <b style="color: #15803d;">${ord.payment_status}</b></div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem; font-family: monospace;">Ref: ${ord.payment_ref}</div>
      </div>
    </div>

    <!-- Items table -->
    <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin-bottom: 1.25rem;">
      <div style="padding: 0.75rem 1rem; background: #f8fafc; font-weight: 700; font-size: 0.9rem; border-bottom: 1px solid var(--border);">
        🛍️ വാങ്ങിയ സാധനങ്ങൾ (${(ord.items || []).length} ഇനങ്ങൾ)
      </div>
      <table class="table" style="margin: 0;">
        <thead>
          <tr>
            <th>ഇനം</th>
            <th style="text-align: center;">അളവ്</th>
            <th style="text-align: right;">വില</th>
            <th style="text-align: right;">ആകെ തുക</th>
          </tr>
        </thead>
        <tbody>
          ${(ord.items || []).map(i => `
            <tr>
              <td><b>${i.product_name}</b></td>
              <td style="text-align: center;">${i.quantity}</td>
              <td style="text-align: right;">₹${i.unit_price}</td>
              <td style="text-align: right; font-weight: 700;">₹${i.total_price}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <!-- Price Summary Box -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem 1.25rem;">
      <button class="btn btn-primary" onclick="showInvoice('${ord.id}')">
        🧾 ബിൽ കാണുക / പ്രിന്റ് ചെയ്യുക (Print Invoice)
      </button>

      <div style="width: 240px; font-size: 0.875rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span style="color: var(--text-muted);">സബ്ടോട്ടൽ:</span>
          <b>₹${ord.subtotal}</b>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span style="color: var(--text-muted);">ഡെലിവറി ചാർജ്:</span>
          <b>${ord.delivery_fee === 0 ? "<span style='color:#16a34a;'>FREE</span>" : "₹" + ord.delivery_fee}</b>
        </div>
        ${ord.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; color: #16a34a;">
            <span>ഡിസ്കൗണ്ട്:</span>
            <b>-₹${ord.discount}</b>
          </div>
        ` : ""}
        <div style="display: flex; justify-content: space-between; padding-top: 0.4rem; border-top: 1.5px solid #0f172a; font-weight: 800; font-size: 1.15rem; color: var(--primary);">
          <span>ആകെ തുക:</span>
          <span>₹${ord.total_amount}</span>
        </div>
      </div>
    </div>
  `;
}

// Admin Portal Logic
document.getElementById("nav-admin-btn").addEventListener("click", () => {
  if (state.adminToken) {
    showAdminView();
  } else {
    openModal("admin-login-modal");
  }
});

document.getElementById("brand-home-btn").addEventListener("click", () => {
  showStorefrontView();
});

document.getElementById("admin-exit-btn").addEventListener("click", () => {
  showStorefrontView();
});

function showStorefrontView() {
  document.getElementById("storefront-view").style.display = "block";
  document.getElementById("admin-view").classList.remove("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showAdminView() {
  document.getElementById("storefront-view").style.display = "none";
  document.getElementById("admin-view").classList.add("active");
  loadAdminStats();
  loadAdminProducts();
  loadAdminOrders();
  loadAdminUsers();
  loadAdminSettings();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Admin Login Form
document.getElementById("admin-login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "ലോഗിൻ പരാജയപ്പെട്ടു", "error");
      return;
    }

    if (data.user.role !== "admin") {
      showToast("അഡ്മിൻ അക്കൗണ്ട് മാത്രമാണ് ഇതിലേക്ക് പ്രവേശിക്കാൻ സാധിക്കുക", "error");
      return;
    }

    state.adminToken = data.token;
    state.adminUser = data.user;
    localStorage.setItem("admin_token", data.token);

    closeModal("admin-login-modal");
    showToast("അഡ്മിൻ പാനലിലേക്ക് സ്വാഗതം!", "success");
    showAdminView();

  } catch (err) {
    console.error("Login error:", err);
    showToast("സെർവറുമായി ബന്ധപ്പെടാൻ സാധിച്ചില്ല", "error");
  }
});

// Admin Logout
document.getElementById("admin-logout-btn").addEventListener("click", () => {
  state.adminToken = null;
  state.adminUser = null;
  localStorage.removeItem("admin_token");
  showStorefrontView();
  showToast("അഡ്മിൻ ലോഗൗട്ട് ചെയ്തു", "info");
});

// Admin Tabs Switcher
document.querySelectorAll(".admin-tab-btn[data-tab]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab-btn[data-tab]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tab;
    document.getElementById("admin-tab-products").style.display = tab === "products" ? "block" : "none";
    document.getElementById("admin-tab-orders").style.display = tab === "orders" ? "block" : "none";
    document.getElementById("admin-tab-users").style.display = tab === "users" ? "block" : "none";
    document.getElementById("admin-tab-settings").style.display = tab === "settings" ? "block" : "none";
  });
});

// Admin Dashboard KPI Stats
async function loadAdminStats() {
  if (!state.adminToken) return;
  try {
    const res = await fetch("/api/admin/stats", {
      headers: { "Authorization": `Bearer ${state.adminToken}` }
    });
    if (!res.ok) return;
    const stats = await res.json();

    document.getElementById("kpi-revenue").textContent = `₹${stats.totalRevenue}`;
    document.getElementById("kpi-orders").textContent = stats.totalOrders;
    document.getElementById("kpi-pending").textContent = stats.pendingOrders;
    document.getElementById("kpi-products").textContent = stats.totalProducts;
    document.getElementById("kpi-users").textContent = stats.totalUsers || 0;
    document.getElementById("kpi-lowstock").textContent = stats.lowStockCount;
  } catch (err) {
    console.error("Admin stats error:", err);
  }
}

// Admin Users Directory & Block Management
async function loadAdminUsers() {
  if (!state.adminToken) return;
  try {
    const res = await fetch("/api/admin/users", {
      headers: { "Authorization": `Bearer ${state.adminToken}` }
    });
    const users = await res.json();
    const tbody = document.getElementById("admin-users-tbody");

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">ഇതുവരെ ഉപഭോക്താക്കൾ രജിസ്റ്റർ ചെയ്തിട്ടില്ല.</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr style="${u.is_blocked ? "background: #fff1f2;" : ""}">
        <td><b>#${u.id}</b></td>
        <td>
          <div style="font-weight: 700;">${u.name}</div>
          <div style="font-size: 0.8rem; color: var(--primary); font-weight: 600;">${u.phone || "-"}</div>
        </td>
        <td style="font-family: monospace; font-size: 0.75rem; color: var(--text-muted);">
          ${u.device_id ? u.device_id : "<i style='opacity:0.6;'>Unknown</i>"}
        </td>
        <td style="font-weight: 700; text-align: center;">${u.total_orders}</td>
        <td style="font-weight: 800; color: var(--primary);">₹${u.total_spent}</td>
        <td>
          <span class="status-badge ${u.is_blocked ? "status-cancelled" : "status-delivered"}">
            ${u.is_blocked ? "🚫 Blocked" : "✅ Active"}
          </span>
        </td>
        <td>
          <button class="btn ${u.is_blocked ? "btn-primary" : "btn-danger"} btn-sm" onclick="toggleBlockUser(${u.id}, ${u.is_blocked ? 0 : 1})">
            ${u.is_blocked ? "🔓 Unblock" : "🚫 Block"}
          </button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Admin users load error:", err);
  }
}

async function toggleBlockUser(userId, newStatus) {
  const actionText = newStatus === 1 ? "ബ്ലോക്ക്" : "അൺബ്ലോക്ക്";
  if (!confirm(`ഈ ഉപഭോക്താവിനെ ${actionText} ചെയ്യണമെന്ന് ഉറപ്പാണോ?`)) return;

  try {
    const res = await fetch(`/api/admin/users/${userId}/block`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.adminToken}`
      },
      body: JSON.stringify({ is_blocked: newStatus })
    });

    const data = await res.json();
    if (res.ok) {
      showToast(newStatus === 1 ? "യൂസറെ ബ്ലോക്ക് ചെയ്തു" : "യൂസറെ അൺബ്ലോക്ക് ചെയ്തു", "success");
      loadAdminUsers();
      loadAdminStats();
    } else {
      showToast(data.error || "പ്രവർത്തനം പരാജയപ്പെട്ടു", "error");
    }
  } catch (err) {
    console.error("User block toggle error:", err);
  }
}

// Admin Products Table
async function loadAdminProducts() {
  if (!state.adminToken) return;
  try {
    const res = await fetch("/api/products?sort=newest");
    const products = await res.json();
    const tbody = document.getElementById("admin-products-tbody");

    tbody.innerHTML = products.map(p => `
      <tr>
        <td style="width: 60px;">
          <img src="${p.image_url || getProductSvg("📦", p.name)}" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover;">
        </td>
        <td>
          <div style="font-weight: 700;">${p.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${p.name_ml || ""}</div>
        </td>
        <td><span class="status-badge" style="background: #e2e8f0;">${p.category_name_ml || p.category_name || "General"}</span></td>
        <td style="font-weight: 700;">₹${p.price}</td>
        <td style="color: var(--text-muted);">${p.mrp ? "₹" + p.mrp : "-"}</td>
        <td>
          <div style="display: inline-flex; align-items: center; gap: 0.4rem;">
            <button class="btn btn-secondary btn-sm" style="padding: 0.15rem 0.45rem;" onclick="quickAdjustStock(${p.id}, ${p.stock - 1})">-</button>
            <b style="min-width: 25px; text-align: center;">${p.stock}</b>
            <button class="btn btn-secondary btn-sm" style="padding: 0.15rem 0.45rem;" onclick="quickAdjustStock(${p.id}, ${p.stock + 5})">+5</button>
          </div>
        </td>
        <td>
          <span class="status-badge ${p.stock > 5 ? "status-delivered" : p.stock > 0 ? "status-pending" : "status-cancelled"}">
            ${p.stock > 0 ? "Active" : "Out of Stock"}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn btn-secondary btn-sm" onclick="editProduct(${p.id})">✏️ എഡിറ്റ്</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Admin products load error:", err);
  }
}

async function quickAdjustStock(id, newStock) {
  if (newStock < 0) return;
  try {
    const res = await fetch(`/api/admin/products/${id}/stock`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.adminToken}`
      },
      body: JSON.stringify({ stock: newStock })
    });
    if (res.ok) {
      loadAdminProducts();
      loadAdminStats();
      loadProducts();
      showToast("സ്റ്റോക്ക് പുതുക്കി!", "success");
    }
  } catch (err) {
    console.error(err);
  }
}

// Add/Edit Product Modal
document.getElementById("admin-add-product-btn").addEventListener("click", () => {
  document.getElementById("product-form").reset();
  document.getElementById("pf-id").value = "";
  document.getElementById("pf-modal-title").textContent = "➕ പുതിയ ഉൽപ്പന്നം ചേർക്കുക";
  populateCategoryDropdown();
  openModal("product-form-modal");
});

function editProduct(id) {
  const p = state.products.find(item => item.id === id);
  if (!p) return;

  document.getElementById("pf-id").value = p.id;
  document.getElementById("pf-name").value = p.name;
  document.getElementById("pf-name-ml").value = p.name_ml || "";
  document.getElementById("pf-category").value = p.category_id || "";
  document.getElementById("pf-unit").value = p.unit || "";
  document.getElementById("pf-price").value = p.price;
  document.getElementById("pf-mrp").value = p.mrp || "";
  document.getElementById("pf-stock").value = p.stock;
  document.getElementById("pf-desc").value = p.description || "";
  document.getElementById("pf-modal-title").textContent = "✏️ ഉൽപ്പന്നം എഡിറ്റ് ചെയ്യുക";

  openModal("product-form-modal");
}

async function deleteProduct(id) {
  if (!confirm("ഈ ഉൽപ്പന്നം ലിസ്റ്റിൽ നിന്ന് ഒഴിവാക്കണമെന്ന് ഉറപ്പാണോ?")) return;
  try {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${state.adminToken}` }
    });
    if (res.ok) {
      showToast("ഉൽപ്പന്നം ഒഴിവാക്കി", "info");
      loadAdminProducts();
      loadAdminStats();
      loadProducts();
    }
  } catch (err) {
    console.error(err);
  }
}

document.getElementById("product-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("pf-id").value;
  const name = document.getElementById("pf-name").value.trim();
  const name_ml = document.getElementById("pf-name-ml").value.trim();
  const category_id = document.getElementById("pf-category").value;
  const unit = document.getElementById("pf-unit").value.trim();
  const price = Number(document.getElementById("pf-price").value);
  const mrp = Number(document.getElementById("pf-mrp").value) || price;
  const stock = Number(document.getElementById("pf-stock").value);
  const icon = document.getElementById("pf-icon").value.trim() || "📦";
  const description = document.getElementById("pf-desc").value.trim();

  const imageUrl = icon.startsWith("http") ? icon : getProductSvg(icon, name);

  const payload = {
    category_id,
    name,
    name_ml,
    unit,
    price,
    mrp,
    stock,
    description,
    image_url: imageUrl
  };

  const url = id ? `/api/admin/products/${id}` : "/api/admin/products";
  const method = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.adminToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      showToast(errData.error || "സേവ് ചെയ്യുന്നതിൽ പിഴവുണ്ടായി", "error");
      return;
    }

    closeModal("product-form-modal");
    showToast(id ? "ഉൽപ്പന്ന വിവരങ്ങൾ പുതുക്കി!" : "പുതിയ ഉൽപ്പന്നം ലിസ്റ്റ് ചെയ്തു!", "success");
    loadAdminProducts();
    loadAdminStats();
    loadProducts();

  } catch (err) {
    console.error("Product save error:", err);
  }
});

// Admin Orders Table
async function loadAdminOrders() {
  if (!state.adminToken) return;
  try {
    const res = await fetch("/api/orders", {
      headers: { "Authorization": `Bearer ${state.adminToken}` }
    });
    const orders = await res.json();
    const tbody = document.getElementById("admin-orders-tbody");

    tbody.innerHTML = orders.map(ord => `
      <tr>
        <td style="font-weight: 800; color: var(--primary);">${ord.id}</td>
        <td>
          <div style="font-weight: 700;">${ord.customer_name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${ord.shipping_address}</div>
        </td>
        <td>${ord.customer_phone}</td>
        <td style="font-weight: 800;">₹${ord.total_amount}</td>
        <td>
          <span class="status-badge" style="background: #e0f2fe; color: #0369a1;">
            ${ord.payment_method} (${ord.payment_status})
          </span>
        </td>
        <td style="font-size: 0.8rem;">${new Date(ord.created_at).toLocaleString("en-IN")}</td>
        <td>
          <select class="form-select" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onchange="updateOrderStatus('${ord.id}', this.value)">
            <option value="Pending" ${ord.status === "Pending" ? "selected" : ""}>Pending (ലഭിച്ചു)</option>
            <option value="Processing" ${ord.status === "Processing" ? "selected" : ""}>Processing (തയ്യാറാക്കുന്നു)</option>
            <option value="Shipped" ${ord.status === "Shipped" ? "selected" : ""}>Shipped (അയച്ചു)</option>
            <option value="Delivered" ${ord.status === "Delivered" ? "selected" : ""}>Delivered (വിതരണം ചെയ്തു)</option>
            <option value="Cancelled" ${ord.status === "Cancelled" ? "selected" : ""}>Cancelled (റദ്ദാക്കി)</option>
          </select>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="showInvoice('${ord.id}')">🧾 ബിൽ</button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Admin orders load error:", err);
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.adminToken}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      showToast(`ഓർഡർ സ്റ്റാറ്റസ് ${newStatus} ആയി മാറ്റി`, "success");
      loadAdminStats();
    }
  } catch (err) {
    console.error(err);
  }
}

// Admin Store Settings
async function loadAdminSettings() {
  if (!state.settings) return;
  document.getElementById("setting-shop-name").value = state.settings.shop_name || "";
  document.getElementById("setting-shop-tagline").value = state.settings.shop_tagline || "";
  document.getElementById("setting-shop-phone").value = state.settings.shop_phone || "";
  document.getElementById("setting-upi-id").value = state.settings.upi_id || "";
  document.getElementById("setting-shop-address").value = state.settings.shop_address || "";
  document.getElementById("setting-free-delivery").value = state.settings.free_delivery_threshold || 500;
  document.getElementById("setting-standard-fee").value = state.settings.standard_delivery_fee || 40;
}

document.getElementById("store-settings-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    shop_name: document.getElementById("setting-shop-name").value.trim(),
    shop_tagline: document.getElementById("setting-shop-tagline").value.trim(),
    shop_phone: document.getElementById("setting-shop-phone").value.trim(),
    upi_id: document.getElementById("setting-upi-id").value.trim(),
    shop_address: document.getElementById("setting-shop-address").value.trim(),
    free_delivery_threshold: document.getElementById("setting-free-delivery").value,
    standard_delivery_fee: document.getElementById("setting-standard-fee").value
  };

  try {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.adminToken}`
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast("ഷോപ്പ് ക്രമീകരണങ്ങൾ സേവ് ചെയ്തു!", "success");
      await loadSettings();
    }
  } catch (err) {
    console.error(err);
  }
});

// Language Switcher
document.getElementById("lang-toggle-btn").addEventListener("click", () => {
  state.lang = state.lang === "ml" ? "en" : "ml";
  localStorage.setItem("shop_lang", state.lang);
  document.getElementById("current-lang-text").textContent = state.lang === "ml" ? "മലയാളം" : "English";
  renderCategories();
  renderProducts();
  renderCartDrawer();
  updateCustomerUI();
  showToast(state.lang === "ml" ? "മലയാളം തിരഞ്ഞെടുത്തു" : "Switched to English", "info");
});

// Event Listeners for UI
document.getElementById("nav-cart-btn").addEventListener("click", openCartDrawer);
document.getElementById("close-cart-btn").addEventListener("click", closeCartDrawer);
document.getElementById("checkout-btn").addEventListener("click", openCheckoutModal);

document.getElementById("search-input").addEventListener("input", () => {
  loadProducts();
});

document.getElementById("sort-select").addEventListener("change", () => {
  loadProducts();
});

document.getElementById("filter-stock-only").addEventListener("change", () => {
  loadProducts();
});

// Initialize Application
async function init() {
  updateCartBadge();
  updateCustomerUI();
  await verifyCustomerProfile();
  await loadSettings();
  await loadCategories();
  await loadProducts();
}

window.addEventListener("DOMContentLoaded", init);
