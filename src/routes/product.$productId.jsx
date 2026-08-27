import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Heart,
  ShoppingCart,
  Star,
  Check,
  Share2,
  ThumbsUp,
  Minus,
  Plus,
  ArrowLeft,
  Home,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Package,
  Ruler,
  X,
  CreditCard,
  Sparkles,
  Info,
  Edit3,
  Trash2,
  Loader2,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader.jsx";
import SiteFooter from "@/components/SiteFooter.jsx";
import ProductCard from "@/components/ProductCard.jsx";
import ProductFloatingVideo from "@/components/ProductFloatingVideo.jsx";
import { useShop, normalizeProduct } from "@/context/ShopContext.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const Route = createFileRoute("/product/$productId")({
  component: ProductDetailsPage,
});

function ProductDetailsPage() {
  const { productId } = Route.useParams();
  const router = useRouter();
  const {
    products,
    addToCart,
    toggleWishlist,
    isWishlisted,
    setCartOpen,
    customer,
    customerToken,
    isCustomerLoggedIn,
    requireLogin,
    refreshProducts,
  } = useShop();

  const [liveProduct, setLiveProduct] = useState(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Find product in ShopContext live products or fallback
  const productFromList = (products || []).find(
    (p) => String(p._id || p.id) === String(productId) || p.slug === productId
  );

  // If not found in list, attempt direct API fetch
  useEffect(() => {
    if (!productFromList && productId) {
      fetch(`${API_BASE_URL}/products/${productId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.data?.product) {
            setLiveProduct(normalizeProduct(data.data.product));
          }
        })
        .catch(() => { });
    }
  }, [productId, productFromList]);

  const product = liveProduct || productFromList || (products && products.find((p) => String(p._id || p.id) === String(productId)));

  // Color Variants & Colors from backend
  const colorVariants = useMemo(() => {
    if (Array.isArray(product?.colorVariants) && product.colorVariants.length > 0) {
      return product.colorVariants;
    }
    return [];
  }, [product?.colorVariants]);

  const colors = useMemo(() => {
    if (colorVariants.length > 0) {
      return colorVariants.map((cv) => ({
        name: cv.displayName || cv.name,
        rawName: cv.name,
        hex: cv.hex || "#E5E7EB",
      }));
    }
    if (product?.colors && product.colors.length > 0) {
      return product.colors.map((c) => ({
        name: c.name || "Default",
        rawName: c.name || "Default",
        hex: c.hex || "#E5E7EB",
      }));
    }
    return [{ name: "Default", rawName: "Default", hex: "#F5F2EB" }];
  }, [colorVariants, product?.colors]);

  // State: Color Selection
  const [selectedColor, setSelectedColor] = useState("");

  // Initialize selected color when product loads
  useEffect(() => {
    if (colors.length > 0) {
      const defaultColor = colors[0]?.rawName || colors[0]?.name || "Default";
      setSelectedColor((prev) => {
        const exists = colors.some(
          (c) => (c.rawName || c.name).toLowerCase() === (prev || "").toLowerCase()
        );
        return exists ? prev : defaultColor;
      });
    }
  }, [colors]);

  // Determine active Color Variant based on selected color
  const activeCv = useMemo(() => {
    if (colorVariants.length === 0) return null;
    return (
      colorVariants.find(
        (cv) =>
          (cv.name || "").toLowerCase() === (selectedColor || "").toLowerCase() ||
          (cv.displayName || "").toLowerCase() === (selectedColor || "").toLowerCase()
      ) || colorVariants[0]
    );
  }, [colorVariants, selectedColor]);

  // Color-specific gallery images
  const gallery = useMemo(() => {
    if (activeCv && Array.isArray(activeCv.images) && activeCv.images.length > 0) {
      const imgs = activeCv.images
        .map((img) => (typeof img === "string" ? img : img.url))
        .filter(Boolean);
      if (imgs.length > 0) return imgs;
    }
    if (product?.gallery && product.gallery.length > 0) {
      return product.gallery;
    }
    return product?.image ? [product.image] : [];
  }, [activeCv, product?.gallery, product?.image]);

  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);

  // Reset selected image index when gallery changes
  useEffect(() => {
    setSelectedImgIndex(0);
  }, [selectedColor, gallery]);

  // Automatic slideshow for product images (pauses on hover)
  useEffect(() => {
    if (!gallery || gallery.length <= 1 || isSlidePaused) return;

    const timer = setInterval(() => {
      setSelectedImgIndex((prev) => (prev + 1) % gallery.length);
    }, 3600);

    return () => clearInterval(timer);
  }, [gallery, isSlidePaused]);

  const handlePrevImage = () => {
    if (!gallery || gallery.length <= 1) return;
    setSelectedImgIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  const handleNextImage = () => {
    if (!gallery || gallery.length <= 1) return;
    setSelectedImgIndex((prev) => (prev + 1) % gallery.length);
  };

  // Active sizes based strictly on selected color variant
  const sizes = useMemo(() => {
    if (activeCv) {
      if (Array.isArray(activeCv.sizes) && activeCv.sizes.length > 0) {
        return activeCv.sizes;
      }
      if (Array.isArray(activeCv.inventory) && activeCv.inventory.length > 0) {
        return activeCv.inventory.map((inv) => inv.size).filter(Boolean);
      }
    }
    if (product?.sizes && product.sizes.length > 0) {
      return product.sizes;
    }
    return ["Standard"];
  }, [activeCv, product?.sizes]);

  const [selectedSize, setSelectedSize] = useState("");

  // Keep selectedSize valid when color or sizes change
  useEffect(() => {
    if (sizes.length > 0) {
      if (!selectedSize || !sizes.includes(selectedSize)) {
        setSelectedSize(sizes[0]);
      }
    } else {
      setSelectedSize("Standard");
    }
  }, [sizes, selectedColor]);

  // Matched inventory item for the active color and size
  const activeInventoryItem = useMemo(() => {
    if (activeCv && Array.isArray(activeCv.inventory)) {
      return activeCv.inventory.find(
        (inv) => (inv.size || "").toLowerCase() === (selectedSize || "").toLowerCase()
      );
    }
    return null;
  }, [activeCv, selectedSize]);

  const currentVariantStock = useMemo(() => {
    if (activeInventoryItem !== null && activeInventoryItem !== undefined) {
      return Number(activeInventoryItem.stock);
    }
    return Number(product?.stock !== undefined ? product.stock : 50);
  }, [activeInventoryItem, product?.stock]);

  const isCurrentVariantOutOfStock = currentVariantStock <= 0;

  const currentPrice = useMemo(() => {
    if (
      activeInventoryItem?.price !== undefined &&
      !isNaN(Number(activeInventoryItem.price)) &&
      Number(activeInventoryItem.price) > 0
    ) {
      return Number(activeInventoryItem.price);
    }
    return Number(product?.price || 0);
  }, [activeInventoryItem, product?.price]);

  const currentMrp = useMemo(() => {
    if (
      activeInventoryItem?.mrp !== undefined &&
      !isNaN(Number(activeInventoryItem.mrp)) &&
      Number(activeInventoryItem.mrp) > 0
    ) {
      return Number(activeInventoryItem.mrp);
    }
    return Number(product?.mrp || 0);
  }, [activeInventoryItem, product?.mrp]);

  const discountPercentage = useMemo(() => {
    if (currentMrp > currentPrice && currentMrp > 0) {
      return Math.round(((currentMrp - currentPrice) / currentMrp) * 100);
    }
    if (product?.discount && Number(product.discount) > 0) {
      return Number(product.discount);
    }
    return 0;
  }, [currentMrp, currentPrice, product?.discount]);

  const [qty, setQty] = useState(1);

  // Keep qty <= currentVariantStock
  useEffect(() => {
    if (isCurrentVariantOutOfStock) {
      setQty(1);
    } else if (qty > currentVariantStock && currentVariantStock > 0) {
      setQty(currentVariantStock);
    }
  }, [currentVariantStock, isCurrentVariantOutOfStock]);

  const [activeTab, setActiveTab] = useState("Details");
  const [toastMessage, setToastMessage] = useState("");
  const [added, setAdded] = useState(false);

  // ─── Database-Backed Review State ─────────────────────────────────────────
  const [reviewsList, setReviewsList] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewsSort, setReviewsSort] = useState("newest");
  const [reviewStats, setReviewStats] = useState({
    averageRating: null,
    totalReviews: 0,
  });

  const currentProdId = String(product?._id || product?.id || productId || "");

  // Fetch real reviews from backend database
  const fetchProductReviews = useCallback(
    async (sortKey = reviewsSort) => {
      if (!currentProdId) return;
      setLoadingReviews(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/products/${currentProdId}/reviews?sort=${sortKey}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.data) {
            setReviewsList(data.data.reviews || []);
            setReviewStats({
              averageRating: data.data.averageRating,
              totalReviews: data.data.totalReviews,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching product reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    },
    [currentProdId, reviewsSort]
  );

  useEffect(() => {
    if (currentProdId) {
      fetchProductReviews();
    }
  }, [currentProdId, reviewsSort, fetchProductReviews]);

  // Check if authenticated user already reviewed this product
  const userExistingReview = useMemo(() => {
    if (!customer?._id && !customer?.id) return null;
    const uId = String(customer._id || customer.id);
    return reviewsList.find(
      (r) =>
        String(r.user?._id || r.user?.id) === uId ||
        String(r.userId?._id || r.userId) === uId
    );
  }, [reviewsList, customer]);

  const wishlisted = isWishlisted(product?.id || product?._id);
  const reviewsCountVal =
    reviewStats.totalReviews !== undefined
      ? reviewStats.totalReviews
      : product?.reviewCount !== undefined
        ? product.reviewCount
        : reviewsList.length;
  const ratingVal =
    reviewsCountVal > 0
      ? (reviewStats.averageRating !== null && reviewStats.averageRating !== undefined
          ? reviewStats.averageRating
          : product?.rating || 0)
      : 0;
  const categoryLabel = product?.categoryPill || product?.category || "";
  const skuCode = activeInventoryItem?.sku || product?.sku || "SUN-PROD";
  const productTags = Array.isArray(product?.tags) ? product.tags : [];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleColorSelect = (colorKey) => {
    setSelectedColor(colorKey);
    setSelectedImgIndex(0);
  };

  const handleAddToCart = () => {
    if (isCurrentVariantOutOfStock) {
      showToast("Selected color & size is currently out of stock.");
      return;
    }

    const success = addToCart(
      {
        ...product,
        price: currentPrice,
        variant: `${selectedColor} / ${selectedSize}`,
        selectedColor,
        selectedSize,
        sku: skuCode,
        image: gallery[0] || product?.image,
        colorVariantId: activeCv?._id || activeCv?.id,
        variantId: activeInventoryItem?._id || activeInventoryItem?.id,
      },
      qty
    );
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
      showToast(`Added ${qty} item(s) to Cart!`);
      setCartOpen(true);
    }
  };

  const handleBuyNow = () => {
    if (isCurrentVariantOutOfStock) {
      showToast("Selected color & size is currently out of stock.");
      return;
    }

    const success = addToCart(
      {
        ...product,
        price: currentPrice,
        variant: `${selectedColor} / ${selectedSize}`,
        selectedColor,
        selectedSize,
        sku: skuCode,
        image: gallery[0] || product?.image,
        colorVariantId: activeCv?._id || activeCv?.id,
        variantId: activeInventoryItem?._id || activeInventoryItem?.id,
      },
      qty
    );
    if (success) {
      setCartOpen(true);
    }
  };

  const handleOpenReviewForm = (existingRev = null) => {
    if (!isCustomerLoggedIn || !customerToken) {
      requireLogin("Please login to write a review.");
      return;
    }

    const targetRev = existingRev || userExistingReview;
    if (targetRev) {
      setEditingReviewId(targetRev._id || targetRev.id);
      setNewReviewRating(targetRev.rating || 5);
      setNewReviewComment(targetRev.comment || "");
    } else {
      setEditingReviewId(null);
      setNewReviewRating(5);
      setNewReviewComment("");
    }
    setShowReviewForm(true);
  };

  const handleAddOrUpdateReview = async (e) => {
    e.preventDefault();
    if (!isCustomerLoggedIn || !customerToken) {
      requireLogin("Please login to write a review.");
      return;
    }

    if (!newReviewComment.trim()) {
      showToast("Please enter a review comment.");
      return;
    }

    setSubmittingReview(true);
    try {
      const url = editingReviewId
        ? `${API_BASE_URL}/reviews/${editingReviewId}`
        : `${API_BASE_URL}/products/${currentProdId}/reviews`;
      const method = editingReviewId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          rating: newReviewRating,
          comment: newReviewComment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit review.");
      }

      showToast(
        data.message ||
        (editingReviewId
          ? "Review updated successfully!"
          : "Thank you! Your review has been published.")
      );

      setShowReviewForm(false);
      setEditingReviewId(null);
      setNewReviewComment("");
      setNewReviewRating(5);

      // Re-fetch live reviews and refresh global products rating
      await fetchProductReviews();
      if (refreshProducts) refreshProducts();
    } catch (err) {
      showToast(err.message || "An error occurred while submitting review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId || !customerToken) return;
    if (!window.confirm("Are you sure you want to delete your review?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete review.");
      }

      showToast("Review deleted successfully.");
      if (editingReviewId === reviewId) {
        setShowReviewForm(false);
        setEditingReviewId(null);
      }
      await fetchProductReviews();
      if (refreshProducts) refreshProducts();
    } catch (err) {
      showToast(err.message || "Failed to delete review.");
    }
  };

  const handleVoteHelpful = async (rev) => {
    if (!isCustomerLoggedIn || !customerToken) {
      requireLogin("Please login to mark reviews as helpful.");
      return;
    }

    const revId = rev._id || rev.id;
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${revId}/helpful`, {
        method: "POST",
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const data = await res.json();
      if (res.ok && data?.data) {
        setReviewsList((prev) =>
          prev.map((r) =>
            (r._id || r.id) === revId
              ? {
                ...r,
                helpfulCount: data.data.helpfulCount,
                helpfulVotes: data.data.hasVoted
                  ? [...(r.helpfulVotes || []), customer?._id || customer?.id]
                  : (r.helpfulVotes || []).filter(
                    (v) => String(v) !== String(customer?._id || customer?.id)
                  ),
              }
              : r
          )
        );
      }
    } catch (err) {
      console.error("Error voting helpful:", err);
    }
  };

  const recommendedProducts = (products || [])
    .filter((p) => String(p._id || p.id) !== currentProdId)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FCFCFD] text-neutral-900 flex flex-col font-sans selection:bg-neutral-900 selection:text-white w-full overflow-x-clip">
      <SiteHeader />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 rounded-full bg-neutral-900 px-5 py-3 text-xs font-bold text-white shadow-2xl animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation / Breadcrumbs Bar */}
      <div className="border-b border-neutral-200/80 bg-white/95 backdrop-blur-xs w-full overflow-hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => router.history.back()}
              className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 shadow-2xs hover:bg-neutral-50 hover:border-neutral-300 transition active:scale-95 cursor-pointer shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>

            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 shadow-2xs hover:bg-neutral-50 hover:border-neutral-300 transition active:scale-95 shrink-0"
              aria-label="Go to home"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1.5 ml-2 text-xs text-neutral-400 min-w-0" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-neutral-900 transition-colors font-medium shrink-0">Home</Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <Link to="/shop" className="hover:text-neutral-900 transition-colors font-medium shrink-0">Shop</Link>
              {product?.name && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-neutral-800 font-semibold truncate max-w-[200px]">{product.name}</span>
                </>
              )}
            </nav>
          </div>

          {skuCode && (
            <div className="hidden sm:block text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider shrink-0">
              SKU: {skuCode}
            </div>
          )}
        </div>
      </div>

      {!product ? (
        <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:py-20 flex-1 text-center min-w-0">
          <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-8 sm:p-12 max-w-md mx-auto shadow-xs">
            <Package className="h-12 w-12 mx-auto text-neutral-400 mb-3" />
            <h2 className="text-lg font-black text-neutral-900">Product Not Found</h2>
            <p className="text-xs text-neutral-500 mt-1 mb-6">This item is currently unavailable or has been removed from catalog.</p>
            <Link to="/shop" className="rounded-full bg-black px-6 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 transition">
              Browse All Products
            </Link>
          </div>
        </main>
      ) : (
        <main className="mx-auto w-full max-w-7xl px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 md:py-12 flex-1 min-w-0">
          {/* ========================================================= */}
          {/* 1. TOP TWO-COLUMN SECTION: GALLERY (LEFT) + INFO (RIGHT) */}
          {/* ========================================================= */}
          <div className="grid gap-6 sm:gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-14 items-start w-full min-w-0">

            {/* LEFT COLUMN: Gallery (Vertical Thumbnails on Left + Main Image on Right) - Sticky on Desktop */}
            <div className="w-full min-w-0 lg:col-span-7 lg:sticky lg:top-36 self-start z-10">
              <div className="flex flex-col-reverse sm:flex-row gap-3.5 sm:gap-5 items-start w-full min-w-0">

                {/* Vertical Thumbnails List (Left side on desktop, horizontally scrollable on mobile) */}
                {gallery.length > 1 && (
                  <div className="w-full sm:w-20 md:w-22 shrink-0 flex sm:flex-col gap-2 sm:gap-3 overflow-x-auto sm:overflow-y-auto sm:max-h-[520px] pb-1 sm:pb-0 scrollbar-none">
                    {gallery.map((img, idx) => {
                      const isSelected = selectedImgIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedImgIndex(idx);
                            setIsSlidePaused(true);
                            setTimeout(() => setIsSlidePaused(false), 5000);
                          }}
                          className={`relative aspect-square w-16 sm:w-full shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-200 bg-[#F9FAFB] cursor-pointer ${isSelected
                              ? "border-black ring-2 ring-black/10 scale-[1.02] shadow-sm"
                              : "border-neutral-200/90 opacity-70 hover:opacity-100 hover:border-neutral-400"
                            }`}
                          aria-label={`Thumbnail ${idx + 1}`}
                        >
                          <img
                            src={img}
                            alt={`Thumbnail ${idx + 1}`}
                            className="h-full w-full object-cover object-top"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Main Product Image Viewing Container with Auto Slide & Fit Size */}
                <div
                  className="relative flex-1 w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-neutral-200/90 bg-[#F8F9FA] shadow-xs group min-w-0"
                  onMouseEnter={() => setIsSlidePaused(true)}
                  onMouseLeave={() => setIsSlidePaused(false)}
                  onTouchStart={() => setIsSlidePaused(true)}
                  onTouchEnd={() => setIsSlidePaused(false)}
                >
                  <div className="relative w-full aspect-square sm:aspect-4/5 max-h-[440px] sm:max-h-[520px] flex items-center justify-center p-3 sm:p-6 bg-gradient-to-b from-neutral-50/50 to-neutral-100/40">
                    <img
                      key={selectedImgIndex}
                      src={gallery[selectedImgIndex] || product.image}
                      alt={product.name}
                      className="h-full w-full max-h-[400px] sm:max-h-[460px] object-contain object-center transition-all duration-500 ease-out group-hover:scale-105 select-none animate-in fade-in zoom-in-95"
                    />
                  </div>

                  {/* Left & Right Navigation Arrows for Slideshow */}
                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrevImage();
                        }}
                        className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-full bg-white/95 shadow-md backdrop-blur-xs text-neutral-700 hover:text-black hover:bg-white hover:scale-110 active:scale-95 transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer z-10"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 -ml-0.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextImage();
                        }}
                        className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-full bg-white/95 shadow-md backdrop-blur-xs text-neutral-700 hover:text-black hover:bg-white hover:scale-110 active:scale-95 transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer z-10"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 -mr-0.5" />
                      </button>

                      {/* Slide Indicator Dots - Always Visible with High Contrast */}
                      <div className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 bg-black/65 backdrop-blur-md px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full z-20 shadow-md max-w-[90%] overflow-x-auto scrollbar-none">
                        {gallery.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImgIndex(idx);
                            }}
                            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${selectedImgIndex === idx
                                ? "w-5 sm:w-6 bg-white shadow-xs"
                                : "w-1.5 sm:w-2 bg-white/60 hover:bg-white"
                              }`}
                            aria-label={`Slide ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Product Badge */}
                  {product.badge && (
                    <div className="absolute left-3 top-3 sm:left-4 sm:top-4 z-10">
                      <span className="inline-flex items-center rounded-full bg-black px-2.5 sm:px-3.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-black text-white shadow-sm uppercase tracking-wider">
                        {product.badge}
                      </span>
                    </div>
                  )}

                  {/* Wishlist Floating Button */}
                  <button
                    onClick={() => {
                      const success = toggleWishlist(product);
                      if (success) {
                        showToast(wishlisted ? "Removed from wishlist" : "Added to wishlist");
                      }
                    }}
                    className={`absolute right-3 top-3 sm:right-4 sm:top-4 z-10 grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full border border-neutral-200 bg-white/90 shadow-md backdrop-blur-xs transition hover:scale-110 active:scale-95 cursor-pointer ${wishlisted ? "text-rose-500" : "text-neutral-600 hover:text-rose-500"
                      }`}
                    aria-label="Wishlist"
                  >
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5" fill={wishlisted ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Structured Product Information & Purchase Flow */}
            <div className="w-full min-w-0 lg:col-span-5 flex flex-col space-y-4 sm:space-y-6">

              {/* 1. Header: Badge & Category */}
              <div className="flex items-center gap-2 flex-wrap">
                {product.badge && (
                  <span className="rounded-full bg-neutral-900 px-2.5 sm:px-3 py-0.5 text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider">
                    {product.badge}
                  </span>
                )}
                {categoryLabel && (
                  <span className="rounded-full bg-neutral-100 px-2.5 sm:px-3 py-0.5 text-[11px] sm:text-xs font-bold text-neutral-600 capitalize">
                    {categoryLabel}
                  </span>
                )}
                {product.gender && (
                  <span className="rounded-full bg-amber-50 px-2.5 sm:px-3 py-0.5 text-[11px] sm:text-xs font-bold text-amber-800 capitalize">
                    {product.gender}
                  </span>
                )}
              </div>

              {/* 2. Product Name */}
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-900 leading-snug break-words">
                  {product.name}
                </h1>

                {/* 3. Rating Row */}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {reviewsCountVal > 0 ? (
                    <>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                              i < Math.floor(ratingVal)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-neutral-200 text-neutral-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-neutral-800">
                        {Number(ratingVal).toFixed(1)}
                      </span>
                      <span className="text-xs text-neutral-400 font-medium">
                        ({reviewsCountVal} {reviewsCountVal === 1 ? "review" : "reviews"})
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-neutral-400">
                      No customer reviews yet
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Price Section */}
              <div className="flex items-baseline gap-2.5 sm:gap-3 py-1 border-b border-neutral-100 pb-3.5 sm:pb-4 flex-wrap">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-neutral-900">
                  ₹{currentPrice}.00
                </span>
                {currentMrp > currentPrice && (
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-neutral-400 line-through">
                    ₹{currentMrp}.00
                  </span>
                )}
                {discountPercentage > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-black text-emerald-700 border border-emerald-200/80">
                    {discountPercentage}% OFF
                  </span>
                )}
              </div>

              {/* 5. Short Description */}
              {product.description && (
                <div>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed line-clamp-3 break-words">
                    {product.description}
                  </p>
                </div>
              )}

              {/* 6. Color Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold uppercase tracking-wider text-neutral-900">
                    Color: <span className="font-bold text-neutral-700 capitalize">{activeCv?.displayName || selectedColor}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {colors.map((c) => {
                    const cKey = c.rawName || c.name;
                    const isSelected =
                      (selectedColor || "").toLowerCase() === (cKey || "").toLowerCase() ||
                      (selectedColor || "").toLowerCase() === (c.name || "").toLowerCase();

                    return (
                      <button
                        key={cKey}
                        type="button"
                        onClick={() => handleColorSelect(cKey)}
                        title={c.name}
                        className={`group relative flex items-center gap-1.5 sm:gap-2 rounded-full border px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-bold transition-all cursor-pointer ${isSelected
                            ? "border-black bg-neutral-900 text-white shadow-sm ring-2 ring-black/10"
                            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                          }`}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-2xs shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="truncate max-w-[120px]">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 7. Size Selector & Size Guide */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold uppercase tracking-wider text-neutral-900">
                    Size: <span className="font-bold text-neutral-700">{selectedSize}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="flex items-center gap-1.5 font-bold transition cursor-pointer text-primary hover:underline underline-offset-4"
                  >
                    <Ruler className="h-3.5 w-3.5 text-primary" />
                    <span>{product?.sizeChartImage ? "Size Chart" : "Size Guide"}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {sizes.map((sz) => {
                    const sizeInv =
                      activeCv && Array.isArray(activeCv.inventory)
                        ? activeCv.inventory.find(
                          (inv) => (inv.size || "").toLowerCase() === sz.toLowerCase()
                        )
                        : null;
                    const sizeStock = sizeInv
                      ? Number(sizeInv.stock)
                      : Number(product?.stock !== undefined ? product.stock : 50);
                    const isSizeOOS = sizeStock <= 0;
                    const isSelected = (selectedSize || "").toLowerCase() === sz.toLowerCase();

                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`relative rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs font-extrabold transition-all duration-200 cursor-pointer ${isSelected
                            ? "bg-black text-white shadow-md scale-102"
                            : isSizeOOS
                              ? "border border-dashed border-neutral-300 bg-neutral-100/70 text-neutral-400 cursor-pointer"
                              : "border border-neutral-200 bg-white text-neutral-800 hover:border-black"
                          }`}
                      >
                        <span>{sz}</span>
                        {isSizeOOS && (
                          <span className="ml-1 text-[10px] text-rose-500 font-bold">(OOS)</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Stock Status Badge */}
                <div className="pt-0.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] sm:text-[11px] font-extrabold border ${isCurrentVariantOutOfStock
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : currentVariantStock <= 5
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isCurrentVariantOutOfStock
                          ? "bg-rose-500"
                          : currentVariantStock <= 5
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                    />
                    {isCurrentVariantOutOfStock
                      ? "Out of Stock"
                      : currentVariantStock <= 5
                        ? `Only ${currentVariantStock} left in stock — order soon`
                        : `In Stock (${currentVariantStock} units available)`}
                  </span>
                </div>
              </div>

              {/* 8. Quantity Selector */}
              <div className="space-y-1.5">
                <span className="block text-xs font-extrabold uppercase tracking-wider text-neutral-900">
                  Quantity
                </span>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center rounded-full border border-neutral-300 bg-white p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={isCurrentVariantOutOfStock || qty <= 1}
                      className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition disabled:opacity-40 cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-black text-neutral-900">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      disabled={isCurrentVariantOutOfStock || qty >= currentVariantStock}
                      className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition disabled:opacity-40 cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {qty >= currentVariantStock && currentVariantStock > 0 && (
                    <span className="text-[11px] font-bold text-amber-600">Max available stock</span>
                  )}
                </div>
              </div>

              {/* 9. CTAs: BUY NOW (Primary) & ADD TO CART (Secondary) */}
              <div className="flex flex-col gap-2.5 sm:gap-3 pt-1 w-full">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isCurrentVariantOutOfStock}
                  className="w-full rounded-full bg-black py-3.5 sm:py-4 text-xs sm:text-sm font-black text-white uppercase tracking-wider shadow-md hover:bg-neutral-800 transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isCurrentVariantOutOfStock ? "OUT OF STOCK" : "BUY IT NOW"}
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isCurrentVariantOutOfStock}
                  className={`w-full rounded-full border-2 border-black py-3 sm:py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${added
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : isCurrentVariantOutOfStock
                        ? "bg-neutral-100 border-neutral-300 text-neutral-400"
                        : "bg-white text-black hover:bg-black hover:text-white"
                    }`}
                >
                  {added ? "✓ ADDED TO CART" : isCurrentVariantOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}
                </button>
              </div>

              {/* 10. Compact Key Highlights */}
              {(product.fabric || product.ageGroup || product.gender || product.brand || product.countryOfOrigin) && (
                <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-3.5 sm:p-4 space-y-2 text-xs w-full min-w-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {product.brand && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] uppercase font-bold text-neutral-400">Brand</span>
                        <span className="font-bold text-neutral-800 truncate">{product.brand}</span>
                      </div>
                    )}
                    {product.fabric && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] uppercase font-bold text-neutral-400">Fabric</span>
                        <span className="font-bold text-neutral-800 truncate">{product.fabric}</span>
                      </div>
                    )}
                    {(product.ageGroup || product.age) && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] uppercase font-bold text-neutral-400">Age Group</span>
                        <span className="font-bold text-neutral-800 truncate">{product.ageGroup || product.age}</span>
                      </div>
                    )}
                    {product.returnEligibility && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] uppercase font-bold text-neutral-400">Returns</span>
                        <span className="font-bold text-emerald-700 truncate">{product.returnEligibility}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 11. Service Trust Badges */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4 grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-[10px] sm:text-[11px] font-bold text-neutral-700 shadow-2xs w-full min-w-0">
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <Truck className="h-4 w-4 text-black shrink-0" />
                  <span className="truncate w-full">Free Shipping</span>
                </div>
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <RotateCcw className="h-4 w-4 text-black shrink-0" />
                  <span className="truncate w-full">Easy 7-Day Return</span>
                </div>
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <ShieldCheck className="h-4 w-4 text-black shrink-0" />
                  <span className="truncate w-full">100% Authentic</span>
                </div>
              </div>

              {/* 12. Tabbed Product Information & Customer Reviews */}
              <div className="mt-4 border-t border-neutral-200 pt-6 sm:pt-8 space-y-6">

                {/* Horizontal Tabs Header */}
                <div className="flex items-center gap-4 sm:gap-6 border-b border-neutral-200 pb-2.5 overflow-x-auto scrollbar-none">
                  {["Details", "Additional Info", "Reviews"].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`relative pb-2.5 text-xs sm:text-sm md:text-base font-extrabold tracking-tight transition-colors whitespace-nowrap cursor-pointer ${activeTab === tab ? "text-black font-black" : "text-neutral-400 hover:text-neutral-700"
                        }`}
                    >
                      <span>{tab}</span>
                      {tab === "Reviews" && (
                        <span className="ml-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] sm:text-xs text-neutral-600 font-bold">
                          {reviewsCountVal}
                        </span>
                      )}
                      {activeTab === tab && (
                        <span className="absolute bottom-0 left-0 h-0.75 w-full rounded-full bg-black animate-in fade-in" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Contents Area */}
                <div className="pt-2">

                  {/* 1. DETAILS TAB */}
                  {activeTab === "Details" && (
                    <div className="space-y-5 sm:space-y-6 animate-in fade-in">
                      {/* Long Description */}
                      {product.description && (
                        <div className="space-y-1.5">
                          <h4 className="font-extrabold text-xs uppercase tracking-wider text-neutral-900">
                            Description
                          </h4>
                          <p className="text-xs sm:text-sm leading-relaxed text-neutral-700 whitespace-pre-line font-normal break-words">
                            {product.description}
                          </p>
                        </div>
                      )}

                      {/* Admin Details / Highlights */}
                      {product.details && (
                        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-2">
                          <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-950 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>Product Highlights &amp; Features</span>
                          </h4>
                          <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed whitespace-pre-line font-medium break-words">
                            {product.details}
                          </p>
                        </div>
                      )}

                      {/* Baby Comfort & Safety Highlights */}
                      <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200 space-y-3">
                        <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Baby Comfort &amp; Safety Assurance</span>
                        </h4>
                        <ul className="grid grid-cols-1 gap-2.5 text-xs sm:text-sm text-neutral-700 font-medium">
                          <li className="flex items-center gap-2.5 min-w-0">
                            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="break-words">100% Certified Baby-Safe Organic Dyes</span>
                          </li>
                          <li className="flex items-center gap-2.5 min-w-0">
                            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="break-words">Ultra-Soft, Breathable &amp; Lightweight Fabric</span>
                          </li>
                          <li className="flex items-center gap-2.5 min-w-0">
                            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="break-words">Flat Anti-Chafe Seams for Sensitive Skin</span>
                          </li>
                          <li className="flex items-center gap-2.5 min-w-0">
                            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="break-words">Easy Snaps for Fast, Hassle-Free Diaper Changes</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* 2. ADDITIONAL INFO TAB (SPECIFICATIONS GRID) */}
                  {activeTab === "Additional Info" && (
                    <div className="space-y-5 sm:space-y-6 animate-in fade-in">
                      {/* Specifications Grid */}
                      {(product.fabric ||
                        product.pattern ||
                        product.print ||
                        product.sleeveType ||
                        product.neckType ||
                        product.fitType ||
                        product.season ||
                        product.gender ||
                        product.ageGroup ||
                        product.age ||
                        product.subCategory) && (
                          <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-3.5 shadow-xs">
                            <div className="flex items-center gap-2">
                              <span className="grid h-6 w-6 place-items-center rounded-lg bg-neutral-100 text-xs">📋</span>
                              <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-neutral-900">
                                Baby Clothing Specifications
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {product.fabric && (
                                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-2.5 sm:p-3 min-w-0">
                                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Fabric</span>
                                  <p className="font-bold text-neutral-900 text-xs mt-0.5 break-words">{product.fabric}</p>
                                </div>
                              )}
                              {(product.ageGroup || product.age) && (
                                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-2.5 sm:p-3 min-w-0">
                                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Age Group</span>
                                  <p className="font-bold text-neutral-900 text-xs mt-0.5 break-words">{product.ageGroup || product.age}</p>
                                </div>
                              )}
                              {product.gender && (
                                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-2.5 sm:p-3 min-w-0">
                                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Gender</span>
                                  <p className="font-bold text-neutral-900 text-xs mt-0.5 break-words capitalize">{product.gender}</p>
                                </div>
                              )}
                              {(product.pattern || product.print) && (
                                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-2.5 sm:p-3 min-w-0">
                                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Pattern / Print</span>
                                  <p className="font-bold text-neutral-900 text-xs mt-0.5 break-words">{product.pattern || product.print}</p>
                                </div>
                              )}
                              {product.sleeveType && (
                                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-2.5 sm:p-3 min-w-0">
                                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Sleeve Type</span>
                                  <p className="font-bold text-neutral-900 text-xs mt-0.5 break-words">{product.sleeveType}</p>
                                </div>
                              )}
                              {product.neckType && (
                                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-2.5 sm:p-3 min-w-0">
                                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Neck Type</span>
                                  <p className="font-bold text-neutral-900 text-xs mt-0.5 break-words">{product.neckType}</p>
                                </div>
                              )}
                              {product.fitType && (
                                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-2.5 sm:p-3 min-w-0">
                                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Fit Type</span>
                                  <p className="font-bold text-neutral-900 text-xs mt-0.5 break-words">{product.fitType}</p>
                                </div>
                              )}
                              {product.season && (
                                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-2.5 sm:p-3 min-w-0">
                                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Season</span>
                                  <p className="font-bold text-neutral-900 text-xs mt-0.5 break-words">{product.season}</p>
                                </div>
                              )}
                              {product.subCategory && (
                                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-2.5 sm:p-3 min-w-0">
                                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Sub Category</span>
                                  <p className="font-bold text-neutral-900 text-xs mt-0.5 break-words capitalize">{product.subCategory}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {/* Wash & Care Information */}
                      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-3 shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded-lg bg-neutral-100 text-xs">🧼</span>
                          <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-neutral-900">
                            Wash &amp; Fabric Care
                          </h4>
                        </div>
                        <div className="space-y-2.5 text-xs">
                          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3 space-y-1 min-w-0">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Wash Care</span>
                            <p className="font-bold text-neutral-900 break-words">{product.washCare || "Gentle Hand / Machine Wash"}</p>
                          </div>
                          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3 space-y-1 min-w-0">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Care Instructions</span>
                            <p className="font-semibold text-neutral-800 leading-relaxed break-words">
                              {product.careInstructions || "Machine wash cold with gentle baby detergent. Do not bleach. Tumble dry low."}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Manufacturing & Origin */}
                      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-3 shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded-lg bg-neutral-100 text-xs">🏷️</span>
                          <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-neutral-900">
                            Manufacturing &amp; Origin Details
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-2.5 min-w-0">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Origin</span>
                            <p className="font-bold text-neutral-900 mt-0.5 break-words">{product.countryOfOrigin || "India"}</p>
                          </div>
                          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-2.5 min-w-0">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Brand</span>
                            <p className="font-bold text-neutral-900 mt-0.5 break-words">{product.brand || "Little Sunbeam"}</p>
                          </div>
                          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-2.5 min-w-0">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">SKU</span>
                            <p className="font-mono font-bold text-neutral-900 uppercase mt-0.5 break-all text-[11px]">{skuCode}</p>
                          </div>
                          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-2.5 min-w-0">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Taxes</span>
                            <p className="font-bold text-neutral-900 mt-0.5 break-words">GST {product.gst || 5}% Inc.</p>
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      {productTags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <span className="text-xs font-bold text-neutral-900">Tags:</span>
                          {productTags.map((t, idx) => (
                            <span key={idx} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-700">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. REVIEWS TAB */}
                  {activeTab === "Reviews" && (
                    <div className="space-y-5 sm:space-y-6 animate-in fade-in">
                      {/* Rating Summary Card */}
                      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 rounded-2xl bg-neutral-50 border border-neutral-200 p-4 sm:p-5">
                        <div className="flex items-center gap-3.5">
                          <div className="text-3xl sm:text-4xl font-black text-neutral-900">
                            {Number(ratingVal).toFixed(1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${i < Math.floor(ratingVal)
                                      ? "fill-amber-400 text-amber-400"
                                      : "fill-neutral-200 text-neutral-200"
                                    }`}
                                />
                              ))}
                            </div>
                            <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                              {reviewsCountVal} verified customer {reviewsCountVal === 1 ? "review" : "reviews"}
                            </p>
                          </div>
                        </div>

                        <div className="w-full sm:w-auto">
                          {userExistingReview ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (showReviewForm) {
                                  setShowReviewForm(false);
                                  setEditingReviewId(null);
                                } else {
                                  handleOpenReviewForm(userExistingReview);
                                }
                              }}
                              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              {showReviewForm ? "Close Editor" : "Edit Your Review"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (showReviewForm) {
                                  setShowReviewForm(false);
                                } else {
                                  handleOpenReviewForm(null);
                                }
                              }}
                              className="w-full sm:w-auto rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition cursor-pointer text-center"
                            >
                              {showReviewForm ? "Cancel Review" : "Write a Review"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Write/Edit Review Form */}
                      {showReviewForm && (
                        <form
                          onSubmit={handleAddOrUpdateReview}
                          className="rounded-2xl border border-neutral-200 p-4 space-y-3.5 bg-white shadow-2xs animate-in fade-in"
                        >
                          <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 flex-wrap gap-2">
                            <h4 className="font-extrabold text-xs text-neutral-900">
                              {editingReviewId ? "Edit Your Review" : "Share Your Experience"}
                            </h4>
                            {customer?.name && (
                              <span className="text-[11px] text-neutral-500 font-medium">
                                As <strong className="text-neutral-900 font-bold">{customer.name}</strong>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-xs font-semibold text-neutral-600">Your Rating:</span>
                            <div className="flex gap-1 cursor-pointer">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setNewReviewRating(star)}
                                  className="focus:outline-none hover:scale-110 transition-transform"
                                >
                                  <Star
                                    className={`h-4 w-4 ${star <= newReviewRating
                                        ? "fill-amber-400 text-amber-400"
                                        : "fill-neutral-200 text-neutral-200"
                                      }`}
                                  />
                                </button>
                              ))}
                            </div>
                            <span className="text-xs font-bold text-neutral-700 ml-1">
                              ({newReviewRating} / 5)
                            </span>
                          </div>

                          <textarea
                            required
                            rows={3}
                            placeholder="Write your feedback regarding fabric quality, fit, softness and comfort for your baby..."
                            value={newReviewComment}
                            onChange={(e) => setNewReviewComment(e.target.value)}
                            className="w-full rounded-xl border border-neutral-200 p-3 text-xs outline-none focus:border-black transition"
                          />

                          <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                            <button
                              type="submit"
                              disabled={submittingReview}
                              className="flex items-center gap-2 rounded-full bg-black px-5 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
                            >
                              {submittingReview && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                              {editingReviewId ? "Update Review" : "Submit Review"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowReviewForm(false);
                                setEditingReviewId(null);
                              }}
                              className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Reviews List Header & Sorting */}
                      {reviewsList.length > 0 && (
                        <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                          <h4 className="font-extrabold text-xs text-neutral-900">
                            Customer Reviews ({reviewsList.length})
                          </h4>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-neutral-500 font-medium">Sort:</span>
                            <select
                              value={reviewsSort}
                              onChange={(e) => {
                                const newSort = e.target.value;
                                setReviewsSort(newSort);
                                fetchProductReviews(newSort);
                              }}
                              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 outline-none focus:border-black cursor-pointer"
                            >
                              <option value="newest">Newest First</option>
                              <option value="rating_desc">Highest Rating</option>
                              <option value="rating_asc">Lowest Rating</option>
                              <option value="helpful">Most Helpful</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Reviews List */}
                      {loadingReviews && reviewsList.length === 0 ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                        </div>
                      ) : reviewsList.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center bg-white">
                          <p className="text-xs font-semibold text-neutral-500">
                            No customer reviews yet. Be the first to share your experience!
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenReviewForm(null)}
                            className="mt-3 inline-block rounded-full bg-black px-5 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition cursor-pointer"
                          >
                            Write First Review
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {reviewsList.map((rev) => {
                            const revId = rev._id || rev.id;
                            const isAuthor =
                              customer &&
                              (String(rev.user?._id || rev.user?.id) === String(customer._id || customer.id) ||
                                String(rev.userId?._id || rev.userId) === String(customer._id || customer.id));
                            const hasVotedHelpful =
                              customer &&
                              Array.isArray(rev.helpfulVotes) &&
                              rev.helpfulVotes.some((v) => String(v) === String(customer._id || customer.id));
                            const formattedDate = rev.createdAt
                              ? new Date(rev.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                              : "Recently";

                            return (
                              <div
                                key={revId}
                                className="rounded-2xl border border-neutral-200 p-4 space-y-2.5 bg-white shadow-2xs hover:border-neutral-300 transition"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="grid h-7 w-7 place-items-center rounded-full bg-neutral-900 text-white font-bold text-[11px] shrink-0">
                                      {(rev.user?.name || "U").charAt(0).toUpperCase()}
                                    </span>
                                    <div className="min-w-0">
                                      <h5 className="text-xs font-extrabold text-neutral-900 truncate">
                                        {rev.user?.name || "Verified Parent"}
                                      </h5>
                                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                        <Check className="h-2.5 w-2.5" /> Verified Buyer
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] text-neutral-400 font-medium">
                                      {formattedDate}
                                    </span>
                                    {isAuthor && (
                                      <div className="flex items-center gap-1 border-l border-neutral-200 pl-2">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenReviewForm(rev)}
                                          title="Edit your review"
                                          className="p-1 text-neutral-500 hover:text-black transition cursor-pointer"
                                        >
                                          <Edit3 className="h-3 w-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteReview(revId)}
                                          title="Delete review"
                                          className="p-1 text-neutral-400 hover:text-red-600 transition cursor-pointer"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${i < (rev.rating || 5)
                                          ? "fill-amber-400 text-amber-400"
                                          : "fill-neutral-200 text-neutral-200"
                                        }`}
                                    />
                                  ))}
                                </div>

                                <p className="text-xs text-neutral-700 leading-relaxed font-normal break-words">
                                  {rev.comment}
                                </p>

                                <div className="flex items-center gap-2 text-[10px] text-neutral-400 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleVoteHelpful(rev)}
                                    className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 border transition cursor-pointer ${hasVotedHelpful
                                        ? "border-amber-400 bg-amber-50 text-amber-800 font-bold"
                                        : "border-neutral-200 hover:border-black hover:text-black"
                                      }`}
                                  >
                                    <ThumbsUp className="h-2.5 w-2.5" />
                                    <span>Helpful ({rev.helpfulCount || 0})</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. RELATED PRODUCTS ("You May Also Like")                 */}
          {/* ========================================================= */}
          {recommendedProducts.length > 0 && (
            <section className="mt-20 border-t border-neutral-200 pt-14">
              <div className="text-center max-w-xl mx-auto mb-10">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 uppercase">
                  You May Also Like
                </h2>
                <p className="text-xs text-neutral-500 mt-1">Carefully paired baby essentials handcrafted for comfort</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {recommendedProducts.map((p) => (
                  <ProductCard key={p._id || p.id} product={p} />
                ))}
              </div>
            </section>
          )}
          {/* Floating Product Video Player (Watch to Shop) */}
          <ProductFloatingVideo product={product} />
        </main>
      )}

      {/* ─── SIZE GUIDE & SIZE CHART MODAL ──────────────────────────────── */}
      {sizeGuideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSizeGuideOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50/80">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-black text-white grid place-items-center shrink-0 shadow-xs">
                  <Ruler className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                    <span>{product?.sizeChartImage ? "Product Size Chart" : "Baby Size Guide"}</span>
                    {product?.sizeChartImage && (
                      <span className="rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                        Product Specific
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {product?.name || "Little Sunbeam Baby Clothing"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900 transition cursor-pointer"
                aria-label="Close size guide"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* If custom size chart image was uploaded by admin, show image ONLY */}
              {product?.sizeChartImage ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-neutral-900">
                      Garment Measurement Chart
                    </span>
                    <a
                      href={product.sizeChartImage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>Open Full Size</span>
                      <span>↗</span>
                    </a>
                  </div>
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-2 sm:p-4 overflow-hidden flex items-center justify-center min-h-[220px]">
                    <img
                      src={product.sizeChartImage}
                      alt={`${product.name || "Product"} Size Chart`}
                      className="w-full max-h-[500px] object-contain rounded-xl"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* Standard Baby Sizing Table (Fallback when no custom chart uploaded) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                        Standard Baby Sizing Chart
                      </h4>
                      <span className="text-[11px] text-neutral-400 font-medium">All measurements approximate</span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-neutral-200">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-neutral-200 bg-neutral-100/70 font-black uppercase text-neutral-600 text-[10px]">
                          <tr>
                            <th className="px-3.5 py-2.5">Size / Age</th>
                            <th className="px-3.5 py-2.5">Baby Height</th>
                            <th className="px-3.5 py-2.5">Chest</th>
                            <th className="px-3.5 py-2.5">Weight (approx)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 bg-white">
                          {[
                            { size: "Newborn", height: "45 – 52 cm", chest: "35 – 38 cm", weight: "2.5 – 3.8 kg" },
                            { size: "0 - 3 Months", height: "52 – 62 cm", chest: "38 – 42 cm", weight: "3.8 – 5.8 kg" },
                            { size: "3 - 6 Months", height: "62 – 68 cm", chest: "42 – 45 cm", weight: "5.8 – 7.8 kg" },
                            { size: "6 - 12 Months", height: "68 – 76 cm", chest: "45 – 48 cm", weight: "7.8 – 10.2 kg" },
                            { size: "1 - 2 Years", height: "76 – 86 cm", chest: "48 – 51 cm", weight: "10.2 – 12.8 kg" },
                            { size: "2 - 3 Years", height: "86 – 94 cm", chest: "51 – 54 cm", weight: "12.8 – 15.0 kg" },
                            { size: "3 - 4 Years", height: "94 – 102 cm", chest: "54 – 57 cm", weight: "15.0 – 17.5 kg" },
                          ].map((row, rIdx) => {
                            const isSelectedRow = (selectedSize || "").toLowerCase() === row.size.toLowerCase();
                            return (
                              <tr
                                key={rIdx}
                                className={`transition ${isSelectedRow ? "bg-amber-500/10 font-bold" : "hover:bg-neutral-50"}`}
                              >
                                <td className="px-3.5 py-2.5 font-extrabold text-neutral-900 flex items-center gap-1.5">
                                  <span>{row.size}</span>
                                  {isSelectedRow && (
                                    <span className="rounded-full bg-black text-white text-[9px] px-1.5 py-0.2 font-black">
                                      Selected
                                    </span>
                                  )}
                                </td>
                                <td className="px-3.5 py-2.5 text-neutral-600">{row.height}</td>
                                <td className="px-3.5 py-2.5 text-neutral-600">{row.chest}</td>
                                <td className="px-3.5 py-2.5 text-neutral-600">{row.weight}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Sizing Tip */}
                  <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200/80 p-3.5 text-xs text-amber-900">
                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
                    <p>
                      <strong>Parent Sizing Tip:</strong> Babies grow fast! If your baby is between two sizes or in the higher percentile for weight/height, we recommend ordering one size up for a relaxed and comfortable fit.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t border-neutral-200 px-6 py-3.5 bg-neutral-50">
              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                className="rounded-full bg-black px-6 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
