import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Star, Check, Heart, MessageSquareQuote, Sparkles } from "lucide-react";
import { API_BASE_URL } from "@/lib/utils.js";

export default function CustomerReviewsCarousel() {
  const [reviews, setReviews] = useState([]);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch verified customer reviews from backend API
  const fetchGlobalReviews = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews?limit=15`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.data?.reviews)) {
          setReviews(data.data.reviews);
          return;
        }
      }
      setReviews([]);
    } catch {
      setReviews([]);
    }
  }, []);

  useEffect(() => {
    fetchGlobalReviews();
  }, [fetchGlobalReviews]);

  // If there are no real reviews submitted by customers yet, do not display dummy data
  if (!reviews || reviews.length === 0) {
    return null;
  }

  // Ensure there are at least 6 items by repeating real customer reviews to make the seamless infinite track loop smoothly
  let listToRepeat = [...reviews];
  while (listToRepeat.length < 6) {
    listToRepeat = [...listToRepeat, ...reviews];
  }

  // Duplicate items for seamless 50% translation continuous infinite loop
  const infiniteReviews = [...listToRepeat, ...listToRepeat];

  return (
    <section className="relative w-full py-12 sm:py-16 overflow-hidden bg-gradient-to-b from-white via-[#FAFBFD] to-white dark:from-background dark:via-card/30 dark:to-background border-y border-border/40">
      {/* Header Info */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sun/20 border border-sun/40 px-3.5 py-1 text-xs font-bold text-sun-foreground shadow-2xs animate-in fade-in">
          <Heart className="h-3.5 w-3.5 fill-sun text-sun animate-pulse" />
          <span>Verified Parent Reviews</span>
        </div>

        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl text-foreground">
          What Our <span className="sun-underline">Customers Say</span>
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
          Real stories and honest ratings from parents who chose Little Sunbeam organic comfort for their little ones
        </p>
      </div>

      {/* Infinite Seamless Scrolling Track Container */}
      <div
        className="marquee-wrapper relative w-full overflow-hidden select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Left & Right Soft Blur Gradients for Edge Transition */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-28 bg-gradient-to-r from-[#FAFBFD] via-[#FAFBFD]/80 to-transparent dark:from-background dark:via-background/80 z-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-28 bg-gradient-to-l from-[#FAFBFD] via-[#FAFBFD]/80 to-transparent dark:from-background dark:via-background/80 z-20" />

        {/* Continuous 1-Direction Moving Track */}
        <div
          className="animate-smooth-marquee flex items-stretch gap-5 sm:gap-6 py-4 px-2"
          style={{
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          {infiniteReviews.map((rev, index) => {
            const revId = `${rev._id || rev.id || index}-${index}`;
            const authorName = rev.user?.name || "Verified Parent";
            const formattedDate = rev.createdAt
              ? new Date(rev.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recent";

            return (
              <div
                key={revId}
                className="w-[290px] sm:w-[350px] md:w-[380px] shrink-0 flex flex-col justify-between rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xs p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:-translate-y-1.5"
              >
                <div className="space-y-3.5">
                  {/* Card Header: Avatar, Name, Verified Badge & Date */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary border border-primary/20 font-black text-sm shadow-2xs">
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-black text-foreground truncate">
                          {authorName}
                        </h4>
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="h-3 w-3 stroke-[3]" /> Verified Buyer
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground shrink-0">
                      {formattedDate}
                    </span>
                  </div>

                  {/* Star Rating Badge */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < (rev.rating || 5)
                              ? "fill-sun text-sun"
                              : "fill-muted text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-black text-foreground/80">
                      {Number(rev.rating || 5).toFixed(1)}
                    </span>
                  </div>

                  {/* Review Text */}
                  <div className="relative pt-1">
                    <MessageSquareQuote className="absolute -left-1 -top-1.5 h-5 w-5 text-muted-foreground/15 -z-0" />
                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed italic line-clamp-4 relative z-10 pl-2">
                      "{rev.comment}"
                    </p>
                  </div>
                </div>

                {/* Optional Attached Product Chip */}
                {rev.product && (
                  <div className="mt-4 pt-3 border-t border-border/50">
                    {rev.product._id || rev.product.id || rev.product.slug ? (
                      <Link
                        to="/product/$productId"
                        params={{
                          productId: String(rev.product._id || rev.product.slug || rev.product.id),
                        }}
                        className="flex items-center gap-2.5 rounded-2xl bg-secondary/40 hover:bg-secondary/80 p-2 border border-border/50 transition group cursor-pointer"
                      >
                        {rev.product.image && (
                          <img
                            src={rev.product.image}
                            alt={rev.product.name}
                            className="h-9 w-9 rounded-xl object-cover border border-border/40 shrink-0 bg-white"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black text-foreground truncate group-hover:text-primary transition">
                            {rev.product.name}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground">
                            {rev.product.category ? `${rev.product.category} · ` : ""}₹{rev.product.price}
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2 rounded-2xl bg-secondary/30 p-2 border border-border/40">
                        <Sparkles className="h-3.5 w-3.5 text-sun shrink-0" />
                        <span className="text-[10px] font-bold text-muted-foreground truncate">
                          {rev.product.name}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtle interaction tip */}
      <div className="mt-3 text-center">
        <span className="text-[10px] font-semibold text-muted-foreground/70 tracking-wide uppercase">
          ✦ Hover or touch to pause review ✦
        </span>
      </div>
    </section>
  );
}
