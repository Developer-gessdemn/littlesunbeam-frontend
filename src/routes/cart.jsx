import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, Tag, ChevronRight, Home, ArrowRight } from "lucide-react";
import { useShop } from "@/context/ShopContext.jsx";
import SiteHeader from "@/components/SiteHeader.jsx";
import SiteFooter from "@/components/SiteFooter.jsx";

const FREE_SHIPPING_THRESHOLD = 2499;

function CartPage() {
  const { cart, updateCartQty, removeFromCart, customer, isCustomerLoggedIn, requireLogin } = useShop();
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  const applyCoupon = () => {
    setCouponError("");
    if (coupon.trim().toUpperCase() === "SUNNY10") {
      setCouponApplied(true);
    } else {
      setCouponError("Invalid coupon code. Try SUNNY10 for 10% off.");
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
          <span className="font-extrabold text-foreground">Cart</span>
        </div>

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-xs">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight">Shopping Cart</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {cart.reduce((s, i) => s + i.qty, 0)} {cart.reduce((s, i) => s + i.qty, 0) === 1 ? "item" : "items"} in your cart
            </p>
          </div>
        </div>

        {!isCustomerLoggedIn ? (
          /* Not Logged In State */
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 bg-card rounded-3xl border border-border text-center shadow-xs max-w-xl mx-auto">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-muted text-primary">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold">Please login to continue</h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                Sign in to view your cart items, sync across your devices, and complete checkout.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => requireLogin("Please login to access your shopping cart.")}
                className="rounded-full bg-primary text-primary-foreground px-7 py-3 text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90 transition cursor-pointer"
              >
                Sign In to Continue
              </button>
              <Link
                to="/shop"
                className="rounded-full bg-muted text-foreground px-7 py-3 text-xs sm:text-sm font-bold hover:bg-muted/80 transition inline-flex items-center gap-2"
              >
                Browse Products <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : cart.length === 0 ? (
          /* Empty Cart State */
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 bg-card rounded-3xl border border-border text-center shadow-xs max-w-xl mx-auto">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold">Your cart is empty</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Looks like you haven't added anything yet!</p>
            </div>
            <Link
              to="/shop"
              className="mt-2 rounded-full bg-primary text-primary-foreground px-8 py-3 text-xs sm:text-sm font-bold shadow-xs hover:bg-primary/90 transition inline-flex items-center gap-2"
            >
              Start Shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* LEFT – Cart Items */}
            <div className="lg:col-span-8 space-y-4">
              {/* Item Cards */}
              <div className="space-y-3">
                {cart.map((item, idx) => {
                  const itemKey = item.cartItemId || item.id || item._id || idx;
                  const productParam = String(item.productId || item._id || item.id);
                  const price = Number(item.price) || 0;
                  const qty = Number(item.qty) || 1;

                  return (
                    <div
                      key={itemKey}
                      className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 bg-card rounded-2xl border border-border p-3.5 sm:p-4 shadow-xs"
                    >
                      <div className="flex gap-3.5 sm:gap-4 min-w-0 flex-1">
                        <Link
                          to="/product/$productId"
                          params={{ productId: productParam }}
                          className="shrink-0"
                        >
                          <img
                            src={
                              item.image ||
                              (item.gallery && item.gallery[0]) ||
                              "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80"
                            }
                            alt={item.name}
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80";
                            }}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-contain bg-muted/40 rounded-xl p-1 shrink-0"
                          />
                        </Link>
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <Link
                                to="/product/$productId"
                                params={{ productId: productParam }}
                                className="text-xs sm:text-sm font-extrabold leading-snug hover:text-primary transition-colors line-clamp-2"
                              >
                                {item.name}
                              </Link>
                              {item.variant && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">{item.variant}</p>
                              )}
                            </div>
                            <button
                              onClick={() => removeFromCart(itemKey)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition shrink-0 cursor-pointer"
                              title="Remove item"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-1 border-t border-border/50 sm:border-t-0 sm:pt-0">
                            <p className="text-sm sm:text-base font-black text-primary">
                              ₹{price.toLocaleString()}
                            </p>

                            <div className="flex items-center gap-1 bg-muted/60 rounded-full p-1 border border-border">
                              <button
                                onClick={() => updateCartQty(itemKey, -1)}
                                aria-label="Decrease quantity"
                                className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-card shadow-xs text-foreground hover:bg-muted transition cursor-pointer"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold">{qty}</span>
                              <button
                                onClick={() => updateCartQty(itemKey, 1)}
                                aria-label="Increase quantity"
                                className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-card shadow-xs text-foreground hover:bg-muted transition cursor-pointer"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <p className="text-xs font-bold text-foreground sm:ml-auto">
                              Total: <span className="text-primary">₹{(price * qty).toLocaleString()}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mt-2"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* RIGHT – Order Summary */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
              <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs">
                <h2 className="text-base font-black pb-3 mb-4 border-b border-border">Order Summary</h2>

                {/* Coupon */}
                <div className="mb-5">
                  <label className="block text-xs font-bold mb-1.5">Coupon Code</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={coupon}
                        onChange={(e) => {
                          setCoupon(e.target.value);
                          setCouponError("");
                        }}
                        placeholder="e.g. SUNNY10"
                        disabled={couponApplied}
                        className={`w-full pl-9 pr-3 py-2 rounded-full border text-xs outline-none transition ${
                          couponError
                            ? "border-destructive bg-destructive/5"
                            : couponApplied
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-border bg-muted/40 focus:border-primary"
                        }`}
                        onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                      />
                    </div>
                    {!couponApplied && (
                      <button
                        onClick={applyCoupon}
                        className="rounded-full border border-primary text-primary px-4 py-2 text-xs font-bold hover:bg-primary hover:text-primary-foreground transition cursor-pointer whitespace-nowrap"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                  {couponApplied && (
                    <p className="text-[11px] font-bold text-emerald-600 mt-1">✓ SUNNY10 applied — 10% off!</p>
                  )}
                  {couponError && (
                    <p className="text-[11px] text-destructive mt-1">{couponError}</p>
                  )}
                </div>

                {/* Price breakdown */}
                <div className="space-y-2.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} items)</span>
                    <span className="font-bold text-foreground">₹{subtotal.toLocaleString()}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount (SUNNY10)</span>
                      <span className="font-bold">−₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-bold text-emerald-600">FREE</span>
                  </div>
                  <div className="border-t border-border pt-3 mt-3 flex justify-between text-base font-black text-foreground">
                    <span>Total Amount</span>
                    <span className="text-primary text-lg font-black">
                      ₹{Math.max(0, subtotal - discount).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="mt-5 w-full flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-3.5 text-sm font-bold shadow-md hover:bg-primary/90 transition active:scale-98"
                >
                  Proceed to Checkout <ChevronRight className="h-4 w-4" />
                </Link>

                <div className="text-center text-[11px] text-muted-foreground mt-3 flex items-center justify-center gap-2">
                  <span>🔒 256-Bit SSL Secured</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="bg-card rounded-2xl border border-border p-4 space-y-2 text-xs">
                {[
                  { icon: "🔒", label: "Secure Checkout Guarantee" },
                  { icon: "🚚", label: "Free shipping on ₹2499+" },
                  { icon: "↩️", label: "7-day easy returns & exchanges" },
                  { icon: "🌱", label: "100% pure organic cotton baby care" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 text-muted-foreground">
                    <span className="text-sm">{icon}</span>
                    <span className="font-medium text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

export const Route = createFileRoute("/cart")({
  component: CartPage,
});
