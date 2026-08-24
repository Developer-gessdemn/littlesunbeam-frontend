import { useState, useEffect, useMemo } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  User,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  ShoppingBag,
  Calendar,
  MapPin,
  LogOut,
  Settings,
  Heart,
  Home,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Phone,
  Mail,
  Search,
  RotateCcw,
  MessageCircle,
  ExternalLink,
  Check,
  Gift,
  ArrowUpRight,
  FileText,
  Printer,
} from "lucide-react";
import { useShop } from "@/context/ShopContext.jsx";
import { adminService } from "@/lib/adminService.js";
import { generateInvoicePdf, printInvoice } from "@/lib/exportUtils.js";
import InvoiceModal from "@/components/InvoiceModal.jsx";
import SiteHeader from "@/components/SiteHeader.jsx";
import SiteFooter from "@/components/SiteFooter.jsx";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Account & Orders — Little Sunbeam" },
      {
        name: "description",
        content: "Manage your Little Sunbeam profile, track orders, view wishlist, and manage delivery addresses.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const {
    customer,
    isCustomerLoggedIn,
    loginCustomer,
    registerCustomer,
    updateCustomerProfile,
    logoutCustomer,
    setAuthOpen,
    wishlist,
    removeFromWishlist,
    addToCart,
    setCartOpen,
    footerInfo,
  } = useShop();

  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState(null);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });

  // Address Management State
  const defaultSavedAddresses = useMemo(() => {
    if (customer?.addresses && Array.isArray(customer.addresses) && customer.addresses.length > 0) {
      return customer.addresses;
    }
    if (customer?.address?.street || customer?.address?.city) {
      return [
        {
          id: "addr_default",
          name: customer.name || "",
          phone: customer.phone || "",
          street: customer.address.street || "",
          landmark: customer.address.landmark || "",
          city: customer.address.city || "",
          state: customer.address.state || "",
          pincode: customer.address.pincode || "",
          isDefault: true,
        },
      ];
    }
    return [];
  }, [customer]);

  const [addresses, setAddresses] = useState(defaultSavedAddresses);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  // Settings State
  const [notifications, setNotifications] = useState({
    whatsappUpdates: true,
    emailReceipts: true,
    promoOffers: false,
  });

  // Logged-out Auth Form State
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Sync profile form when customer changes
  useEffect(() => {
    if (customer) {
      setProfileForm({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
      });
    }
  }, [customer]);

  // Load customer orders from backend
  useEffect(() => {
    if (!isCustomerLoggedIn) {
      setLoadingOrders(false);
      return;
    }

    setLoadingOrders(true);
    const customerToken = localStorage.getItem("little_sunbeam_customer_token");
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    if (customerToken && !customerToken.startsWith("demo_jwt")) {
      // Real backend — fetch this customer's own orders
      fetch(`${apiBase}/orders`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.data?.orders) {
            setOrders(data.data.orders);
          } else {
            // Fallback: filter localStorage orders by email
            const stored = JSON.parse(localStorage.getItem("little_sunbeam_admin_orders") || "[]");
            setOrders(
              stored.filter(
                (o) =>
                  o.user?.email?.toLowerCase() === customer?.email?.toLowerCase() ||
                  o.shippingAddress?.email?.toLowerCase() === customer?.email?.toLowerCase()
              )
            );
          }
        })
        .catch(() => {
          const stored = JSON.parse(localStorage.getItem("little_sunbeam_admin_orders") || "[]");
          setOrders(
            stored.filter(
              (o) =>
                o.user?.email?.toLowerCase() === customer?.email?.toLowerCase() ||
                o.shippingAddress?.email?.toLowerCase() === customer?.email?.toLowerCase()
            )
          );
        })
        .finally(() => setLoadingOrders(false));
    } else {
      // Demo/offline mode — filter localStorage orders by this customer's email
      try {
        const stored = JSON.parse(localStorage.getItem("little_sunbeam_admin_orders") || "[]");
        const myOrders = stored.filter(
          (o) =>
            o.user?.email?.toLowerCase() === customer?.email?.toLowerCase() ||
            o.shippingAddress?.email?.toLowerCase() === customer?.email?.toLowerCase() ||
            String(o.user?._id || o.user?.id) === String(customer?._id || customer?.id)
        );
        setOrders(myOrders);
      } catch {
        setOrders([]);
      }
      setLoadingOrders(false);
    }
  }, [isCustomerLoggedIn, customer]);


  // Filtered orders calculation
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchStatus =
        orderFilter === "all" ||
        ord.orderStatus?.toLowerCase() === orderFilter.toLowerCase();
      const matchSearch =
        !orderSearch ||
        ord.orderNumber?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        ord.items?.some((i) => i.name?.toLowerCase().includes(orderSearch.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [orders, orderFilter, orderSearch]);

  // Handle Logged-out Login / Register Form
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      if (authMode === "login") {
        if (!authEmail || !authPassword) {
          throw new Error("Please enter your email and password");
        }
        await loginCustomer(authEmail, authPassword);
      } else {
        if (!authName || !authEmail || !authPassword) {
          throw new Error("Please fill in all required fields");
        }
        await registerCustomer({
          name: authName,
          email: authEmail,
          phone: authPhone,
          password: authPassword,
          confirmPassword: authPassword,
        });
      }
    } catch (err) {
      setAuthError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg({ text: "", type: "" });
    try {
      await updateCustomerProfile({
        name: profileForm.name,
        phone: profileForm.phone,
      });
      setProfileMsg({ text: "Profile details updated successfully!", type: "success" });
      setIsEditingProfile(false);
    } catch (err) {
      setProfileMsg({ text: err.message || "Failed to update profile", type: "error" });
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Add Address
  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!addressForm.name || !addressForm.street || !addressForm.city || !addressForm.pincode) {
      alert("Please fill in all required address fields.");
      return;
    }

    const newAddr = {
      id: "addr_" + Date.now(),
      ...addressForm,
    };

    let updatedAddrs;
    if (newAddr.isDefault) {
      updatedAddrs = addresses.map((a) => ({ ...a, isDefault: false }));
      updatedAddrs.unshift(newAddr);
    } else {
      updatedAddrs = [...addresses, newAddr];
    }

    const primaryAddr = updatedAddrs.find((a) => a.isDefault) || updatedAddrs[0];

    setAddresses(updatedAddrs);
    try {
      localStorage.setItem("little_sunbeam_saved_address", JSON.stringify(primaryAddr));
    } catch {}

    updateCustomerProfile({
      addresses: updatedAddrs,
      address: primaryAddr,
      shippingAddress: primaryAddr,
    });
    setShowAddressModal(false);
    setAddressForm({
      name: "",
      phone: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    });
  };

  const handleDeleteAddress = (id) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    updateCustomerProfile({ addresses: updated });
  };

  const handleSetDefaultAddress = (id) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    const def = updated.find((a) => a.id === id);
    if (def) {
      updateCustomerProfile({ addresses: updated, address: def });
    }
  };

  // Handle Reorder item
  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) return;
    order.items.forEach((item) => {
      addToCart({
        id: item.product || item._id || item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        selectedSize: item.size || "Standard",
        selectedColor: item.color || "Cream",
      });
    });
    setCartOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Delivered
          </span>
        );
      case "Shipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-extrabold text-xs">
            <Truck className="h-3.5 w-3.5 text-blue-600 animate-pulse" /> Shipped & In Transit
          </span>
        );
      case "Processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-xs">
            <Clock className="h-3.5 w-3.5 text-amber-600" /> Order Processing
          </span>
        );
      case "Confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-extrabold text-xs">
            <Check className="h-3.5 w-3.5 text-indigo-600" /> Order Confirmed
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive font-extrabold text-xs">
            <AlertCircle className="h-3.5 w-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground font-extrabold text-xs">
            <Clock className="h-3.5 w-3.5" /> {status || "Pending"}
          </span>
        );
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-cream,#fdf8f3)] text-foreground font-sans">
      {/* ─── SITE HEADER ─── */}
      <SiteHeader />

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb Bar */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-6">
          <Link to="/" className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium">
            <Home className="h-4 w-4" /> Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="font-extrabold text-foreground">My Account</span>
          {isCustomerLoggedIn && customer && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 hidden sm:inline" />
              <span className="text-muted-foreground hidden sm:inline capitalize">
                {activeTab === "orders" ? "Order History" : activeTab === "wishlist" ? "Wishlist" : activeTab === "addresses" ? "Saved Addresses" : activeTab === "profile" ? "Profile Details" : "Settings"}
              </span>
            </>
          )}
        </nav>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* ─── NOT LOGGED IN STATE ─── */}
        {/* ───────────────────────────────────────────────────────────── */}
        {!isCustomerLoggedIn ? (
          <div className="max-w-4xl mx-auto py-6 sm:py-10">
            <div className="rounded-3xl border border-border bg-card shadow-[var(--shadow-lift)] overflow-hidden grid md:grid-cols-12">
              
              {/* Left Column: Brand Story & Benefits */}
              <div className="md:col-span-5 bg-gradient-to-br from-primary/15 via-sun/15 to-primary/5 p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sun/30 text-sun-foreground text-xs font-black uppercase tracking-wider mb-6">
                    <Sparkles className="h-3.5 w-3.5" /> Little Sunbeam Family
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
                    Welcome to Your Baby Care Portal
                  </h2>
                  <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Sign in to track your parcels in real time, reorder essentials with 1-click, and manage your wishlist.
                  </p>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/20 text-primary shrink-0">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Real-time Order Tracking</h4>
                        <p className="text-[11px] text-muted-foreground">Follow your package from Tiruppur to your doorstep.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/20 text-primary shrink-0">
                        <Heart className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Saved Wishlist & Favorites</h4>
                        <p className="text-[11px] text-muted-foreground">Keep your newborn shopping list handy anytime.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/20 text-primary shrink-0">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Fast & Secure Express Checkout</h4>
                        <p className="text-[11px] text-muted-foreground">Save your addresses for effortless ordering.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border/60">
                  <p className="text-xs text-muted-foreground">
                    Need instant help? Reach out on{" "}
                    <a
                      href="https://wa.me/919361503943?text=Hi%20Little%20Sunbeam,%20I%20need%20assistance%20with%20my%20account"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      WhatsApp <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>
              </div>

              {/* Right Column: Sign In / Sign Up Form */}
              <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-card">

                {/* Tabs for Mode */}
                <div className="flex bg-muted/60 p-1 rounded-xl mb-5 mt-2">
                  <button
                    type="button"
                    onClick={() => { setAuthMode("login"); setAuthError(""); }}
                    className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition ${
                      authMode === "login"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode("register"); setAuthError(""); }}
                    className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition ${
                      authMode === "register"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {authError && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                  {authMode === "register" && (
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          placeholder="Your Full Name"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full rounded-xl border border-border bg-muted/20 pl-10 pr-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full rounded-xl border border-border bg-muted/20 pl-10 pr-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      />
                    </div>
                  </div>

                  {authMode === "register" && (
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">Phone Number (Optional)</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
                          className="w-full rounded-xl border border-border bg-muted/20 pl-10 pr-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Password</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full rounded-xl border border-border bg-muted/20 pl-10 pr-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full mt-2 rounded-full bg-primary py-3 text-xs font-extrabold text-primary-foreground shadow-md hover:bg-primary/90 transition active:scale-98 flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : authMode === "login" ? (
                      "Sign In to My Account"
                    ) : (
                      "Create My Account"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* ───────────────────────────────────────────────────────────── */
          /* ─── LOGGED IN STATE ─── */
          /* ───────────────────────────────────────────────────────────── */
          <div className="space-y-8">
            {/* ── USER HEADER HERO CARD ── */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-sun/10 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="grid h-16 w-16 sm:h-20 sm:w-20 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-2xl sm:text-3xl font-black shadow-md">
                    {getInitials(customer?.name)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-black text-foreground">
                        {customer?.name || "Valued Parent"}
                      </h1>
                      {customer?.role === "admin" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-extrabold text-[11px] border border-amber-500/30">
                          Administrator
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-extrabold text-[11px] border border-primary/20">
                          Sunbeam Parent
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" /> {customer?.email}
                      </span>
                      {customer?.phone && (
                        <span className="hidden sm:flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" /> {customer.phone}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <Link
                    to="/shop"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-xs font-bold text-secondary-foreground hover:bg-secondary/80 transition"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Browse Shop</span>
                  </Link>

                  {customer?.role === "admin" && (
                    <Link
                      to="/admin"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 text-amber-950 px-5 py-2.5 text-xs font-extrabold shadow-sm hover:bg-amber-400 transition"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>Admin Panel</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      logoutCustomer();
                      navigate({ to: "/" });
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/10 transition border border-destructive/20"
                    title="Sign Out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* ── 4 QUICK METRICS TILES ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-border/70">
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    activeTab === "orders"
                      ? "bg-primary/10 border-primary/40 shadow-xs"
                      : "bg-muted/30 border-border hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-bold">Total Orders</span>
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-foreground">{orders.length}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("wishlist")}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    activeTab === "wishlist"
                      ? "bg-primary/10 border-primary/40 shadow-xs"
                      : "bg-muted/30 border-border hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-bold">Wishlist Saved</span>
                    <Heart className="h-4 w-4 text-destructive" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-foreground">{wishlist.length}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("addresses")}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    activeTab === "addresses"
                      ? "bg-primary/10 border-primary/40 shadow-xs"
                      : "bg-muted/30 border-border hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-bold">Saved Addresses</span>
                    <MapPin className="h-4 w-4 text-sun-foreground" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-foreground">{addresses.length}</p>
                </button>

                <div className="p-3.5 rounded-2xl border border-border bg-muted/30">
                  <div className="flex items-center justify-between text-muted-foreground mb-1">
                    <span className="text-[11px] font-bold">In Transit</span>
                    <Truck className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-foreground">
                    {orders.filter((o) => o.orderStatus === "Shipped" || o.orderStatus === "Processing").length}
                  </p>
                </div>
              </div>
            </div>

            {/* ── TWO COLUMN LAYOUT: SIDEBAR + CONTENT ── */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* Sidebar Navigation (Horizontal scroll on mobile/tablet, vertical sidebar on desktop) */}
              <aside className="w-full lg:w-64 shrink-0">
                <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-2 sm:p-4 shadow-xs lg:sticky lg:top-24 flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1 sm:gap-1.5 scrollbar-none">
                  
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`flex shrink-0 lg:w-full items-center justify-between gap-2.5 rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap cursor-pointer ${
                      activeTab === "orders"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="flex items-center gap-2 sm:gap-3">
                      <Package className="h-4 w-4" /> My Orders & Tracking
                    </span>
                    {orders.length > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        activeTab === "orders" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {orders.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("wishlist")}
                    className={`flex shrink-0 lg:w-full items-center justify-between gap-2.5 rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap cursor-pointer ${
                      activeTab === "wishlist"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="flex items-center gap-2 sm:gap-3">
                      <Heart className="h-4 w-4" /> Saved Wishlist
                    </span>
                    {wishlist.length > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        activeTab === "wishlist" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-destructive/10 text-destructive"
                      }`}>
                        {wishlist.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("addresses")}
                    className={`flex shrink-0 lg:w-full items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap cursor-pointer ${
                      activeTab === "addresses"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Saved Addresses</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`flex shrink-0 lg:w-full items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap cursor-pointer ${
                      activeTab === "profile"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>Profile Details</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("settings")}
                    className={`flex shrink-0 lg:w-full items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-extrabold transition whitespace-nowrap cursor-pointer ${
                      activeTab === "settings"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings & Support</span>
                  </button>

                  <div className="hidden lg:block pt-3 mt-3 border-t border-border">
                    <button
                      onClick={() => {
                        logoutCustomer();
                        navigate({ to: "/" });
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/10 transition cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </aside>

              {/* ───────────────────────────────────────────────────────── */}
              {/* ── MAIN TAB VIEW CONTENT ── */}
              {/* ───────────────────────────────────────────────────────── */}
              <div className="flex-1 min-w-0 w-full space-y-6">

                {/* ══════════════════════════════════════════════════════════ */}
                {/* ── TAB 1: ORDERS ── */}
                {/* ══════════════════════════════════════════════════════════ */}
                {activeTab === "orders" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    
                    {/* Header + Search/Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                          Order History & Tracking
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          View details, tracking status, and invoice for your purchases
                        </p>
                      </div>

                      {/* Search box */}
                      <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search orders or items..."
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          className="w-full rounded-full border border-border bg-card pl-9 pr-3.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {["all", "Processing", "Shipped", "Delivered", "Cancelled"].map((f) => (
                        <button
                          key={f}
                          onClick={() => setOrderFilter(f)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition whitespace-nowrap ${
                            orderFilter === f
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "bg-card border border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {f === "all" ? "All Orders" : f}
                        </button>
                      ))}
                    </div>

                    {/* Orders List */}
                    {loadingOrders ? (
                      <div className="rounded-3xl border border-border bg-card p-12 text-center space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <p className="text-xs font-bold text-muted-foreground">Loading your orders...</p>
                      </div>
                    ) : filteredOrders.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-primary mx-auto mb-4">
                          <ShoppingBag className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-black text-foreground">No orders found</h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
                          {orderSearch || orderFilter !== "all"
                            ? "No orders match your search criteria. Try resetting filters."
                            : "You haven't placed any baby clothing or essential orders yet."}
                        </p>
                        <Link
                          to="/shop"
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-extrabold text-primary-foreground shadow-md hover:bg-primary/90 transition"
                        >
                          <span>Explore Baby Essentials</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredOrders.map((ord) => (
                          <div
                            key={ord._id || ord.orderNumber}
                            className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4 transition hover:border-primary/40"
                          >
                            {/* Card Top: Order Number, Date, Status */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                              <div className="flex items-center gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-sm text-foreground">
                                      {ord.orderNumber || "ORD-94281"}
                                    </span>
                                    <span className="text-[11px] font-bold text-muted-foreground">
                                      · {ord.paymentMethod || "Online Payment"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(ord.createdAt || Date.now()).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {getStatusBadge(ord.orderStatus || "Processing")}
                              </div>
                            </div>

                            {/* Tracking Timeline (if expanded or shipped) */}
                            {ord.orderStatus && ord.orderStatus !== "Cancelled" && (
                              <div className="bg-muted/30 rounded-2xl p-3 sm:p-4 border border-border/50">
                                <div className="grid grid-cols-4 gap-2 text-center text-[10px] sm:text-xs">
                                  <div className="flex flex-col items-center">
                                    <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold mb-1">
                                      ✓
                                    </div>
                                    <span className="font-bold text-foreground">Placed</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold mb-1 ${
                                      ord.orderStatus === "Processing" || ord.orderStatus === "Shipped" || ord.orderStatus === "Delivered"
                                        ? "bg-emerald-500 text-white"
                                        : "bg-muted text-muted-foreground"
                                    }`}>
                                      ✓
                                    </div>
                                    <span className="font-bold text-foreground">Confirmed</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold mb-1 ${
                                      ord.orderStatus === "Shipped" || ord.orderStatus === "Delivered"
                                        ? "bg-blue-600 text-white animate-pulse"
                                        : "bg-muted text-muted-foreground"
                                    }`}>
                                      {ord.orderStatus === "Delivered" ? "✓" : "3"}
                                    </div>
                                    <span className="font-bold text-foreground">Shipped</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold mb-1 ${
                                      ord.orderStatus === "Delivered"
                                        ? "bg-emerald-500 text-white"
                                        : "bg-muted text-muted-foreground"
                                    }`}>
                                      {ord.orderStatus === "Delivered" ? "✓" : "4"}
                                    </div>
                                    <span className="font-bold text-foreground">Delivered</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Items List */}
                            <div className="space-y-3 divide-y divide-border/40">
                              {(ord.items || []).map((item, idx) => (
                                <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3.5">
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="h-14 w-14 rounded-2xl object-cover border border-border shrink-0 bg-muted"
                                      />
                                    ) : (
                                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary font-bold text-xl shrink-0">
                                        👶
                                      </div>
                                    )}
                                    <div>
                                      <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">
                                        {item.name}
                                      </h4>
                                      <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Qty: <span className="font-bold text-foreground">{item.quantity || 1}</span>
                                        {item.size && <span> · Size: {item.size}</span>}
                                        {item.color && <span> · Color: {item.color}</span>}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="font-black text-sm text-foreground shrink-0">
                                    ₹{(item.price || 0) * (item.quantity || 1)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Card Footer */}
                            <div className="border-t border-border/60 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="truncate max-w-xs">
                                  {ord.shippingAddress?.address || "Lotus Boulevard"}, {ord.shippingAddress?.city || "Bengaluru"} — {ord.shippingAddress?.pincode || "560001"}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                                <div className="text-left sm:text-right">
                                  <span className="text-[11px] text-muted-foreground mr-1.5">Order Total:</span>
                                  <span className="text-base font-black text-primary">₹{ord.totalAmount}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setViewingInvoiceOrder(ord)}
                                    title="View Tax Invoice"
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-extrabold text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition shadow-2xs cursor-pointer"
                                  >
                                    <FileText className="h-3.5 w-3.5 text-primary" />
                                    <span>Invoice</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleReorder(ord)}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-1.5 text-xs font-extrabold text-secondary-foreground hover:bg-secondary/80 transition cursor-pointer"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    <span>Re-order</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* ── TAB 2: WISHLIST ── */}
                {/* ══════════════════════════════════════════════════════════ */}
                {activeTab === "wishlist" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                          Saved Wishlist ({wishlist.length})
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          Baby products you've saved for later
                        </p>
                      </div>

                      {wishlist.length > 0 && (
                        <button
                          onClick={() => {
                            wishlist.forEach((item) => addToCart(item));
                            setCartOpen(true);
                          }}
                          className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
                        >
                          Move All to Cart
                        </button>
                      )}
                    </div>

                    {wishlist.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive mx-auto mb-4">
                          <Heart className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-black text-foreground">Your wishlist is empty</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 mb-6">
                          Explore our collection of organic swaddles, hospital kits, and clothing to save your favorites!
                        </p>
                        <Link
                          to="/shop"
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-extrabold text-primary-foreground shadow-md hover:bg-primary/90 transition"
                        >
                          <span>Start Exploring</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {wishlist.map((item) => (
                          <div
                            key={item._id || item.id}
                            className="rounded-3xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between space-y-3 group hover:border-primary/40 transition"
                          >
                            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-muted">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <button
                                onClick={() => removeFromWishlist(item._id || item.id)}
                                className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-card/80 backdrop-blur-xs text-destructive shadow-xs hover:bg-destructive hover:text-white transition"
                                title="Remove from wishlist"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">{item.name}</h4>
                              <p className="text-xs font-extrabold text-primary mt-1">₹{item.price}</p>
                            </div>

                            <button
                              onClick={() => {
                                addToCart(item);
                                setCartOpen(true);
                              }}
                              className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-extrabold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                              <span>Add to Cart</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* ── TAB 3: SAVED ADDRESSES ── */}
                {/* ══════════════════════════════════════════════════════════ */}
                {activeTab === "addresses" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                          Saved Delivery Addresses
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          Manage your home, hospital, and gifting addresses for fast checkout
                        </p>
                      </div>

                      <button
                        onClick={() => setShowAddressModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add New</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`rounded-3xl border p-5 shadow-sm space-y-3 relative transition ${
                            addr.isDefault
                              ? "bg-card border-primary/50 ring-2 ring-primary/20"
                              : "bg-card border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-foreground">{addr.name}</span>
                              {addr.isDefault && (
                                <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-black uppercase">
                                  Default
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {addresses.length > 1 && (
                                <button
                                  onClick={() => handleDeleteAddress(addr.id)}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                                  title="Delete address"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {addr.street}
                            {addr.landmark ? `, ${addr.landmark}` : ""}
                            <br />
                            {addr.city}, {addr.state} — <span className="font-bold text-foreground">{addr.pincode}</span>
                          </p>

                          <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                            <Phone className="h-3 w-3" /> {addr.phone}
                          </p>

                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-xs font-bold text-primary hover:underline block pt-1"
                            >
                              Make this my default address
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* ── TAB 4: PROFILE DETAILS ── */}
                {/* ══════════════════════════════════════════════════════════ */}
                {activeTab === "profile" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                          Personal Profile Details
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          Update your contact and baby details
                        </p>
                      </div>

                      <button
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-xs font-extrabold text-secondary-foreground hover:bg-secondary/80 transition"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>{isEditingProfile ? "Cancel" : "Edit Profile"}</span>
                      </button>
                    </div>

                    {profileMsg.text && (
                      <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                        profileMsg.type === "success"
                          ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}>
                        {profileMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        <span>{profileMsg.text}</span>
                      </div>
                    )}

                    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                      <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Full Name
                          </label>
                          <input
                            type="text"
                            disabled={!isEditingProfile}
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className="w-full rounded-2xl border border-border bg-muted/20 px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground outline-none focus:border-primary disabled:opacity-80"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Email Address (Account ID)
                          </label>
                          <input
                            type="email"
                            disabled
                            value={profileForm.email}
                            className="w-full rounded-2xl border border-border bg-muted/50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-muted-foreground outline-none cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            disabled={!isEditingProfile}
                            placeholder="+91 98765 43210"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            className="w-full rounded-2xl border border-border bg-muted/20 px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground outline-none focus:border-primary disabled:opacity-80"
                          />
                        </div>

                        {isEditingProfile && (
                          <div className="pt-4 border-t border-border flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setIsEditingProfile(false)}
                              className="rounded-full px-5 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={profileSaving}
                              className="rounded-full bg-primary px-6 py-2 text-xs font-extrabold text-primary-foreground hover:bg-primary/90 shadow-sm flex items-center gap-2"
                            >
                              {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                            </button>
                          </div>
                        )}
                      </form>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* ── TAB 5: SETTINGS & SUPPORT ── */}
                {/* ══════════════════════════════════════════════════════════ */}
                {activeTab === "settings" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                        Account Settings & Customer Care
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Manage communication preferences and contact support
                      </p>
                    </div>

                    {/* Notification Preferences */}
                    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                      <h3 className="font-extrabold text-sm text-foreground">Notification Preferences</h3>
                      
                      <label className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/50 cursor-pointer">
                        <div>
                          <p className="text-xs font-bold text-foreground">WhatsApp Order Updates</p>
                          <p className="text-[11px] text-muted-foreground">Receive real-time tracking links & delivery alerts</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.whatsappUpdates}
                          onChange={(e) => setNotifications({ ...notifications, whatsappUpdates: e.target.checked })}
                          className="h-4 w-4 rounded accent-primary cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/50 cursor-pointer">
                        <div>
                          <p className="text-xs font-bold text-foreground">Email Invoices & Receipts</p>
                          <p className="text-[11px] text-muted-foreground">Receive order receipts and return labels in your inbox</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.emailReceipts}
                          onChange={(e) => setNotifications({ ...notifications, emailReceipts: e.target.checked })}
                          className="h-4 w-4 rounded accent-primary cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border/50 cursor-pointer">
                        <div>
                          <p className="text-xs font-bold text-foreground">Little Sunbeam Secret Sales</p>
                          <p className="text-[11px] text-muted-foreground">Be first to know about festive discounts & new collections</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.promoOffers}
                          onChange={(e) => setNotifications({ ...notifications, promoOffers: e.target.checked })}
                          className="h-4 w-4 rounded accent-primary cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Customer Support Card */}
                    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                      <h3 className="font-extrabold text-sm text-foreground">Need Assistance?</h3>
                      <p className="text-xs text-muted-foreground">
                        Our parenting and customer support team is happy to help with sizing, fabric advice, exchanges, or tracking.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <a
                          href="https://wa.me/919361503943?text=Hi%20Little%20Sunbeam,%20I%20have%20a%20question%20about%20my%20order"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 font-bold text-xs hover:bg-emerald-500/20 transition"
                        >
                          <MessageCircle className="h-5 w-5 text-emerald-600" />
                          <div>
                            <p>Chat on WhatsApp</p>
                            <span className="text-[10px] font-normal text-muted-foreground">+91 93615 03943</span>
                          </div>
                        </a>

                        <a
                          href="mailto:littlesunbeamkidswear@gmail.com"
                          className="flex items-center gap-3 p-3 rounded-2xl bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/20 font-bold text-xs hover:bg-blue-500/20 transition"
                        >
                          <Mail className="h-5 w-5 text-blue-600" />
                          <div>
                            <p>Email Customer Care</p>
                            <span className="text-[10px] font-normal text-muted-foreground">24-hour response</span>
                          </div>
                        </a>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* ── ADD NEW ADDRESS MODAL ── */}
        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-lg font-black text-foreground">Add New Delivery Address</h3>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      value={addressForm.name}
                      onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                      className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 12345"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Street Address / House No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 302, Palm Grove, 4th Cross"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    placeholder="Near St. Mary's School"
                    value={addressForm.landmark}
                    onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="Bengaluru"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">State *</label>
                    <input
                      type="text"
                      required
                      placeholder="Karnataka"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      placeholder="560001"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-bold text-foreground">Make this my default delivery address</span>
                </label>

                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="rounded-full px-5 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-6 py-2 text-xs font-extrabold text-primary-foreground hover:bg-primary/90 shadow-sm"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* ─── INVOICE PREVIEW MODAL ─── */}
        <InvoiceModal
          isOpen={Boolean(viewingInvoiceOrder)}
          order={viewingInvoiceOrder}
          onClose={() => setViewingInvoiceOrder(null)}
          storeInfo={footerInfo}
        />
      </main>

      {/* ─── SITE FOOTER ─── */}
      <SiteFooter />
    </div>
  );
}
