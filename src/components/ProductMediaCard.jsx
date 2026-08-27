import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Heart,
  ShoppingBag,
  ArrowRight,
  Check,
  VideoOff,
} from "lucide-react";
import { cn, isInstagramUrl, resolveInstagramVideoUrl } from "@/lib/utils.js";

export default function ProductMediaCard({
  product,
  videoUrl: explicitVideoUrl,
  isMuted = true,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  onClick,
  className = "",
}) {
  const [isAdded, setIsAdded] = useState(false);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState(null);
  const [resolvedThumbnailUrl, setResolvedThumbnailUrl] = useState(null);
  const [isFallbackNeeded, setIsFallbackNeeded] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState("");

  if (!product) return null;

  const rawVideoUrl =
    explicitVideoUrl ||
    product.video ||
    (Array.isArray(product.videos) ? product.videos[0] : "") ||
    "";

  useEffect(() => {
    let isMounted = true;
    if (!rawVideoUrl) {
      setResolvedVideoUrl(null);
      setIsFallbackNeeded(false);
      return;
    }

    if (!isInstagramUrl(rawVideoUrl)) {
      // Direct uploaded video file URL (MP4, WebM, blob, Cloudinary, AWS S3)
      setResolvedVideoUrl(rawVideoUrl);
      setIsFallbackNeeded(false);
      return;
    }

    // Instagram Reel/Post URL - resolve direct playable video source via backend
    resolveInstagramVideoUrl(rawVideoUrl)
      .then((res) => {
        if (!isMounted) return;
        if (res.resolvedVideoUrl) {
          setResolvedVideoUrl(res.resolvedVideoUrl);
          setResolvedThumbnailUrl(res.thumbnailUrl || null);
          setIsFallbackNeeded(false);
        } else {
          setResolvedVideoUrl(null);
          setResolvedThumbnailUrl(res.thumbnailUrl || null);
          setIsFallbackNeeded(true);
          setFallbackMessage(res.message || "Instagram video cannot be autoplayed.");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setResolvedVideoUrl(null);
        setIsFallbackNeeded(true);
        setFallbackMessage("Instagram video cannot be autoplayed.");
      });

    return () => {
      isMounted = false;
    };
  }, [rawVideoUrl]);

  const discount =
    product.discount ||
    (product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0);

  const handleCartClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onAddToCart) {
      onAddToCart(e, product);
    }
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggleWishlist) {
      onToggleWishlist(e, product);
    }
  };

  return (
    <div
      onClick={() => onClick && onClick(product)}
      className={cn(
        "product-media-card group relative flex-none w-[240px] sm:w-[280px] md:w-[300px] aspect-[9/16] rounded-[24px] overflow-hidden bg-black border border-border/80 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 snap-start cursor-pointer select-none",
        className
      )}
    >
      {/* 1. Playable Video Container (Native HTML5 Video for both uploaded & resolved Instagram videos) */}
      {resolvedVideoUrl ? (
        <video
          src={resolvedVideoUrl}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="auto"
          className="product-media-video h-full w-full object-cover block transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            // Fallback to poster image if direct video stream fails
            e.currentTarget.style.display = "none";
            if (e.currentTarget.nextElementSibling) {
              e.currentTarget.nextElementSibling.classList.remove("hidden");
            }
          }}
        />
      ) : isFallbackNeeded ? (
        /* Styled Showcase Card for Instagram — uses scraped thumbnail if available */
        <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
          {/* Thumbnail background — prefer scraped og:image, fallback to product image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${resolvedThumbnailUrl || product.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" />
          <div className="relative z-10 flex flex-col items-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white grid place-items-center shadow-lg border-2 border-white/30">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-black uppercase tracking-wider">
              Instagram Post Showcase
            </span>
            {/* Watch on Instagram button */}
            <a
              href={rawVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-1 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 px-4 py-2 text-[11px] font-black text-white shadow-lg hover:scale-105 transition-transform active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Watch on Instagram
            </a>
          </div>
        </div>
      ) : (
        /* Loading Background Poster while resolving */
        <div
          className="absolute inset-0 bg-cover bg-center animate-pulse"
          style={{ backgroundImage: `url(${product.image})` }}
        />
      )}

      {/* Poster Fallback Image (hidden unless video errors) */}
      <div
        className="hidden absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${product.image})` }}
      />

      {/* Dark Legibility Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />

      {/* 2. Top Header Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1 border border-white/10 shadow-xs">
            <Sparkles className="h-3 w-3 text-sun" />
            <span>
              {isInstagramUrl(rawVideoUrl)
                ? "Instagram Post Showcase"
                : product.category || "Shop Reel"}
            </span>
          </span>
        </div>

        {/* Wishlist button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white grid place-items-center transition active:scale-90 cursor-pointer"
          aria-label="Wishlist"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isWishlisted ? "fill-rose-500 text-rose-500" : "text-white"
            }`}
          />
        </button>
      </div>

      {/* 3. Center Hover Play/Shopping Micro-Indicator */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white grid place-items-center transform scale-90 group-hover:scale-100 transition-transform shadow-xl">
          <ShoppingBag className="h-5 w-5 text-sun animate-bounce" />
        </div>
      </div>

      {/* 4. Bottom Product Card Details Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4 z-10 space-y-2.5">
        {/* Product Mini Info Pill */}
        <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 backdrop-blur-md p-2 border border-white/15 shadow-lg">
          {/* Thumbnail Image */}
          <img
            src={product.image}
            alt={product.name}
            className="h-12 w-12 rounded-xl object-cover border border-white/20 shrink-0 bg-white/80"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-black text-white line-clamp-1 group-hover:text-sun transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-extrabold text-white">
                ₹{product.price}
              </span>
              {product.mrp > product.price && (
                <span className="text-[10px] text-white/60 line-through">
                  ₹{product.mrp}
                </span>
              )}
              {discount > 0 && (
                <span className="text-[9px] font-black text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded-md">
                  {discount}% OFF
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-5 gap-2">
          {/* Shop Now Primary Button */}
          <Link
            to="/product/$productId"
            params={{ productId: product.slug || product._id || product.id }}
            onClick={(e) => e.stopPropagation()}
            className="col-span-4 flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 text-xs font-black transition-all shadow-md active:scale-95 group/btn"
          >
            <span>Shop Now</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>

          {/* Quick Add to Cart Button */}
          <button
            type="button"
            onClick={handleCartClick}
            className={`col-span-1 flex items-center justify-center rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${
              isAdded
                ? "bg-emerald-500 text-white"
                : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20"
            }`}
            title="Add to Cart"
          >
            {isAdded ? (
              <Check className="h-4 w-4 stroke-[3]" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
