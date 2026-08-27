import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  CheckCircle2, CreditCard, ShieldCheck, Truck, Lock, User, Mail,
  Sparkles, ArrowRight, AlertCircle, QrCode, Banknote, Building,
  Loader2, Package, ChevronRight, Home, MapPin, Edit3, Check,
} from "lucide-react";
import { useShop } from "@/context/ShopContext.jsx";
import { adminService } from "@/lib/adminService.js";
import SiteHeader from "@/components/SiteHeader.jsx";
import SiteFooter from "@/components/SiteFooter.jsx";
import lsbLogo from "@/assets/LSB_Logo1.jpg";
import { LSB_LOGO_BASE64 } from "@/assets/logoBase64.js";

// Step indicator component
function StepIndicator({ step }) {
  const steps = [
    { id: "auth", label: "Sign In" },
    { id: "shipping", label: "Shipping" },
    { id: "payment", label: "Payment" },
    { id: "success", label: "Confirmed" },
  ];
  const activeIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto py-1">
      {steps.map((s, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full text-xs sm:text-sm font-extrabold transition-all ${done
                    ? "bg-emerald-600 text-white"
                    : active
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-bold whitespace-nowrap ${active ? "text-primary font-black" : done ? "text-emerald-600" : "text-muted-foreground"
                  }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-6 sm:w-12 mx-1 sm:mx-2 -mt-4 transition-colors ${i < activeIndex ? "bg-emerald-600" : "bg-border"
                  }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const {
    cart,
    clearCart,
    customer,
    isCustomerLoggedIn,
    loginCustomer,
    registerCustomer,
    updateCustomerProfile,
    codEnabled,
  } = useShop();

  const [step, setStep] = useState(isCustomerLoggedIn ? "shipping" : "auth");
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [authForm, setAuthForm] = useState({ name: "", email: "", phone: "", password: "" });

  const getSavedAddressFromStorage = () => {
    try {
      const stored = localStorage.getItem("little_sunbeam_saved_address");
      if (stored) return JSON.parse(stored);
    } catch { }
    return null;
  };

  const storedLocalAddr = getSavedAddressFromStorage();

  const [shippingForm, setShippingForm] = useState(() => {
    return {
      name: customer?.name || customer?.shippingAddress?.name || customer?.address?.name || storedLocalAddr?.name || "",
      email: customer?.email || customer?.shippingAddress?.email || customer?.address?.email || storedLocalAddr?.email || "",
      phone: customer?.phone || customer?.shippingAddress?.phone || customer?.address?.phone || storedLocalAddr?.phone || "",
      address: customer?.shippingAddress?.street || customer?.shippingAddress?.address || customer?.address?.street || customer?.address?.address || storedLocalAddr?.street || storedLocalAddr?.address || "",
      city: customer?.shippingAddress?.city || customer?.address?.city || storedLocalAddr?.city || "",
      state: customer?.shippingAddress?.state || customer?.address?.state || storedLocalAddr?.state || "",
      pincode: customer?.shippingAddress?.pincode || customer?.address?.pincode || storedLocalAddr?.pincode || "",
    };
  });

  const isSavedAddressComplete = Boolean(
    shippingForm.name &&
    (shippingForm.address || shippingForm.street) &&
    shippingForm.city &&
    shippingForm.pincode
  );

  const [isEditingAddress, setIsEditingAddress] = useState(!isSavedAddressComplete);

  // Real-time reactive COD status (from context + localStorage + storage events)
  const getIsCodAvailable = () => {
    try {
      const explicit = localStorage.getItem("little_sunbeam_cod_enabled");
      if (explicit !== null) return explicit === "true";
      const stored = localStorage.getItem("little_sunbeam_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.codEnabled === "boolean") return parsed.codEnabled;
      }
    } catch { }
    return codEnabled !== false;
  };

  const [isCodOptionEnabled, setIsCodOptionEnabled] = useState(getIsCodAvailable);

  useEffect(() => {
    setIsCodOptionEnabled(getIsCodAvailable());
  }, [codEnabled]);

  useEffect(() => {
    // 1. Fetch latest authoritative settings directly from backend
    adminService
      .getSettings()
      .then((s) => {
        if (typeof s?.codEnabled === "boolean") {
          setIsCodOptionEnabled(s.codEnabled);
        }
      })
      .catch(() => {});

    // 2. Real-time BroadcastChannel listener for instant cross-tab sync
    let bc;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("little_sunbeam_broadcast_channel");
        bc.onmessage = (event) => {
          if (event.data?.type === "COD_UPDATED" && typeof event.data.codEnabled === "boolean") {
            setIsCodOptionEnabled(event.data.codEnabled);
          }
        };
      }
    } catch { }

    const handleUpdate = (e) => {
      if (e?.detail && typeof e.detail.codEnabled === "boolean") {
        setIsCodOptionEnabled(e.detail.codEnabled);
      } else if (typeof e?.detail === "boolean") {
        setIsCodOptionEnabled(e.detail);
      } else {
        setIsCodOptionEnabled(getIsCodAvailable());
      }
    };

    const handleStorage = (e) => {
      if (e.key === "little_sunbeam_settings" || e.key === "little_sunbeam_cod_enabled") {
        setIsCodOptionEnabled(getIsCodAvailable());
      }
    };

    const handleFocus = () => {
      setIsCodOptionEnabled(getIsCodAvailable());
    };

    // 3. Heartbeat interval check every 800ms
    const intervalTimer = setInterval(() => {
      const current = getIsCodAvailable();
      setIsCodOptionEnabled((prev) => (prev !== current ? current : prev));
    }, 800);

    window.addEventListener("settings_updated", handleUpdate);
    window.addEventListener("cod_updated", handleUpdate);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalTimer);
      if (bc) {
        try { bc.close(); } catch { }
      }
      window.removeEventListener("settings_updated", handleUpdate);
      window.removeEventListener("cod_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const [paymentMethod, setPaymentMethod] = useState("razorpay");

  useEffect(() => {
    if (!isCodOptionEnabled && paymentMethod === "cod") {
      setPaymentMethod("razorpay");
    }
  }, [isCodOptionEnabled, paymentMethod]);
  const [upiId, setUpiId] = useState("");
  const [cardData, setCardData] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  useEffect(() => {
    if (isCustomerLoggedIn && customer) {
      if (step === "auth") setStep("shipping");
      const localAddr = getSavedAddressFromStorage();
      setShippingForm((prev) => {
        const updated = {
          ...prev,
          name: prev.name || customer.name || customer.shippingAddress?.name || customer.address?.name || localAddr?.name || "",
          email: prev.email || customer.email || customer.shippingAddress?.email || customer.address?.email || localAddr?.email || "",
          phone: prev.phone || customer.phone || customer.shippingAddress?.phone || customer.address?.phone || localAddr?.phone || "",
          address: prev.address || customer.shippingAddress?.street || customer.shippingAddress?.address || customer.address?.street || customer.address?.address || localAddr?.street || localAddr?.address || "",
          city: prev.city || customer.shippingAddress?.city || customer.address?.city || localAddr?.city || "",
          state: prev.state || customer.shippingAddress?.state || customer.address?.state || localAddr?.state || "",
          pincode: prev.pincode || customer.shippingAddress?.pincode || customer.address?.pincode || localAddr?.pincode || "",
        };
        const complete = Boolean(updated.name && updated.address && updated.city && updated.pincode);
        if (complete && isEditingAddress) {
          setIsEditingAddress(false);
        }
        return updated;
      });
    } else if (!isCustomerLoggedIn && step !== "success") {
      setStep("auth");
    }
  }, [isCustomerLoggedIn, customer]);

  useEffect(() => {
    if (cart.length === 0 && step !== "success") navigate({ to: "/cart" });
  }, [cart.length, step, navigate]);

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1), 0);
  const shippingFee = 0;
  const total = subtotal;

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      if (authMode === "login") {
        await loginCustomer(authForm.email, authForm.password);
      } else {
        await registerCustomer({
          name: authForm.name,
          email: authForm.email,
          phone: authForm.phone,
          password: authForm.password,
          confirmPassword: authForm.password,
        });
      }
    } catch (err) {
      setAuthError(err.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const saveAddressAndProceed = () => {
    if (!shippingForm.name || !shippingForm.address || !shippingForm.pincode) {
      alert("Please fill in all required fields (Name, Address, PIN code)");
      return;
    }

    const fullAddr = {
      name: shippingForm.name.trim(),
      phone: (shippingForm.phone || "").trim(),
      email: (shippingForm.email || "").trim().toLowerCase(),
      street: shippingForm.address.trim(),
      address: shippingForm.address.trim(),
      city: (shippingForm.city || "").trim(),
      state: (shippingForm.state || "").trim(),
      pincode: (shippingForm.pincode || "").trim(),
      country: "India",
    };

    // Cache locally for instant re-use across sessions
    try {
      localStorage.setItem("little_sunbeam_saved_address", JSON.stringify(fullAddr));
    } catch { }

    // Persist full shipping address to customer account in database
    if (isCustomerLoggedIn && updateCustomerProfile) {
      updateCustomerProfile({
        name: fullAddr.name,
        phone: fullAddr.phone,
        email: fullAddr.email,
        address: fullAddr,
        shippingAddress: fullAddr,
      }).catch((err) => {
        console.warn("Could not sync customer shipping address on submit:", err);
      });
    }

    setIsEditingAddress(false);
    setStep("payment");
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    saveAddressAndProceed();
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const isCod = paymentMethod === "cod";
      const backendPaymentMethod = isCod ? "Cash on Delivery" : "Online Payment";

      const baseOrderPayload = {
        shippingAddress: {
          name: shippingForm.name,
          email: shippingForm.email || customer?.email || "",
          phone: shippingForm.phone || customer?.phone || "",
          address: shippingForm.address,
          city: shippingForm.city,
          state: shippingForm.state || "",
          pincode: shippingForm.pincode,
          country: "India",
        },
        items: cart.map((item) => ({
          product: item.id || item._id,
          name: item.name,
          price: item.price,
          quantity: item.qty,
          image: item.image,
          selectedSize: item.size || item.variant || "Standard",
          selectedColor: item.color || "Default",
          variant: item.variant || "",
        })),
        paymentMethod: backendPaymentMethod,
        subtotal,
        shippingCharge: shippingFee,
        totalAmount: total,
        notes: "",
      };

      if (isCod) {
        // Direct order creation for Cash on Delivery
        const result = await adminService.createCustomerOrder(baseOrderPayload);
        setPlacedOrder(result.order);
        setStep("success");
        clearCart();
        setIsPlacingOrder(false);
        return;
      }

      // Online Payment via Razorpay
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay payment gateway. Please check your internet connection.");
      }

      // 1. Create Razorpay order on backend
      let rzpOrderData = null;
      try {
        rzpOrderData = await adminService.createRazorpayOrder({ amount: total });
      } catch (orderErr) {
        console.warn("[Razorpay Order] Backend order creation failed, falling back to direct checkout:", orderErr.message);
      }

      const keyId = rzpOrderData?.keyId || (await adminService.getRazorpayKey());

      // 2. Configure Razorpay modal
      const logoUrl = typeof window !== "undefined"
        ? (typeof lsbLogo === "string" && lsbLogo.startsWith("http")
            ? lsbLogo
            : `${window.location.origin}/LSB_Logo1.jpg`)
        : "/LSB_Logo1.jpg";

      const options = {
        key: keyId,
        amount: rzpOrderData ? rzpOrderData.amount : Math.round(total * 100),
        currency: rzpOrderData?.currency || "INR",
        name: "Little Sunbeam",
        description: `Baby Clothing & Essentials (${cart.length} items)`,
        image: LSB_LOGO_BASE64 || logoUrl,
        order_id: rzpOrderData?.orderId || undefined,
        prefill: {
          name: shippingForm.name || customer?.name || "",
          email: shippingForm.email || customer?.email || "",
          contact: shippingForm.phone || customer?.phone || "",
        },
        notes: {
          address: `${shippingForm.address}, ${shippingForm.city} - ${shippingForm.pincode}`,
        },
        theme: {
          color: "#0ea5e9", // Sky Blue
        },
        handler: async function (response) {
          try {
            setIsPlacingOrder(true);
            const verifiedPayload = {
              ...baseOrderPayload,
              paymentMethod: "Razorpay",
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            };
            const result = await adminService.createCustomerOrder(verifiedPayload);
            setPlacedOrder(result.order);
            setStep("success");
            clearCart();
          } catch (err) {
            alert("Payment processed but order recording failed: " + err.message);
          } finally {
            setIsPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsPlacingOrder(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (response) {
        alert("Payment failed: " + (response.error?.description || "Transaction was declined."));
        setIsPlacingOrder(false);
      });
      razorpayInstance.open();
    } catch (err) {
      alert("Failed to initiate payment: " + err.message);
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream text-foreground font-sans">
      <SiteHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          <Link to="/cart" className="hover:text-primary transition-colors">
            Cart
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          <span className="font-extrabold text-foreground">Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* LEFT – Main Checkout Step Panel */}
          <div className={`${step === "success" ? "lg:col-span-12 max-w-2xl mx-auto w-full" : "lg:col-span-8"}`}>
            <div className="bg-card rounded-3xl border border-border p-5 sm:p-8 shadow-xs">
              {step !== "success" && <StepIndicator step={step} />}

              {/* ── AUTH STEP ── */}
              {step === "auth" && (
                <div className="space-y-5 max-w-md mx-auto">
                  <div className="text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-3">
                      <Lock className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-black">Sign In to Continue</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sign in to your Little Sunbeam account for a secure checkout with order tracking.
                    </p>
                  </div>

                  {/* Toggle */}
                  <div className="flex bg-muted/60 rounded-xl p-1 gap-1">
                    {["login", "register"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setAuthMode(m)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${authMode === m
                            ? "bg-card text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        {m === "login" ? "Sign In" : "Create Account"}
                      </button>
                    ))}
                  </div>

                  {authError && (
                    <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                    {authMode === "register" && (
                      <div>
                        <label className="block text-xs font-bold mb-1">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            required
                            placeholder="Your Full Name"
                            value={authForm.name}
                            onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                            className="w-full rounded-xl border border-border bg-muted/30 pl-10 pr-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary transition"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold mb-1">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={authForm.email}
                          onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                          className="w-full rounded-xl border border-border bg-muted/30 pl-10 pr-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary transition"
                        />
                      </div>
                    </div>

                    {authMode === "register" && (
                      <div>
                        <label className="block text-xs font-bold mb-1">Phone Number (Optional)</label>
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={authForm.phone}
                          onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary transition"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold mb-1">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={authForm.password}
                          onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                          className="w-full rounded-xl border border-border bg-muted/30 pl-10 pr-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full rounded-full bg-primary text-primary-foreground py-3 text-xs sm:text-sm font-bold shadow-md hover:bg-primary/90 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {authLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : authMode === "login" ? (
                        "Sign In & Continue"
                      ) : (
                        "Create Account & Continue"
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ── SHIPPING STEP ── */}
              {step === "shipping" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <Truck className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-black">
                        {isSavedAddressComplete && !isEditingAddress ? "Delivery Address" : "Shipping Address"}
                      </h2>
                    </div>
                    {isSavedAddressComplete && !isEditingAddress && (
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(true)}
                        className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Change Address
                      </button>
                    )}
                  </div>

                  {/* Option 1: Complete Saved Address Card (1-Click Delivery) */}
                  {isSavedAddressComplete && !isEditingAddress ? (
                    <div className="space-y-4">
                      <div className="p-5 rounded-3xl border-2 border-primary/40 bg-primary/5 relative shadow-xs">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white text-xs">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-xs font-black text-foreground">Saved Delivery Address</span>
                          </div>
                          <span className="text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                            Default Address
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p className="font-extrabold text-sm text-foreground">{shippingForm.name}</p>
                          <p className="text-xs text-foreground flex items-start gap-1.5 pt-0.5">
                            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>
                              {shippingForm.address}, {shippingForm.city}
                              {shippingForm.state ? `, ${shippingForm.state}` : ""} — <strong>{shippingForm.pincode}</strong>
                            </span>
                          </p>
                          <div className="pt-2 flex flex-wrap gap-4 text-[11px] text-muted-foreground border-t border-border/50 mt-2">
                            {shippingForm.phone && (
                              <span>📞 <strong>{shippingForm.phone}</strong></span>
                            )}
                            {shippingForm.email && (
                              <span>✉️ {shippingForm.email}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => saveAddressAndProceed()}
                          className="flex-1 rounded-full bg-primary text-primary-foreground py-3.5 text-xs sm:text-sm font-black shadow-md hover:bg-primary/90 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                          Deliver to This Address <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(true)}
                          className="rounded-full border border-border bg-card hover:bg-muted text-foreground py-3.5 px-6 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="h-4 w-4" /> Change / Add New
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Option 2: Full Address Input Form (when editing or entering new address) */
                    <form onSubmit={handleShippingSubmit} className="space-y-3.5">
                      {isSavedAddressComplete && (
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border mb-2 text-xs">
                          <span className="text-muted-foreground">Editing delivery address</span>
                          <button
                            type="button"
                            onClick={() => setIsEditingAddress(false)}
                            className="font-bold text-primary hover:underline cursor-pointer"
                          >
                            Cancel & Use Saved
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={shippingForm.name}
                            onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                            placeholder="Recipient Full Name"
                            className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1">Phone Number *</label>
                          <input
                            type="tel"
                            required
                            value={shippingForm.phone}
                            onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                            placeholder="+91 98765 43210"
                            className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={shippingForm.email}
                          onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1">Street Address / House No. *</label>
                        <input
                          type="text"
                          required
                          value={shippingForm.address}
                          onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                          placeholder="Flat, House No., Building, Street Area"
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary transition"
                        />
                      </div>

                      {/* Responsive 3-Field Grid: Stack on Mobile, 3 cols on sm+ */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold mb-1">City *</label>
                          <input
                            type="text"
                            required
                            value={shippingForm.city}
                            onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                            placeholder="City"
                            className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1">State *</label>
                          <input
                            type="text"
                            required
                            value={shippingForm.state}
                            onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                            placeholder="State"
                            className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1">PIN Code *</label>
                          <input
                            type="text"
                            required
                            value={shippingForm.pincode}
                            onChange={(e) => setShippingForm({ ...shippingForm, pincode: e.target.value })}
                            placeholder="PIN Code"
                            className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary transition"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span>This address will be automatically saved for all your future orders.</span>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          className="flex-1 rounded-full bg-primary text-primary-foreground py-3.5 text-xs sm:text-sm font-black shadow-md hover:bg-primary/90 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                          Save Address & Proceed to Payment <ArrowRight className="h-4 w-4" />
                        </button>
                        {isSavedAddressComplete && (
                          <button
                            type="button"
                            onClick={() => setIsEditingAddress(false)}
                            className="rounded-full border border-border bg-muted text-foreground py-3.5 px-5 text-xs font-bold transition hover:bg-muted/80 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* ── PAYMENT STEP ── */}
              {step === "payment" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-black">Payment Method</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep("shipping")}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      ← Edit Address
                    </button>
                  </div>

                  {/* Summary amount banner */}
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-amber-900 dark:text-amber-300">Total Payable</p>
                      <p className="text-2xl font-black text-primary">₹{total.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-amber-900 dark:text-amber-300">Delivering to</p>
                      <p className="text-xs font-bold">{shippingForm.city} — {shippingForm.pincode}</p>
                    </div>
                  </div>

                  {/* Payment options */}
                  <div className="space-y-3">
                    {[
                      {
                        id: "razorpay",
                        title: "Online Payment via Razorpay",
                        subtitle: "UPI (GPay, PhonePe, Paytm), Cards, Net Banking & Wallets",
                        icon: ShieldCheck,
                        badge: "Fast & Secure",
                      },
                      ...(isCodOptionEnabled
                        ? [
                            {
                              id: "cod",
                              title: "Cash on Delivery (COD)",
                              subtitle: "Pay in cash at your doorstep upon delivery",
                              icon: Banknote,
                              badge: "Pay at Doorstep",
                            },
                          ]
                        : []),
                    ].map(({ id, title, subtitle, icon: Icon, badge }) => {
                      const active = paymentMethod === id || (id === "razorpay" && paymentMethod !== "cod");
                      return (
                        <div
                          key={id}
                          onClick={() => setPaymentMethod(id)}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition cursor-pointer ${active
                              ? "border-primary bg-primary/5 shadow-xs"
                              : "border-border bg-card hover:bg-muted/40"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`grid h-11 w-11 place-items-center rounded-xl transition ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-extrabold text-foreground">{title}</p>
                              <p className="text-[11px] text-muted-foreground">{subtitle}</p>
                            </div>
                          </div>
                          {badge && (
                            <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full ${active ? "bg-primary/20 text-primary-900 dark:text-amber-300" : "bg-muted text-muted-foreground"
                              }`}>
                              {badge}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {paymentMethod !== "cod" && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                        <Sparkles className="h-4 w-4 text-amber-500" /> Powered by Razorpay
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Clicking the button below will securely open the Razorpay payment gateway popup where you can choose your preferred UPI app, card, or net banking account.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className="w-full rounded-full bg-primary text-primary-foreground py-3.5 text-xs sm:text-sm font-black shadow-md hover:bg-primary/90 transition flex items-center justify-center gap-2 cursor-pointer mt-3 active:scale-98"
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                      </>
                    ) : paymentMethod === "cod" ? (
                      <>
                        <Banknote className="h-4 w-4" /> Place Order with Cash on Delivery (₹{total.toLocaleString()})
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" /> Pay ₹{total.toLocaleString()} via Razorpay
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-emerald-600" /> 256-bit encrypted & PCI-DSS compliant
                  </p>
                </div>
              )}

              {/* ── SUCCESS STEP ── */}
              {step === "success" && (
                <div className="text-center py-6">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 mx-auto mb-4">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-black text-foreground">Order Placed! 🎉</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-6">
                    Thank you, <strong>{placedOrder?.shippingAddress?.name || customer?.name}</strong>! Your order is confirmed.
                  </p>

                  <div className="bg-muted/30 border border-border rounded-2xl p-4 sm:p-5 text-left space-y-3 mb-6">
                    <div className="flex justify-between items-center pb-3 border-b border-border">
                      <span className="text-sm font-extrabold">Order #{placedOrder?.orderNumber || "LS-94285"}</span>
                      <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-0.5 rounded-full">
                        {placedOrder?.paymentStatus || "Paid"}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Payment Method</span>
                        <span className="font-bold text-foreground">{placedOrder?.paymentMethod || "Online"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping to</span>
                        <span className="font-bold text-foreground">{shippingForm.address}, {shippingForm.city}</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-foreground pt-1">
                        <span>Total Paid</span>
                        <span className="text-primary font-black">₹{total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                      to="/profile"
                      className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-xs font-bold shadow-xs hover:bg-primary/90 transition"
                    >
                      View Order in Profile
                    </Link>
                    <Link
                      to="/shop"
                      className="rounded-full bg-muted text-foreground px-6 py-2.5 text-xs font-bold hover:bg-muted/80 transition"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT – Order Summary (hidden on success) */}
          {step !== "success" && (
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
              <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs">
                <h2 className="text-base font-black pb-3 mb-4 border-b border-border">Order Summary</h2>

                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center">
                      <div className="relative shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-contain bg-muted/40 rounded-xl p-1"
                        />
                        <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {item.qty}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{item.name}</p>
                        {item.variant && (
                          <p className="text-[10px] text-muted-foreground">{item.variant}</p>
                        )}
                      </div>
                      <span className="text-xs font-black shrink-0">₹{(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-foreground">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-bold text-emerald-600">FREE</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2 flex justify-between text-base font-black text-foreground">
                    <span>Total Amount</span>
                    <span className="text-primary text-lg font-black">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border space-y-1.5 text-[11px] text-muted-foreground">
                  <p className="flex items-center gap-1.5">🔒 Secure 256-bit encryption</p>
                  <p className="flex items-center gap-1.5">🚚 Express delivery from Tiruppur</p>
                  <p className="flex items-center gap-1.5">↩️ 7-day easy returns & exchanges</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});
