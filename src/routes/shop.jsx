import { useMemo, useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SlidersHorizontal, X, Home, ChevronRight, Check } from "lucide-react";
import SiteHeader from "@/components/SiteHeader.jsx";
import SiteFooter from "@/components/SiteFooter.jsx";
import ProductCard from "@/components/ProductCard.jsx";
import { ageGroups } from "@/data/products.js";
import { useShop } from "@/context/ShopContext.jsx";

export const Route = createFileRoute("/shop")({
  validateSearch: (search) => ({
    q: typeof search.q === "string" ? search.q : typeof search.search === "string" ? search.search : undefined,
    search: typeof search.search === "string" ? search.search : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
    subCategory:
      typeof search.subCategory === "string"
        ? search.subCategory
        : typeof search.subcategory === "string"
        ? search.subcategory
        : undefined,
    age: typeof search.age === "string" ? search.age : undefined,
    print: typeof search.print === "string" ? search.print : undefined,
    prints: typeof search.prints === "string" ? search.prints : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Baby Essentials — Little Sunbeam" },
      {
        name: "description",
        content:
          "Filter organic cotton baby products by category, subcategory, age, print and price at Little Sunbeam.",
      },
      { property: "og:title", content: "Shop Baby Essentials — Little Sunbeam" },
      {
        name: "description",
        content: "Filter organic cotton baby products by category, subcategory, age, print and price.",
      },
    ],
  }),
  component: Shop,
});

const MAX_PRICE = 3500;

function Shop() {
  const search = Route.useSearch();
  const { products, loadingProducts, prints, isShopByPrintEnabled, categories } = useShop();

  const [searchQuery, setSearchQuery] = useState(search.q || search.search || "");
  const [selectedCats, setSelectedCats] = useState(
    search.category ? [search.category.toLowerCase()] : []
  );
  const [selectedSubCats, setSelectedSubCats] = useState(
    search.subCategory ? [search.subCategory.toLowerCase()] : []
  );
  const [selectedAges, setSelectedAges] = useState(search.age ? [search.age] : []);
  const [selectedPrints, setSelectedPrints] = useState(() => {
    const initial = [];
    if (search.print) initial.push(search.print);
    if (search.prints) {
      search.prints.split(",").forEach((p) => {
        const trimmed = p.trim();
        if (trimmed && !initial.includes(trimmed)) initial.push(trimmed);
      });
    }
    return initial;
  });
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [sort, setSort] = useState("featured");
  const [openMobile, setOpenMobile] = useState(false);

  // Sync state if search params change
  useEffect(() => {
    if (search.q !== undefined || search.search !== undefined) {
      setSearchQuery(search.q || search.search || "");
    }
  }, [search.q, search.search]);

  useEffect(() => {
    const paramsList = [];
    if (search.print) paramsList.push(search.print);
    if (search.prints) {
      search.prints.split(",").forEach((p) => {
        const trimmed = p.trim();
        if (trimmed && !paramsList.includes(trimmed)) paramsList.push(trimmed);
      });
    }
    if (paramsList.length > 0) {
      setSelectedPrints((prev) => {
        const merged = [...prev];
        paramsList.forEach((p) => {
          if (!merged.some((m) => m.toLowerCase() === p.toLowerCase())) {
            merged.push(p);
          }
        });
        return merged;
      });
    }
  }, [search.print, search.prints]);

  useEffect(() => {
    if (search.category) {
      const catLower = search.category.toLowerCase();
      setSelectedCats((prev) => (prev.includes(catLower) ? prev : [catLower]));
    }
  }, [search.category]);

  useEffect(() => {
    if (search.subCategory) {
      const subLower = search.subCategory.toLowerCase();
      setSelectedSubCats((prev) => (prev.includes(subLower) ? prev : [subLower]));
    }
  }, [search.subCategory]);

  useEffect(() => {
    if (search.age) {
      setSelectedAges((prev) => (prev.includes(search.age) ? prev : [search.age]));
    }
  }, [search.age]);

  const toggle = (list, setList, value) => {
    const valLower = value.toLowerCase();
    const exists = list.some((item) => item.toLowerCase() === valLower);
    setList(exists ? list.filter((item) => item.toLowerCase() !== valLower) : [...list, value]);
  };

  const clearAll = () => {
    setSearchQuery("");
    setSelectedCats([]);
    setSelectedSubCats([]);
    setSelectedAges([]);
    setSelectedPrints([]);
    setMaxPrice(MAX_PRICE);
  };

  const filtered = useMemo(() => {
    let list = (products || []).filter((p) => {
      // 0. Search Query Match
      if (searchQuery && searchQuery.trim()) {
        const qWords = searchQuery.toLowerCase().trim().split(/\s+/);
        const hay = [
          p.name || "",
          p.description || "",
          p.category || "",
          p.categoryPill || "",
          p.subCategory || "",
          p.print || "",
          p.ageGroup || "",
          p.age || "",
          p.fabric || "",
          Array.isArray(p.prints) ? p.prints.map((pr) => (typeof pr === "object" ? pr.name : pr)).join(" ") : "",
          Array.isArray(p.colorVariants) ? p.colorVariants.map((cv) => cv.name).join(" ") : "",
          Array.isArray(p.tags) ? p.tags.join(" ") : "",
        ].join(" ").toLowerCase();

        const match = qWords.every((w) => hay.includes(w));
        if (!match) return false;
      }

      // 1. Category Match
      const catMatch =
        selectedCats.length === 0 ||
        selectedCats.some((c) => {
          const cLow = String(c).toLowerCase().trim();
          const pCatLow = (p.category || "").toLowerCase().trim();
          const pPillLow = (p.categoryPill || "").toLowerCase().trim();
          const pSubLow = (p.subCategory || "").toLowerCase().trim();
          const pCatId = String(p.categoryId || "").toLowerCase().trim();

          // Direct match against category string/id
          if (pCatLow === cLow || pPillLow.includes(cLow) || pSubLow.includes(cLow) || pCatId === cLow) {
            return true;
          }

          // Match against category slug/name from categories list
          const foundCategory = (categories || []).find(
            (cat) =>
              (cat._id && String(cat._id).toLowerCase() === cLow) ||
              (cat.id && String(cat.id).toLowerCase() === cLow) ||
              (cat.slug && String(cat.slug).toLowerCase() === cLow) ||
              (cat.name && cat.name.toLowerCase() === cLow)
          );

          if (foundCategory) {
            const foundName = (foundCategory.name || "").toLowerCase();
            const foundSlug = (foundCategory.slug || "").toLowerCase();
            const foundId = (foundCategory.id || "").toLowerCase();
            const foundObjId = String(foundCategory._id || "").toLowerCase();

            if (pCatLow === foundName || pCatLow === foundSlug || pCatLow === foundId) return true;
            if (pCatId && pCatId === foundObjId) return true;
            if (pPillLow && (pPillLow.includes(foundName) || pPillLow.includes(foundSlug))) return true;
          }

          return false;
        });

      // 2. Subcategory Match
      const subCatMatch =
        selectedSubCats.length === 0 ||
        selectedSubCats.some((sc) => {
          const scLow = String(sc).toLowerCase().trim();
          const pSubLow = (p.subCategory || "").toLowerCase().trim();
          const pSubId = String(p.subCategoryId || "").toLowerCase().trim();

          if (pSubLow === scLow || pSubLow.includes(scLow) || pSubId === scLow) return true;

          // Check against subcategory slugs in categories
          for (const cat of categories || []) {
            for (const sub of cat.subCategories || []) {
              const sName = (typeof sub === "string" ? sub : sub.name || "").toLowerCase();
              const sSlug = (typeof sub === "string" ? sub.toLowerCase().replace(/\s+/g, "-") : sub.slug || sName.replace(/\s+/g, "-")).toLowerCase();
              const sId = (typeof sub === "object" && sub._id ? String(sub._id) : "").toLowerCase();

              if (scLow === sSlug || scLow === sName || scLow === sId) {
                if (pSubLow === sName || pSubLow === sSlug || (pSubId && pSubId === sId)) {
                  return true;
                }
              }
            }
          }

          return false;
        });

      // 3. Age Match
      const ageMatch =
        selectedAges.length === 0 ||
        selectedAges.some((a) => (p.ageGroup || p.age || "").toLowerCase().includes(a.toLowerCase()));

      // 4. Print Match
      const printMatch =
        selectedPrints.length === 0 ||
        selectedPrints.some((pr) => {
          const prLow = String(pr).toLowerCase().trim();

          if (Array.isArray(p.prints) && p.prints.length > 0) {
            const hasMatch = p.prints.some((prodPrint) => {
              if (typeof prodPrint === "object" && prodPrint !== null) {
                const idMatch = prodPrint._id && String(prodPrint._id).toLowerCase() === prLow;
                const slugMatch = prodPrint.id && String(prodPrint.id).toLowerCase() === prLow;
                const nameMatch = prodPrint.name && prodPrint.name.toLowerCase() === prLow;
                return idMatch || slugMatch || nameMatch;
              }
              return String(prodPrint).toLowerCase() === prLow;
            });
            if (hasMatch) return true;
          }

          const pPrintLow = (p.print || "").toLowerCase().trim();
          if (pPrintLow && pPrintLow === prLow) return true;

          const foundPrint = prints?.find(
            (item) =>
              (item._id && String(item._id).toLowerCase() === prLow) ||
              (item.id && String(item.id).toLowerCase() === prLow) ||
              item.name?.toLowerCase() === prLow
          );
          if (foundPrint) {
            if (pPrintLow === foundPrint.name.toLowerCase()) return true;
            if (pPrintLow === (foundPrint.id || "").toLowerCase()) return true;
          }

          return false;
        });

      // 5. Price Match
      const priceMatch = Number(p.price) <= maxPrice;

      return catMatch && subCatMatch && ageMatch && printMatch && priceMatch;
    });

    if (sort === "low") list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "high") list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "rating") list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [products, searchQuery, selectedCats, selectedSubCats, selectedAges, selectedPrints, maxPrice, sort, prints, categories]);

  const activeCount =
    (searchQuery.trim() ? 1 : 0) +
    selectedCats.length +
    selectedSubCats.length +
    selectedAges.length +
    selectedPrints.length +
    (maxPrice < MAX_PRICE ? 1 : 0);

  const filterPanel = (
    <div className="space-y-8">
      {/* Dynamic Categories & Nested Subcategories */}
      <FilterGroup title="Category">
        <div className="space-y-3">
          {(categories || []).map((c) => {
            const catKey = (c.slug || c.id || c.name || "").toLowerCase().replace(/\s+/g, "-");
            const isCatChecked = selectedCats.some(
              (sel) =>
                sel.toLowerCase() === catKey ||
                sel.toLowerCase() === (c.name || "").toLowerCase() ||
                sel.toLowerCase() === (c.id || "").toLowerCase() ||
                sel.toLowerCase() === (c.slug || "").toLowerCase()
            );

            const subs = (c.subCategories || []).filter(
              (s) => typeof s === "string" || s.isActive !== false
            );

            return (
              <div key={c._id || c.id || c.slug || c.name} className="space-y-1.5">
                <CheckRow
                  label={c.name}
                  checked={isCatChecked}
                  onChange={() => toggle(selectedCats, setSelectedCats, catKey)}
                />

                {/* Nested Subcategories */}
                {subs.length > 0 && (
                  <div className="ml-6 space-y-1 border-l-2 border-border/80 pl-2.5 pt-0.5">
                    {subs.map((sub, sIdx) => {
                      const subName = typeof sub === "string" ? sub : sub.name;
                      const subKey =
                        typeof sub === "string"
                          ? sub.toLowerCase().replace(/\s+/g, "-")
                          : (sub.slug || sub.name?.toLowerCase().replace(/\s+/g, "-"));
                      const isSubChecked = selectedSubCats.some(
                        (sel) =>
                          sel.toLowerCase() === subKey ||
                          sel.toLowerCase() === subName.toLowerCase()
                      );

                      return (
                        <CheckRow
                          key={typeof sub === "object" && sub._id ? sub._id : sIdx}
                          label={<span className="text-xs text-muted-foreground">{subName}</span>}
                          checked={isSubChecked}
                          onChange={() => toggle(selectedSubCats, setSelectedSubCats, subKey)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {(!categories || categories.length === 0) && (
            <p className="text-xs text-muted-foreground">No categories available.</p>
          )}
        </div>
      </FilterGroup>

      {/* Age Groups */}
      <FilterGroup title="Age">
        {ageGroups.map((a) => (
          <CheckRow
            key={a}
            label={a}
            checked={selectedAges.includes(a)}
            onChange={() => toggle(selectedAges, setSelectedAges, a)}
          />
        ))}
      </FilterGroup>

      {/* Prints */}
      {isShopByPrintEnabled && prints && prints.filter((p) => p.isActive !== false).length > 0 && (
        <FilterGroup title="Print">
          <div className="space-y-2">
            {prints
              .filter((p) => p.isActive !== false)
              .map((p, idx) => {
                const pIdentifier = p.id || p._id || p.name;
                const isChecked = selectedPrints.some(
                  (sp) =>
                    sp.toLowerCase() === (p.id || "").toLowerCase() ||
                    (p._id && sp.toLowerCase() === String(p._id).toLowerCase()) ||
                    sp.toLowerCase() === p.name.toLowerCase()
                );
                const printSymbol = p.emoji || p.icon || "✨";
                return (
                  <CheckRow
                    key={p._id || p.id || p.name || idx}
                    label={
                      <span className="flex items-center gap-2">
                        <span className="text-base">{printSymbol}</span>
                        <span>{p.name}</span>
                      </span>
                    }
                    checked={isChecked}
                    onChange={() => toggle(selectedPrints, setSelectedPrints, pIdentifier)}
                  />
                );
              })}
          </div>
        </FilterGroup>
      )}

      {/* Max Price */}
      <FilterGroup title="Max price">
        <input
          type="range"
          min={100}
          max={MAX_PRICE}
          step={50}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[var(--primary)]"
        />
        <p className="text-sm font-bold">Up to ₹{maxPrice}</p>
      </FilterGroup>

      <button
        onClick={clearAll}
        className="w-full rounded-full border border-border py-2 text-sm font-bold hover:bg-secondary transition"
      >
        Clear all filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Navigation Bar — Home button + breadcrumb */}
      <div className="sticky top-0 z-30 border-b border-neutral-100 bg-white/95 backdrop-blur-sm shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 shadow-xs hover:bg-neutral-50 hover:border-neutral-300 transition-all active:scale-95"
            aria-label="Go to home"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1 ml-1 text-xs text-neutral-400" aria-label="Breadcrumb">
            <ChevronRight className="h-3 w-3" />
            <span className="text-neutral-700 font-semibold">Shop</span>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold">
          Shop <span className="sun-underline">All Products</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {loadingProducts ? "Loading live catalog..." : `${filtered.length} product${filtered.length === 1 ? "" : "s"} found`}
        </p>

        {/* Active Filter Pills */}
        {activeCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Active Filters:</span>
            {searchQuery && searchQuery.trim() && (
              <button
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer"
              >
                <span>Search: "{searchQuery}"</span>
                <X className="h-3 w-3" />
              </button>
            )}
            {selectedCats.map((cat) => {
              const catObj = (categories || []).find(
                (c) => (c.slug || c.id || c.name || "").toLowerCase() === cat.toLowerCase()
              );
              return (
                <button
                  key={cat}
                  onClick={() => toggle(selectedCats, setSelectedCats, cat)}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition"
                >
                  <span>Category: {catObj?.name || cat}</span>
                  <X className="h-3 w-3" />
                </button>
              );
            })}
            {selectedSubCats.map((sub) => (
              <button
                key={sub}
                onClick={() => toggle(selectedSubCats, setSelectedSubCats, sub)}
                className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition"
              >
                <span>Subcategory: {sub}</span>
                <X className="h-3 w-3" />
              </button>
            ))}
            {selectedAges.map((age) => (
              <button
                key={age}
                onClick={() => toggle(selectedAges, setSelectedAges, age)}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-foreground hover:bg-secondary/80 transition"
              >
                <span>Age: {age}</span>
                <X className="h-3 w-3" />
              </button>
            ))}
            {selectedPrints.map((pr) => (
              <button
                key={pr}
                onClick={() => toggle(selectedPrints, setSelectedPrints, pr)}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-foreground hover:bg-secondary/80 transition"
              >
                <span>Print: {pr}</span>
                <X className="h-3 w-3" />
              </button>
            ))}
            {maxPrice < MAX_PRICE && (
              <button
                onClick={() => setMaxPrice(MAX_PRICE)}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-foreground hover:bg-secondary/80 transition"
              >
                <span>Under ₹{maxPrice}</span>
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={clearAll}
              className="text-xs font-bold text-destructive hover:underline ml-1"
            >
              Reset All
            </button>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={() => setOpenMobile(true)}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-bold lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters{activeCount ? ` (${activeCount})` : ""}
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="ml-auto rounded-full border border-border bg-card px-4 py-2 text-sm font-bold outline-none cursor-pointer"
          >
            <option value="featured">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-40 rounded-2xl border border-border bg-card p-6 shadow-xs">
              {filterPanel}
            </div>
          </aside>

          <div>
            {filtered.length ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                {filtered.map((p) => (
                  <ProductCard key={p._id || p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                <p className="text-base font-bold text-muted-foreground">
                  No baby products match your selected filters.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try clearing or adjusting category, age, print or price filters.
                </p>
                <button
                  onClick={clearAll}
                  className="mt-4 rounded-full bg-primary px-6 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filters Drawer */}
      {openMobile && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-background p-6 shadow-2xl overflow-y-auto max-h-screen">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">Filters</h2>
              <button
                onClick={() => setOpenMobile(false)}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6">{filterPanel}</div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-0.5 hover:text-primary transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-border accent-[var(--primary)] h-4 w-4"
      />
      <span className={checked ? "font-bold text-primary" : "text-foreground"}>{label}</span>
    </label>
  );
}
