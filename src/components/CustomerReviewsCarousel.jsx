import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Star, ChevronLeft, ChevronRight, Check, Heart, MessageSquareQuote } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function CustomerReviewsCarousel() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  // Fetch verified customer reviews from backend API
  const fetchGlobalReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/reviews?limit=12`);
      if (res.ok) {
        const data = await res.json();
        if (data?.data?.reviews) {
          setReviews(data.data.reviews);
        }
      }
    } catch (err) {
      console.error("Error fetching home page reviews:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalReviews();
  }, [fetchGlobalReviews]);

  // Determine items per page based on window size
  const [cardsPerPage, setCardsPerPage] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCardsPerPage(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerPage(2);
      } else {
        setCardsPerPage(3);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalCards = reviews.length;
  const maxPages = Math.ceil(totalCards / cardsPerPage) || 1;
  const safeIndex = Math.min(Math.max(0, currentIndex), maxPages - 1);

  const goTo = useCallback(
    (pageIdx) => {
      setCurrentIndex(((pageIdx % maxPages) + maxPages) % maxPages);
    },
    [maxPages]
  );

  const next = useCallback(() => goTo(safeIndex + 1), [safeIndex, goTo]);
  const prev = useCallback(() => goTo(safeIndex - 1), [safeIndex, goTo]);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (paused || totalCards <= cardsPerPage) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [paused, next, totalCards, cardsPerPage]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            Loved by <span className="sun-underline">Parents</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Loading reviews...</p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-3xl border border-border bg-card/60 p-6 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  // Calculate visible slice of reviews
  const startIndex = safeIndex * cardsPerPage;
  const visibleReviews = reviews.slice(startIndex, startIndex + cardsPerPage);

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-10 sm:py-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sun/20 px-3.5 py-1 text-xs font-bold text-sun-foreground">
            <Heart className="h-3.5 w-3.5 fill-sun text-sun" /> Verified Parent Reviews
          </span>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl text-foreground">
            What Our <span className="sun-underline">Customers Say</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Real stories and ratings from parents who chose Little Sunbeam organic comfort
          </p>
        </div>

        {/* Carousel Navigation Arrows */}
        {maxPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              aria-label="Previous customer reviews"
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground shadow-xs hover:bg-secondary hover:text-primary transition cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next customer reviews"
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground shadow-xs hover:bg-secondary hover:text-primary transition cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Cards Container */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-500">
        {visibleReviews.map((rev) => {
          const revId = rev._id || rev.id;
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
              className="card-lift flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-xs hover:shadow-md transition duration-300"
            >
              <div className="space-y-4">
                {/* Header: Avatar, Name, Verified Badge, Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-xs">
                      {authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-foreground">{authorName}</h4>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="h-3 w-3" /> Verified Buyer
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{formattedDate}</span>
                </div>

                {/* Star Rating */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < (rev.rating || 5)
                          ? "fill-sun text-sun"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-muted-foreground ml-1.5">
                    {Number(rev.rating || 5).toFixed(1)}
                  </span>
                </div>

                {/* Review Text */}
                <div className="relative">
                  <MessageSquareQuote className="absolute -left-1 -top-2 h-5 w-5 text-muted-foreground/20 -z-0" />
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed italic line-clamp-4 relative z-10 pl-2">
                    "{rev.comment}"
                  </p>
                </div>
              </div>

              {/* Product Reference Card */}
              {rev.product && (
                <Link
                  to="/product/$productId"
                  params={{ productId: rev.product._id || rev.product.slug || rev.product.id }}
                  className="mt-5 flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-2.5 hover:bg-secondary/60 transition group cursor-pointer"
                >
                  {rev.product.image && (
                    <img
                      src={rev.product.image}
                      alt={rev.product.name}
                      className="h-11 w-11 rounded-xl object-cover border border-border/50 shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-foreground truncate group-hover:text-primary transition">
                      {rev.product.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {rev.product.category ? `${rev.product.category} · ` : ""}₹{rev.product.price}
                    </p>
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Dots */}
      {maxPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: maxPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              aria-label={`Go to reviews slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
