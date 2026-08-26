import { products as initialProducts, categories as initialCategories } from "@/data/products";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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
  async getProducts(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await apiRequest(`/products?${query}`);
      const fetchedProducts = res.data.products || [];
      if (fetchedProducts.length > 0) {
        saveLocalProducts(fetchedProducts);
      }
      return { products: fetchedProducts, total: res.data.pagination?.total, isLiveBackend: true };
    } catch {
      let list = getLocalProducts();
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
      if (index !== -1 && res.data?.product) {
        products[index] = res.data.product;
        saveLocalProducts(products);
      }
      return { product: res.data.product, isLiveBackend: true };
    } catch (err) {
      const { token } = getAdminAuth();
      if (token && token.startsWith("demo_jwt")) {
        const products = getLocalProducts();
        const index = products.findIndex((p) => String(p._id) === String(id) || String(p.id) === String(id));
        if (index !== -1) {
          products[index] = { ...products[index], ...updates };
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
    try {
      const res = await fetch(`${API_BASE_URL}/orders/razorpay-key`);
      const data = await res.json();
      if (res.ok && data.data?.keyId) {
        return data.data.keyId;
      }
    } catch (err) {
      console.warn("[getRazorpayKey] Could not fetch key from backend:", err.message);
    }
    return import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TTYFrGlH8NWdDV";
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

  async updateOrderStatus(id, { orderStatus, paymentStatus, cancelledReason }) {
    try {
      const res = await apiRequest(`/admin/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ orderStatus, paymentStatus, cancelledReason }),
      });
      return { order: res.data.order, isLiveBackend: true };
    } catch {
      const orders = getLocalOrders();
      const index = orders.findIndex((o) => String(o._id) === String(id) || o.orderNumber === id);
      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          ...(orderStatus ? { orderStatus } : {}),
          ...(paymentStatus ? { paymentStatus } : {}),
          ...(cancelledReason ? { cancelledReason } : {}),
          ...(orderStatus === "Shipped" ? { shippedAt: new Date().toISOString() } : {}),
          ...(orderStatus === "Delivered" ? { deliveredAt: new Date().toISOString(), paymentStatus: "Paid" } : {}),
        };
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
};
