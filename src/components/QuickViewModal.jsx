import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  X,
  Heart,
  Star,
  Check,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useShop } from "@/context/ShopContext.jsx";

export default function QuickViewModal({ product, open, onClose }) {
  const { addToCart, toggleWishlist, isWishlisted, setCartOpen } = useShop();

  // Gallery array
  const gallery = useMemo(() => {
    if (!product) return [];
    const list = [];
    if (product.image && typeof product.image === "string") list.push(product.image);
    if (Array.isArray(product.gallery)) {
      product.gallery.forEach((img) => {
        const url = typeof img === "string" ? img : img?.url;
        if (url && !list.includes(url)) list.push(url);
      });
    }
    if (Array.isArray(product.colorVariants)) {
      product.colorVariants.forEach((cv) => {
        if (Array.isArray(cv?.images)) {
          cv.images.forEach((img) => {
            const url = typeof img === "string" ? img : img?.url;
            if (url && !list.includes(url)) list.push(url);
          });
        }
      });
    }
    return list.length > 0 ? list : (product.image ? [product.image] : []);
  }, [product]);

  // Colors & Sizes defaults — use product data first, then baby-appropriate fallbacks
  const colors = (product && product.colors && product.colors.length > 0)
    ? product.colors
    : [{ name: "Default", hex: "#E5E7EB" }];
  const sizes = (product && product.sizes && product.sizes.length > 0)
    ? product.sizes
    : ["0-3M", "3-6M", "6-12M", "1-2Y", "2-3Y"];

  // ALL hooks must be called unconditionally before any early return
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);
  const [selectedColor, setSelectedColor] = useState(colors[0].name);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("Reviews");
  const [added, setAdded] = useState(false);

  // Reset image index when modal opens or product changes
  useEffect(() => {
    setSelectedImgIndex(0);
  }, [open, product]);

  // Auto-slide when modal is open and has multiple images
  useEffect(() => {
    if (!open || gallery.length <= 1 || isSlidePaused) return;

    const timer = setInterval(() => {
      setSelectedImgIndex((prev) => (prev + 1) % gallery.length);
    }, 3600);

    return () => clearInterval(timer);
  }, [open, gallery.length, isSlidePaused]);

  const wishlisted = isWishlisted(product?.id);

  // Early return AFTER all hooks
  if (!open || !product) return null;
  const reviewsCountVal = product.reviewCount !== undefined ? Number(product.reviewCount) : 0;
  const ratingVal = reviewsCountVal > 0 ? Number(product.rating || 0).toFixed(1) : "0.0";
  const categoryLabel = product.categoryPill || product.category || "Baby Essentials";
  const skuCode = product.sku || `SUN-${product.id || product._id}`;
  const productTags = Array.isArray(product.tags) ? product.tags : ["Baby", "Cotton", "Organic"];

  const handleAddToCart = () => {
    const success = addToCart(
      {
        ...product,
        variant: `${selectedColor} / ${selectedSize}`,
        selectedColor,
        selectedSize, 
      },
      qty
    );
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
      setCartOpen(true);
    }
  };

  const handleBuyNow = () => {
    const success = addToCart(
      {
        ...product,
        variant: `${selectedColor} / ${selectedSize}`,
        selectedColor,
        selectedSize,
      },
      qty
    );
    if (success) {
      setCartOpen(true);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 md:p-8 shadow-2xl z-10 my-auto max-h-[92vh] overflow-y-auto font-sans text-neutral-900">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 sm:right-5 sm:top-5 z-20 grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-black hover:text-white transition"
          aria-label="Close modal"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* 2-Column Product Detail Layout */}
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-10 items-start">

          {/* LEFT SECTION: Image + 4 Thumbnails + Bottom Tabs */}
          <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6">

            {/* Visuals: Big Main Image + Thumbnails (horizontal scroll on mobile, vertical column on sm+) */}
            <div className="flex flex-col sm:grid sm:grid-cols-12 gap-3 items-stretch">

              {/* Big Main Image (9 cols on sm+) */}
              <div 
                className="sm:col-span-9 relative overflow-hidden rounded-2xl border border-neutral-200 bg-[#f8f9fa] shadow-xs group"
                onMouseEnter={() => setIsSlidePaused(true)}
                onMouseLeave={() => setIsSlidePaused(false)}
                onTouchStart={() => setIsSlidePaused(true)}
                onTouchEnd={() => setIsSlidePaused(false)}
              >
                <img
                  key={selectedImgIndex}
                  src={gallery[selectedImgIndex] || product.image}
                  alt={product.name}
                  className="h-56 sm:h-[340px] md:h-[400px] w-full object-contain p-2 transition-all duration-300 animate-in fade-in"
                />

                {/* Slideshow Arrows */}
                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedImgIndex((prev) => (prev - 1 + gallery.length) % gallery.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full bg-white/90 shadow text-neutral-700 hover:text-black hover:scale-110 active:scale-95 transition opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                      aria-label="Previous"
                    >
                      <ChevronLeft className="h-4 w-4 -ml-0.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImgIndex((prev) => (prev + 1) % gallery.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full bg-white/90 shadow text-neutral-700 hover:text-black hover:scale-110 active:scale-95 transition opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                      aria-label="Next"
                    >
                      <ChevronRight className="h-4 w-4 -mr-0.5" />
                    </button>
                  </>
                )}

                {product.badge && (
                  <span className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 rounded-full bg-black px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold text-white shadow">
                    {product.badge}
                  </span>
                )}

                {/* Wishlist Button Overlay */}
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`absolute right-2.5 top-2.5 sm:right-3 sm:top-3 z-10 grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full border border-neutral-200 bg-white/90 shadow backdrop-blur-xs transition hover:scale-110 cursor-pointer ${
                    wishlisted ? "text-rose-500" : "text-neutral-600 hover:text-rose-500"
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill={wishlisted ? "currentColor" : "none"} />
                </button>
              </div>

              {/* 4 Thumbnails (Horizontal on mobile, vertical column on sm+) */}
              {gallery.length > 1 && (
                <div className="sm:col-span-3 flex sm:flex-col justify-start sm:justify-between gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scrollbar-none">
                  {gallery.slice(0, 4).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImgIndex(idx)}
                      className={`relative w-14 sm:w-full aspect-square shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                        selectedImgIndex === idx
                          ? "border-black ring-2 ring-black/10 scale-102"
                          : "border-neutral-200 opacity-75 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="h-full w-full object-cover object-top"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* TAB NAVIGATION: Details | Reviews | Discussion */}
            <div className="mt-2">
              <div className="flex items-center gap-4 sm:gap-6 border-b border-neutral-200 pb-2 overflow-x-auto">
                {["Details", "Reviews", "Discussion"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative pb-2 text-sm sm:text-base font-extrabold tracking-tight transition-colors whitespace-nowrap ${
                      activeTab === tab ? "text-black" : "text-neutral-400 hover:text-neutral-700"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <span className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-black" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="pt-3 text-xs leading-relaxed text-neutral-600">
                {activeTab === "Details" && (
                  <p>{product.description || "Expertly crafted tailored design made for maximum comfort and sharp modern style."}</p>
                )}
                {activeTab === "Reviews" && (
                  <div className="space-y-3">
                    {reviewsCountVal > 0 ? (
                      <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 border border-neutral-200">
                        <span className="text-xl sm:text-2xl font-extrabold text-black">{ratingVal}</span>
                        <div>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(Number(ratingVal)) ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200"}`} />
                            ))}
                          </div>
                          <span className="text-[11px] text-neutral-500">Based on {reviewsCountVal} {reviewsCountVal === 1 ? "review" : "reviews"}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-neutral-50 p-4 border border-dashed border-neutral-200 text-center text-neutral-500 text-xs font-medium">
                        No customer reviews yet.
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "Discussion" && (
                  <div className="rounded-xl bg-neutral-50 p-3 border border-neutral-200 space-y-1">
                    <p className="font-bold text-black">Q: Is this true to size?</p>
                    <p>A: Yes! Order your regular size for an oversize fit.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SECTION: Details & Purchase Controls */}
          <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-5">

            {/* Category Tag */}
            <div>
              <span className="inline-block rounded-full bg-[#f3f4f6] px-3 py-0.5 sm:px-3.5 sm:py-1 text-[11px] sm:text-xs font-bold text-[#4b5563]">
                {categoryLabel}
              </span>
            </div>

            {/* Title */}
            <div>
              <Link
                to="/product/$productId"
                params={{ productId: String(product.id) }}
                onClick={onClose}
                className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900 leading-snug hover:text-neutral-700 transition"
              >
                {product.name}
              </Link>

              {/* Rating */}
              <div className="mt-1.5 flex items-center gap-2">
                {reviewsCountVal > 0 ? (
                  <>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                            i < Math.floor(Number(ratingVal))
                              ? "fill-amber-400 text-amber-400"
                              : "fill-neutral-200 text-neutral-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-neutral-500">
                      ({ratingVal} from {reviewsCountVal} {reviewsCountVal === 1 ? "Review" : "Reviews"})
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] sm:text-xs font-medium text-neutral-400">
                    No reviews yet
                  </span>
                )}
              </div>
            </div>

            {/* Price Row */}
            <div className="flex items-end gap-3 border-y border-border py-3 sm:py-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Price</span>
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  ₹{product.price}.00
                </span>
              </div>
              {product.mrp && product.mrp > product.price && (
                <div className="mb-1 text-xs sm:text-sm font-bold text-muted-foreground line-through">
                  ₹{product.mrp}.00
                </div>
              )}
            </div>

            {/* Color & Quantity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] sm:text-xs font-extrabold text-neutral-900 uppercase tracking-wider mb-1.5">
                  Available Color
                </label>
                <div className="flex items-center gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full transition-all ${
                        selectedColor === c.name
                          ? "ring-2 ring-black ring-offset-2 scale-110"
                          : "border border-neutral-300 hover:scale-105"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-extrabold text-neutral-900 uppercase tracking-wider mb-1.5">
                  Quantity
                </label>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full bg-black text-white hover:bg-neutral-800 transition active:scale-95 shadow-xs cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-extrabold">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full bg-black text-white hover:bg-neutral-800 transition active:scale-95 shadow-xs cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Size */}
            <div className="pt-1">
              <label className="block text-[11px] sm:text-xs font-extrabold text-neutral-900 uppercase tracking-wider mb-1.5">
                Available Size
              </label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                      selectedSize === sz
                        ? "bg-black text-white shadow-xs"
                        : "border border-neutral-300 bg-white text-neutral-800 hover:border-black"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleBuyNow}
                className="w-full rounded-full bg-black py-3 sm:py-3.5 text-xs font-extrabold text-white uppercase tracking-wider shadow-md hover:bg-neutral-800 transition active:scale-98 cursor-pointer"
              >
                BUY IT NOW
              </button>

              <button
                onClick={handleAddToCart}
                className={`w-full rounded-full border-2 border-black py-3 sm:py-3.5 text-xs font-extrabold uppercase tracking-wider transition active:scale-98 cursor-pointer ${
                  added
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-white text-black hover:bg-black hover:text-white"
                }`}
              >
                {added ? "✓ ADDED TO CART" : "ADD TO CART"}
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-200 my-0.5" />

            {/* Metadata */}
            <div className="space-y-1 text-xs text-neutral-600">
              <p><strong className="font-extrabold text-neutral-900">SKU:</strong> {skuCode}</p>
              <p><strong className="font-extrabold text-neutral-900">Tags:</strong> {productTags.join(", ")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
