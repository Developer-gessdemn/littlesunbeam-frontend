import { createFileRoute, Link } from "@tanstack/react-router";
import { RefreshCcw, Home, ChevronRight, CheckCircle, AlertCircle, Clock, ShieldCheck, Mail, Phone } from "lucide-react";
import SiteHeader from "@/components/SiteHeader.jsx";
import SiteFooter from "@/components/SiteFooter.jsx";
import { useShop } from "@/context/ShopContext.jsx";

export const Route = createFileRoute("/return-cancellation")({
  head: () => ({
    meta: [
      { title: "Return & Cancellation Policy | Little Sunbeam" },
      {
        name: "description",
        content: "Hassle-free 7-day returns, exchanges, and cancellations for your baby clothing orders at Little Sunbeam.",
      },
    ],
  }),
  component: ReturnCancellationPage,
});

function ReturnCancellationPage() {
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
          <span className="font-bold text-foreground">Return &amp; Cancellation</span>
        </div>

        {/* Header Banner */}
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-10 shadow-xs mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <RefreshCcw className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">Return &amp; Cancellation Policy</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Baby-friendly, parent-first return &amp; replacement process
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-4">
            We want you and your baby to love every item from Little Sunbeam. If you are not completely satisfied with your purchase, we provide a smooth 7-day return and exchange window.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-xs">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <Clock className="h-4 w-4 text-primary" />
              <h2>1. 7-Day Return &amp; Exchange Window</h2>
            </div>
            <p>
              You can request a return or size exchange within <strong>7 days</strong> of order delivery.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Items must be unused, unwashed, and with all original brand tags and packaging intact.</li>
              <li>Due to hygiene reasons for newborns, washed garments or personal hygiene kits cannot be returned.</li>
            </ul>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2>2. Damaged or Defective Items</h2>
            </div>
            <p>
              In the rare event that you receive a defective or damaged product, we offer a <strong>100% free immediate replacement</strong> or complete refund. Simply send us a photo of the product within 48 hours of delivery.
            </p>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <AlertCircle className="h-4 w-4 text-primary" />
              <h2>3. Order Cancellation</h2>
            </div>
            <p>
              You may cancel an order anytime before it has been dispatched from our Tiruppur facility. Once dispatched, you can initiate a return upon receiving the package.
            </p>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <CheckCircle className="h-4 w-4 text-primary" />
              <h2>4. How to Request a Return or Exchange</h2>
            </div>
            <p>
              To initiate a return or exchange, reach out to our friendly support team:
            </p>
            <div className="p-4 rounded-2xl bg-secondary/60 border border-border text-foreground space-y-1.5 text-xs sm:text-sm">
              <p>Email: <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a></p>
              <p>WhatsApp / Call: <a href="https://wa.me/919361503943" target="_blank" rel="noreferrer" className="text-green-600 font-bold hover:underline">+91 93615 03943 (Chat on WhatsApp →)</a></p>
              <p className="text-muted-foreground pt-1">Please mention your Order Number and photos if relevant.</p>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
