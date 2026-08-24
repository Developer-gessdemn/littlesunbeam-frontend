import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useShop } from "@/context/ShopContext.jsx";

export default function HeroBannerSlider() {
  const { heroBanners } = useShop();
  const slides = heroBanners && heroBanners.length > 0 ? heroBanners : [];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const count = slides.length;

  const goTo = useCallback(
    (idx) => {
      setCurrent(((idx % count) + count) % count);
    },
    [count]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (paused || count <= 1) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [paused, next, count]);

  if (count === 0) return null;

  const slide = slides[current];

  // Determine bg style
  const bgStyle = slide.bgColor
    ? { background: slide.bgColor }
    : {};

  return (
    <section
      className="relative overflow-hidden bg-secondary transition-colors duration-700"
      style={bgStyle}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 md:grid-cols-2 md:py-14">
        {/* Text Side */}
        <div
          key={`text-${current}`}
          className="animate-in fade-in slide-in-from-left-8 duration-500"
        >
          {slide.badge && (
            <span className="inline-block rounded-full bg-sun px-4 py-1 text-xs font-bold text-sun-foreground">
              {slide.badge}
            </span>
          )}
          <h1
            className="mt-4 text-3xl leading-tight font-extrabold sm:text-4xl md:text-6xl"
            dangerouslySetInnerHTML={{ __html: slide.heading }}
          />
          <p className="mt-4 max-w-md text-sm text-muted-foreground sm:mt-5 sm:text-base">
            {slide.subtext}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 sm:mt-7 sm:gap-3">
            {slide.primaryBtnLabel && (
              <Link
                to={slide.primaryBtnTo || "/shop"}
                className="rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/85"
              >
                {slide.primaryBtnLabel}
              </Link>
            )}
            {slide.secondaryBtnLabel && (
              <Link
                to={slide.secondaryBtnTo || "/shop"}
                className="rounded-full bg-accent px-7 py-3 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90"
              >
                {slide.secondaryBtnLabel}
              </Link>
            )}
          </div>
        </div>

        {/* Image Side */}
        <div
          key={`img-${current}`}
          className="flex items-center justify-center animate-in fade-in slide-in-from-right-8 duration-500"
        >
          <img
            src={slide.image}
            alt={slide.imageAlt || "Hero banner image"}
            className="w-full max-w-sm md:max-w-md object-contain drop-shadow-none"
          />
        </div>
      </div>

      {/* Prev / Next Arrows */}
      {count > 1 && (
        <>
          <button
            aria-label="Previous slide"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/80 shadow-md backdrop-blur hover:bg-background transition"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <button
            aria-label="Next slide"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/80 shadow-md backdrop-blur hover:bg-background transition"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === current
                  ? "w-6 bg-primary"
                  : "w-2 bg-foreground/30 hover:bg-foreground/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
