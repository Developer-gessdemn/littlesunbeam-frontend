import { products as initialProducts, categories as initialCategories } from "@/data/products";
import { API_BASE_URL } from "@/lib/utils.js";

const TOKEN_KEY = "little_sunbeam_admin_token";
const USER_KEY = "little_sunbeam_admin_user";
const LOCAL_PRODUCTS_KEY = "little_sunbeam_admin_products";
const LOCAL_ORDERS_KEY = "little_sunbeam_admin_orders";
const LOCAL_CATEGORIES_KEY = "little_sunbeam_categories";

// Initial mock orders (zero dummy orders)
const initialMockOrders = [];

function getLocalCategories() {
  try {
    const stored = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

function saveLocalCategories(categories) {
  try {
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(categories));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("categories_updated", { detail: categories }));
    }
  } catch { }
}


// Helper to get stored auth
export const getAdminAuth = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user, isAuthenticated: Boolean(token && user?.role === "admin") };
  } catch {
    return { token: null, user: null, isAuthenticated: false };
  }
};

export const setAdminAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAdminAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Generic API helper with fetch
async function apiRequest(endpoint, options = {}) {
  let { token } = getAdminAuth();

  // If token is missing, expired, or a demo token, try auto-login with live backend credentials
  if (!token || token.startsWith("demo_jwt")) {
    try {
      const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@littlesunbeam.com", password: "Admin@123456" }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok && loginData.data?.token) {
        token = loginData.data.token;
        setAdminAuth(token, loginData.data.user);
      }
    } catch {
      // Backend unreachable
    }
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        // Clear auth and try once more if expired
        clearAdminAuth();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("admin_auth_expired"));
        }
      }
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    throw err;
  }
}

// Local storage helpers
function getLocalProducts() {
  try {
    const stored = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (stored) return JSON.parse(stored);
    return [];
  } catch {
    return [];
  }
}

function saveLocalProducts(products) {
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("products_updated", { detail: products }));
      try {
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("little_sunbeam_broadcast_channel");
          bc.postMessage({ type: "PRODUCTS_UPDATED", products });
          bc.close();
        }
      } catch { }
    }
  } catch { }
}

function getLocalOrders() {
  try {
    const stored = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (stored) return JSON.parse(stored);
    return [];
  } catch {
    return [];
  }
}

function saveLocalOrders(orders) {
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
}

// One-time migration: clear stale product cache that may have wrong prices (e.g., price=1, mrp=2)
// so that correct prices are fetched from the live backend on next load.
const ADMIN_PRODUCT_CACHE_MIGRATION_KEY = "little_sunbeam_admin_product_cache_migration_v2";
(function clearStaleAdminProductCache() {
  try {
    if (typeof localStorage === "undefined") return;
    if (localStorage.getItem(ADMIN_PRODUCT_CACHE_MIGRATION_KEY)) return; // already ran
    localStorage.removeItem(LOCAL_PRODUCTS_KEY);
    localStorage.setItem(ADMIN_PRODUCT_CACHE_MIGRATION_KEY, "done");
  } catch { }
})();

// --- ADMIN API SERVICE ---
export const adminService = {
  // 1. Admin Login
  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to authenticate as administrator.");
      }

      if (data.data?.user?.role !== "admin") {
        throw new Error("Access Denied: This account is not an administrator");
      }

      setAdminAuth(data.data.token, data.data.user);
      return { success: true, user: data.data.user, token: data.data.token, isLiveBackend: true };
    } catch (err) {
      // Demo credentials fallback ONLY if backend is offline or network fails
      if (
        (email === "admin@littlesunbeam.com" && password === "Admin@123456") ||
        (email === "admin" && password === "admin") ||
        (email === "admin@test.com" && password === "admin123")
      ) {
        if (err.name === "TypeError" || err.message?.includes("fetch") || err.message?.includes("Network")) {
          const demoUser = {
            id: "admin_demo_1",
            name: "Admin User",
            email: "admin@littlesunbeam.com",
            role: "admin",
          };
          const demoToken = "demo_jwt_admin_token_" + Date.now();
          setAdminAuth(demoToken, demoUser);
          return { success: true, user: demoUser, token: demoToken, isLiveBackend: false };
        }
      }
      throw err;
    }
  },

  // 2. Fetch Dashboard Analytics
  async getDashboard() {
    try {
      const res = await apiRequest("/admin/dashboard");
      return { ...res.data, isLiveBackend: true };
    } catch {
      // Calculate strictly from local stored real data
      const products = getLocalProducts();
      const orders = getLocalOrders();

      const validOrders = orders.filter((o) => o.orderStatus !== "Cancelled");
      const totalSales = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const pendingOrders = orders.filter((o) => o.orderStatus === "Pending").length;
      const confirmedOrders = orders.filter((o) => o.orderStatus === "Confirmed").length;
      const processingOrders = orders.filter((o) => o.orderStatus === "Processing").length;
      const shippedOrders = orders.filter((o) => o.orderStatus === "Shipped").length;
      const deliveredOrders = orders.filter((o) => o.orderStatus === "Delivered").length;
      const cancelledOrders = orders.filter((o) => o.orderStatus === "Cancelled").length;

      const lowStockProducts = products.filter((p) => p.stock <= 10).slice(0, 5);
      const recentOrders = [...orders].reverse().slice(0, 5);

      // Group last 7 days from actual orders
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const daySales = validOrders
          .filter((o) => o.createdAt && new Date(o.createdAt).toISOString().split("T")[0] === dateStr)
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        last7Days.push({
          date: dateStr,
          day: d.toLocaleDateString("en-US", { weekday: "short" }),
          sales: daySales,
          orders: validOrders.filter((o) => o.createdAt && new Date(o.createdAt).toISOString().split("T")[0] === dateStr).length,
        });
      }

      return {
        summary: {
          totalUsers: 0,
          totalProducts: products.length,
          totalCategories: initialCategories.length,
          totalOrders: orders.length,
          totalSales: totalSales,
          pendingOrders,
          confirmedOrders,
          processingOrders,
          shippedOrders,
          deliveredOrders,
          cancelledOrders,
        },
        lowStockProducts,
        recentOrders,
        bestSellingProducts: [],
        salesTrends: last7Days,
        isLiveBackend: false,
      };
    }
  },

  // 3. Products

  // Internal helper: resolve correct price/mrp for a product by checking variant-level
  // prices when root-level price appears to be a wrong placeholder value.
  _resolveProductPricing(p) {
    if (!p) return p;

    let bestVariantPrice = 0;
    let bestVariantMrp = 0;

    // Check flattened variants array
    if (Array.isArray(p.variants)) {
      for (const v of p.variants) {
        const vp = Number(v.price);
        const vm = Number(v.mrp);
        if (!isNaN(vp) && vp > bestVariantPrice) bestVariantPrice = vp;
        if (!isNaN(vm) && vm > bestVariantMrp) bestVariantMrp = vm;
      }
    }
    // Check colorVariants inventory
    if (Array.isArray(p.colorVariants)) {
      for (const cv of p.colorVariants) {
        if (Array.isArray(cv.inventory)) {
          for (const inv of cv.inventory) {
            const ip = Number(inv.price);
            const im = Number(inv.mrp);
            if (!isNaN(ip) && ip > bestVariantPrice) bestVariantPrice = ip;
            if (!isNaN(im) && im > bestVariantMrp) bestVariantMrp = im;
          }
        }
      }
    }

    const rootPrice = Number(p.price) || 0;
    const rootMrp = Number(p.mrp) || 0;

    // The root price is authoritative. Only fallback to variant price if rootPrice is 0 or missing.
    const resolvedPrice = rootPrice > 0 ? rootPrice : (bestVariantPrice > 0 ? bestVariantPrice : 0);
    const resolvedMrp = rootMrp > 0 ? rootMrp : (bestVariantMrp > 0 ? bestVariantMrp : resolvedPrice);

    if (resolvedPrice !== rootPrice || resolvedMrp !== rootMrp) {
      return { ...p, price: resolvedPrice, mrp: resolvedMrp };
    }
    return p;
  },

  async getProducts(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await apiRequest(`/products?${query}`);
      const rawProducts = res.data.products || [];
      // Resolve correct pricing for each product before returning/caching
      const fetchedProducts = rawProducts.map((p) => this._resolveProductPricing(p));
      if (fetchedProducts.length > 0) {
        saveLocalProducts(fetchedProducts);
      }
      return { products: fetchedProducts, total: res.data.pagination?.total, isLiveBackend: true };
    } catch {
      let list = getLocalProducts().map((p) => this._resolveProductPricing(p));
      if (params.search) {
        const s = params.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(s) ||
            p.category?.toLowerCase().includes(s) ||
            p.sku?.toLowerCase().includes(s)
        );
      }
      if (params.category) {
        list = list.filter((p) => p.category?.toLowerCase() === params.category.toLowerCase());
      }
      return { products: list, total: list.length, isLiveBackend: false };
    }
  },


  async createProduct(productData) {
    try {
      const res = await apiRequest("/products", {
        method: "POST",
        body: JSON.stringify(productData),
      });
      const products = getLocalProducts();
      if (res.data?.product) {
        products.unshift(res.data.product);
        saveLocalProducts(products);
      }
      return { product: res.data.product, isLiveBackend: true };
    } catch (err) {
      const { token } = getAdminAuth();
      if (token && token.startsWith("demo_jwt")) {
        const products = getLocalProducts();
        const newProduct = {
          _id: "prod_" + Date.now(),
          id: Date.now(),
          ...productData,
          createdAt: new Date().toISOString(),
        };
        products.unshift(newProduct);
        saveLocalProducts(products);
        return { product: newProduct, isLiveBackend: false };
      }
      throw err;
    }
  },

  async updateProduct(id, updates) {
    try {
      const res = await apiRequest(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      const products = getLocalProducts();
      const index = products.findIndex((p) => String(p._id) === String(id) || String(p.id) === String(id));
      const resolvedProduct = res.data?.product ? this._resolveProductPricing(res.data.product) : null;
      if (index !== -1 && resolvedProduct) {
        products[index] = resolvedProduct;
        saveLocalProducts(products);
      }
      return { product: resolvedProduct, isLiveBackend: true };
    } catch (err) {
      const { token } = getAdminAuth();
      if (token && token.startsWith("demo_jwt")) {
        const products = getLocalProducts();
        const index = products.findIndex((p) => String(p._id) === String(id) || String(p.id) === String(id));
        if (index !== -1) {
          products[index] = this._resolveProductPricing({ ...products[index], ...updates });
          saveLocalProducts(products);
          return { product: products[index], isLiveBackend: false };
        }
        throw new Error("Product not found in local store");
      }
      throw err;
    }
  },


  async deleteProduct(id) {
    try {
      await apiRequest(`/products/${id}`, { method: "DELETE" });
      const products = getLocalProducts();
      const filtered = products.filter((p) => String(p._id) !== String(id) && String(p.id) !== String(id));
      saveLocalProducts(filtered);
      return { success: true, isLiveBackend: true };
    } catch {
      const products = getLocalProducts();
      const filtered = products.filter((p) => String(p._id) !== String(id) && String(p.id) !== String(id));
      saveLocalProducts(filtered);
      return { success: true, isLiveBackend: false };
    }
  },

  // 4. Orders
  async getOrders(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await apiRequest(`/admin/orders?${query}`);
      const fetchedOrders = res.data?.orders || [];
      saveLocalOrders(fetchedOrders);
      return { orders: fetchedOrders, total: res.data?.pagination?.total, isLiveBackend: true };
    } catch {
      let list = getLocalOrders();
      if (params.status && params.status !== "All") {
        list = list.filter((o) => o.orderStatus === params.status);
      }
      if (params.search) {
        const s = params.search.toLowerCase();
        list = list.filter(
          (o) =>
            o.orderNumber?.toLowerCase().includes(s) ||
            o.user?.name?.toLowerCase().includes(s) ||
            o.shippingAddress?.name?.toLowerCase().includes(s)
        );
      }
      return { orders: list, total: list.length, isLiveBackend: false };
    }
  },

  async getRazorpayKey() {
    // Prefer the env var key (set at build time) — especially when it's a live key.
    // Only fall back to backend if no env var is set.
    const envKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (envKey && envKey.startsWith("rzp_live_")) {
      return envKey;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/orders/razorpay-key`);
      const data = await res.json();
      if (res.ok && data.data?.keyId) {
        return data.data.keyId;
      }
    } catch (err) {
      console.warn("[getRazorpayKey] Could not fetch key from backend:", err.message);
    }
    return envKey || "rzp_live_TaDwCOE6e7ioNi";
  },

  async createRazorpayOrder({ amount, currency = "INR" }) {
    const customerToken = localStorage.getItem("little_sunbeam_customer_token");
    if (!customerToken) {
      throw new Error("Please log in to proceed with Razorpay payment.");
    }

    const res = await fetch(`${API_BASE_URL}/orders/razorpay-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ amount, currency }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Failed to create payment order (${res.status})`);
    }

    return data.data;
  },

  async createCustomerOrder(orderData) {
    const customerToken = localStorage.getItem("little_sunbeam_customer_token");

    // Attempt to save order to the live MongoDB backend
    if (customerToken && !customerToken.startsWith("demo_jwt")) {
      try {
        const res = await fetch(`${API_BASE_URL}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify(orderData),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data.data?.order || data.order)) {
          const newOrder = data.data?.order || data.order;
          // Also cache in localStorage so admin panel shows it immediately
          const orders = getLocalOrders();
          orders.unshift(newOrder);
          saveLocalOrders(orders);
          return { order: newOrder, isLiveBackend: true };
        }
        console.warn("[createCustomerOrder] Live backend order response:", data.message || `Status ${res.status}`);
      } catch (err) {
        console.warn("[createCustomerOrder] Live backend fetch note:", err.message);
      }
    }

    // Fallback for demo/offline mode (demo tokens)
    console.warn("[createCustomerOrder] Demo token — saving order locally only");

    // Fallback: save to local orders

    const orders = getLocalOrders();
    const newOrder = {
      _id: "ord_" + Date.now(),
      orderNumber: "ORD-" + Math.floor(10000 + Math.random() * 90000),
      ...orderData,
      paymentStatus: orderData.paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
      orderStatus: "Processing",
      createdAt: new Date().toISOString(),
    };
    orders.unshift(newOrder);
    saveLocalOrders(orders);
    return { order: newOrder, isLiveBackend: false };
  },

  // Public order tracking (by Order Number + Email / Phone)
  async trackOrderPublic({ orderNumber, contact }) {
    const cleanOrdNum = (orderNumber || "").trim();
    const cleanContact = (contact || "").trim();

    try {
      const res = await fetch(`${API_BASE_URL}/orders/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: cleanOrdNum, contact: cleanContact }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to retrieve order tracking details.");
      }
      return { order: data.data?.order, isLiveBackend: true };
    } catch (err) {
      // Local fallback lookup
      const orders = getLocalOrders();
      const matched = orders.find(
        (o) =>
          String(o._id || "").toLowerCase() === cleanOrdNum.toLowerCase() ||
          String(o.orderNumber || "").toLowerCase() === cleanOrdNum.toLowerCase()
      );

      if (!matched) {
        throw new Error(err.message || `No order found with number "${cleanOrdNum}".`);
      }

      // Verify contact
      const contactLower = cleanContact.toLowerCase();
      const contactDigits = cleanContact.replace(/\D/g, "");
      const orderEmail = (matched.shippingAddress?.email || matched.user?.email || "").toLowerCase();
      const orderPhoneDigits = (matched.shippingAddress?.phone || matched.user?.phone || "").replace(/\D/g, "");

      const emailMatch = contactLower.includes("@") && (orderEmail === contactLower || orderEmail.includes(contactLower));
      const phoneMatch = contactDigits.length >= 6 && orderPhoneDigits.endsWith(contactDigits.slice(-6));

      if (!emailMatch && !phoneMatch) {
        throw new Error("The Email or Mobile Number provided does not match this order's details.");
      }

      return { order: matched, isLiveBackend: false };
    }
  },

  async updateOrderStatus(id, { orderStatus, paymentStatus, cancelledReason, customMessage, sendNotification = true }) {
    try {
      const res = await apiRequest(`/admin/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ orderStatus, paymentStatus, cancelledReason, customMessage, sendNotification }),
      });
      const updated = res.data?.order;
      if (updated) {
        const orders = getLocalOrders();
        const index = orders.findIndex((o) => String(o._id) === String(id) || o.orderNumber === id);
        if (index !== -1) {
          orders[index] = { ...orders[index], ...updated };
          saveLocalOrders(orders);
        }
      }
      return { order: updated, isLiveBackend: true };
    } catch {
      const orders = getLocalOrders();
      const index = orders.findIndex((o) => String(o._id) === String(id) || o.orderNumber === id);
      if (index !== -1) {
        const now = new Date();
        const newHist = orders[index].trackingHistory ? [...orders[index].trackingHistory] : [];
        if (orderStatus && orderStatus !== orders[index].orderStatus) {
          newHist.push({
            _id: "chk_" + Date.now(),
            status: orderStatus,
            location: "Local Hub",
            description: `Status updated to ${orderStatus}`,
            date: now.toISOString().split("T")[0],
            time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            timestamp: now.toISOString(),
            updatedBy: "Admin",
          });
        }

        orders[index] = {
          ...orders[index],
          ...(orderStatus ? { orderStatus } : {}),
          ...(paymentStatus ? { paymentStatus } : {}),
          ...(cancelledReason ? { cancelledReason } : {}),
          ...(orderStatus === "Packed" && !orders[index].packedAt ? { packedAt: now.toISOString() } : {}),
          ...(orderStatus === "Shipped" && !orders[index].shippedAt ? { shippedAt: now.toISOString(), shippingDate: now.toISOString() } : {}),
          ...(orderStatus === "Out for Delivery" && !orders[index].outForDeliveryAt ? { outForDeliveryAt: now.toISOString() } : {}),
          ...(orderStatus === "Delivered" ? { deliveredAt: now.toISOString(), paymentStatus: "Paid" } : {}),
          trackingHistory: newHist,
        };
        saveLocalOrders(orders);
        return { order: orders[index], isLiveBackend: false };
      }
      throw new Error("Order not found");
    }
  },

  async updateOrderCourier(id, courierData) {
    try {
      const res = await apiRequest(`/admin/orders/${id}/courier`, {
        method: "PUT",
        body: JSON.stringify(courierData),
      });
      const updated = res.data?.order;
      if (updated) {
        const orders = getLocalOrders();
        const index = orders.findIndex((o) => String(o._id) === String(id) || o.orderNumber === id);
        if (index !== -1) {
          orders[index] = { ...orders[index], ...updated };
          saveLocalOrders(orders);
        }
      }
      return { order: updated, isLiveBackend: true };
    } catch {
      const orders = getLocalOrders();
      const index = orders.findIndex((o) => String(o._id) === String(id) || o.orderNumber === id);
      if (index !== -1) {
        const now = new Date();
        const newHist = orders[index].trackingHistory ? [...orders[index].trackingHistory] : [];
        if (courierData.newCheckpointDescription) {
          newHist.push({
            _id: "chk_" + Date.now(),
            status: courierData.orderStatus || orders[index].orderStatus || "In Transit",
            location: courierData.newCheckpointLocation || "",
            description: courierData.newCheckpointDescription,
            date: now.toISOString().split("T")[0],
            time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            timestamp: now.toISOString(),
            updatedBy: "Admin",
          });
        }

        orders[index] = {
          ...orders[index],
          courierName: courierData.courierName || orders[index].courierName,
          trackingNumber: courierData.trackingNumber || orders[index].trackingNumber,
          trackingUrl: courierData.trackingUrl || orders[index].trackingUrl,
          shippingDate: courierData.shippingDate || orders[index].shippingDate,
          expectedDeliveryDate: courierData.expectedDeliveryDate || orders[index].expectedDeliveryDate,
          ...(courierData.orderStatus ? { orderStatus: courierData.orderStatus } : {}),
          trackingHistory: newHist,
        };
        saveLocalOrders(orders);
        return { order: orders[index], isLiveBackend: false };
      }
      throw new Error("Order not found");
    }
  },

  async addTrackingUpdate(id, trackingData) {
    try {
      const res = await apiRequest(`/admin/orders/${id}/tracking`, {
        method: "POST",
        body: JSON.stringify(trackingData),
      });
      const updated = res.data?.order;
      if (updated) {
        const orders = getLocalOrders();
        const index = orders.findIndex((o) => String(o._id) === String(id) || o.orderNumber === id);
        if (index !== -1) {
          orders[index] = { ...orders[index], ...updated };
          saveLocalOrders(orders);
        }
      }
      return { order: updated, isLiveBackend: true };
    } catch {
      const orders = getLocalOrders();
      const index = orders.findIndex((o) => String(o._id) === String(id) || o.orderNumber === id);
      if (index !== -1) {
        const now = new Date();
        const entry = {
          _id: "chk_" + Date.now(),
          status: trackingData.status || orders[index].orderStatus || "In Transit",
          location: trackingData.location || "",
          description: trackingData.description,
          date: trackingData.date || now.toISOString().split("T")[0],
          time: trackingData.time || now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          timestamp: trackingData.date && trackingData.time ? `${trackingData.date}T${trackingData.time}` : now.toISOString(),
          updatedBy: "Admin",
        };

        const newHist = [...(orders[index].trackingHistory || []), entry];
        orders[index] = {
          ...orders[index],
          ...(trackingData.updateOrderStatusTo ? { orderStatus: trackingData.updateOrderStatusTo } : {}),
          trackingHistory: newHist,
        };
        saveLocalOrders(orders);
        return { order: orders[index], isLiveBackend: false };
      }
      throw new Error("Order not found");
    }
  },

  async deleteTrackingUpdate(id, updateId) {
    try {
      const res = await apiRequest(`/admin/orders/${id}/tracking/${updateId}`, {
        method: "DELETE",
      });
      const updated = res.data?.order;
      if (updated) {
        const orders = getLocalOrders();
        const index = orders.findIndex((o) => String(o._id) === String(id) || o.orderNumber === id);
        if (index !== -1) {
          orders[index] = { ...orders[index], ...updated };
          saveLocalOrders(orders);
        }
      }
      return { order: updated, isLiveBackend: true };
    } catch {
      const orders = getLocalOrders();
      const index = orders.findIndex((o) => String(o._id) === String(id) || o.orderNumber === id);
      if (index !== -1) {
        orders[index].trackingHistory = (orders[index].trackingHistory || []).filter(
          (h) => String(h._id) !== String(updateId)
        );
        saveLocalOrders(orders);
        return { order: orders[index], isLiveBackend: false };
      }
      throw new Error("Order not found");
    }
  },

  // 5. Users
  async getUsers() {
    try {
      const res = await apiRequest("/admin/users");
      const usersList = res.data?.users || [];
      return { users: usersList, count: res.data?.count || usersList.length, isLiveBackend: true };
    } catch {
      // Local fallback: derive customer accounts from local storage & orders
      const orders = getLocalOrders();
      const userMap = {};

      // Check current logged in customer
      try {
        const storedCustomer = localStorage.getItem("little_sunbeam_customer_user");
        if (storedCustomer) {
          const c = JSON.parse(storedCustomer);
          const email = (c.email || "").toLowerCase();
          if (email) {
            userMap[email] = {
              _id: c._id || c.id || "cust_1",
              name: c.name || "Customer",
              email: c.email,
              phone: c.phone || "",
              role: c.role || "user",
              shippingAddress: c.shippingAddress || c.address || {},
              address: c.address || {},
              createdAt: c.createdAt || new Date().toISOString(),
              ordersCount: 0,
              totalSpent: 0,
              orders: [],
            };
          }
        }
      } catch { }

      // Enrich from orders
      orders.forEach((ord) => {
        const email = (ord.shippingAddress?.email || ord.user?.email || "").toLowerCase();
        if (!email) return;

        if (!userMap[email]) {
          userMap[email] = {
            _id: ord.user?._id || ord.user?.id || "usr_" + Math.random().toString(36).substring(2, 9),
            name: ord.shippingAddress?.name || ord.user?.name || "Customer",
            email: email,
            phone: ord.shippingAddress?.phone || ord.user?.phone || "",
            role: "user",
            shippingAddress: {
              name: ord.shippingAddress?.name || "",
              phone: ord.shippingAddress?.phone || "",
              email: ord.shippingAddress?.email || "",
              street: ord.shippingAddress?.address || ord.shippingAddress?.street || "",
              address: ord.shippingAddress?.address || ord.shippingAddress?.street || "",
              city: ord.shippingAddress?.city || "",
              state: ord.shippingAddress?.state || "",
              pincode: ord.shippingAddress?.pincode || "",
              country: ord.shippingAddress?.country || "India",
            },
            address: {
              street: ord.shippingAddress?.address || ord.shippingAddress?.street || "",
              city: ord.shippingAddress?.city || "",
              state: ord.shippingAddress?.state || "",
              pincode: ord.shippingAddress?.pincode || "",
              country: ord.shippingAddress?.country || "India",
            },
            createdAt: ord.createdAt || new Date().toISOString(),
            ordersCount: 0,
            totalSpent: 0,
            orders: [],
          };
        }

        userMap[email].ordersCount += 1;
        if (ord.orderStatus !== "Cancelled") {
          userMap[email].totalSpent += ord.totalAmount || 0;
        }
        userMap[email].orders.push({
          _id: ord._id,
          orderNumber: ord.orderNumber,
          totalAmount: ord.totalAmount,
          orderStatus: ord.orderStatus,
          paymentStatus: ord.paymentStatus,
          paymentMethod: ord.paymentMethod,
          itemsCount: ord.items?.length || 0,
          createdAt: ord.createdAt,
        });

        if (!userMap[email].shippingAddress?.street && ord.shippingAddress) {
          userMap[email].shippingAddress = {
            name: ord.shippingAddress.name || userMap[email].name,
            phone: ord.shippingAddress.phone || userMap[email].phone,
            email: ord.shippingAddress.email || userMap[email].email,
            street: ord.shippingAddress.address || ord.shippingAddress.street || "",
            address: ord.shippingAddress.address || ord.shippingAddress.street || "",
            city: ord.shippingAddress.city || "",
            state: ord.shippingAddress.state || "",
            pincode: ord.shippingAddress.pincode || "",
            country: ord.shippingAddress.country || "India",
          };
        }
      });

      const usersList = Object.values(userMap);
      return {
        users: usersList,
        count: usersList.length,
        isLiveBackend: false,
      };
    }
  },

  // 6. Categories
  async getCategories() {
    try {
      const res = await apiRequest("/categories");
      const fetchedCategories = res.data?.categories || [];
      if (Array.isArray(fetchedCategories) && fetchedCategories.length > 0) {
        saveLocalCategories(fetchedCategories);
      }
      return { categories: fetchedCategories, isLiveBackend: true };
    } catch {
      return { categories: getLocalCategories(), isLiveBackend: false };
    }
  },

  async createCategory(categoryData) {
    try {
      const res = await apiRequest("/categories", {
        method: "POST",
        body: JSON.stringify(categoryData),
      });
      const newCat = res.data?.category || categoryData;
      const categories = getLocalCategories();
      categories.push(newCat);
      saveLocalCategories(categories);
      return { category: newCat, isLiveBackend: true };
    } catch (err) {
      // Fallback
      const newCat = {
        _id: "cat_" + Date.now(),
        id: (categoryData.name || "").toLowerCase().replace(/\s+/g, "-"),
        name: categoryData.name,
        description: categoryData.description || "",
        image: categoryData.image || "",
        order: categoryData.order || 0,
      };
      const categories = getLocalCategories();
      categories.push(newCat);
      saveLocalCategories(categories);
      return { category: newCat, isLiveBackend: false };
    }
  },

  async updateCategory(id, updates) {
    try {
      const res = await apiRequest(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      const updatedCat = res.data?.category || { _id: id, id, ...updates };
      const categories = getLocalCategories();
      const index = categories.findIndex((c) => String(c._id) === String(id) || String(c.id) === String(id) || c.slug === id);
      if (index !== -1) {
        categories[index] = { ...categories[index], ...updatedCat };
      } else {
        categories.push(updatedCat);
      }
      saveLocalCategories(categories);
      return { category: updatedCat, isLiveBackend: true };
    } catch (err) {
      const categories = getLocalCategories();
      const index = categories.findIndex((c) => String(c._id) === String(id) || String(c.id) === String(id) || c.slug === id);
      if (index !== -1) {
        categories[index] = { ...categories[index], ...updates };
      }
      saveLocalCategories(categories);
      return { category: { id, ...updates }, isLiveBackend: false };
    }
  },

  async deleteCategory(id) {
    try {
      await apiRequest(`/categories/${id}`, { method: "DELETE" });
      const categories = getLocalCategories();
      const filtered = categories.filter((c) => String(c._id) !== String(id) && String(c.id) !== String(id) && c.slug !== id);
      saveLocalCategories(filtered);
      return { success: true, isLiveBackend: true };
    } catch (err) {
      const categories = getLocalCategories();
      const filtered = categories.filter((c) => String(c._id) !== String(id) && String(c.id) !== String(id) && c.slug !== id);
      saveLocalCategories(filtered);
      return { success: true, isLiveBackend: false };
    }
  },

  async addSubCategory(categoryId, subCategoryData) {
    try {
      const res = await apiRequest(`/categories/${categoryId}/subcategories`, {
        method: "POST",
        body: JSON.stringify(subCategoryData),
      });
      const categories = getLocalCategories();
      const catIdx = categories.findIndex((c) => String(c._id) === String(categoryId) || c.slug === categoryId);
      if (catIdx !== -1 && res.data?.category) {
        categories[catIdx] = res.data.category;
        saveLocalCategories(categories);
      }
      return { category: res.data?.category, subCategory: res.data?.subCategory, isLiveBackend: true };
    } catch (err) {
      const categories = getLocalCategories();
      const catIdx = categories.findIndex((c) => String(c._id) === String(categoryId) || c.slug === categoryId);
      if (catIdx !== -1) {
        const subName = typeof subCategoryData === "string" ? subCategoryData : subCategoryData.name;
        const subObj = {
          _id: "sub_" + Date.now(),
          name: subName,
          slug: subName.toLowerCase().replace(/\s+/g, "-"),
          description: subCategoryData.description || "",
          image: subCategoryData.image || "",
          isActive: true,
          order: (categories[catIdx].subCategories?.length || 0) + 1,
        };
        categories[catIdx].subCategories = [...(categories[catIdx].subCategories || []), subObj];
        saveLocalCategories(categories);
        return { category: categories[catIdx], subCategory: subObj, isLiveBackend: false };
      }
      throw err;
    }
  },

  async updateSubCategory(categoryId, subId, subCategoryData) {
    try {
      const res = await apiRequest(`/categories/${categoryId}/subcategories/${subId}`, {
        method: "PUT",
        body: JSON.stringify(subCategoryData),
      });
      const categories = getLocalCategories();
      const catIdx = categories.findIndex((c) => String(c._id) === String(categoryId) || c.slug === categoryId);
      if (catIdx !== -1 && res.data?.category) {
        categories[catIdx] = res.data.category;
        saveLocalCategories(categories);
      }
      return { category: res.data?.category, subCategory: res.data?.subCategory, isLiveBackend: true };
    } catch (err) {
      const categories = getLocalCategories();
      const catIdx = categories.findIndex((c) => String(c._id) === String(categoryId) || c.slug === categoryId);
      if (catIdx !== -1) {
        categories[catIdx].subCategories = (categories[catIdx].subCategories || []).map((s) => {
          if (String(s._id) === String(subId) || s.slug === subId || s.name === subId) {
            return typeof s === "string" ? subCategoryData.name : { ...s, ...subCategoryData };
          }
          return s;
        });
        saveLocalCategories(categories);
        return { category: categories[catIdx], isLiveBackend: false };
      }
      throw err;
    }
  },

  async deleteSubCategory(categoryId, subId) {
    try {
      const res = await apiRequest(`/categories/${categoryId}/subcategories/${subId}`, {
        method: "DELETE",
      });
      const categories = getLocalCategories();
      const catIdx = categories.findIndex((c) => String(c._id) === String(categoryId) || c.slug === categoryId);
      if (catIdx !== -1 && res.data?.category) {
        categories[catIdx] = res.data.category;
        saveLocalCategories(categories);
      }
      return { category: res.data?.category, isLiveBackend: true };
    } catch (err) {
      const categories = getLocalCategories();
      const catIdx = categories.findIndex((c) => String(c._id) === String(categoryId) || c.slug === categoryId);
      if (catIdx !== -1) {
        categories[catIdx].subCategories = (categories[catIdx].subCategories || []).filter(
          (s) => String(s._id) !== String(subId) && s.slug !== subId && s.name !== subId
        );
        saveLocalCategories(categories);
        return { category: categories[catIdx], isLiveBackend: false };
      }
      throw err;
    }
  },

  // 7. File & Video Upload
  async uploadImage(file) {
    try {
      const { token } = getAdminAuth();
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_BASE_URL}/upload/single`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to upload image");
      }
      return data.data?.url || data.url;
    } catch (err) {
      // Fallback to local DataURL (Base64) if backend upload fails
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(err);
        reader.readAsDataURL(file);
      });
    }
  },

  async uploadVideo(file) {
    try {
      const { token } = getAdminAuth();
      const formData = new FormData();
      formData.append("video", file);

      const res = await fetch(`${API_BASE_URL}/upload/video`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to upload video");
      }
      return data.data?.url || data.url;
    } catch (err) {
      // Fallback to local Object URL / Base64 if backend upload fails
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(err);
        reader.readAsDataURL(file);
      });
    }
  },

  async uploadMultipleVideos(files) {
    try {
      const { token } = getAdminAuth();
      const formData = new FormData();
      files.forEach((f) => formData.append("videos", f));

      const res = await fetch(`${API_BASE_URL}/upload/videos`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to upload videos");
      }
      return data.data?.urls || data.urls || [];
    } catch (err) {
      return Promise.all(
        files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => reject(err);
              reader.readAsDataURL(file);
            })
        )
      );
    }
  },

  // 8. Prints
  async getPrints() {
    try {
      const res = await apiRequest("/prints");
      const printsList = res.data?.prints || res.prints || [];
      try {
        localStorage.setItem("little_sunbeam_prints", JSON.stringify(printsList));
      } catch { }
      return { prints: printsList, isLiveBackend: true };
    } catch {
      try {
        const stored = localStorage.getItem("little_sunbeam_prints");
        return { prints: stored ? JSON.parse(stored) : [], isLiveBackend: false };
      } catch {
        return { prints: [], isLiveBackend: false };
      }
    }
  },

  async syncPrints(prints) {
    try {
      const res = await apiRequest("/prints", {
        method: "PUT",
        body: JSON.stringify({ prints }),
      });
      const list = res.data?.prints || prints;
      try {
        localStorage.setItem("little_sunbeam_prints", JSON.stringify(list));
        if (typeof window !== "undefined") window.dispatchEvent(new Event("prints_updated"));
      } catch { }
      return { prints: list, isLiveBackend: true };
    } catch {
      try {
        localStorage.setItem("little_sunbeam_prints", JSON.stringify(prints));
        if (typeof window !== "undefined") window.dispatchEvent(new Event("prints_updated"));
      } catch { }
      return { prints, isLiveBackend: false };
    }
  },

  async addPrint(printData) {
    try {
      const res = await apiRequest("/prints", {
        method: "POST",
        body: JSON.stringify(printData),
      });
      const newPrint = res.data?.print || res.print || printData;
      try {
        const stored = JSON.parse(localStorage.getItem("little_sunbeam_prints") || "[]");
        const existingIdx = stored.findIndex(
          (p) => (p._id && newPrint._id && p._id === newPrint._id) || (p.id && newPrint.id && p.id === newPrint.id) || p.name?.toLowerCase() === newPrint.name?.toLowerCase()
        );
        if (existingIdx >= 0) {
          stored[existingIdx] = newPrint;
        } else {
          stored.push(newPrint);
        }
        localStorage.setItem("little_sunbeam_prints", JSON.stringify(stored));
        if (typeof window !== "undefined") window.dispatchEvent(new Event("prints_updated"));
      } catch { }
      return { print: newPrint, isLiveBackend: true };
    } catch {
      const newPrint = {
        _id: "print_" + Date.now(),
        id: (printData.name || "").toLowerCase().replace(/[^a-z0-9]/g, "-"),
        ...printData,
        createdAt: new Date().toISOString(),
      };
      try {
        const stored = JSON.parse(localStorage.getItem("little_sunbeam_prints") || "[]");
        stored.push(newPrint);
        localStorage.setItem("little_sunbeam_prints", JSON.stringify(stored));
        if (typeof window !== "undefined") window.dispatchEvent(new Event("prints_updated"));
      } catch { }
      return { print: newPrint, isLiveBackend: false };
    }
  },

  async deletePrint(id) {
    try {
      await apiRequest(`/prints/${id}`, { method: "DELETE" });
      try {
        const stored = JSON.parse(localStorage.getItem("little_sunbeam_prints") || "[]");
        const updated = stored.filter((p) => p._id !== id && p.id !== id);
        localStorage.setItem("little_sunbeam_prints", JSON.stringify(updated));
        if (typeof window !== "undefined") window.dispatchEvent(new Event("prints_updated"));
      } catch { }
      return { success: true, isLiveBackend: true };
    } catch {
      try {
        const stored = JSON.parse(localStorage.getItem("little_sunbeam_prints") || "[]");
        const updated = stored.filter((p) => p._id !== id && p.id !== id);
        localStorage.setItem("little_sunbeam_prints", JSON.stringify(updated));
        if (typeof window !== "undefined") window.dispatchEvent(new Event("prints_updated"));
      } catch { }
      return { success: true, isLiveBackend: false };
    }
  },

  // 9. Hero Banners
  async getHeroBanners() {
    try {
      const res = await apiRequest("/banners");
      const bannersList = res.data?.banners || res.banners || [];
      if (Array.isArray(bannersList) && bannersList.length > 0) {
        try {
          localStorage.setItem("little_sunbeam_hero_banners", JSON.stringify(bannersList));
        } catch { }
        return { banners: bannersList, isLiveBackend: true };
      }
      // If empty from API, fallback to localStorage
      try {
        const stored = localStorage.getItem("little_sunbeam_hero_banners");
        return { banners: stored ? JSON.parse(stored) : [], isLiveBackend: true };
      } catch {
        return { banners: [], isLiveBackend: true };
      }
    } catch {
      try {
        const stored = localStorage.getItem("little_sunbeam_hero_banners");
        return { banners: stored ? JSON.parse(stored) : [], isLiveBackend: false };
      } catch {
        return { banners: [], isLiveBackend: false };
      }
    }
  },

  async syncHeroBanners(banners) {
    try {
      const res = await apiRequest("/banners", {
        method: "PUT",
        body: JSON.stringify({ banners }),
      });
      const list = res.data?.banners || banners;
      try {
        localStorage.setItem("little_sunbeam_hero_banners", JSON.stringify(list));
        if (typeof window !== "undefined") window.dispatchEvent(new Event("hero_banners_updated"));
      } catch { }
      return { banners: list, isLiveBackend: true };
    } catch {
      try {
        localStorage.setItem("little_sunbeam_hero_banners", JSON.stringify(banners));
        if (typeof window !== "undefined") window.dispatchEvent(new Event("hero_banners_updated"));
      } catch { }
      return { banners, isLiveBackend: false };
    }
  },

  async createHeroBanner(bannerData) {
    try {
      const res = await apiRequest("/banners", {
        method: "POST",
        body: JSON.stringify(bannerData),
      });
      const newBanner = res.data?.banner || bannerData;
      try {
        const stored = JSON.parse(localStorage.getItem("little_sunbeam_hero_banners") || "[]");
        stored.push(newBanner);
        localStorage.setItem("little_sunbeam_hero_banners", JSON.stringify(stored));
        if (typeof window !== "undefined") window.dispatchEvent(new Event("hero_banners_updated"));
      } catch { }
      return { banner: newBanner, isLiveBackend: true };
    } catch {
      const newBanner = {
        _id: "banner_" + Date.now(),
        id: Date.now(),
        ...bannerData,
      };
      try {
        const stored = JSON.parse(localStorage.getItem("little_sunbeam_hero_banners") || "[]");
        stored.push(newBanner);
        localStorage.setItem("little_sunbeam_hero_banners", JSON.stringify(stored));
        if (typeof window !== "undefined") window.dispatchEvent(new Event("hero_banners_updated"));
      } catch { }
      return { banner: newBanner, isLiveBackend: false };
    }
  },

  async updateHeroBanner(id, updates) {
    try {
      const res = await apiRequest(`/banners/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      const updatedBanner = res.data?.banner || { id, ...updates };
      try {
        const stored = JSON.parse(localStorage.getItem("little_sunbeam_hero_banners") || "[]");
        const idx = stored.findIndex((b) => String(b._id) === String(id) || String(b.id) === String(id));
        if (idx !== -1) {
          stored[idx] = { ...stored[idx], ...updatedBanner };
          localStorage.setItem("little_sunbeam_hero_banners", JSON.stringify(stored));
          if (typeof window !== "undefined") window.dispatchEvent(new Event("hero_banners_updated"));
        }
      } catch { }
      return { banner: updatedBanner, isLiveBackend: true };
    } catch {
      try {
        const stored = JSON.parse(localStorage.getItem("little_sunbeam_hero_banners") || "[]");
        const idx = stored.findIndex((b) => String(b._id) === String(id) || String(b.id) === String(id));
        if (idx !== -1) {
          stored[idx] = { ...stored[idx], ...updates };
          localStorage.setItem("little_sunbeam_hero_banners", JSON.stringify(stored));
          if (typeof window !== "undefined") window.dispatchEvent(new Event("hero_banners_updated"));
        }
      } catch { }
      return { banner: { id, ...updates }, isLiveBackend: false };
    }
  },

  async deleteHeroBanner(id) {
    try {
      await apiRequest(`/banners/${id}`, { method: "DELETE" });
      try {
        const stored = JSON.parse(localStorage.getItem("little_sunbeam_hero_banners") || "[]");
        const updated = stored.filter((b) => String(b._id) !== String(id) && String(b.id) !== String(id));
        localStorage.setItem("little_sunbeam_hero_banners", JSON.stringify(updated));
        if (typeof window !== "undefined") window.dispatchEvent(new Event("hero_banners_updated"));
      } catch { }
      return { success: true, isLiveBackend: true };
    } catch {
      try {
        const stored = JSON.parse(localStorage.getItem("little_sunbeam_hero_banners") || "[]");
        const updated = stored.filter((b) => String(b._id) !== String(id) && String(b.id) !== String(id));
        localStorage.setItem("little_sunbeam_hero_banners", JSON.stringify(updated));
        if (typeof window !== "undefined") window.dispatchEvent(new Event("hero_banners_updated"));
      } catch { }
      return { success: true, isLiveBackend: false };
    }
  },

  // 13. Site Settings (COD toggle, Standard Size Chart toggle, etc.)
  async getSettings() {
    try {
      const res = await apiRequest("/settings");
      const localSizeChart = localStorage.getItem("little_sunbeam_size_chart_enabled");
      const localCod = localStorage.getItem("little_sunbeam_cod_enabled");
      const standardSizeChartEnabled =
        res.data && typeof res.data.standardSizeChartEnabled === "boolean"
          ? res.data.standardSizeChartEnabled
          : localSizeChart !== null
            ? localSizeChart === "true"
            : true;
      const codEnabled =
        res.data && typeof res.data.codEnabled === "boolean"
          ? res.data.codEnabled
          : localCod !== null
            ? localCod === "true"
            : true;
      const settings = {
        codEnabled,
        standardSizeChartEnabled,
      };
      try {
        localStorage.setItem("little_sunbeam_settings", JSON.stringify(settings));
        localStorage.setItem("little_sunbeam_size_chart_enabled", String(standardSizeChartEnabled));
        localStorage.setItem("little_sunbeam_cod_enabled", String(codEnabled));
      } catch { }
      return { ...settings, isLiveBackend: true };
    } catch {
      try {
        const stored = localStorage.getItem("little_sunbeam_settings");
        if (stored) return { ...JSON.parse(stored), isLiveBackend: false };
      } catch { }
      const localSizeChart = localStorage.getItem("little_sunbeam_size_chart_enabled");
      const localCod = localStorage.getItem("little_sunbeam_cod_enabled");
      return {
        codEnabled: localCod !== null ? localCod === "true" : true,
        standardSizeChartEnabled: localSizeChart !== null ? localSizeChart === "true" : true,
        isLiveBackend: false,
      };
    }
  },

  async updateSettings(settings) {
    try {
      const res = await apiRequest("/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      const updated = {
        ...(res.data || {}),
        ...settings,
      };
      try {
        localStorage.setItem("little_sunbeam_settings", JSON.stringify(updated));
        if (typeof settings.standardSizeChartEnabled === "boolean") {
          localStorage.setItem("little_sunbeam_size_chart_enabled", String(settings.standardSizeChartEnabled));
        }
        if (typeof settings.codEnabled === "boolean") {
          localStorage.setItem("little_sunbeam_cod_enabled", String(settings.codEnabled));
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("settings_updated", { detail: updated }));
          if (typeof settings.standardSizeChartEnabled === "boolean") {
            window.dispatchEvent(new CustomEvent("size_chart_updated", { detail: settings.standardSizeChartEnabled }));
          }
          if (typeof settings.codEnabled === "boolean") {
            window.dispatchEvent(new CustomEvent("cod_updated", { detail: settings.codEnabled }));
          }
        }
      } catch { }
      return { ...updated, isLiveBackend: true };
    } catch {
      try {
        const existing = JSON.parse(localStorage.getItem("little_sunbeam_settings") || "{}");
        const merged = { ...existing, ...settings };
        localStorage.setItem("little_sunbeam_settings", JSON.stringify(merged));
        if (typeof settings.standardSizeChartEnabled === "boolean") {
          localStorage.setItem("little_sunbeam_size_chart_enabled", String(settings.standardSizeChartEnabled));
        }
        if (typeof settings.codEnabled === "boolean") {
          localStorage.setItem("little_sunbeam_cod_enabled", String(settings.codEnabled));
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("settings_updated", { detail: merged }));
          if (typeof settings.standardSizeChartEnabled === "boolean") {
            window.dispatchEvent(new CustomEvent("size_chart_updated", { detail: settings.standardSizeChartEnabled }));
          }
          if (typeof settings.codEnabled === "boolean") {
            window.dispatchEvent(new CustomEvent("cod_updated", { detail: settings.codEnabled }));
          }
        }
        return { ...merged, isLiveBackend: false };
      } catch {
        return { ...settings, isLiveBackend: false };
      }
    }
  },
};
