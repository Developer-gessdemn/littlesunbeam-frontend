import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useShop } from "@/context/ShopContext.jsx";
import ProductMediaCard from "@/components/ProductMediaCard.jsx";

export default function WatchToShopSlider() {
  const { products, addToCart, toggleWishlist, isWishlisted } = useShop();
  const navigate = useNavigate();

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Filter only products that have videos
  const videoProducts = useMemo(() => {
    return (products || []).filter((p) => {
      const hasVideosArr = Array.isArray(p.videos) && p.videos.length > 0 && p.videos.some((v) => Boolean(v && v.trim()));
      const hasSingleVideo = Boolean(p.video && p.video.trim());
      const isActive = p.isActive !== false && p.status !== "Draft" && p.status !== "Archived";
      return (hasVideosArr || hasSingleVideo) && isActive;
    });
  }, [products]);

  // Fallback demo video products if none uploaded yet (supporting Instagram reel + direct MP4 videos)
  const displayProducts = useMemo(() => {
    if (videoProducts.length > 0) return videoProducts;

    // Curated sample video items: Item 1 is an Instagram Reel link; Item 2+ are direct uploaded MP4 videos
    return [
      {
        _id: "demo-video-1",
        id: "demo-video-1",
        name: "Organic Muslin Baby Swaddle Wrap",
        price: 499,
        mrp: 699,
        discount: 28,
        image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80",
        video: "https://www.instagram.com/reel/C-X81234567/",
        videos: ["https://www.instagram.com/reel/C-X81234567/"],
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
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"],
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
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"],
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
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        videos: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"],
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
    addToCart(product);
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
                Instagram Post Showcase
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
            const isWished = isWishlisted(p._id || p.id);

            return (
              <ProductMediaCard
                key={p._id || p.id || idx}
                product={p}
                isMuted={isMuted}
                onAddToCart={handleAddToCart}
                onToggleWishlist={(e, prod) => toggleWishlist(prod)}
                isWishlisted={isWished}
                onClick={handleCardClick}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

