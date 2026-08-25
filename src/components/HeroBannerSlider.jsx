import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useShop } from "@/context/ShopContext.jsx";

const FALLBACK_HERO_IMG = "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1000&q=80";

export default function HeroBannerSlider() {
  const { heroBanners } = useShop();
  const rawSlides = heroBanners && heroBanners.length > 0 ? heroBanners : [];
  const slides = rawSlides.filter((s) => s.isActive !== false);

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const count = slides.length;

  const goTo = useCallback(
    (idx) => {
      if (count === 0) return;
      setCurrent(((idx % count) + count) % count);
    },
    [count]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // If current slide index is out of bounds (e.g. after removing slides)
  useEffect(() => {
    if (current >= count && count > 0) {
      setCurrent(0);
    }
  }, [count, current]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (paused || count <= 1) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [paused, next, count]);

  if (count === 0) return null;

  const slide = slides[current] || slides[0];
  if (!slide) return null;

  // Determine background style
  const bgStyle = slide.bgColor
    ? { background: slide.bgColor }
    : {};

  return (
    <section
      className="relative overflow-hidden bg-secondary transition-colors duration-700 w-full"
      style={bgStyle}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Centered Hero Content Container (max 1400px, 40-60px padding, vertically centered) */}
      <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-10 md:px-12 lg:px-16 py-8 sm:py-10 md:py-12 lg:py-14 min-h-[460px] md:min-h-[500px] lg:min-h-[520px] flex items-center justify-center">
        {/* 2-Column Responsive Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 items-center gap-8 lg:gap-12 xl:gap-16">
          {/* Left Column: Text Side */}
          <div
            key={`text-${slide.id || slide._id || current}`}
            className="flex flex-col items-center text-center md:items-start md:text-left animate-in fade-in slide-in-from-left-8 duration-500 z-10"
          >
            {slide.badge && (
              <div className="mb-3 sm:mb-4">
                <span className="inline-block rounded-full bg-sun px-4 py-1.5 text-xs sm:text-sm font-bold text-sun-foreground shadow-xs tracking-wide">
                  {slide.badge}
                </span>
              </div>
            )}

            <h1
              className="text-3xl sm:text-4xl md:text-[2.75rem] lg:text-[3.25rem] xl:text-[3.6rem] font-extrabold leading-[1.15] tracking-tight text-foreground max-w-xl lg:max-w-2xl"
              dangerouslySetInnerHTML={{ __html: slide.heading || "Soft Muslin Organic Babywear" }}
            />

            {slide.subtext && (
              <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg">
                {slide.subtext}
              </p>
            )}

            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4">
              {slide.primaryBtnLabel && (
                <Link
                  to={slide.primaryBtnTo || "/shop"}
                  className="rounded-full bg-primary px-7 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-primary-foreground shadow-md transition-all duration-200 hover:scale-105 hover:bg-primary/90 active:scale-95 text-center"
                >
                  {slide.primaryBtnLabel}
                </Link>
              )}
              {slide.secondaryBtnLabel && (
                <Link
                  to={slide.secondaryBtnTo || "/shop"}
                  className="rounded-full bg-accent px-6 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-accent-foreground shadow-xs transition-all duration-200 hover:opacity-90 active:scale-95 text-center"
                >
                  {slide.secondaryBtnLabel}
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Baby Hero Image */}
          <div
            key={`img-${slide.id || slide._id || current}`}
            className="flex items-center justify-center relative w-full animate-in fade-in slide-in-from-right-8 duration-500 py-2 sm:py-4 md:py-0"
          >
            <img
              src={slide.image || FALLBACK_HERO_IMG}
              alt={slide.imageAlt || "Hero banner baby image"}
              className="w-auto max-w-full h-auto max-h-[300px] sm:max-h-[360px] md:max-h-[420px] lg:max-h-[470px] xl:max-h-[500px] object-contain drop-shadow-md rounded-2xl transition-all duration-300"
              onError={(e) => {
                if (e.currentTarget.src !== FALLBACK_HERO_IMG) {
                  e.currentTarget.src = FALLBACK_HERO_IMG;
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Prev / Next Arrows (vertically centered, positioned at edges) */}
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={prev}
            className="absolute left-2 sm:left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full bg-background/80 shadow-md backdrop-blur border border-border/50 hover:bg-background transition active:scale-95"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={next}
            className="absolute right-2 sm:right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full bg-background/80 shadow-md backdrop-blur border border-border/50 hover:bg-background transition active:scale-95"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {count > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === current
                  ? "w-7 sm:w-8 bg-primary shadow-xs"
                  : "w-2.5 bg-foreground/30 hover:bg-foreground/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
