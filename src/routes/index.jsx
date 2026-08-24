import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Feather,
  Heart,
  HeartHandshake,
  Leaf,
  MessageCircle,
  Play,
  RefreshCcw,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader.jsx";
import SiteFooter from "@/components/SiteFooter.jsx";
import ProductCard from "@/components/ProductCard.jsx";
import HeroBannerSlider from "@/components/HeroBannerSlider.jsx";
import CustomerReviewsCarousel from "@/components/CustomerReviewsCarousel.jsx";
import {
  ageCategories,
  videoProducts,
} from "@/data/products.js";


import hero from "@/assets/hero-baby.jpg";
import muslin from "@/assets/cat-muslin.jpg";
import hospital from "@/assets/cat-hospital.jpg";
import towels from "@/assets/cat-towels.jpg";
import clothing from "@/assets/cat-clothing.jpg";

import { useShop } from "@/context/ShopContext.jsx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Little Sunbeam — Organic Cotton Baby Clothing & Essentials" },
      {
        name: "description",
        content:
          "Shop soft organic cotton swaddles, newborn hospital kits, hooded towels and baby clothing at Little Sunbeam.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [activeCategoryKey, setActiveCategoryKey] = useState("all");
  const [activeSubCategoryKey, setActiveSubCategoryKey] = useState("all");
  const { products, addToCart, toggleWishlist, isWishlisted, prints, isShopByPrintEnabled, categories } = useShop();

  // 1. Get all active New Arrival products
  const newArrivalProducts = useMemo(() => {
    return (products || []).filter(
      (p) =>
        (p.isNewArrival ?? true) &&
        (p.isActive ?? true) &&
        p.status !== "Draft" &&
        p.status !== "Archived"
    );
  }, [products]);

  // 2. Extract only categories & subcategories that contain New Arrival products
  const dynamicCategories = useMemo(() => {
    if (!newArrivalProducts || newArrivalProducts.length === 0) return [];

    const catMap = new Map();

    newArrivalProducts.forEach((p) => {
      // Find matching category object from backend / context
      const foundCat = (categories || []).find((c) => {
        if (p.categoryId && String(c._id || c.id) === String(p.categoryId)) return true;
        const catNameLower = (c.name || "").toLowerCase().trim();
        const catSlugLower = (c.slug || "").toLowerCase().trim();
        const pCatLower = (p.category || "").toLowerCase().trim();
        const pPillLower = (p.categoryPill || "").toLowerCase().trim();
        return (
          catNameLower === pCatLower ||
          catSlugLower === pCatLower ||
          catNameLower === pPillLower ||
          catSlugLower === pPillLower
        );
      });

      const catKey = foundCat
        ? String(foundCat._id || foundCat.slug || foundCat.name).toLowerCase()
        : (p.categoryPill || p.category || "other").toLowerCase();

      const catName = foundCat ? foundCat.name : (p.categoryPill || p.category || "Other");
      const catSlug = foundCat?.slug || catName.toLowerCase().replace(/\s+/g, "-");

      if (!catMap.has(catKey)) {
        catMap.set(catKey, {
          key: catKey,
          name: catName,
          slug: catSlug,
          count: 0,
          subCategories: new Map(),
        });
      }

      const catObj = catMap.get(catKey);
      catObj.count += 1;

      // Extract subcategories for this category if product has one
      if (p.subCategory && p.subCategory.trim()) {
        const subName = p.subCategory.trim();
        const subKey = subName.toLowerCase();
        if (!catObj.subCategories.has(subKey)) {
          catObj.subCategories.set(subKey, {
            key: subKey,
            name: subName,
            count: 0,
          });
        }
        catObj.subCategories.get(subKey).count += 1;
      }
    });

    return Array.from(catMap.values()).map((c) => ({
      ...c,
      subCategories: Array.from(c.subCategories.values()),
    }));
  }, [newArrivalProducts, categories]);

  // 3. Filter products matching selected category & subcategory
  const filteredNewArrivals = useMemo(() => {
    if (!newArrivalProducts || newArrivalProducts.length === 0) return [];
    if (activeCategoryKey === "all") return newArrivalProducts.slice(0, 10);

    const selectedCat = dynamicCategories.find((c) => c.key === activeCategoryKey);
    if (!selectedCat) return newArrivalProducts.slice(0, 10);

    return newArrivalProducts.filter((p) => {
      const foundCat = (categories || []).find((c) => {
        if (p.categoryId && String(c._id || c.id) === String(p.categoryId)) return true;
        const catNameLower = (c.name || "").toLowerCase().trim();
        const catSlugLower = (c.slug || "").toLowerCase().trim();
        const pCatLower = (p.category || "").toLowerCase().trim();
        const pPillLower = (p.categoryPill || "").toLowerCase().trim();
        return (
          catNameLower === pCatLower ||
          catSlugLower === pCatLower ||
          catNameLower === pPillLower ||
          catSlugLower === pPillLower
        );
      });

      const pCatKey = foundCat
        ? String(foundCat._id || foundCat.slug || foundCat.name).toLowerCase()
        : (p.categoryPill || p.category || "other").toLowerCase();

      if (pCatKey !== activeCategoryKey) return false;

      if (activeSubCategoryKey !== "all") {
        const pSubKey = (p.subCategory || "").toLowerCase().trim();
        return pSubKey === activeSubCategoryKey;
      }

      return true;
    }).slice(0, 10);
  }, [newArrivalProducts, activeCategoryKey, activeSubCategoryKey, dynamicCategories, categories]);

  const selectedCategoryObj = useMemo(() => {
    return dynamicCategories.find((c) => c.key === activeCategoryKey);
  }, [dynamicCategories, activeCategoryKey]);

  const viewAllSearch = useMemo(() => {
    if (activeCategoryKey === "all" || !selectedCategoryObj) return {};
    const searchObj = { category: selectedCategoryObj.slug || selectedCategoryObj.name.toLowerCase().replace(/\s+/g, "-") };
    if (activeSubCategoryKey !== "all") {
      searchObj.subCategory = activeSubCategoryKey;
    }
    return searchObj;
  }, [activeCategoryKey, activeSubCategoryKey, selectedCategoryObj]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="space-y-10 sm:space-y-14">
        {/* Hero & Marquee Unit */}
        <div>
          {/* Hero Banner Slider */}
          <HeroBannerSlider />

          {/* Marquee Strip */}
          <div className="border-y border-border bg-sky py-3">
            <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-10 gap-y-2 px-4 text-xs font-bold text-sky-foreground sm:text-sm">
              <span>Free shipping above ₹2499</span>
              <span>Azo-free dyes</span>
              <span>Easy 7-day returns</span>
              <span>Made in Tiruppur, India</span>
            </div>
          </div>
        </div>

        {/* Shop By Age */}
        <section className="mx-auto max-w-7xl px-4 py-6">
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl">
            Shop by <span className="sun-underline">Age</span>
          </h2>
          <div className="mt-8 sm:mt-12 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-start sm:justify-center sm:gap-10">
            {ageCategories.map((age, idx) => {
              const ringColors = [
                "ring-primary/50",
                "ring-accent/50",
                "ring-sun/70",
                "ring-[oklch(0.7_0.13_20)]/50",
                "ring-[oklch(0.6_0.1_300)]/50",
              ];
              const shadowColors = [
                "shadow-primary/20",
                "shadow-accent/20",
                "shadow-sun/30",
                "shadow-[oklch(0.7_0.13_20)]/20",
                "shadow-[oklch(0.6_0.1_300)]/20",
              ];
              return (
                <Link
                  key={age.id}
                  to="/shop"
                  search={{ age: age.id }}
                  className="group flex flex-col items-center gap-2 sm:gap-4"
                >
                  <img
                    src={age.image}
                    alt={age.name}
                    className="h-32 w-32 sm:h-48 sm:w-48 md:h-60 md:w-60 object-contain transition-transform duration-500 group-hover:scale-105"
                  />

                  <span className="text-center text-xs font-extrabold text-foreground group-hover:text-primary transition-colors tracking-tight sm:text-sm">
                    {age.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Shop By Category */}
        <section className="bg-cream py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
              <h2 className="text-2xl font-extrabold sm:text-3xl">
                Shop by <span className="sun-underline">Category</span>
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Explore our pure organic cotton baby collections curated with love and care
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4">
              {(categories || []).map((cat) => {
                const catParam = cat.slug || cat.id || cat.name?.toLowerCase().replace(/\s+/g, "-");
                const fallbackImg = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80";

                return (
                  <Link
                    key={cat._id || cat.id || cat.slug || cat.name}
                    to="/shop"
                    search={{ category: catParam }}
                    className="group relative flex flex-col items-center gap-2 rounded-2xl bg-card p-3 sm:p-4 border border-border/80 shadow-xs hover:shadow-lg hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-xl bg-muted/60 relative">
                      <img
                        src={cat.image || fallbackImg}
                        alt={cat.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = fallbackImg;
                        }}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                      />
                    </div>
                    <div className="text-center w-full px-1">
                      <p className="text-xs sm:text-sm font-extrabold line-clamp-1 group-hover:text-primary transition-colors text-foreground">
                        {cat.name}
                      </p>
                      {cat.description ? (
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1 hidden sm:block">
                          {cat.description}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* New Arrivals */}
        <section className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              New <span className="sun-underline">Arrivals</span>
            </h2>

            {/* Dynamic Category Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => {
                  setActiveCategoryKey("all");
                  setActiveSubCategoryKey("all");
                }}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[11px] sm:px-4 sm:py-1.5 sm:text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs ${activeCategoryKey === "all"
                    ? "bg-primary text-primary-foreground shadow-sm scale-102"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
              >
                All
              </button>

              {dynamicCategories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setActiveCategoryKey(cat.key);
                    setActiveSubCategoryKey("all");
                  }}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[11px] sm:px-4 sm:py-1.5 sm:text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs ${activeCategoryKey === cat.key
                      ? "bg-primary text-primary-foreground shadow-sm scale-102"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-foreground"
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <Link
              to="/shop"
              search={viewAllSearch}
              className="text-sm font-bold text-primary hover:underline self-start sm:self-auto flex items-center gap-1 transition-transform hover:translate-x-0.5"
            >
              <span>View all products →</span>
            </Link>
          </div>

          {/* Subcategory Pills (when selected category has subcategories) */}
          {selectedCategoryObj && selectedCategoryObj.subCategories?.length > 0 && (
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-border/50">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground mr-1">Subcategory:</span>
              <button
                type="button"
                onClick={() => setActiveSubCategoryKey("all")}
                className={`whitespace-nowrap rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-bold transition-colors cursor-pointer ${activeSubCategoryKey === "all"
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                All {selectedCategoryObj.name}
              </button>
              {selectedCategoryObj.subCategories.map((sub) => (
                <button
                  key={sub.key}
                  type="button"
                  onClick={() => setActiveSubCategoryKey(sub.key)}
                  className={`whitespace-nowrap rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-bold transition-colors cursor-pointer ${activeSubCategoryKey === sub.key
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}

          {filteredNewArrivals.length > 0 ? (
            <div className="mt-6 sm:mt-10 grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 lg:grid-cols-5">
              {filteredNewArrivals.map((p) => (
                <ProductCard key={p._id || p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm font-bold text-muted-foreground">No new arrival products in this selection yet.</p>
              <Link
                to="/shop"
                search={viewAllSearch}
                className="mt-3 inline-block rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/85"
              >
                Browse Shop
              </Link>
            </div>
          )}
        </section>

        {/* Essentials Grid */}
        <section className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2">
            <div className="card-lift relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card">
              <img src={muslin} alt="Swaddles" className="h-40 sm:h-56 md:h-64 w-full object-cover" />
              <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 rounded-xl sm:rounded-2xl bg-card/90 px-3 py-1.5 sm:px-5 sm:py-2.5 shadow-md backdrop-blur-xs">
                <h3 className="text-sm sm:text-lg font-extrabold">Swaddles</h3>
              </div>
            </div>

            <div className="card-lift relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card">
              <img src={towels} alt="Towels" className="h-40 sm:h-56 md:h-64 w-full object-cover" />
              <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 rounded-xl sm:rounded-2xl bg-card/90 px-3 py-1.5 sm:px-5 sm:py-2.5 shadow-md backdrop-blur-xs">
                <h3 className="text-sm sm:text-lg font-extrabold">Towels</h3>
              </div>
            </div>

            <div className="card-lift relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card">
              <img src={towels} alt="Hooded Towels" className="h-36 sm:h-48 md:h-56 w-full object-cover" />
              <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 rounded-xl sm:rounded-2xl bg-card/90 px-3 py-1.5 sm:px-5 sm:py-2.5 shadow-md backdrop-blur-xs">
                <h3 className="text-sm sm:text-lg font-extrabold">Hooded Towels</h3>
              </div>
            </div>

            <div className="card-lift relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card">
              <img src={muslin} alt="Face Towels" className="h-36 sm:h-48 md:h-56 w-full object-cover" />
              <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 rounded-xl sm:rounded-2xl bg-card/90 px-3 py-1.5 sm:px-5 sm:py-2.5 shadow-md backdrop-blur-xs">
                <h3 className="text-sm sm:text-lg font-extrabold">Face Towels</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Explore Our Product Videos */}
        {videoProducts.length > 0 && (
          <section className="bg-cream py-10 sm:py-14">
            <div className="mx-auto max-w-7xl px-4">
              <h2 className="text-center text-2xl font-extrabold sm:text-3xl">
                Explore Our <span className="sun-underline">Product Videos</span>
              </h2>

              <div className="mt-6 sm:mt-10 grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 lg:grid-cols-5">
                {videoProducts.map((vp) => {
                  const numPrice = Number(vp.price.replace(/[^0-9.]/g, "")) || 479;
                  const numMrp = Number(vp.mrp.replace(/[^0-9.]/g, "")) || 599;
                  const productObj = {
                    id: `video-${vp.id}`,
                    name: vp.title,
                    price: numPrice,
                    mrp: numMrp,
                    image: vp.image,
                  };
                  const isWished = isWishlisted(productObj.id);

                  return (
                    <div key={vp.id} className="card-lift group relative overflow-hidden rounded-2xl border border-border bg-card">
                      <div className="relative h-44 sm:h-56 md:h-64 w-full bg-muted">
                        <img src={vp.image} alt={vp.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 grid place-items-center bg-black/10">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-sun text-sun-foreground shadow-md transition-transform group-hover:scale-110">
                            <Play className="h-4 w-4 fill-current ml-0.5" />
                          </div>
                        </div>

                        {/* Wishlist toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleWishlist(productObj);
                          }}
                          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur-md shadow-md transition-transform hover:scale-110 active:scale-95"
                          aria-label="Wishlist toggle"
                        >
                          <Heart
                            className={`h-4 w-4 transition-colors ${isWished
                                ? "fill-destructive text-destructive"
                                : "text-foreground/70 hover:text-destructive"
                              }`}
                          />
                        </button>
                      </div>

                      <div className="p-3 text-center space-y-1.5">
                        <h4 className="text-xs font-bold line-clamp-1">{vp.title}</h4>
                        <p className="text-xs font-extrabold text-primary">{vp.price}</p>
                        <button
                          type="button"
                          onClick={() => addToCart(productObj)}
                          className="w-full rounded-full bg-primary py-1.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/85 active:scale-98"
                        >
                          Add to cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {isShopByPrintEnabled && prints && prints.filter((p) => p.isActive !== false).length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-6">
            <h2 className="text-center text-2xl font-extrabold sm:text-3xl">
              Shop By <span className="sun-underline">Print</span>
            </h2>

            <div className="mt-6 sm:mt-10 grid grid-cols-3 gap-3 sm:gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {prints
                .filter((p) => p.isActive !== false)
                .map((p, idx) => {
                  const printId = p.id || p._id || p.name;
                  const printIcon = p.emoji || p.icon || "✨";
                  return (
                    <Link
                      key={p._id || p.id || p.name || idx}
                      to="/shop"
                      search={{ print: printId }}
                      className="card-lift flex flex-col items-center rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-4 hover:border-primary transition-all group"
                    >
                      <div className="grid h-14 w-14 sm:h-18 sm:w-18 place-items-center rounded-full bg-secondary text-2xl sm:text-3xl transition-transform duration-300 group-hover:scale-110 shadow-xs">
                        {printIcon}
                      </div>
                      <span className="mt-2 sm:mt-2.5 text-[11px] sm:text-xs font-bold text-center group-hover:text-primary transition-colors">{p.name}</span>
                    </Link>
                  );
                })}
            </div>
          </section>
        )}

        {/* Why Choose Us */}
        <section className="bg-secondary py-10 sm:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center max-w-2xl mx-auto">
              <span className="inline-block rounded-full bg-sun px-4 py-1 text-xs font-bold text-sun-foreground">
                Pure, Gentle & Thoughtfully Crafted
              </span>
              <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl md:text-4xl">
                Why Choose <span className="sun-underline">Little Sunbeam</span>
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                We believe your newborn deserves the gentlest touch. Every piece is designed with care, certified organic materials, and zero harsh chemicals.
              </p>
            </div>

            {/* 8 Feature Cards Grid */}
            <div className="mt-8 sm:mt-12 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Leaf,
                  title: "100% GOTS Organic Cotton",
                  text: "Sourced from certified organic farms — no toxic pesticides or synthetic fertilizers ever touch your baby's skin.",
                },
                {
                  icon: ShieldCheck,
                  title: "Non-Toxic Azo-Free Dyes",
                  text: "Dyed using gentle, toxin-free eco dyes that are dermatologically safe for even the most sensitive newborn skin.",
                },
                {
                  icon: Feather,
                  title: "Tagless & Flat Seams",
                  text: "Thoughtfully stitched with scratch-free flat seams and soft tagless labels to eliminate irritation and chafing.",
                },
                {
                  icon: HeartHandshake,
                  title: "Handcrafted in Tiruppur",
                  text: "Ethically crafted in India's premier knitwear city by skilled artisans committed to small-batch perfection.",
                },
                {
                  icon: Sparkles,
                  title: "Breathable Multi-Layer Weave",
                  text: "Airy muslin weave naturally regulates body temperature, keeping babies cool in summer and cozy in winter.",
                },
                {
                  icon: RefreshCcw,
                  title: "Pre-Washed & Gets Softer",
                  text: "Pre-shrunk and bio-washed so items keep their shape, color, and grow noticeably softer with every single wash.",
                },
                {
                  icon: Truck,
                  title: "Fast 24-Hour Pan-India Shipping",
                  text: "Orders packed with love and dispatched within 24 hours with real-time SMS tracking right to your doorstep.",
                },
                {
                  icon: BadgeCheck,
                  title: "Easy 7-Day Hassle-Free Returns",
                  text: "Shop with total confidence — instant size exchanges and 100% money-back guarantee if you're not delighted.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="card-lift flex flex-col justify-between rounded-3xl bg-card p-6 border border-border shadow-xs"
                >
                  <div>
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust Metrics Bar */}
            <div className="mt-8 sm:mt-12 rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-xs">
              <div className="grid grid-cols-2 gap-4 sm:gap-6 text-center md:grid-cols-4">
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-primary">50,000+</p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">Happy Little Sunbeams Wrapped</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-sun-foreground">4.9 ★</p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">Average Verified Parent Rating</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-primary">100%</p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">GOTS Certified Organic Cotton</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-primary">24h</p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">Express Order Dispatch</p>
                </div>
              </div>
            </div>

            {/* Organic Quality Promise Banner */}
            <div className="mt-8 rounded-3xl bg-cream p-8 border border-border">
              <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                <div className="space-y-2 text-center md:text-left">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary uppercase tracking-wider">
                    <Award className="h-4 w-4" /> Little Sunbeam Quality Guarantee
                  </span>
                  <h3 className="text-xl font-extrabold">Gentle on your baby, kind to the planet</h3>
                  <p className="max-w-xl text-xs text-muted-foreground">
                    From organic seed selection to eco-conscious plastic-free packaging, we ensure every detail meets the highest standard for newborn safety and comfort.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2 text-xs font-bold shadow-xs">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Zero Harsh Chemicals
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2 text-xs font-bold shadow-xs">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Hypoallergenic
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2 text-xs font-bold shadow-xs">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Eco Packaging
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Customer Reviews Carousel */}
        <CustomerReviewsCarousel />

        {/* Founder Message */}
        <section className="mx-auto max-w-7xl px-4 py-6">
          <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-[var(--shadow-lift)] md:grid md:grid-cols-2">
            <div className="h-52 sm:h-64 md:h-auto overflow-hidden bg-muted">
              <img src={hero} alt="Founder" className="h-full w-full object-cover" />
            </div>
            <div className="p-5 sm:p-8 md:p-12 flex flex-col justify-center space-y-4 sm:space-y-5">
              <h2 className="text-2xl font-extrabold sm:text-3xl">
                A Message from <span className="sun-underline">Our Founder</span>
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                As a mother, I wanted nothing but the best for my child — especially when it comes to comfort, safety, and quality. That's why we created Little Sunbeam. Every product is crafted with hypoallergenic organic cotton to give your baby the gentlest embrace.
              </p>
              <div>
                <Link
                  to="/shop"
                  className="inline-block rounded-full bg-primary px-7 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/85"
                >
                  Learn more
                </Link>
              </div>
            </div>
          </div>

        </section>
      </main>

      {/* Back to top button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button
          onClick={scrollToTop}
          className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/85 transition-transform hover:scale-105"
          aria-label="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      <SiteFooter />
    </div>
  );
}
