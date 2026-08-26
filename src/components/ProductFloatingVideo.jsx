import { useState, useRef, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Minus,
  Maximize2,
  Film,
  Sparkles,
  ShoppingBag,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useShop } from "@/context/ShopContext.jsx";

export default function ProductFloatingVideo({ product }) {
  const { addToCart } = useShop();

  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isAdded, setIsAdded] = useState(false);

  const videoRef = useRef(null);

  // Extract all valid videos for this product
  const videos = useMemo(() => {
    if (!product) return [];
    const list = Array.isArray(product.videos) && product.videos.length > 0
      ? product.videos.map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean)
      : (product.video && typeof product.video === "string" && product.video.trim() ? [product.video.trim()] : []);
    return list;
  }, [product]);

  const activeVideoUrl = videos[currentIdx] || videos[0] || "";

  // If no video, do not render anything
  if (!product || videos.length === 0 || !activeVideoUrl) {
    return null;
  }

  // Handle Play/Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2200);
  };

  const handleNextVideo = (e) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev + 1) % videos.length);
  };

  const handlePrevVideo = (e) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev - 1 + videos.length) % videos.length);
  };

  // If dismissed completely by close button, show a subtle re-open pill
  if (!isOpen) {
    return (
      <aside aria-label="Re-open video preview" className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="flex items-center gap-2 rounded-full bg-card/95 hover:bg-card text-foreground px-4 py-2.5 shadow-xl border border-primary/40 hover:border-primary backdrop-blur-md transition-all hover:scale-105 active:scale-95 group cursor-pointer"
        >
          <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-xs">
            <Film className="h-3.5 w-3.5 animate-pulse" />
          </div>
          <span className="text-xs font-black">Watch Product Video</span>
          <span className="rounded-full bg-rose-500 h-2 w-2 animate-ping" />
        </button>
      </aside>
    );
  }

  // If in minimized mode, show floating compact preview pill
  if (isMinimized) {
    return (
      <aside aria-label="Minimized video preview" className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 rounded-2xl bg-card/95 backdrop-blur-md p-2 border border-border shadow-2xl">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            {/* Live Video Micro-Thumb */}
            <div className="relative h-12 w-10 rounded-xl overflow-hidden bg-black border border-primary/30 shrink-0">
              <video
                src={activeVideoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 grid place-items-center bg-black/20">
                <Play className="h-3 w-3 text-white fill-white" />
              </div>
            </div>
            <div className="pr-1">
              <p className="text-[11px] font-black text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                <span>Product Video</span>
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              </p>
              <p className="text-[10px] text-muted-foreground">Click to expand</p>
            </div>
          </button>

          <div className="flex items-center gap-1 border-l border-border pl-1.5">
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Expand"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Expanded Full Floating Video Player Card
  return (
    <aside aria-label="Floating product video player" className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-[230px] sm:w-[260px] animate-in fade-in slide-in-from-bottom-6 duration-300 select-none">
      <div className="flex flex-col rounded-3xl overflow-hidden bg-card border border-border shadow-2xl backdrop-blur-xl">
        {/* 1. Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/60 border-b border-border">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-black text-foreground truncate flex items-center gap-1">
              <Film className="h-3 w-3 text-primary" />
              <span>Product Video</span>
            </span>
            {videos.length > 1 && (
              <span className="text-[10px] font-bold text-muted-foreground">
                ({currentIdx + 1}/{videos.length})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Minimize button */}
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Minimize video player"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Close video"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Video Player Frame */}
        <div
          onClick={togglePlay}
          className="relative aspect-[9/13] sm:aspect-[9/14] w-full bg-black overflow-hidden group cursor-pointer"
        >
          <video
            ref={videoRef}
            key={activeVideoUrl}
            src={activeVideoUrl}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            className="h-full w-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Dark Overlay on Hover for Controls */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {/* Play/Pause Central Flash Indicator */}
          {!isPlaying && (
            <div className="absolute inset-0 grid place-items-center bg-black/40 pointer-events-none">
              <div className="h-12 w-12 rounded-full bg-white/90 text-black grid place-items-center shadow-2xl scale-100 animate-in zoom-in-75">
                <Play className="h-5 w-5 fill-current ml-0.5" />
              </div>
            </div>
          )}

          {/* Multi-video switch arrows if multiple videos */}
          {videos.length > 1 && (
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handlePrevVideo}
                className="h-7 w-7 rounded-full bg-black/60 hover:bg-black text-white grid place-items-center backdrop-blur-xs transition active:scale-90"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNextVideo}
                className="h-7 w-7 rounded-full bg-black/60 hover:bg-black text-white grid place-items-center backdrop-blur-xs transition active:scale-90"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Bottom Video Floating Control Buttons */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 z-10">
            {/* Play/Pause toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="h-7 w-7 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md grid place-items-center transition active:scale-90 shadow-md cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
            </button>

            {/* Sound Mute/Unmute */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted((prev) => !prev);
              }}
              className="h-7 w-7 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md grid place-items-center transition active:scale-90 shadow-md cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-sun animate-pulse" />}
            </button>
          </div>
        </div>

        {/* 3. Compact Footer Info & Fast Add to Cart */}
        <div className="p-3 bg-card border-t border-border flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black text-foreground truncate">{product.name}</p>
            <p className="text-xs font-black text-primary">₹{product.price}</p>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black transition-all shadow-xs shrink-0 cursor-pointer active:scale-95 ${
              isAdded
                ? "bg-emerald-500 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3 w-3" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
