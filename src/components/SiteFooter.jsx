import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, Phone, Facebook, Heart, ShieldCheck } from "lucide-react";
import logo from "@/assets/LSB_Logo1.jpg";
import { useShop } from "@/context/ShopContext.jsx";

export default function SiteFooter() {
  const { footerInfo, categories } = useShop();

  const phone = footerInfo?.phone || "+91 93615 03943";
  const email = footerInfo?.email || "littlesunbeamkidswear@gmail.com";
  const address =
    footerInfo?.address ||
    "1/95m Bandari Nagar, Veerapandi, Tirupur, Tamil Nadu - 641605";

  const cleanPhone = phone.replace(/[^0-9+]/g, "");

  // Filter active categories for navbar navigation (without subcategory dropdowns)
  const activeNavCategories = (categories || []).filter((c) => c.isActive !== false);

  return (
    <footer className="mt-20 border-t border-border bg-secondary/50 font-sans">
      {/* Social Strip */}
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-center gap-6 text-xs font-bold text-muted-foreground border-b border-border">
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noreferrer"
          className="hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <Facebook className="h-4 w-4" />
          <span>Facebook</span>
        </a>
        <span>·</span>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noreferrer"
          className="hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <Instagram className="h-4 w-4" />
          <span>Instagram</span>
        </a>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Brand & About */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={logo}
              alt="Little Sunbeam baby store logo"
              className="h-12 w-auto object-contain"
              loading="lazy"
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
          <p className="text-xs leading-relaxed text-muted-foreground">
            Little Sunbeam designs 100% certified organic cotton baby essentials — crafted in Tiruppur for delicate newborn skin, maximum comfort, and everyday durability.
          </p>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>100% GOTS Certified Organic Cotton</span>
          </div>
        </div>

        {/* 2. Main Navbar Navigation (All Categories without Subcategory Dropdowns) */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">Baby Essentials</h4>
          <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
            <li>
              <Link to="/shop" className="hover:text-primary transition-colors font-medium">
                All Essentials
              </Link>
            </li>
            {activeNavCategories.length > 0 ? (
              activeNavCategories.map((cat, idx) => {
                const catParam = (cat.slug || cat.id || cat.name || "").toLowerCase().replace(/\s+/g, "-");
                const catKey = cat._id || cat.id || cat.slug || cat.name || idx;

                return (
                  <li key={catKey}>
                    <Link
                      to="/shop"
                      search={{ category: catParam }}
                      className="hover:text-primary transition-colors font-medium"
                    >
                      {cat.name}
                    </Link>
                  </li>
                );
              })
            ) : (
              <>
                <li>
                  <Link to="/shop" search={{ category: "muslin" }} className="hover:text-primary transition-colors font-medium">
                    Muslin Baby Clothing
                  </Link>
                </li>
                <li>
                  <Link to="/shop" search={{ category: "hospital" }} className="hover:text-primary transition-colors font-medium">
                    Newborn Hospital Kits
                  </Link>
                </li>
                <li>
                  <Link to="/shop" search={{ category: "towels" }} className="hover:text-primary transition-colors font-medium">
                    Baby Blankets &amp; Towels
                  </Link>
                </li>
                <li>
                  <Link to="/shop" search={{ category: "accessories" }} className="hover:text-primary transition-colors font-medium">
                    Baby Accessories
                  </Link>
                </li>
                <li>
                  <Link to="/shop" search={{ category: "daily-wear" }} className="hover:text-primary transition-colors font-medium">
                    Daily Wear Essentials
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* 3. Policies & Legal Info */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">Policies &amp; Legal</h4>
          <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
            <li>
              <Link to="/privacy-policy" className="hover:text-primary transition-colors font-medium">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/shipping-policy" className="hover:text-primary transition-colors font-medium">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link to="/terms-conditions" className="hover:text-primary transition-colors font-medium">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link to="/return-cancellation" className="hover:text-primary transition-colors font-medium">
                Return &amp; Cancellation
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary transition-colors font-medium">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/sitemap" className="hover:text-primary transition-colors font-medium">
                Site Map
              </Link>
            </li>
          </ul>
        </div>

        {/* 4. Contact Us */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">Contact Info</h4>
          <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
            <li>
              <a
                href={`tel:${cleanPhone}`}
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <Phone className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-foreground">{phone}</span>
              </a>
            </li>
            <li>
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <Mail className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-foreground break-all">{email}</span>
              </a>
            </li>
            <li className="flex items-start gap-2 pt-0.5">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="leading-relaxed">{address}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Little Sunbeam Baby Clothing. All Rights Reserved. Made in Tiruppur, India.
      </div>
    </footer>
  );
}
