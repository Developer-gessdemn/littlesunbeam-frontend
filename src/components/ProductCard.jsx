import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useShop } from "@/context/ShopContext.jsx";

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, isWishlisted } = useShop();
  const [added, setAdded] = useState(false);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const wishlisted = isWishlisted(product?.id || product?._id);
  const discount = product.mrp
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  // Extract and combine all available images (primary image, gallery, color variants)
  const cardImages = useMemo(() => {
    const list = [];
    if (product?.image && typeof product.image === "string") {
      list.push(product.image);
    }
    if (Array.isArray(product?.gallery)) {
      product.gallery.forEach((img) => {
        const url = typeof img === "string" ? img : img?.url;
        if (url && !list.includes(url)) list.push(url);
      });
    }
    if (Array.isArray(product?.colorVariants)) {
      product.colorVariants.forEach((cv) => {
        if (Array.isArray(cv?.images)) {
          cv.images.forEach((img) => {
            const url = typeof img === "string" ? img : img?.url;
            if (url && !list.includes(url)) list.push(url);
          });
        }
      });
    }
    return list.length > 0 ? list : [product?.image || "/placeholder.jpg"];
  }, [product]);

  // Automatic slideshow for card images (pauses on hover)
  useEffect(() => {
    if (cardImages.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentImgIdx((prev) => (prev + 1) % cardImages.length);
    }, 3600);

    return () => clearInterval(timer);
  }, [cardImages.length, isHovered]);

  const handlePrevImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev - 1 + cardImages.length) % cardImages.length);
  };

  const handleNextImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev + 1) % cardImages.length);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const success = addToCart(product);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const productIdStr = String(product?._id || product?.id || "");

  return (
    <div 
      className="card-lift group relative flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-card shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Clickable Image Link Container */}
      <Link
        to="/product/$productId"
        params={{ productId: productIdStr }}
        className="relative block overflow-hidden bg-neutral-100 aspect-square w-full"
      >
        <img
          key={currentImgIdx}
          src={cardImages[currentImgIdx] || product.image}
          alt={product.name}
          className="h-full w-full object-contain p-2 sm:p-3 transition-transform duration-500 group-hover:scale-105 select-none animate-in fade-in"
        />

        {/* Slideshow Arrows (Always accessible on touch / on hover on desktop) */}
        {cardImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImg}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-white/95 shadow-md backdrop-blur-xs text-neutral-800 hover:text-black hover:bg-white hover:scale-110 active:scale-95 transition opacity-70 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 -ml-0.5" />
            </button>

            <button
              type="button"
              onClick={handleNextImg}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-white/95 shadow-md backdrop-blur-xs text-neutral-800 hover:text-black hover:bg-white hover:scale-110 active:scale-95 transition opacity-70 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 -mr-0.5" />
            </button>

          </>
        )}

        {/* Badge */}
        {product.badge && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-black px-2 py-0.5 text-[9px] font-bold text-white shadow sm:left-2.5 sm:top-2.5 sm:px-2.5 sm:text-[10px]">
            {product.badge}
          </span>
        )}

        {/* Discount badge */}
        {discount > 0 && !product.badge && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-sun px-2 py-0.5 text-[9px] font-bold text-foreground shadow sm:left-2.5 sm:top-2.5 sm:px-2.5 sm:text-[10px]">
            {discount}% OFF
          </span>
        )}

        {/* Wishlist button — always visible, touch-friendly */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full border border-border bg-background/90 shadow transition hover:scale-110 sm:right-2.5 sm:top-2.5 sm:h-8 sm:w-8 cursor-pointer ${
            wishlisted ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
          }`}
        >
          <Heart
            className="h-3 w-3 transition-transform sm:h-3.5 sm:w-3.5"
            fill={wishlisted ? "currentColor" : "none"}
          />
        </button>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-2 sm:gap-1.5 sm:p-2.5 md:p-3">
        <Link
          to="/product/$productId"
          params={{ productId: productIdStr }}
          className="line-clamp-2 text-[11px] font-semibold leading-snug hover:text-primary transition-colors sm:text-xs md:text-sm"
        >
          {product.name}
        </Link>

        {/* Stars / Reviews */}
        <div className="flex items-center gap-1 min-h-[14px]">
          {Number(product.reviewCount) > 0 ? (
            <>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-2 w-2 sm:h-2.5 sm:w-2.5 ${
                      i < Math.floor(product.rating || 0)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-neutral-200 text-neutral-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[8px] text-muted-foreground font-medium sm:text-[9px]">
                ({Number(product.rating || 0).toFixed(1)})
              </span>
            </>
          ) : (
            <span className="text-[8px] text-muted-foreground/60 font-medium sm:text-[9px]">
              No reviews yet
            </span>
          )}
        </div>

        {/* Price row */}
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-0.5 sm:gap-1.5 sm:pt-1">
          <span className="text-xs font-extrabold text-foreground sm:text-sm md:text-base">
            ₹{product.price}.00
          </span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-[9px] text-muted-foreground line-through sm:text-[10px]">
              ₹{product.mrp}.00
            </span>
          )}
          {discount > 0 && (
            <span className="ml-auto rounded-full bg-sun/30 px-1.5 py-0.5 text-[8px] font-bold text-foreground sm:text-[9px]">
              {discount}% off
            </span>
          )}
        </div>

        {/* Full-width Add to Cart CTA button */}
        <div className="mt-2 sm:mt-3">
          <button
            onClick={handleAddToCart}
            className={`w-full flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl py-2 sm:py-2.5 text-xs sm:text-sm font-bold shadow-xs transition active:scale-98 cursor-pointer ${
              added
                ? "bg-emerald-600 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/85"
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>{added ? "Added to Cart!" : "Add to Cart"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
