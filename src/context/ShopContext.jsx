import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { products as initialProducts, categories as initialCategories } from "@/data/products";

const ShopContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const CUSTOMER_TOKEN_KEY = "little_sunbeam_customer_token";
const CUSTOMER_USER_KEY = "little_sunbeam_customer_user";

// Helper: Robustly extract numerical price from candidates without falling back to 0 prematurely
export const parsePrice = (...candidates) => {
  for (const val of candidates) {
    if (val === null || val === undefined || val === "") continue;
    if (typeof val === "number" && !isNaN(val) && val > 0) return val;
    if (typeof val === "string") {
      const cleaned = Number(val.replace(/[^0-9.]/g, ""));
      if (!isNaN(cleaned) && cleaned > 0) return cleaned;
    }
    if (typeof val === "object" && val !== null) {
      const subPrice = parsePrice(val.price, val.sellingPrice, val.mrp, val.unitPrice, val.cost);
      if (subPrice > 0) return subPrice;
    }
  }
  return 0;
};

// Normalize product for frontend components
export const normalizeProduct = (p) => {
  if (!p || typeof p !== "object") return null;
  const idStr = String(p._id || p.id || "");
  const gallery = p.gallery && p.gallery.length > 0 ? p.gallery : (p.image ? [p.image] : []);

  // Normalize prints array
  let normalizedPrints = [];
  if (Array.isArray(p.prints) && p.prints.length > 0) {
    normalizedPrints = p.prints.map((pr) => {
      if (typeof pr === "object" && pr !== null) {
        return {
          _id: String(pr._id || pr.id || ""),
          id: pr.id || String(pr._id || ""),
          name: pr.name || "",
          emoji: pr.emoji || pr.icon || "✨",
          icon: pr.icon || pr.emoji || "✨",
        };
      }
      return { _id: String(pr), id: String(pr), name: String(pr), emoji: "✨", icon: "✨" };
    });
  }

  const priceNum = parsePrice(
    p.price,
    p.sellingPrice,
    p.variantPrice,
    p.offerPrice,
    p.colorVariants?.[0]?.inventory?.[0]?.price,
    p.variants?.[0]?.price,
    p.mrp
  );
  const mrpNum = parsePrice(p.mrp, p.originalPrice, priceNum);
  const discountNum = p.discount !== undefined && !isNaN(Number(p.discount)) ? Number(p.discount) : (mrpNum > priceNum ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0);
  const stockNum = Number(p.stock !== undefined ? p.stock : 50);
  const threshold = Number(p.lowStockThreshold || 10);
  let stockStatus = p.stockStatus || (stockNum <= 0 ? "Out of Stock" : (stockNum <= threshold ? "Low Stock" : "In Stock"));

  // Normalize colorVariants array
  let normalizedColorVariants = [];
  let colorVariantImages = [];
  if (Array.isArray(p.colorVariants) && p.colorVariants.length > 0) {
    normalizedColorVariants = p.colorVariants.map((cv, idx) => {
      const cvImages = Array.isArray(cv.images)
        ? cv.images
          .map((img) => (typeof img === "string" ? { url: img, isPrimary: false } : { url: img.url, isPrimary: Boolean(img.isPrimary) }))
          .filter((img) => Boolean(img.url))
        : [];

      cvImages.forEach((img) => {
        if (img.url) colorVariantImages.push(img.url);
      });

      return {
        _id: String(cv._id || `cv-${idx}`),
        id: String(cv._id || `cv-${idx}`),
        name: cv.name || `Color ${idx + 1}`,
        displayName: cv.displayName || cv.name || `Color ${idx + 1}`,
        hex: cv.hex || "#E5E7EB",
        images: cvImages,
        sizes: Array.isArray(cv.sizes) ? cv.sizes : [],
        inventory: Array.isArray(cv.inventory)
          ? cv.inventory.map((inv) => ({
            _id: String(inv._id || ""),
            size: inv.size || "Standard",
            stock: Number(inv.stock) || 0,
            sku: inv.sku || "",
            price: inv.price !== undefined ? Number(inv.price) : priceNum,
            mrp: inv.mrp !== undefined ? Number(inv.mrp) : mrpNum,
          }))
          : [],
      };
    });
  }

  const activeMainImg = p.image || colorVariantImages[0] || (gallery && gallery[0]) || "";
  const activeGallery = gallery && gallery.length > 0 ? gallery : (colorVariantImages.length > 0 ? colorVariantImages : (activeMainImg ? [activeMainImg] : []));

  const extractedColors = normalizedColorVariants.length > 0
    ? normalizedColorVariants.map((cv) => ({ name: cv.name, hex: cv.hex }))
    : (p.colors && p.colors.length > 0 ? p.colors : [{ name: "Default", hex: "#E5E7EB" }]);

  const extractedSizes = normalizedColorVariants.length > 0
    ? Array.from(new Set(normalizedColorVariants.flatMap((cv) => (cv.sizes?.length ? cv.sizes : cv.inventory.map((inv) => inv.size)))))
    : (p.sizes && p.sizes.length > 0 ? p.sizes : ["0-3M", "3-6M", "6-12M"]);

  return {
    ...p,
    _id: idStr,
    id: idStr,
    name: p.name || "",
    price: priceNum,
    mrp: mrpNum,
    discount: discountNum,
    gst: p.gst !== undefined ? Number(p.gst) : 5,
    category: (p.category || "").toLowerCase(),
    categoryId: p.categoryId || null,
    categoryPill: p.categoryPill || p.category || "",
    subCategory: p.subCategory || "",
    brand: p.brand || "Little Sunbeam",
    age: p.age || p.ageGroup || "0 - 3 Months",
    ageGroup: p.ageGroup || p.age || "0 - 3 Months",
    gender: p.gender || "Unisex",
    fabric: p.fabric || "",
    pattern: p.pattern || "",
    print: p.print || (normalizedPrints[0]?.name || normalizedPrints[0]?.id || ""),
    prints: normalizedPrints,
    sleeveType: p.sleeveType || "",
    neckType: p.neckType || "",
    fitType: p.fitType || "",
    season: p.season || "",
    image: activeMainImg,
    gallery: activeGallery,
    images: p.images || { main: activeMainImg, front: "", back: "", side: "", model: "", additional: [] },
    video: p.video || (Array.isArray(p.videos) && p.videos[0]) || "",
    videos: Array.isArray(p.videos) && p.videos.length > 0
      ? p.videos.map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean)
      : (p.video && String(p.video).trim() ? [String(p.video).trim()] : []),
    colorVariants: normalizedColorVariants,
    variants: Array.isArray(p.variants) ? p.variants : [],
    colors: extractedColors,
    sizes: extractedSizes.length > 0 ? extractedSizes : ["Standard"],
    stock: stockNum,
    lowStockThreshold: threshold,
    stockStatus: stockStatus,
    sku: p.sku || `SUN-${idStr}`,
    careInstructions: p.careInstructions || "Machine wash cold with gentle baby detergent. Do not bleach. Tumble dry low.",
    washCare: p.washCare || "Gentle Hand/Machine Wash",
    countryOfOrigin: p.countryOfOrigin || "India",
    manufacturer: p.manufacturer || "Little Sunbeam Kidswear",
    productWeight: p.productWeight || "150g",
    returnEligibility: p.returnEligibility || "7-Day Return & Exchange Available",
    badge: p.badge || "",
    status: p.status || "Active",
    rating: p.rating !== undefined ? Number(p.rating) : 0,
    reviewCount: Number(p.reviewCount) || 0,
    description: p.description || "",
    details: p.details || "",
    tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === "string" ? p.tags.split(",").map(t => t.trim()).filter(Boolean) : []),
    isFeatured: Boolean(p.isFeatured),
    isNewArrival: p.isNewArrival !== undefined ? Boolean(p.isNewArrival) : true,
    isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
  };
};

const getUserCartKey = (userId) => `little_sunbeam_cart_${userId || "guest"}`;
const getUserWishlistKey = (userId) => `little_sunbeam_wishlist_${userId || "guest"}`;

// Helper to get initial customer auth from localStorage
const getStoredCustomer = () => {
  try {
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    const userStr = localStorage.getItem(CUSTOMER_USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user, isAuthenticated: Boolean(token && user) };
  } catch {
    return { token: null, user: null, isAuthenticated: false };
  }
};

const LOCAL_PRODUCTS_KEY = "little_sunbeam_admin_products";

// One-time migration: clear any stale cart localStorage entries that contain
// known dummy/deleted product names. Runs once per browser session.
const MIGRATION_KEY = "little_sunbeam_cart_migration_v2";
const cleanStaleDummyCartData = () => {
  try {
    if (localStorage.getItem(MIGRATION_KEY)) return; // already ran
    const KNOWN_DUMMY_NAMES = [
      "Jorpeche Oversize Fit Blazer",
      "Ethnic Shirt - Green Kanjeevaram",
      "Ethnic Shirt - Chocolate Nisha",
      "Ethnic Shirt - Marigold Sweety",
      "Ethnic Shirt - Peacock Blue",
      "Sunny Muslin Swaddle - Pack of 3",
      "Newborn Hospital Kit - 14 Pieces",
      "Bear Ears Hooded Towel",
    ];
    // Scan all localStorage keys that look like cart keys
    Object.keys(localStorage)
      .filter((k) => k.startsWith("little_sunbeam_cart_"))
      .forEach((cartKey) => {
        try {
          const raw = localStorage.getItem(cartKey);
          if (!raw) return;
          const items = JSON.parse(raw);
          if (!Array.isArray(items)) {
            localStorage.removeItem(cartKey);
            return;
          }
          const cleaned = items.filter(
            (item) => !KNOWN_DUMMY_NAMES.includes(item.name)
          );
          if (cleaned.length !== items.length) {
            if (cleaned.length === 0) {
              localStorage.removeItem(cartKey);
            } else {
              localStorage.setItem(cartKey, JSON.stringify(cleaned));
            }
          }
        } catch {
          localStorage.removeItem(cartKey);
        }
      });
    localStorage.setItem(MIGRATION_KEY, "done");
  } catch { }
};
cleanStaleDummyCartData();

const getInitialProducts = () => {
  try {
    const stored = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeProduct);
      }
    }
  } catch (e) {
    console.error("Error reading local products:", e);
  }
  return [];
};

export function ShopProvider({ children }) {
  // ─── Products state (Live Backend + Local Storage Fallback) ────────────────
  const [products, setProducts] = useState(getInitialProducts);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isLiveBackend, setIsLiveBackend] = useState(false);

  // ─── Banner text (editable from admin) ───────────────────────────────────
  const BANNER_KEY = "little_sunbeam_banner_text";
  const DEFAULT_BANNER = "Use code SUNNY10 for 10% off orders above ₹1999 · Free shipping over ₹2499";
  const [bannerText, setBannerTextState] = useState(() => {
    try { return localStorage.getItem(BANNER_KEY) || DEFAULT_BANNER; } catch { return DEFAULT_BANNER; }
  });
  const setBannerText = (text) => {
    setBannerTextState(text);
    try { localStorage.setItem(BANNER_KEY, text); } catch { }
  };

  // ─── Footer contact info (editable from admin) ───────────────────────────
  const FOOTER_KEY = "little_sunbeam_footer_info";
  const DEFAULT_FOOTER = {
    email: "littlesunbeamkidswear@gmail.com",
    phone: "+91 93615 03943",
    address: "1/95m Bandari Nagar, Veerapandi, Tirupur, Tamil Nadu - 641605",
  };
  const [footerInfo, setFooterInfoState] = useState(() => {
    try {
      const stored = localStorage.getItem(FOOTER_KEY);
      return stored ? { ...DEFAULT_FOOTER, ...JSON.parse(stored) } : DEFAULT_FOOTER;
    } catch {
      return DEFAULT_FOOTER;
    }
  });
  const setFooterInfo = (info) => {
    setFooterInfoState(info);
    try { localStorage.setItem(FOOTER_KEY, JSON.stringify(info)); } catch { }
  };

  // ─── Hero Banner Slides (editable from admin) ─────────────────────────────
  const HERO_BANNERS_KEY = "little_sunbeam_hero_banners";
  const DEFAULT_HERO_BANNERS = [
    {
      id: 1,
      badge: "New Arrival",
      heading: "Soft muslin days for your <span class=\"sun-underline\">little sunbeam</span>",
      subtext: "100% organic cotton essentials designed for delicate newborn skin — swaddles, hospital kits, towels and everyday clothing.",
      primaryBtnLabel: "Shop Now",
      primaryBtnTo: "/shop",
      secondaryBtnLabel: "Newborn Hospital Kits",
      secondaryBtnTo: "/shop",
      image: "/src/assets/hero-baby.jpg",
      imageAlt: "Smiling baby in soft yellow organic cotton clothing",
      bgColor: "",
    },
    {
      id: 2,
      badge: "Best Sellers",
      heading: "Wrap them in <span class=\"sun-underline\">pure softness</span>",
      subtext: "Our muslin swaddles and towels are crafted from the finest organic cotton — gentle on newborn skin, durable for everyday use.",
      primaryBtnLabel: "Shop Muslin",
      primaryBtnTo: "/shop",
      secondaryBtnLabel: "View All",
      secondaryBtnTo: "/shop",
      image: "/src/assets/hero-baby.jpg",
      imageAlt: "Baby wrapped in soft muslin swaddle",
      bgColor: "oklch(0.97 0.02 95)",
    },
    {
      id: 3,
      badge: "Hospital Ready",
      heading: "Everything your <span class=\"sun-underline\">newborn needs</span>",
      subtext: "Complete hospital kits packed with certified organic cotton essentials — designed by parents, trusted by doctors across India.",
      primaryBtnLabel: "Explore Hospital Kits",
      primaryBtnTo: "/shop",
      secondaryBtnLabel: "Learn More",
      secondaryBtnTo: "/shop",
      image: "/src/assets/hero-baby.jpg",
      imageAlt: "Newborn hospital kit essentials",
      bgColor: "oklch(0.97 0.025 160)",
    },
  ];
  const [heroBanners, setHeroBannersState] = useState(() => {
    try {
      const stored = localStorage.getItem(HERO_BANNERS_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_HERO_BANNERS;
    } catch {
      return DEFAULT_HERO_BANNERS;
    }
  });

  const fetchLiveHeroBanners = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/banners?all=true`);
      if (!res.ok) throw new Error("Failed to fetch live hero banners");
      const data = await res.json();
      const rawBanners = data.data?.banners || data.banners || [];
      if (Array.isArray(rawBanners) && rawBanners.length > 0) {
        setHeroBannersState(rawBanners);
        try {
          localStorage.setItem(HERO_BANNERS_KEY, JSON.stringify(rawBanners));
        } catch { }
        return;
      }
    } catch (err) {
      try {
        const stored = localStorage.getItem(HERO_BANNERS_KEY);
        if (stored) {
          setHeroBannersState(JSON.parse(stored));
        }
      } catch { }
    }
  }, []);

  const setHeroBanners = (banners, syncToBackend = true) => {
    setHeroBannersState(banners);
    try {
      localStorage.setItem(HERO_BANNERS_KEY, JSON.stringify(banners));
      window.dispatchEvent(new Event("hero_banners_updated"));
    } catch { }

    if (!syncToBackend) return;

    // Sync to backend /api/banners if admin token is available
    const token = localStorage.getItem("little_sunbeam_admin_token") || localStorage.getItem("adminToken");
    if (!token) return;

    fetch(`${API_BASE_URL}/banners`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ banners }),
    }).catch(() => { });
  };

  // ─── Shop By Print options (editable from admin) ──────────────────────────
  const PRINTS_KEY = "little_sunbeam_prints";
  const SHOP_BY_PRINT_ENABLED_KEY = "little_sunbeam_shop_by_print_enabled";

  const [isShopByPrintEnabled, setIsShopByPrintEnabledState] = useState(() => {
    try {
      const stored = localStorage.getItem(SHOP_BY_PRINT_ENABLED_KEY);
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const setShopByPrintEnabled = (enabled) => {
    const val = Boolean(enabled);
    setIsShopByPrintEnabledState(val);
    try {
      localStorage.setItem(SHOP_BY_PRINT_ENABLED_KEY, JSON.stringify(val));
      window.dispatchEvent(new Event("prints_updated"));
    } catch { }
  };
  // Emoji dictionary for auto-assigning cute icons to new baby prints
  const EMOJI_MAP = {
    fruit: "🍓",
    candy: "🍬",
    animal: "🐘",
    heart: "💖",
    cloud: "☁️",
    flower: "🌸",
    star: "⭐",
    rainbow: "🌈",
    sunflower: "🌻",
    dinosaur: "🦕",
    dino: "🦖",
    butterfly: "🦋",
    bear: "🧸",
    teddy: "🧸",
    dog: "🐶",
    cat: "🐱",
    bird: "🐦",
    lion: "🦁",
    panda: "🐼",
    fish: "🐠",
    duck: "🦆",
    rabbit: "🐰",
    bunny: "🐰",
    moon: "🌙",
    sun: "☀️",
    strawberry: "🍓",
    apple: "🍎",
    banana: "🍌",
    cherry: "🍒",
    icecream: "🍦",
    balloon: "🎈",
    leaf: "🌿",
    clover: "🍀",
    music: "🎵",
  };

  const [prints, setPrintsState] = useState(() => {
    try {
      const stored = localStorage.getItem(PRINTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const fetchLivePrints = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/prints?all=true`);
      if (!res.ok) throw new Error("Failed to fetch live prints");
      const data = await res.json();
      const rawPrints = data.data?.prints || data.prints || [];
      if (Array.isArray(rawPrints)) {
        setPrintsState(rawPrints);
        try {
          localStorage.setItem(PRINTS_KEY, JSON.stringify(rawPrints));
        } catch { }
        return;
      }
    } catch (err) {
      // Offline fallback: load from local storage
      try {
        const stored = localStorage.getItem(PRINTS_KEY);
        if (stored) setPrintsState(JSON.parse(stored));
      } catch { }
    }
  }, []);

  const setPrints = (newPrints, syncToBackend = true) => {
    setPrintsState(newPrints);
    try {
      localStorage.setItem(PRINTS_KEY, JSON.stringify(newPrints));
      window.dispatchEvent(new Event("prints_updated"));
    } catch { }

    if (!syncToBackend) return;

    // Sync to backend /api/prints if admin is logged in
    const token = localStorage.getItem("little_sunbeam_admin_token") || localStorage.getItem("adminToken");
    if (!token) return;

    fetch(`${API_BASE_URL}/prints`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prints: newPrints }),
    }).catch(() => { });
  };

  // ─── Categories state (Live Backend + Local Storage Fallback) ───────────────
  const CATEGORIES_KEY = "little_sunbeam_categories";
  const [categories, setCategoriesState] = useState(() => {
    try {
      const stored = localStorage.getItem(CATEGORIES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { }
    return [];
  });

  const fetchLiveCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error("Failed to fetch live categories");
      const data = await res.json();
      const rawCategories = data.data?.categories || data.categories || [];
      if (Array.isArray(rawCategories)) {
        setCategoriesState(rawCategories);
        try {
          localStorage.setItem(CATEGORIES_KEY, JSON.stringify(rawCategories));
        } catch { }
        return;
      }
    } catch (err) {
      try {
        const stored = localStorage.getItem(CATEGORIES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCategoriesState(parsed);
          }
        }
      } catch { }
    }
  }, []);

  const setCategories = (newCategories) => {
    setCategoriesState(newCategories);
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(newCategories));
      window.dispatchEvent(new CustomEvent("categories_updated", { detail: newCategories }));
    } catch { }
  };

  const fetchLiveProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch(`${API_BASE_URL}/products?limit=100`);
      if (!res.ok) throw new Error("Failed to fetch live products");
      const data = await res.json();
      const rawProducts = data.data?.products || data.products || [];
      if (Array.isArray(rawProducts)) {
        const normalized = rawProducts.map(normalizeProduct);
        setProducts(normalized);
        setIsLiveBackend(true);
        try {
          localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(rawProducts));
        } catch { }
        return;
      }
    } catch (err) {
      console.warn("[ShopContext] Live products fetch notice:", err.message);
      setIsLiveBackend(false);
    } finally {
      setLoadingProducts(false);
    }

    // Fallback from local storage
    try {
      const stored = localStorage.getItem(LOCAL_PRODUCTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setProducts(parsed.map(normalizeProduct));
          return;
        }
      }
    } catch { }
    setProducts([]);
  }, []);

  useEffect(() => {
    fetchLiveProducts();
    fetchLivePrints();
    fetchLiveCategories();
    fetchLiveHeroBanners();

    // Listen for product updates, print updates, and category updates in real-time
    const handleProductsUpdated = () => {
      fetchLiveProducts();
    };

    const handleHeroBannersUpdated = () => {
      fetchLiveHeroBanners();
      try {
        const stored = localStorage.getItem(HERO_BANNERS_KEY);
        if (stored) {
          setHeroBannersState(JSON.parse(stored));
        }
      } catch { }
    };

    const handlePrintsUpdated = () => {
      fetchLivePrints();
      try {
        const stored = localStorage.getItem(PRINTS_KEY);
        if (stored) {
          setPrintsState(JSON.parse(stored));
        }
      } catch { }
      try {
        const storedToggle = localStorage.getItem(SHOP_BY_PRINT_ENABLED_KEY);
        if (storedToggle !== null) {
          setIsShopByPrintEnabledState(JSON.parse(storedToggle));
        }
      } catch { }
    };

    const handleCategoriesUpdated = (e) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setCategoriesState(e.detail);
      } else {
        fetchLiveCategories();
      }
    };

    window.addEventListener("products_updated", handleProductsUpdated);
    window.addEventListener("prints_updated", handlePrintsUpdated);
    window.addEventListener("categories_updated", handleCategoriesUpdated);
    window.addEventListener("hero_banners_updated", handleHeroBannersUpdated);
    window.addEventListener("storage", (e) => {
      if (e.key === HERO_BANNERS_KEY && e.newValue) {
        try {
          setHeroBannersState(JSON.parse(e.newValue));
        } catch { }
      }
      if (e.key === PRINTS_KEY && e.newValue) {
        try {
          setPrintsState(JSON.parse(e.newValue));
        } catch { }
      }
      if (e.key === SHOP_BY_PRINT_ENABLED_KEY && e.newValue) {
        try {
          setIsShopByPrintEnabledState(JSON.parse(e.newValue));
        } catch { }
      }
      if (e.key === CATEGORIES_KEY && e.newValue) {
        try {
          setCategoriesState(JSON.parse(e.newValue));
        } catch { }
      }
      handleProductsUpdated();
    });

    return () => {
      window.removeEventListener("products_updated", handleProductsUpdated);
      window.removeEventListener("prints_updated", handlePrintsUpdated);
      window.removeEventListener("categories_updated", handleCategoriesUpdated);
      window.removeEventListener("hero_banners_updated", handleHeroBannersUpdated);
      window.removeEventListener("storage", handleProductsUpdated);
    };
  }, [fetchLiveProducts, fetchLivePrints, fetchLiveCategories, fetchLiveHeroBanners]);

  // ─── Customer Auth state ──────────────────────────────────────────────────
  const [customerAuth, setCustomerAuth] = useState(getStoredCustomer);
  const [authNotice, setAuthNotice] = useState("");

  const currentUserId = customerAuth.user?._id || customerAuth.user?.id || null;

  // ─── User-Scoped Cart state ───────────────────────────────────────────────
  const [cart, setCart] = useState(() => {
    if (!currentUserId) return [];
    try {
      const key = getUserCartKey(currentUserId);
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ─── User-Scoped Wishlist state ───────────────────────────────────────────
  const [wishlist, setWishlist] = useState(() => {
    if (!currentUserId) return [];
    try {
      const key = getUserWishlistKey(currentUserId);
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Whenever the active user changes (login / logout / switch account), load their cart and wishlist
  useEffect(() => {
    if (!currentUserId || !customerAuth.token) {
      setCart([]);
      setWishlist([]);
      return;
    }

    const keyCart = getUserCartKey(currentUserId);
    const keyWish = getUserWishlistKey(currentUserId);

    // ─── IMPORTANT: Clear state immediately on user switch ───────────────────
    // Do NOT pre-load stale localStorage here. The backend is the single source
    // of truth. We only fall back to localStorage if the network request fails.
    // This prevents deleted/dummy cart items from flashing on login.
    setCart([]);
    setWishlist([]);

    const handleUnauthorized = (r) => {
      if (r.status === 401) {
        // Token expired — clear it so we stop retrying
        setCustomerSession(null, null);
        return null;
      }
      return r.ok ? r.json() : null;
    };

    // 1. Fetch user remote cart — backend is the source of truth
    fetch(`${API_BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${customerAuth.token}` },
    })
      .then(handleUnauthorized)
      .then((data) => {
        if (data?.data?.items && Array.isArray(data.data.items)) {
          const formattedItems = data.data.items
            .filter((i) => Boolean(i && (i.product || i.name)))
            .map((i) => {
              const pId = String(i.product?._id || i.product || i._id);
              const color = String(i.selectedColor || i.color || "Default").trim();
              const size = String(i.selectedSize || i.size || "Standard").trim();
              const variant = i.variant || (color !== "Default" && size !== "Standard" ? `${color} / ${size}` : color !== "Default" ? color : size !== "Standard" ? size : "");
              const cartItemId = `${pId}_${color}_${size}`;
              const itemDbId = String(i._id || "");
              const itemPrice = parsePrice(
                i.price,
                i.product?.price,
                i.product?.sellingPrice,
                i.product?.mrp
              );
              return {
                id: cartItemId,
                _id: itemDbId || cartItemId,
                productId: pId,
                cartItemId,
                name: i.name || i.product?.name || "Baby Clothing",
                price: itemPrice,
                image: i.image || i.product?.image || (i.product?.gallery && i.product?.gallery[0]) || "",
                qty: Math.max(1, Number(i.quantity || i.qty) || 1),
                size,
                color,
                selectedSize: size,
                selectedColor: color,
                variant,
              };
            });
          setCart(formattedItems);
          // Sync localStorage with the authoritative backend data
          if (formattedItems.length > 0) {
            localStorage.setItem(keyCart, JSON.stringify(formattedItems));
          } else {
            // Backend says cart is empty — wipe any stale localStorage entry
            localStorage.removeItem(keyCart);
          }
        }
      })
      .catch(() => {
        // Network failure only — fall back to localStorage as last resort
        try {
          const savedCart = localStorage.getItem(keyCart);
          if (savedCart) {
            const parsed = JSON.parse(savedCart);
            if (Array.isArray(parsed)) {
              setCart(
                parsed.map((item) => ({
                  ...item,
                  price: parsePrice(item.price, item.product?.price, item.mrp),
                }))
              );
            }
          }
        } catch { }
      });

    // 2. Fetch user remote wishlist — backend is the source of truth
    fetch(`${API_BASE_URL}/wishlist`, {
      headers: { Authorization: `Bearer ${customerAuth.token}` },
    })
      .then((res) => {
        if (res.ok) return res.json();
        return fetch(`${API_BASE_URL}/users/wishlist`, {
          headers: { Authorization: `Bearer ${customerAuth.token}` },
        }).then(handleUnauthorized);
      })
      .then((data) => {
        if (data?.data?.wishlist && Array.isArray(data.data.wishlist)) {
          const formattedWish = data.data.wishlist.map(normalizeProduct);
          setWishlist(formattedWish);
          if (formattedWish.length > 0) {
            localStorage.setItem(keyWish, JSON.stringify(formattedWish));
          } else {
            localStorage.removeItem(keyWish);
          }
        }
      })
      .catch(() => {
        // Network failure only — fall back to localStorage as last resort
        try {
          const savedWish = localStorage.getItem(keyWish);
          if (savedWish) setWishlist(JSON.parse(savedWish));
        } catch { }
      });
    // 3. Fetch latest user profile (with saved shipping address) from database
    if (customerAuth.token && !customerAuth.token.startsWith("demo_jwt")) {
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${customerAuth.token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.data?.user) {
            const freshUser = data.data.user;
            localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(freshUser));
            setCustomerAuth((prev) => ({ ...prev, user: freshUser }));
            const addr = freshUser.shippingAddress || freshUser.address;
            if (addr && (addr.street || addr.address)) {
              localStorage.setItem("little_sunbeam_saved_address", JSON.stringify(addr));
            }
          }
        })
        .catch(() => { });
    }
  }, [currentUserId, customerAuth.token]);

  // Persist cart to localStorage whenever it changes (only when logged in)
  // Note: cart is set from backend on login; this keeps localStorage in sync
  // after user actions (add/remove/update) that happen during the session.
  useEffect(() => {
    if (!currentUserId) return;
    try {
      const key = getUserCartKey(currentUserId);
      localStorage.setItem(key, JSON.stringify(cart));
    } catch { }
  }, [cart, currentUserId]);

  // Persist wishlist to active user's storage only if logged in
  useEffect(() => {
    if (!currentUserId) return;
    try {
      const key = getUserWishlistKey(currentUserId);
      localStorage.setItem(key, JSON.stringify(wishlist));
    } catch { }
  }, [wishlist, currentUserId]);

  const setCustomerSession = (token, user) => {
    try {
      if (token && user) {
        localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
        localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(user));
        setCustomerAuth({ token, user, isAuthenticated: true });
        const addr = user.shippingAddress || user.address;
        if (addr && (addr.street || addr.address)) {
          localStorage.setItem("little_sunbeam_saved_address", JSON.stringify(addr));
        }
      } else {
        localStorage.removeItem(CUSTOMER_TOKEN_KEY);
        localStorage.removeItem(CUSTOMER_USER_KEY);
        setCustomerAuth({ token: null, user: null, isAuthenticated: false });
      }
    } catch (e) {
      console.error("Error setting customer session:", e);
    }
  };

  // Customer Login
  const loginCustomer = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid email or password");
      }

      const { token, user } = data.data;
      setCustomerSession(token, user);
      return { success: true, user, token };
    } catch (err) {
      throw err;
    }
  };

  // Customer Register
  const registerCustomer = async ({ name, email, phone, password, confirmPassword }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone ? phone.trim() : "",
          password,
          confirmPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      const { token, user } = data.data;
      setCustomerSession(token, user);
      return { success: true, user, token };
    } catch (err) {
      if (err.message && !err.message.includes("fetch") && !err.message.includes("NetworkError")) {
        throw err;
      }
      const newUser = {
        _id: "cust_" + Date.now(),
        id: "cust_" + Date.now(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : "",
        role: "user",
        createdAt: new Date().toISOString(),
      };
      const token = "demo_jwt_customer_token_" + Date.now();
      setCustomerSession(token, newUser);
      return { success: true, user, newUser, token };
    }
  };

  // Update Customer Profile
  const updateCustomerProfile = async (updates) => {
    const updatedUser = { ...(customerAuth.user || {}), ...updates };
    setCustomerSession(customerAuth.token, updatedUser);

    if (customerAuth.token) {
      try {
        const res = await fetch(`${API_BASE_URL}/users/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerAuth.token}`,
          },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data?.user) {
            setCustomerSession(customerAuth.token, data.data.user);
            return data.data.user;
          }
        }
      } catch (err) {
        console.warn("Backend profile update fallback:", err);
      }
    }
    return updatedUser;
  };

  // Customer Logout
  const logoutCustomer = () => {
    setCustomerSession(null, null);
    setCart([]);
    setWishlist([]);
  };

  // ─── Drawer / modal state ─────────────────────────────────────────────────
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const requireLogin = useCallback((notice = "Please login to continue.") => {
    setAuthNotice(notice);
    setAuthOpen(true);
  }, []);

  // ─── Derived counts ───────────────────────────────────────────────────────
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const wishlistCount = wishlist.length;

  // ─── Cart actions ─────────────────────────────────────────────────────────
  const addToCart = useCallback((product, qtyToAdd = 1) => {
    // 1. Block Guest user & prompt login
    if (!customerAuth.token || !customerAuth.isAuthenticated) {
      requireLogin("Please login to continue.");
      return false;
    }

    const pId = String(product._id || product.id || product.productId);
    const quantity = Math.max(1, Number(qtyToAdd) || Number(product.qty) || 1);
    const color = String(product.selectedColor || product.color || (product.colors && product.colors[0]?.name) || "Default").trim();
    const size = String(product.selectedSize || product.size || (product.sizes && product.sizes[0]) || "Standard").trim();
    const variant = product.variant || (color !== "Default" && size !== "Standard" ? `${color} / ${size}` : color !== "Default" ? color : size !== "Standard" ? size : "Standard");
    const cartItemId = `${pId}_${color}_${size}`;
    const price = parsePrice(
      product.price,
      product.sellingPrice,
      product.variantPrice,
      product.offerPrice,
      product.colorVariants?.[0]?.inventory?.[0]?.price,
      product.variants?.[0]?.price,
      product.mrp
    );
    const image = product.image || (product.gallery && product.gallery[0]) || "";
    const name = product.name || "Baby Clothing Item";

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
          i.cartItemId === cartItemId ||
          (String(i.productId || i.id || i._id) === pId &&
            String(i.selectedColor || i.color || "Default").toLowerCase() === color.toLowerCase() &&
            String(i.selectedSize || i.size || "Standard").toLowerCase() === size.toLowerCase())
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: (updated[existingIdx].qty || 1) + quantity,
          price: price > 0 ? price : updated[existingIdx].price,
          image: image || updated[existingIdx].image,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: cartItemId,
          _id: cartItemId,
          cartItemId,
          productId: pId,
          name,
          price,
          image,
          qty: quantity,
          size,
          color,
          selectedSize: size,
          selectedColor: color,
          variant,
        },
      ];
    });

    // Sync to backend with user's JWT token
    fetch(`${API_BASE_URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerAuth.token}`,
      },
      body: JSON.stringify({
        productId: pId,
        quantity,
        selectedSize: size,
        selectedColor: color,
        variant,
        price,
        image,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.items && Array.isArray(data.data.items)) {
          const formattedItems = data.data.items
            .filter((i) => Boolean(i && (i.product || i.name)))
            .map((i) => {
              const prodId = String(i.product?._id || i.product || i._id);
              const c = String(i.selectedColor || i.color || "Default").trim();
              const s = String(i.selectedSize || i.size || "Standard").trim();
              const v = i.variant || (c !== "Default" && s !== "Standard" ? `${c} / ${s}` : c !== "Default" ? c : s !== "Standard" ? s : "");
              const cItemId = `${prodId}_${c}_${s}`;
              const itemDbId = String(i._id || "");
              const itemPrice = parsePrice(
                i.price,
                i.product?.price,
                i.product?.sellingPrice,
                i.product?.mrp,
                price
              );
              return {
                id: cItemId,
                _id: itemDbId || cItemId,
                productId: prodId,
                cartItemId: cItemId,
                name: i.name || i.product?.name || "Baby Clothing",
                price: itemPrice,
                image: i.image || i.product?.image || (i.product?.gallery && i.product?.gallery[0]) || "",
                qty: Math.max(1, Number(i.quantity || i.qty) || 1),
                size: s,
                color: c,
                selectedSize: s,
                selectedColor: c,
                variant: v,
              };
            });
          setCart(formattedItems);
        }
      })
      .catch(() => { });

    return true;
  }, [customerAuth.token, customerAuth.isAuthenticated, requireLogin]);

  const removeFromCart = useCallback((itemId) => {
    if (!customerAuth.token) return;
    const key = String(itemId);
    setCart((prev) =>
      prev.filter(
        (i) =>
          !(
            (i.cartItemId && String(i.cartItemId) === key) ||
            (i._id && String(i._id) === key) ||
            (i.id && String(i.id) === key)
          )
      )
    );

    fetch(`${API_BASE_URL}/cart/${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${customerAuth.token}` },
    }).catch(() => { });
  }, [customerAuth.token]);

  const updateCartQty = useCallback((itemId, delta) => {
    if (!customerAuth.token) {
      requireLogin("Please login to continue.");
      return;
    }
    const key = String(itemId);
    setCart((prev) =>
      prev
        .map((i) => {
          const isMatch =
            (i.cartItemId && String(i.cartItemId) === key) ||
            (i._id && String(i._id) === key) ||
            (i.id && String(i.id) === key);
          return isMatch ? { ...i, qty: Math.max(0, (i.qty || 1) + delta) } : i;
        })
        .filter((i) => i.qty > 0)
    );

    fetch(`${API_BASE_URL}/cart/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerAuth.token}`,
      },
      body: JSON.stringify({ delta }),
    }).catch(() => { });
  }, [customerAuth.token, requireLogin]);

  const clearCart = useCallback(() => {
    setCart([]);
    if (currentUserId) {
      try {
        const key = getUserCartKey(currentUserId);
        localStorage.removeItem(key);
      } catch { }
    }
    if (customerAuth.token) {
      fetch(`${API_BASE_URL}/cart`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${customerAuth.token}` },
      }).catch(() => { });
    }
  }, [customerAuth.token, currentUserId]);

  // ─── Wishlist actions ─────────────────────────────────────────────────────
  const toggleWishlist = useCallback((product) => {
    // 1. Block Guest user & prompt login
    if (!customerAuth.token || !customerAuth.isAuthenticated) {
      requireLogin("Please login to continue.");
      return false;
    }

    const pId = String(product._id || product.id);

    // Optimistic toggle
    setWishlist((prev) => {
      const inList = prev.some((i) => String(i._id || i.id) === pId);
      if (inList) {
        return prev.filter((i) => String(i._id || i.id) !== pId);
      } else {
        return [...prev, { ...product, id: pId }];
      }
    });

    // Call backend API /api/wishlist/toggle
    fetch(`${API_BASE_URL}/wishlist/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerAuth.token}`,
      },
      body: JSON.stringify({ productId: pId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.wishlist && Array.isArray(data.data.wishlist)) {
          setWishlist(data.data.wishlist.map(normalizeProduct));
        }
      })
      .catch(() => { });

    return true;
  }, [customerAuth.token, customerAuth.isAuthenticated, requireLogin]);

  const isWishlisted = useCallback(
    (productId) => {
      if (!customerAuth.token || !customerAuth.isAuthenticated) return false;
      const pId = String(productId);
      return wishlist.some((i) => String(i._id || i.id) === pId);
    },
    [customerAuth.token, customerAuth.isAuthenticated, wishlist]
  );

  const removeFromWishlist = useCallback((productId) => {
    if (!customerAuth.token) return;
    const pId = String(productId);
    setWishlist((prev) => prev.filter((i) => String(i._id || i.id) !== pId));

    fetch(`${API_BASE_URL}/wishlist/${pId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${customerAuth.token}` },
    }).catch(() => { });
  }, [customerAuth.token]);

  return (
    <ShopContext.Provider
      value={{
        // Live Products
        products,
        loadingProducts,
        isLiveBackend,
        refreshProducts: fetchLiveProducts,
        // Customer Auth
        customer: customerAuth.user,
        customerToken: customerAuth.token,
        isCustomerLoggedIn: customerAuth.isAuthenticated,
        loginCustomer,
        registerCustomer,
        updateCustomerProfile,
        logoutCustomer,
        authNotice,
        setAuthNotice,
        requireLogin,
        // User-based Cart
        cart,
        cartCount,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        // User-based Wishlist
        wishlist,
        wishlistCount,
        toggleWishlist,
        isWishlisted,
        removeFromWishlist,
        // Drawer / modal state
        cartOpen,
        setCartOpen,
        wishlistOpen,
        setWishlistOpen,
        authOpen,
        setAuthOpen,
        // Banner
        bannerText,
        setBannerText,
        // Footer Contact Info
        footerInfo,
        setFooterInfo,
        // Hero Banner Slides
        heroBanners,
        setHeroBanners,
        // Shop By Print options (single source of truth)
        prints,
        setPrints,
        refreshPrints: fetchLivePrints,
        isShopByPrintEnabled,
        setIsShopByPrintEnabled: setShopByPrintEnabled,
        setShopByPrintEnabled,
        // Categories (live admin categories data)
        categories,
        setCategories,
        refreshCategories: fetchLiveCategories,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside <ShopProvider>");
  return ctx;
}
