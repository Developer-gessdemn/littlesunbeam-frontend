import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  Heart,
  Eye,
  ArrowRight,
  Check,
} from "lucide-react";
import { useShop } from "@/context/ShopContext.jsx";

export default function WatchToShopSlider() {
  const { products, addToCart, toggleWishlist, isWishlisted } = useShop();
  const navigate = useNavigate();

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [playingState, setPlayingState] = useState({}); // { [productId]: boolean }
  const [addedItem, setAddedItem] = useState(null);

  // Filter only products that have videos
  const videoProducts = useMemo(() => {
    return (products || []).filter((p) => {
      const hasVideosArr = Array.isArray(p.videos) && p.videos.length > 0 && p.videos.some((v) => Boolean(v && v.trim()));
      const hasSingleVideo = Boolean(p.video && p.video.trim());
      const isActive = p.isActive !== false && p.status !== "Draft" && p.status !== "Archived";
      return (hasVideosArr || hasSingleVideo) && isActive;
    });
  }, [products]);

  // Fallback demo video products if none uploaded yet (to wow the user)
  const displayProducts = useMemo(() => {
    if (videoProducts.length > 0) return videoProducts;

    // Curated high quality baby clothing sample video items
    return [
      {
        _id: "demo-video-1",
        id: "demo-video-1",
        name: "Organic Muslin Baby Swaddle Wrap",
        price: 499,
        mrp: 699,
        discount: 28,
        image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80",
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"],
        category: "Hospital Kit",
      },
      {
        _id: "demo-video-2",
        id: "demo-video-2",
        name: "Pure Cotton Unisex Romper - Pastel Sky",
        price: 649,
        mrp: 899,
        discount: 27,
        image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80",
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"],
        category: "Muslin Baby Essentials",
      },
      {
        _id: "demo-video-3",
        id: "demo-video-3",
        name: "Hooded Organic Towel with Bear Ears",
        price: 799,
        mrp: 1199,
        discount: 33,
        image: "https://images.unsplash.com/photo-1584839610506-57c517453dd0?auto=format&fit=crop&w=600&q=80",
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"],
        category: "Blankets & Towels",
      },
      {
        _id: "demo-video-4",
        id: "demo-video-4",
        name: "Newborn 7-Piece Hospital Welcome Kit",
        price: 1499,
        mrp: 2199,
        discount: 31,
        image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=600&q=80",
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
        videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4"],
        category: "Hospital Kit",
      },
    ];
  }, [videoProducts]);

  // Check scroll positions for left/right arrows
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [displayProducts]);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.querySelector("div")?.offsetWidth || 280;
    const scrollAmount = (cardWidth + 16) * (direction === "left" ? -1 : 1);
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    setTimeout(checkScroll, 300);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    e.preventDefault();
    addToCart(product);
    setAddedItem(product._id || product.id);
    setTimeout(() => setAddedItem(null), 2000);
  };

  const handleCardClick = (product) => {
    const targetId = product.slug || product._id || product.id;
    navigate({ to: `/product/${targetId}` });
  };

  return (
    <section className="bg-gradient-to-b from-card via-muted/30 to-card py-12 sm:py-16 border-y border-border/60 relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative">
        {/* Header with Title, Badge and Navigation Arrows */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-black text-primary uppercase tracking-wider shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span>Interactive Shopping</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-[11px] font-black text-rose-600 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                Live Reels
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
              Watch to <span className="sun-underline">Shop</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-xl">
              See our organic baby garments in action. Watch real feel videos, explore fit &amp; fabric, and shop your favorites instantly with a single tap.
            </p>
          </div>

          {/* Controls: Sound Toggle & Navigation Arrows */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Global Sound Toggle */}
            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-full bg-card border border-border px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted hover:border-primary/40 transition shadow-xs cursor-pointer"
              title={isMuted ? "Unmute all videos" : "Mute all videos"}
            >
              {isMuted ? (
                <>
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                  <span className="hidden sm:inline">Unmute Audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 text-primary animate-pulse" />
                  <span className="hidden sm:inline text-primary">Sound ON</span>
                </>
              )}
            </button>

            {/* Prev Arrow */}
            <button
              type="button"
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              className="h-10 w-10 rounded-full border border-border bg-card text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition flex items-center justify-center shadow-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer active:scale-95"
              aria-label="Previous video"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Next Arrow */}
            <button
              type="button"
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              className="h-10 w-10 rounded-full border border-border bg-card text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition flex items-center justify-center shadow-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer active:scale-95"
              aria-label="Next video"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Slider Track */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {displayProducts.map((p, idx) => {
            const videoUrl = p.video || (Array.isArray(p.videos) ? p.videos[0] : "") || "";
            const isWished = isWishlisted(p._id || p.id);
            const isAdded = addedItem === (p._id || p.id);
            const discount = p.discount || (p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);

            return (
              <div
                key={p._id || p.id || idx}
                onClick={() => handleCardClick(p)}
                className="group relative flex-none w-[240px] sm:w-[280px] md:w-[300px] aspect-[9/16] rounded-3xl overflow-hidden bg-black border border-border/80 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 snap-start cursor-pointer select-none"
              >
                {/* 1. Background Video */}
                <video
                  src={videoUrl}
                  autoPlay
                  muted={isMuted}
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to product poster image if video fails to stream
                    e.currentTarget.style.display = "none";
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.classList.remove("hidden");
                    }
                  }}
                />

                {/* Poster fallback (hidden unless video errors) */}
                <div
                  className="hidden absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${p.image})` }}
                />

                {/* Dark Gradient Overlay for optimal legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />

                {/* 2. Top Header Overlay */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1 border border-white/10 shadow-xs">
                      <Sparkles className="h-3 w-3 text-sun" />
                      <span>{p.category || "Shop Reel"}</span>
                    </span>
                  </div>

                  {/* Wishlist button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleWishlist(p);
                    }}
                    className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white grid place-items-center transition active:scale-90 cursor-pointer"
                    aria-label="Wishlist"
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${
                        isWished ? "fill-rose-500 text-rose-500" : "text-white"
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Center Play/Sound Pulsing Micro-Indicator on Hover */}
                <div className="absolute inset-0 grid place-items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white grid place-items-center transform scale-90 group-hover:scale-100 transition-transform shadow-xl">
                    <ShoppingBag className="h-5 w-5 text-sun animate-bounce" />
                  </div>
                </div>

                {/* 4. Bottom Product Card Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4 z-10 space-y-2.5">
                  {/* Product Mini Pill */}
                  <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 backdrop-blur-md p-2 border border-white/15 shadow-lg">
                    {/* Thumbnail Image */}
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-12 w-12 rounded-xl object-cover border border-white/20 shrink-0 bg-white/80"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-black text-white line-clamp-1 group-hover:text-sun transition-colors">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-extrabold text-white">
                          ₹{p.price}
                        </span>
                        {p.mrp > p.price && (
                          <span className="text-[10px] text-white/60 line-through">
                            ₹{p.mrp}
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
                      params={{ productId: p.slug || p._id || p.id }}
                      onClick={(e) => e.stopPropagation()}
                      className="col-span-4 flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 text-xs font-black transition-all shadow-md active:scale-95 group/btn"
                    >
                      <span>Shop Now</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>

                    {/* Quick Add to Cart Button */}
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(e, p)}
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
          })}
        </div>
      </div>
    </section>
  );
}
