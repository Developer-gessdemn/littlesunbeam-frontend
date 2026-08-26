import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  ShieldCheck,
  LogOut,
  Sparkles,
  CheckCircle,
  Home,
  Flame,
  Award,
  Grid,
  Layers,
  ArrowRight,
} from "lucide-react";
import logo from "@/assets/LSB_Logo1.jpg";
import WishlistDrawer from "@/components/WishlistDrawer.jsx";
import CartDrawer from "@/components/CartDrawer.jsx";
import AuthModal from "@/components/AuthModal.jsx";
import { useShop } from "@/context/ShopContext.jsx";

function SmileUnderline({ className = "" }) {
  return (
    <svg
      className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-[114%] h-[14px] text-[var(--color-sun)] overflow-visible pointer-events-none ${className}`}
      viewBox="0 0 120 26"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      {/* Left cheek / smile dimple accent matching logo */}
      <path
        d="M 5 6 C 1.5 11.5, 3.5 18, 9 22"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Main cheerful smile curve */}
      <path
        d="M 14 13 C 38 25, 82 25, 106 13"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
      {/* Right cheek / smile dimple accent matching logo */}
      <path
        d="M 115 6 C 118.5 11.5, 116.5 18, 111 22"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SiteHeader() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrolledNavOpen, setScrolledNavOpen] = useState(false);
  const [expandedScrolledCategory, setExpandedScrolledCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const userMenuRef = useRef(null);
  const scrolledNavRef = useRef(null);
  const desktopNavRef = useRef(null);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();

  const {
    products,
    cartOpen,
    setCartOpen,
    wishlistOpen,
    setWishlistOpen,
    authOpen,
    setAuthOpen,
    cartCount,
    wishlistCount,
    customer,
    isCustomerLoggedIn,
    logoutCustomer,
    bannerText,
    categories,
  } = useShop();

  const isScrolledRef = useRef(false);

  // Live instant search results matching name, description, category, subcategory, print, fabric
  const liveSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const words = q.split(/\s+/);
    return (products || [])
      .filter((p) => {
        const hay = [
          p.name || "",
          p.description || "",
          p.category || "",
          p.categoryPill || "",
          p.subCategory || "",
          p.print || "",
          p.fabric || "",
        ]
          .join(" ")
          .toLowerCase();
        return words.every((w) => hay.includes(w));
      })
      .slice(0, 5);
  }, [searchQuery, products]);

  const handleSearchSubmit = (e, customQuery) => {
    if (e) e.preventDefault();
    const q = (customQuery !== undefined ? customQuery : searchQuery).trim();
    if (q) {
      setSearchFocused(false);
      setMobileMenuOpen(false);
      navigate({ to: "/shop", search: { q } });
    }
  };

  // Scroll detection with RAF throttling & zero layout thrashing
  useEffect(() => {
    let rafId = null;

    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const scrollPos = window.scrollY;
        // Hysteresis threshold to prevent flickering around the boundary
        const shouldBeScrolled = isScrolledRef.current ? scrollPos > 50 : scrollPos > 80;

        if (shouldBeScrolled !== isScrolledRef.current) {
          isScrolledRef.current = shouldBeScrolled;
          setIsScrolled(shouldBeScrolled);
          if (!shouldBeScrolled) {
            setScrolledNavOpen(false);
          }
        }
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Close customer dropdown, desktop nav dropdown & search popup on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (desktopNavRef.current && !desktopNavRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close scrolled navbar menu on outside click
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        scrolledNavOpen &&
        scrolledNavRef.current &&
        !scrolledNavRef.current.contains(event.target) &&
        !event.target.closest("#header-scroll-hamburger-btn") &&
        !event.target.closest("#header-mobile-hamburger-btn")
      ) {
        setScrolledNavOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [scrolledNavOpen]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Filter active categories from DB
  const dynamicNavCategories = (categories || []).filter((c) => c.isActive !== false);

  const toggleHamburgerMenu = () => {
    if (window.innerWidth < 1024) {
      // Mobile / Tablet drawer
      setMobileMenuOpen((prev) => !prev);
    } else {
      // Desktop scrolled dropdown / navigation
      setScrolledNavOpen((prev) => !prev);
    }
  };

  return (
    <>
      {/* 1. TOP UTILITY BAR (Natural 60fps Page Flow - Scrolls away naturally without causing sticky header jumps) */}
      <div className="relative overflow-hidden bg-primary text-center text-xs font-medium text-primary-foreground select-none">
        {/* Floating animated baby items stream */}
        <style>{`
          @keyframes driftAcross {
            0% {
              left: 102%;
              transform: translateY(-50%) rotate(0deg) scale(0.9);
            }
            3% {
              opacity: 0.95;
            }
            25% {
              transform: translateY(calc(-50% - 4px)) rotate(12deg) scale(1.05);
            }
            50% {
              transform: translateY(calc(-50% + 3px)) rotate(-10deg) scale(1);
            }
            75% {
              transform: translateY(calc(-50% - 5px)) rotate(14deg) scale(1.08);
            }
            97% {
              opacity: 0.95;
            }
            100% {
              left: -8%;
              transform: translateY(-50%) rotate(-12deg) scale(0.9);
              opacity: 0;
            }
          }
          .banner-item-drifter {
            position: absolute;
            top: 50%;
            pointer-events: none;
            font-size: 15px;
            animation-name: driftAcross;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
            will-change: left, transform;
          }
        `}</style>

        {/* Stream of moving baby clothes and essentials */}
        {[
          { emoji: "👶", dur: 22, delay: -0 },
          { emoji: "🍼", dur: 20, delay: -2 },
          { emoji: "👕", dur: 24, delay: -4 },
          { emoji: "🧸", dur: 19, delay: -6 },
          { emoji: "👗", dur: 23, delay: -8 },
          { emoji: "🧦", dur: 21, delay: -10 },
          { emoji: "🌟", dur: 25, delay: -12 },
          { emoji: "🍼", dur: 22, delay: -14 },
          { emoji: "👒", dur: 20, delay: -16 },
          { emoji: "👶", dur: 24, delay: -18 },
          { emoji: "🎈", dur: 19, delay: -20 },
          { emoji: "🤍", dur: 21, delay: -22 },
        ].map((item, idx) => (
          <span
            key={idx}
            className="banner-item-drifter"
            style={{
              animationDuration: `${item.dur}s`,
              animationDelay: `${item.delay}s`,
            }}
          >
            {item.emoji}
          </span>
        ))}

        {/* Banner message */}
        <div className="relative z-20 flex items-center justify-center px-4 py-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-0.5 shadow-xs ring-1 ring-white/15">
            <span className="hidden sm:inline text-amber-200">✨</span>
            <span className="font-extrabold tracking-wide text-primary-foreground drop-shadow-xs">
              {bannerText}
            </span>
            <span className="hidden sm:inline text-amber-200">✨</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN STICKY HEADER (Locks smoothly at top:0) */}
      <header className="sticky top-0 z-40 border-b border-border bg-background transition-shadow duration-200 shadow-xs">
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between gap-3 sm:gap-4 px-4 transition-all duration-300 ease-out ${
            isScrolled ? "py-2 sm:py-2.5" : "py-3 sm:py-3.5"
          }`}
        >
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Hamburger (Always visible on mobile) */}
            <button
              id="header-mobile-hamburger-btn"
              onClick={toggleHamburgerMenu}
              className="rounded-xl p-2 text-foreground hover:bg-muted transition lg:hidden cursor-pointer"
              aria-label="Toggle navigation menu"
              title={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-foreground transition-transform rotate-90 duration-200" />
              ) : (
                <Menu className="h-6 w-6 text-foreground transition-transform duration-200" />
              )}
            </button>

            {/* Desktop Scrolled Hamburger Button (Smoothly slides & fades in) */}
            <div
              className={`hidden lg:flex items-center transition-all duration-300 ease-out ${
                isScrolled
                  ? "max-w-[50px] opacity-100 mr-1 translate-x-0"
                  : "max-w-0 opacity-0 -mr-1 -translate-x-3 pointer-events-none overflow-hidden"
              }`}
            >
              <button
                id="header-scroll-hamburger-btn"
                type="button"
                onClick={toggleHamburgerMenu}
                className={`flex items-center justify-center rounded-xl p-2 text-foreground hover:bg-primary/10 hover:text-primary border transition-all duration-200 cursor-pointer shadow-xs ${
                  scrolledNavOpen
                    ? "bg-primary/15 text-primary border-primary"
                    : "bg-card border-border/80"
                }`}
                aria-label={scrolledNavOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
                title={scrolledNavOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                {scrolledNavOpen ? (
                  <X className="h-5 w-5 transition-transform rotate-90 duration-200" />
                ) : (
                  <Menu className="h-5 w-5 transition-transform duration-200" />
                )}
              </button>
            </div>

            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src={logo}
                alt="Little Sunbeam baby store logo"
                className={`w-auto object-contain transition-all duration-300 ease-out ${
                  isScrolled ? "h-10 md:h-11" : "h-12 md:h-14"
                }`}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling.style.display = "flex";
                }}
              />
              <div className="hidden items-center gap-1.5 font-display text-xl font-extrabold text-foreground">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-sun text-sun-foreground text-sm">☀️</span>
                Little <span className="text-primary">Sunbeam</span>
              </div>
            </Link>
          </div>

          {/* Search bar (Desktop & Tablet) */}
          <div ref={searchContainerRef} className="relative hidden flex-1 md:flex lg:max-w-md">
            <form
              onSubmit={(e) => handleSearchSubmit(e)}
              className={`flex w-full items-center gap-2 rounded-full border border-border bg-muted px-4 transition-all duration-300 ease-out focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
                isScrolled ? "py-1.5" : "py-2"
              }`}
            >
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                name="search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search swaddles, kits, frocks..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-muted-foreground hover:text-foreground text-xs p-1 cursor-pointer"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </form>

            {/* Live Instant Search Dropdown */}
            {searchFocused && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-border bg-card shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Products</span>
                  <span>{liveSearchResults.length} found</span>
                </div>

                {liveSearchResults.length > 0 ? (
                  <div className="space-y-1 mt-1">
                    {liveSearchResults.map((prod) => {
                      const prodId = prod._id || prod.id;
                      const thumb = prod.image || (prod.gallery && prod.gallery[0]);
                      return (
                        <Link
                          key={prodId}
                          to="/product/$productId"
                          params={{ productId: String(prodId) }}
                          onClick={() => setSearchFocused(false)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary transition group"
                        >
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={prod.name}
                              className="h-10 w-10 rounded-lg object-cover bg-muted shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center text-xs font-bold text-primary shrink-0">
                              ☀️
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition">
                              {prod.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {prod.category || "Baby Essential"} · ₹{prod.price}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground group-hover:text-primary font-bold">→</span>
                        </Link>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit(null, searchQuery)}
                      className="w-full mt-1.5 py-2 text-center text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition cursor-pointer"
                    >
                      View all results for "{searchQuery}" →
                    </button>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    <p>No products matching "<strong className="text-foreground">{searchQuery}</strong>"</p>
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit(null, searchQuery)}
                      className="mt-2 text-primary font-bold hover:underline cursor-pointer"
                    >
                      Search all catalog for "{searchQuery}" →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Icon actions (Admin / Customer / Wishlist / Cart) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Show Admin shortcut ONLY if logged-in user is explicitly admin */}
            {isCustomerLoggedIn && customer?.role === "admin" && (
              <Link
                to="/admin"
                id="header-admin-btn"
                aria-label="Admin Portal"
                title="Open Admin Console"
                className="hidden sm:flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs font-black text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 transition mr-1"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Admin Console</span>
              </Link>
            )}

            {/* Customer Account Button & Dropdown */}
            <div className="relative" ref={userMenuRef}>
              {isCustomerLoggedIn && customer ? (
                <button
                  id="header-account-btn"
                  aria-label="Customer Account"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 py-1.5 px-2.5 sm:px-3 text-xs font-bold text-primary transition cursor-pointer"
                >
                  <div className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-extrabold text-primary-foreground">
                    {getInitials(customer.name)}
                  </div>
                  <span className="hidden sm:inline font-semibold text-foreground max-w-[90px] truncate">
                    {customer.name?.split(" ")[0] || "Account"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              ) : (
                <button
                  id="header-account-btn"
                  aria-label="Sign In"
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center gap-1.5 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-primary cursor-pointer"
                  title="Sign In / Register"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline text-xs font-semibold">Sign In</span>
                </button>
              )}

              {/* Customer Account Dropdown Menu */}
              {userDropdownOpen && isCustomerLoggedIn && customer && (
                <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-background p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="border-b border-border pb-3 mb-2 px-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-primary font-bold text-primary-foreground text-xs shrink-0">
                        {getInitials(customer.name)}
                      </div>
                      <div className="overflow-hidden min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{customer.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{customer.email}</p>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-md bg-sun/20 px-2 py-0.5 text-[10px] font-bold text-sun-foreground mt-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Customer Account</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {customer?.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex sm:hidden w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition text-left"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition text-left"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>My Profile &amp; Orders</span>
                    </Link>

                    <Link
                      to="/shop"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition"
                    >
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span>Shop Baby Essentials</span>
                    </Link>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setWishlistOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition text-left cursor-pointer"
                    >
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span>My Wishlist ({wishlistCount})</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setCartOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition text-left cursor-pointer"
                    >
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span>My Cart ({cartCount})</span>
                    </button>
                  </div>

                  <div className="border-t border-border pt-2 mt-2">
                    <button
                      onClick={() => {
                        logoutCustomer();
                        setUserDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition text-left cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Wishlist */}
            <button
              id="header-wishlist-btn"
              aria-label="Wishlist"
              onClick={() => setWishlistOpen(true)}
              className="relative rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-primary cursor-pointer"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              id="header-cart-btn"
              aria-label="Cart"
              onClick={() => setCartOpen(true)}
              className="relative rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-primary cursor-pointer"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 3. NAVIGATION BAR / NAVBAR (Desktop) */}
        <nav
          ref={desktopNavRef}
          className={`hidden lg:block transition-all duration-300 ease-out bg-background relative ${
            isScrolled
              ? "max-h-0 opacity-0 pointer-events-none border-t-0 overflow-hidden"
              : "opacity-100 border-t border-border overflow-visible"
          }`}
        >
          <div className="mx-auto max-w-7xl px-4 py-2 overflow-visible">
            <ul className="flex flex-wrap items-center justify-center gap-x-3 lg:gap-x-4 xl:gap-x-6 gap-y-2 text-xs lg:text-[13px] xl:text-sm font-semibold text-foreground tracking-tight">
              {/* All Products Link */}
              <li className="relative py-1">
                <Link
                  to="/shop"
                  className="group relative inline-flex items-center gap-1 text-foreground hover:text-primary transition-colors font-bold"
                >
                  <span>All Essentials</span>
                </Link>
              </li>

              {/* Dynamic Categories from Database */}
              {dynamicNavCategories.map((cat, idx) => {
                const catParam = (cat.slug || cat.id || cat.name || "").toLowerCase().replace(/\s+/g, "-");
                const catKey = cat._id || cat.id || cat.slug || cat.name || idx;
                const subs = (cat.subCategories || []).filter(
                  (s) => typeof s === "string" || s.isActive !== false
                );
                const hasDropdown = subs.length > 0;
                const isDropdownActive = activeDropdown === catKey;

                return (
                  <li
                    key={catKey}
                    className="relative py-1"
                    onMouseEnter={() => hasDropdown && setActiveDropdown(catKey)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <div className="inline-flex items-center gap-0.5">
                      <Link
                        to="/shop"
                        search={{ category: catParam }}
                        onClick={() => setActiveDropdown(null)}
                        className="group relative inline-flex items-center text-foreground hover:text-primary transition-colors py-1"
                      >
                        <span className="relative">
                          {cat.name}
                          {idx % 3 === 1 ? <SmileUnderline /> : null}
                        </span>
                      </Link>

                      {hasDropdown ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveDropdown((prev) => (prev === catKey ? null : catKey));
                          }}
                          className="p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer rounded-full hover:bg-secondary flex items-center justify-center"
                          aria-label={`Toggle ${cat.name} menu`}
                        >
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform duration-200 ${
                              isDropdownActive ? "rotate-180 text-primary" : "group-hover:text-primary"
                            }`}
                          />
                        </button>
                      ) : null}
                    </div>

                    {/* Dynamic Subcategories Dropdown */}
                    {hasDropdown && isDropdownActive ? (
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-1 min-w-[220px] rounded-2xl border border-border bg-card p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
                        onMouseEnter={() => setActiveDropdown(catKey)}
                        onMouseLeave={() => setActiveDropdown(null)}
                      >
                        {/* Parent Category Shortcut */}
                        <Link
                          to="/shop"
                          search={{ category: catParam }}
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-colors mb-1"
                        >
                          <span>All {cat.name}</span>
                          <span className="text-[10px] text-muted-foreground">→</span>
                        </Link>

                        <div className="space-y-0.5">
                          {subs.map((sub, sIdx) => {
                            const subName = typeof sub === "string" ? sub : sub.name;
                            const subParam =
                              typeof sub === "string"
                                ? sub.toLowerCase().replace(/\s+/g, "-")
                                : (sub.slug || sub.name?.toLowerCase().replace(/\s+/g, "-"));
                            const subKey = typeof sub === "object" && sub._id ? sub._id : sIdx;

                            return (
                              <Link
                                key={subKey}
                                to="/shop"
                                search={{ category: catParam, subCategory: subParam }}
                                onClick={() => setActiveDropdown(null)}
                                className="block rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary hover:text-primary transition-colors"
                              >
                                {subName}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* 4. SCROLLED DESKTOP HAMBURGER DROPDOWN MENU (Opens when user clicks ☰ while scrolled) */}
        {isScrolled && scrolledNavOpen && (
          <div
            ref={scrolledNavRef}
            className="hidden lg:block border-t border-border bg-background/95 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200 z-50"
          >
            <div className="mx-auto max-w-7xl px-6 py-6">
              {/* Primary Quick Links Bar */}
              <div className="flex items-center justify-between border-b border-border/70 pb-4 mb-5">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <Link
                    to="/"
                    onClick={() => setScrolledNavOpen(false)}
                    className="flex items-center gap-1.5 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground px-4 py-2 text-xs font-bold transition shadow-xs"
                  >
                    <Home className="h-3.5 w-3.5" />
                    <span>Home</span>
                  </Link>

                  <Link
                    to="/shop"
                    onClick={() => setScrolledNavOpen(false)}
                    className="flex items-center gap-1.5 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground px-4 py-2 text-xs font-bold transition shadow-xs"
                  >
                    <Grid className="h-3.5 w-3.5" />
                    <span>All Essentials</span>
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => setScrolledNavOpen(false)}
                  className="flex items-center gap-1 rounded-full bg-muted/60 hover:bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Close (✕)</span>
                </button>
              </div>

              {/* Shop By Category Mega View */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span>Shop By Category</span>
                  </h4>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {dynamicNavCategories.length} categories available
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {dynamicNavCategories.map((cat, idx) => {
                    const catParam = (cat.slug || cat.id || cat.name || "").toLowerCase().replace(/\s+/g, "-");
                    const catKey = cat._id || cat.id || cat.slug || cat.name || idx;
                    const subs = (cat.subCategories || []).filter(
                      (s) => typeof s === "string" || s.isActive !== false
                    );

                    return (
                      <div
                        key={catKey}
                        className="rounded-2xl border border-border/80 bg-card p-3.5 hover:border-primary/50 transition-all hover:shadow-md group"
                      >
                        <Link
                          to="/shop"
                          search={{ category: catParam }}
                          onClick={() => setScrolledNavOpen(false)}
                          className="flex items-center justify-between font-black text-xs text-foreground group-hover:text-primary transition-colors pb-1.5 border-b border-border/50"
                        >
                          <span className="truncate">{cat.name}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-primary transition-transform shrink-0 ml-1" />
                        </Link>

                        {subs.length > 0 ? (
                          <div className="mt-2 space-y-1">
                            {subs.slice(0, 4).map((sub, sIdx) => {
                              const subName = typeof sub === "string" ? sub : sub.name;
                              const subParam = typeof sub === "string" ? sub.toLowerCase().replace(/\s+/g, "-") : (sub.slug || sub.name?.toLowerCase().replace(/\s+/g, "-"));
                              const subKey = typeof sub === "object" && sub._id ? sub._id : sIdx;

                              return (
                                <Link
                                  key={subKey}
                                  to="/shop"
                                  search={{ category: catParam, subCategory: subParam }}
                                  onClick={() => setScrolledNavOpen(false)}
                                  className="block text-[11px] text-muted-foreground hover:text-primary hover:font-bold transition-colors py-0.5 truncate"
                                >
                                  • {subName}
                                </Link>
                              );
                            })}
                            {subs.length > 4 && (
                              <Link
                                to="/shop"
                                search={{ category: catParam }}
                                onClick={() => setScrolledNavOpen(false)}
                                className="block text-[10px] font-bold text-primary hover:underline pt-0.5"
                              >
                                +{subs.length - 4} more subcategories
                              </Link>
                            )}
                          </div>
                        ) : (
                          <p className="mt-2 text-[10px] text-muted-foreground italic">
                            All baby essentials
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. MOBILE DRAWER NAVIGATION (Opens when user clicks hamburger on Mobile/Tablet) */}
        {mobileMenuOpen && (
          <div
            ref={scrolledNavRef}
            className="border-t border-border bg-background p-4 lg:hidden max-h-[85vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 shadow-2xl"
          >
            {/* Mobile Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = e.currentTarget.elements.searchMobile?.value?.trim();
                if (q) {
                  handleSearchSubmit(e, q);
                }
              }}
              className="mb-4 flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2.5 transition focus-within:border-primary"
            >
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                name="searchMobile"
                type="search"
                placeholder="Search swaddles, kits, frocks..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shrink-0"
              >
                Search
              </button>
            </form>

            {isCustomerLoggedIn && customer && (
              <div className="mb-4 rounded-xl bg-muted/60 p-3 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-foreground truncate">{customer.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{customer.email}</p>
                </div>
                <button
                  onClick={() => {
                    logoutCustomer();
                    setMobileMenuOpen(false);
                  }}
                  className="shrink-0 rounded-lg bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive hover:bg-destructive/20 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}

            {/* Navigation Links */}
            <ul className="space-y-1.5 text-sm font-semibold">
              {/* Home */}
              <li className="border-b border-border/60 pb-2">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-foreground hover:text-primary transition-colors py-1 font-bold"
                >
                  <Home className="h-4 w-4 text-primary" />
                  <span>Home</span>
                </Link>
              </li>

              {/* All Essentials shortcut */}
              <li className="border-b border-border/60 pb-2">
                <Link
                  to="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-foreground hover:text-primary transition-colors py-1 font-bold"
                >
                  <Grid className="h-4 w-4 text-primary" />
                  <span>All Essentials</span>
                </Link>
              </li>

              {/* Shop By Category Header */}
              <li className="pt-2 pb-1">
                <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Shop By Category</span>
                </p>
              </li>

              {/* Dynamic Categories */}
              {dynamicNavCategories.map((cat, idx) => {
                const catParam = (cat.slug || cat.id || cat.name || "").toLowerCase().replace(/\s+/g, "-");
                const catKey = cat._id || cat.id || cat.slug || cat.name || idx;
                const subs = (cat.subCategories || []).filter(
                  (s) => typeof s === "string" || s.isActive !== false
                );
                const hasSubs = subs.length > 0;
                const isExpanded = activeDropdown === catKey;

                return (
                  <li key={catKey} className="border-b border-border/60 pb-2">
                    <div className="flex items-center justify-between py-1">
                      <Link
                        to="/shop"
                        search={{ category: catParam }}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex-1 text-foreground hover:text-primary transition-colors py-0.5 font-bold"
                      >
                        <span>{cat.name}</span>
                      </Link>
                      {hasSubs ? (
                        <button
                          type="button"
                          onClick={() => setActiveDropdown(isExpanded ? null : catKey)}
                          className="p-1 rounded-md text-muted-foreground hover:bg-muted cursor-pointer"
                          aria-label={`Toggle subcategories for ${cat.name}`}
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isExpanded ? "rotate-180 text-primary" : ""
                            }`}
                          />
                        </button>
                      ) : null}
                    </div>

                    {/* Mobile Submenu Accordion */}
                    {hasSubs && isExpanded && (
                      <div className="mt-1 space-y-1 pl-3 border-l-2 border-primary/30 animate-in fade-in duration-200">
                        <Link
                          to="/shop"
                          search={{ category: catParam }}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1 text-xs font-bold text-primary hover:underline transition-colors"
                        >
                          All {cat.name} →
                        </Link>
                        {subs.map((sub, sIdx) => {
                          const subName = typeof sub === "string" ? sub : sub.name;
                          const subParam = typeof sub === "string" ? sub.toLowerCase().replace(/\s+/g, "-") : (sub.slug || sub.name?.toLowerCase().replace(/\s+/g, "-"));
                          const subKey = typeof sub === "object" && sub._id ? sub._id : sIdx;

                          return (
                            <Link
                              key={subKey}
                              to="/shop"
                              search={{ category: catParam, subCategory: subParam }}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block py-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                              {subName}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </header>

      {/* Drawers & Modals */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistDrawer open={wishlistOpen} onClose={() => setWishlistOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

