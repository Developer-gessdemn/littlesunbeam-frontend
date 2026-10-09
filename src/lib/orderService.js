import { API_BASE_URL } from "./utils";

const LOCAL_ORDERS_KEY = "little_sunbeam_admin_orders";
const CUSTOMER_TOKEN_KEY = "little_sunbeam_customer_token";
const CUSTOMER_USER_KEY = "little_sunbeam_customer_user";

/**
 * Clean phone number to trailing digits for resilient matching
 */
export const cleanPhoneDigits = (phone) => {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

/**
 * Get all orders from persistent localStorage safely
 */
export const getLocalOrders = () => {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[orderService] Error reading local orders:", err);
    return [];
  }
};

/**
 * Merge two order lists ensuring NO duplicate order IDs and NO loss of historical orders.
 * Orders with the same _id or orderNumber are merged (newer properties override, keeping historical ones).
 */
export const mergeOrdersCollections = (existingOrders = [], incomingOrders = []) => {
  const map = new Map();

  // First seed with existing orders
  (existingOrders || []).forEach((ord) => {
    if (!ord) return;
    const key = String(ord._id || ord.orderNumber || ord.id || "").trim();
    if (key) map.set(key, ord);
  });

  // Then merge / append incoming orders
  (incomingOrders || []).forEach((ord) => {
    if (!ord) return;
    const key = String(ord._id || ord.orderNumber || ord.id || "").trim();
    if (!key) return;

    if (map.has(key)) {
      map.set(key, { ...map.get(key), ...ord });
    } else {
      map.set(key, ord);
    }
  });

  // Convert to array and sort newest first
  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
};

/**
 * Save orders to persistent localStorage safely using append / merge behavior.
 * Broadcasts updates to all tabs & React listeners.
 */
export const saveLocalOrders = (orders) => {
  if (typeof localStorage === "undefined") return;
  try {
    const current = getLocalOrders();
    const merged = mergeOrdersCollections(current, Array.isArray(orders) ? orders : [orders]);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(merged));

    // Dispatch DOM event for reactive components in the same window
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("orders_updated", { detail: merged }));
      try {
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("little_sunbeam_broadcast_channel");
          bc.postMessage({ type: "ORDERS_UPDATED", orders: merged });
          bc.close();
        }
      } catch { }
    }
    return merged;
  } catch (err) {
    console.error("[orderService] Error saving local orders:", err);
  }
};

/**
 * CENTRAL ORDER SERVICE
 * Single Source of Truth for Orders, Order History, Customer Linking, and Stats
 */
export const orderService = {
  /**
   * Check if an order matches a specific customer
   */
  isOrderBelongsToCustomer(order, customerId, customerEmail, customerPhone) {
    if (!order) return false;
    const cIdStr = customerId ? String(customerId).trim() : "";
    const emailLower = customerEmail ? String(customerEmail).trim().toLowerCase() : "";
    const phoneClean = customerPhone ? cleanPhoneDigits(customerPhone) : "";

    const ordUserId = String(order.user?._id || order.user?.id || order.user || "").trim();
    const ordCustId = String(order.customerId || "").trim();
    const ordEmail = (
      order.shippingAddress?.email ||
      order.customer?.email ||
      order.user?.email ||
      ""
    ).trim().toLowerCase();
    const ordPhone = cleanPhoneDigits(
      order.shippingAddress?.phone || order.customer?.phone || order.user?.phone || ""
    );

    // Primary check: Customer ID
    if (cIdStr && (ordUserId === cIdStr || ordCustId === cIdStr)) {
      return true;
    }

    // Secondary check: Email match
    if (emailLower && ordEmail && emailLower === ordEmail) {
      return true;
    }

    // Tertiary check: Phone match (10-digit)
    if (phoneClean && ordPhone && phoneClean.length >= 10 && phoneClean === ordPhone) {
      return true;
    }

    return false;
  },

  /**
   * Get all orders for a logged in customer
   */
  async getCustomerOrders({ customerId, customerEmail, customerPhone } = {}) {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem(CUSTOMER_TOKEN_KEY) : null;
    let liveOrders = [];
    let isLiveBackend = false;

    if (token && !token.startsWith("demo_jwt")) {
      try {
        const res = await fetch(`${API_BASE_URL}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          liveOrders = data.data?.orders || [];
          isLiveBackend = true;
          // Merge into local cache so admin and profile stay in sync
          saveLocalOrders(liveOrders);
        }
      } catch (err) {
        console.warn("[orderService] Could not fetch customer orders from live backend:", err.message);
      }
    }

    // Read full persisted collection
    const allStoredOrders = getLocalOrders();
    const combinedAll = mergeOrdersCollections(allStoredOrders, liveOrders);

    // Filter to orders belonging to this customer
    const customerOrders = combinedAll.filter((ord) =>
      this.isOrderBelongsToCustomer(ord, customerId, customerEmail, customerPhone)
    );

    return {
      orders: customerOrders,
      count: customerOrders.length,
      isLiveBackend,
    };
  },

  /**
   * Get all orders (for Admin portal)
   */
  async getAllOrders(params = {}) {
    const adminToken = typeof localStorage !== "undefined"
      ? localStorage.getItem("little_sunbeam_admin_token") || localStorage.getItem("adminToken")
      : null;

    let liveOrders = [];
    let isLiveBackend = false;
    let totalCount = 0;

    try {
      const query = new URLSearchParams({ all: "true", ...params }).toString();
      const res = await fetch(`${API_BASE_URL}/admin/orders?${query}`, {
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        liveOrders = data.data?.orders || [];
        totalCount = data.data?.pagination?.total || liveOrders.length;
        isLiveBackend = true;
        saveLocalOrders(liveOrders);
      }
    } catch (err) {
      console.warn("[orderService] Backend getAllOrders note:", err.message);
    }

    const localList = getLocalOrders();
    const merged = mergeOrdersCollections(localList, liveOrders);

    let filtered = merged;
    if (params.status && params.status !== "All") {
      filtered = filtered.filter((o) => o.orderStatus?.toLowerCase() === params.status.toLowerCase());
    }
    if (params.search && params.search.trim()) {
      const s = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(s) ||
          o.user?.name?.toLowerCase().includes(s) ||
          o.shippingAddress?.name?.toLowerCase().includes(s) ||
          o.shippingAddress?.email?.toLowerCase().includes(s) ||
          o.shippingAddress?.phone?.includes(s) ||
          o.trackingNumber?.toLowerCase().includes(s)
      );
    }

    return {
      orders: filtered,
      total: totalCount || filtered.length,
      isLiveBackend,
    };
  },

  /**
   * Create a new customer order with persistent appending
   */
  async createCustomerOrder(orderData) {
    const customerToken = typeof localStorage !== "undefined" ? localStorage.getItem(CUSTOMER_TOKEN_KEY) : null;
    let customerUser = null;
    try {
      const stored = localStorage.getItem(CUSTOMER_USER_KEY);
      if (stored) customerUser = JSON.parse(stored);
    } catch { }

    const customerId = customerUser?._id || customerUser?.id || orderData.customerId || "";
    const customerName = orderData.shippingAddress?.name || customerUser?.name || "Customer";
    const customerEmail = (orderData.shippingAddress?.email || customerUser?.email || "").toLowerCase();
    const customerPhone = orderData.shippingAddress?.phone || customerUser?.phone || "";

    // Complete snapshot payload
    const completePayload = {
      customerId,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      ...orderData,
      shippingAddress: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: orderData.shippingAddress?.address || orderData.shippingAddress?.street || "",
        street: orderData.shippingAddress?.street || orderData.shippingAddress?.address || "",
        city: orderData.shippingAddress?.city || "",
        state: orderData.shippingAddress?.state || "",
        pincode: orderData.shippingAddress?.pincode || "",
        country: orderData.shippingAddress?.country || "India",
      },
    };

    // 1. Try sending to live MongoDB backend
    if (customerToken && !customerToken.startsWith("demo_jwt")) {
      try {
        const res = await fetch(`${API_BASE_URL}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
          },
          body: JSON.stringify(completePayload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data.data?.order || data.order)) {
          const newOrder = data.data?.order || data.order;
          // Append & merge new order into existing orders collection
          const existing = getLocalOrders();
          const updated = [newOrder, ...existing.filter((o) => o._id !== newOrder._id && o.orderNumber !== newOrder.orderNumber)];
          saveLocalOrders(updated);
          return { order: newOrder, isLiveBackend: true };
        }
        console.warn("[orderService] Backend createOrder returned:", data.message || `Status ${res.status}`);
      } catch (err) {
        console.warn("[orderService] Backend createOrder fetch note:", err.message);
      }
    }

    // 2. Fallback for demo / offline mode: generate permanent unique order ID and append
    const fallbackOrderId = "ord_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const fallbackOrderNumber = "ORD-" + Math.floor(10000 + Math.random() * 90000);

    const newOrder = {
      _id: fallbackOrderId,
      orderNumber: fallbackOrderNumber,
      customerId,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      ...completePayload,
      paymentStatus: completePayload.paymentMethod === "Cash on Delivery" ? "Pending" : "Paid",
      orderStatus: "Confirmed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trackingHistory: [
        {
          _id: "chk_" + Date.now(),
          status: "Order Confirmed",
          location: "Little Sunbeam Tiruppur Facility",
          description: "Order verified and sent to warehouse fulfillment queue",
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          timestamp: new Date().toISOString(),
          updatedBy: "System",
        },
      ],
    };

    const existing = getLocalOrders();
    const updated = [newOrder, ...existing.filter((o) => o._id !== fallbackOrderId && o.orderNumber !== fallbackOrderNumber)];
    saveLocalOrders(updated);

    return { order: newOrder, isLiveBackend: false };
  },

  /**
   * Create Razorpay backend Order with auto-capture
   */
  async createRazorpayOrder({ amount, currency = "INR", shippingAddress, items, subtotal }) {
    const customerToken = typeof localStorage !== "undefined" ? localStorage.getItem(CUSTOMER_TOKEN_KEY) : null;
    if (!customerToken) {
      throw new Error("Please log in to proceed with online payment.");
    }

    const res = await fetch(`${API_BASE_URL}/orders/razorpay-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ amount, currency, shippingAddress, items, subtotal }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Failed to create payment order (${res.status})`);
    }

    return data.data;
  },

  /**
   * Sync and reconcile Razorpay payments
   */
  async syncRazorpayOrders(count = 50) {
    const adminToken = typeof localStorage !== "undefined"
      ? localStorage.getItem("little_sunbeam_admin_token") || localStorage.getItem("adminToken")
      : null;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/sync-razorpay?count=${count}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.data?.orders) {
        saveLocalOrders(data.data.orders);
      }
      return data;
    } catch (err) {
      console.warn("[orderService] syncRazorpayOrders error:", err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Calculate customer statistics (total orders, total spent, order history) dynamically
   */
  calculateCustomerStats(customer, allOrders = null) {
    if (!customer) return { ordersCount: 0, totalSpent: 0, orders: [], latestOrder: null };
    const ordersCollection = allOrders || getLocalOrders();

    const customerId = customer._id || customer.id || customer.customerId || "";
    const customerEmail = customer.email || customer.shippingAddress?.email || "";
    const customerPhone = customer.phone || customer.shippingAddress?.phone || "";

    const customerOrders = ordersCollection.filter((ord) =>
      this.isOrderBelongsToCustomer(ord, customerId, customerEmail, customerPhone)
    );

    const totalSpent = customerOrders
      .filter((o) => o.orderStatus !== "Cancelled")
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    return {
      ordersCount: customerOrders.length,
      totalSpent,
      orders: customerOrders,
      latestOrder: customerOrders[0] || null,
    };
  },
};
