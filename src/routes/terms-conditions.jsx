import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Home, ChevronRight, CheckCircle2, Shield, AlertTriangle } from "lucide-react";
import SiteHeader from "@/components/SiteHeader.jsx";
import SiteFooter from "@/components/SiteFooter.jsx";
import { useShop } from "@/context/ShopContext.jsx";

export const Route = createFileRoute("/terms-conditions")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | Little Sunbeam" },
      {
        name: "description",
        content: "Review terms and conditions for browsing, ordering, and using Little Sunbeam's baby clothing store.",
      },
    ],
  }),
  component: TermsConditionsPage,
});

function TermsConditionsPage() {
  const { footerInfo } = useShop();
  const email = footerInfo?.email || "littlesunbeamkidswear@gmail.com";

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
          <span className="font-bold text-foreground">Terms &amp; Conditions</span>
        </div>

        {/* Header Banner */}
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-10 shadow-xs mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">Terms &amp; Conditions</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Effective date: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-4">
            Welcome to Little Sunbeam Baby Clothing. By accessing or shopping on our website, you agree to comply with and be bound by the following terms and conditions.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-xs">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h2>1. General Usage &amp; Eligibility</h2>
            </div>
            <p>
              By using our website, you warrant that you are at least 18 years of age or accessing under the supervision of a parent or guardian. You agree to provide accurate, truthful, and complete details when placing an order.
            </p>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <Shield className="h-4 w-4 text-primary" />
              <h2>2. Product Accuracy &amp; Organic Fabric Quality</h2>
            </div>
            <p>
              We manufacture all garments using 100% certified organic cotton and non-toxic dyes in Tiruppur. While we strive to display fabric textures, colors, and prints with utmost accuracy, slight variations may occur due to device screen calibrations and natural hand-dye processes.
            </p>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <h2>3. Pricing &amp; Order Acceptance</h2>
            </div>
            <p>
              All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to cancel or refuse any order in the event of an inadvertent technical pricing glitch or stock unavailability.
            </p>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-foreground font-bold text-base">4. Intellectual Property</h2>
            <p>
              All content on this website, including logos, designs, product photography, text copy, and graphics, is the proprietary intellectual property of Little Sunbeam Baby Wear and protected by applicable copyright and trademark laws.
            </p>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-foreground font-bold text-base">5. Contact Support</h2>
            <p>
              For legal inquiries or questions regarding our terms, please email us at <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a>.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
