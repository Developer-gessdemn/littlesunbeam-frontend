import { createFileRoute, Link } from "@tanstack/react-router";
import { Map, Home, ChevronRight, ShoppingBag, ShieldCheck, HelpCircle, Layers, ArrowRight, User } from "lucide-react";
import SiteHeader from "@/components/SiteHeader.jsx";
import SiteFooter from "@/components/SiteFooter.jsx";
import { useShop } from "@/context/ShopContext.jsx";

export const Route = createFileRoute("/sitemap")({
  head: () => ({
    meta: [
      { title: "Site Map | Little Sunbeam" },
      {
        name: "description",
        content: "Explore the complete directory and sitemap of Little Sunbeam organic baby store pages, categories, and policies.",
      },
    ],
  }),
  component: SitemapPage,
});

function SitemapPage() {
  const { categories } = useShop();
  const dynamicCategories = (categories || []).filter((c) => c.isActive !== false);

  return (
    <div className="min-h-screen flex flex-col bg-cream text-foreground font-sans">
      <SiteHeader />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          <span className="font-bold text-foreground">Site Map</span>
        </div>

        {/* Header Banner */}
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-10 shadow-xs mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Map className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">Site Map &amp; Directory</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Quick direct access to all pages, collections, and policies
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-4">
            Navigate through Little Sunbeam's organic cotton baby wear catalog, newborn hospital sets, customer account features, and legal policies.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Main Pages */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Home className="h-4 w-4" />
              <h2 className="text-foreground font-extrabold">Store Navigation</h2>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/" className="flex items-center justify-between hover:text-primary transition-colors py-1">
                  <span>Home Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
              <li>
                <Link to="/shop" className="flex items-center justify-between hover:text-primary transition-colors py-1">
                  <span>All Baby Essentials</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
              <li>
                <Link to="/contact" className="flex items-center justify-between hover:text-primary transition-colors py-1">
                  <span>Contact Us</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Shop Categories */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <ShoppingBag className="h-4 w-4" />
              <h2 className="text-foreground font-extrabold">Collections &amp; Categories</h2>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/shop" className="flex items-center justify-between hover:text-primary transition-colors py-1">
                  <span>All Products</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
              {dynamicCategories.map((cat, idx) => {
                const catParam = (cat.slug || cat.id || cat.name || "").toLowerCase().replace(/\s+/g, "-");
                const catKey = cat._id || cat.id || cat.slug || cat.name || idx;
                return (
                  <li key={catKey}>
                    <Link
                      to="/shop"
                      search={{ category: catParam }}
                      className="flex items-center justify-between hover:text-primary transition-colors py-1"
                    >
                      <span>{cat.name}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Account & Checkout */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <User className="h-4 w-4" />
              <h2 className="text-foreground font-extrabold">Account &amp; Bag</h2>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/cart" className="flex items-center justify-between hover:text-primary transition-colors py-1">
                  <span>Shopping Cart</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="flex items-center justify-between hover:text-primary transition-colors py-1">
                  <span>Checkout</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
              <li>
                <Link to="/profile" className="flex items-center justify-between hover:text-primary transition-colors py-1">
                  <span>Customer Profile &amp; Orders</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies & Legal */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-xs space-y-3 md:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <ShieldCheck className="h-4 w-4" />
              <h2 className="text-foreground font-extrabold">Policies &amp; Legal</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
              <Link
                to="/privacy-policy"
                className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors text-xs font-semibold text-foreground"
              >
                <span>Privacy Policy</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Link
                to="/shipping-policy"
                className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors text-xs font-semibold text-foreground"
              >
                <span>Shipping Policy</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Link
                to="/terms-conditions"
                className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors text-xs font-semibold text-foreground"
              >
                <span>Terms &amp; Conditions</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Link
                to="/return-cancellation"
                className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors text-xs font-semibold text-foreground"
              >
                <span>Return &amp; Cancellation</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
