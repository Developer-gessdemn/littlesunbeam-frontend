import { useState } from "react";
import { X, Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useShop } from "@/context/ShopContext.jsx";

export default function WishlistDrawer({ open, onClose }) {
  const { wishlist, removeFromWishlist, addToCart } = useShop();

  const handleMoveToCart = (item) => {
    const success = addToCart(item);
    if (success) {
      removeFromWishlist(item.id);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-cream px-5 py-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" fill="currentColor" />
            <h2 className="text-lg font-extrabold">My Wishlist</h2>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-xs font-bold text-white">
              {wishlist.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close wishlist"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {wishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <Heart className="h-16 w-16 text-rose-200" />
              <p className="text-muted-foreground font-semibold">Your wishlist is empty</p>
              <p className="text-sm text-muted-foreground">
                Browse our shop and click the{" "}
                <Heart className="inline h-4 w-4 text-rose-400" /> icon to save favourites.
              </p>
              <button
                onClick={onClose}
                className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/85"
              >
                Shop Now
              </button>
            </div>
          ) : (
            wishlist.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-2xl border border-border bg-card p-3"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                />
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-sm font-bold leading-snug">{item.name}</p>
                  {item.variant && (
                    <p className="text-xs text-muted-foreground">{item.variant}</p>
                  )}
                  <p className="text-sm font-extrabold text-primary">₹{item.price}</p>
                  <div className="mt-auto flex items-center gap-2">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/85"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Move to Cart
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {wishlist.length > 0 && (
          <div className="border-t border-border bg-cream px-5 py-4">
            <button
              onClick={onClose}
              className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/85 transition"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
