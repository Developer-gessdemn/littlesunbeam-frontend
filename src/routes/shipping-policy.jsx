import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck, Home, ChevronRight, Clock, MapPin, PackageCheck, AlertCircle, Phone } from "lucide-react";
import SiteHeader from "@/components/SiteHeader.jsx";
import SiteFooter from "@/components/SiteFooter.jsx";
import { useShop } from "@/context/ShopContext.jsx";

export const Route = createFileRoute("/shipping-policy")({
  head: () => ({
    meta: [
      { title: "Shipping Policy | Little Sunbeam" },
      {
        name: "description",
        content: "Learn about Little Sunbeam's domestic shipping timelines, order tracking, and delivery guidelines.",
      },
    ],
  }),
  component: ShippingPolicyPage,
});

function ShippingPolicyPage() {
  const { footerInfo } = useShop();
  const email = footerInfo?.email || "littlesunbeamkidswear@gmail.com";
  const phone = footerInfo?.phone || "+91 93615 03943";

  return (
    <div className="min-h-screen flex flex-col bg-cream text-foreground font-sans">
      <SiteHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          <span className="font-bold text-foreground">Shipping Policy</span>
        </div>

        {/* Header Banner */}
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-10 shadow-xs mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">Shipping Policy</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Fast, reliable dispatch across all pin codes in India
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-4">
            At Little Sunbeam, every garment is thoughtfully crafted, quality checked, and sanitized in Tiruppur before being carefully packaged and dispatched to you.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-xs">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <Clock className="h-4 w-4 text-primary" />
              <h2>1. Order Processing &amp; Dispatch Timeline</h2>
            </div>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Orders are processed and dispatched within <strong>24 to 48 hours</strong> (excluding Sundays and national holidays).</li>
              <li>Once dispatched, you will receive an SMS and WhatsApp notification containing your airway bill (AWB) tracking number and live tracking link.</li>
            </ul>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <MapPin className="h-4 w-4 text-primary" />
              <h2>2. Estimated Delivery Timeframes</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                <p className="font-bold text-foreground mb-1">Tamil Nadu &amp; South India</p>
                <p className="text-xs">Delivered within <strong>2 to 4 business days</strong> from dispatch.</p>
              </div>
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                <p className="font-bold text-foreground mb-1">Rest of India</p>
                <p className="text-xs">Delivered within <strong>4 to 7 business days</strong> depending on your pin code.</p>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <PackageCheck className="h-4 w-4 text-primary" />
              <h2>3. Shipping Charges</h2>
            </div>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Free Shipping:</strong> Available on prepaid orders exceeding the threshold displayed on our cart page.</li>
              <li><strong>Standard Delivery Fee:</strong> Flat nominal shipping fee applied at checkout for standard orders.</li>
            </ul>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <AlertCircle className="h-4 w-4 text-primary" />
              <h2>4. Damaged or Tampered Parcels</h2>
            </div>
            <p>
              If you receive a package that appears damaged, unsealed, or tampered with at the time of delivery, please do not accept the shipment or take a clear photo/video and notify our support team immediately at <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a> or via phone <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="text-primary hover:underline">{phone}</a>.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
