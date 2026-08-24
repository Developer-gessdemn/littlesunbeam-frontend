import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
} from "lucide-react";
import { useShop } from "@/context/ShopContext.jsx";

const FREE_SHIPPING_THRESHOLD = 2499;

export default function CartDrawer({ open, onClose }) {
  const { cart, cartCount, updateCartQty, removeFromCart } = useShop();
  const navigate = useNavigate();

  // Calculate subtotal
  const subtotal = cart.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
    0
  );
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min(
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100,
    100
  );

  // Close on Escape key & Lock body scroll
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleCheckout = () => {
    onClose();
    navigate({ to: "/checkout" });
  };

  const handleViewCart = () => {
    onClose();
    navigate({ to: "/cart" });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <aside
        className="fixed right-0 top-0 bottom-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl animate-in slide-in-from-right duration-300 border-l border-border"
        aria-label="Shopping Cart Drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground leading-none">
                Shopping Cart
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-muted/80 text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-muted/80 text-muted-foreground">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/60" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-foreground">
                  Your cart is empty
                </h3>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  Looks like you haven't added any soft baby essentials to your cart yet!
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  navigate({ to: "/shop" });
                }}
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-extrabold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-95"
              >
                Start Shopping <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            cart.map((item, idx) => {
              const itemKey = item.cartItemId || item.id || item._id || idx;
              const productLink = item.productId || item._id || item.id;
              const unitPrice = Number(item.price) || 0;
              const qty = Number(item.qty) || 1;
              const itemSubtotal = unitPrice * qty;

              return (
                <div
                  key={itemKey}
                  className="group relative flex gap-3.5 rounded-2xl border border-border bg-card p-3 shadow-xs transition hover:shadow-md"
                >
                  {/* Thumbnail */}
                  <Link
                    to="/product/$productId"
                    params={{ productId: String(productLink) }}
                    onClick={onClose}
                    className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted border border-border/50"
                  >
                    <img
                      src={
                        item.image ||
                        (item.gallery && item.gallery[0]) ||
                        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80"
                      }
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to="/product/$productId"
                          params={{ productId: String(productLink) }}
                          onClick={onClose}
                          className="line-clamp-1 text-xs font-extrabold text-foreground hover:text-primary transition-colors"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeFromCart(itemKey)}
                          className="text-muted-foreground hover:text-destructive transition p-1 -mr-1 -mt-1 rounded-md"
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {item.variant && (
                        <span className="inline-block mt-0.5 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {item.variant}
                        </span>
                      )}
                    </div>

                    {/* Price & Quantity Controls */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-border/40">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-primary">
                          ₹{unitPrice.toLocaleString()}
                        </span>
                        {qty > 1 && (
                          <span className="text-[10px] text-muted-foreground">
                            × {qty} = <span className="font-bold text-foreground">₹{itemSubtotal.toLocaleString()}</span>
                          </span>
                        )}
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center rounded-full border border-border bg-muted/60 p-0.5 shadow-2xs">
                        <button
                          onClick={() => updateCartQty(itemKey, -1)}
                          className="grid h-6 w-6 place-items-center rounded-full bg-card text-foreground shadow-2xs transition hover:bg-muted active:scale-95"
                          title="Decrease quantity"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-extrabold text-foreground">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateCartQty(itemKey, 1)}
                          className="grid h-6 w-6 place-items-center rounded-full bg-card text-foreground shadow-2xs transition hover:bg-muted active:scale-95"
                          title="Increase quantity"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Subtotal & Actions */}
        {cart.length > 0 && (
          <div className="border-t border-border bg-card p-5 space-y-3 shadow-lg">
            {/* Price Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Shipping</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="flex items-center justify-between text-base font-extrabold text-foreground pt-1 border-t border-border/50">
                <span>Total Amount</span>
                <span className="text-xl font-black text-primary">
                  ₹{subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleViewCart}
                className="flex items-center justify-center gap-1.5 rounded-full border border-border bg-background py-2.5 text-xs font-extrabold text-foreground hover:bg-muted transition active:scale-98"
              >
                View Full Cart
              </button>
              <button
                onClick={handleCheckout}
                className="flex items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-xs font-extrabold text-primary-foreground shadow-md hover:bg-primary/90 transition active:scale-98"
              >
                Checkout <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Trust Footer */}
            <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" /> 256-Bit SSL Checkout
              </span>
              <span>•</span>
              <span>7-Day Easy Returns</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
