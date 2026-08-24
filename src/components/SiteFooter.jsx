import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, Phone, Facebook } from "lucide-react";
import logo from "@/assets/LSB_Logo1.jpg";
import { useShop } from "@/context/ShopContext.jsx";

export default function SiteFooter() {
  const { footerInfo } = useShop();

  const phone = footerInfo?.phone || "+91 93615 03943";
  const email = footerInfo?.email || "littlesunbeamkidswear@gmail.com";
  const address =
    footerInfo?.address ||
    "1/95m Bandari Nagar, Veerapandi, Tirupur, Tamil Nadu - 641605";

  const cleanPhone = phone.replace(/[^0-9+]/g, "");

  return (
    <footer className="mt-20 border-t border-border bg-secondary/50 font-sans">
      {/* Social Strip */}
      <div className="mx-auto max-w-7xl px-4 py-5 flex items-center justify-center gap-6 text-xs font-bold text-muted-foreground border-b border-border">
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

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand & About */}
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
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
            <li>
              <Link to="/shop" className="hover:text-primary transition-colors">
                Shop All Essentials
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ category: "muslin" }} className="hover:text-primary transition-colors">
                Muslin Baby Clothing
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ category: "hospital" }} className="hover:text-primary transition-colors">
                Newborn Hospital Kits
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ category: "towels" }} className="hover:text-primary transition-colors">
                Baby Blankets & Towels
              </Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-primary transition-colors">
                Shipping & Returns Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">Contact Us</h4>
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
                <span className="font-semibold text-foreground">{email}</span>
              </a>
            </li>
            <li className="flex items-start gap-2 pt-1">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="leading-relaxed">{address}</span>
            </li>
          </ul>
        </div>

        {/* Newsletter Subscription */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
            Subscribe to our emails
          </h4>
          <div className="mt-4 flex items-center rounded-full border border-border bg-card p-1 shadow-xs focus-within:border-primary">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-3 text-xs outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition text-sm font-bold shadow-xs"
              aria-label="Subscribe"
            >
              →
            </button>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
            Be the first to receive notifications about new organic arrivals, baby care tips, and exclusive offers.
          </p>
        </div>
      </div>

      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Little Sunbeam Baby Clothing. All Rights Reserved. Made in Tiruppur, India.
      </div>
    </footer>
  );
}
