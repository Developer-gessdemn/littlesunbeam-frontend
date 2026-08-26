import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Home, ChevronRight, Lock, Eye, Bell, UserCheck, Mail } from "lucide-react";
import SiteHeader from "@/components/SiteHeader.jsx";
import SiteFooter from "@/components/SiteFooter.jsx";
import { useShop } from "@/context/ShopContext.jsx";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Little Sunbeam" },
      {
        name: "description",
        content: "Learn how Little Sunbeam collects, uses, and safeguards your personal data.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
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
          <span className="font-bold text-foreground">Privacy Policy</span>
        </div>

        {/* Header Title Banner */}
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-10 shadow-xs mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">Privacy Policy</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-4">
            At Little Sunbeam, we value the trust you place in us when shopping for your little ones. We are committed to protecting your privacy and ensuring your personal information is handled in a safe, secure, and responsible manner.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-xs">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <Eye className="h-4 w-4 text-primary" />
              <h2>1. Information We Collect</h2>
            </div>
            <p>
              When you browse our website, create an account, make a purchase, or contact our customer care, we may collect:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Personal Details:</strong> Name, phone number, email address, shipping and billing address.</li>
              <li><strong>Order History:</strong> Details about the organic baby products you have ordered, wishlist items, and past transactions.</li>
              <li><strong>Payment Information:</strong> All payment transactions are securely processed through certified gateway partners (such as Razorpay/UPI). We never store your credit/debit card numbers or CVV on our servers.</li>
              <li><strong>Device &amp; Usage Information:</strong> IP address, browser type, and interaction metrics to improve your shopping experience.</li>
            </ul>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <Lock className="h-4 w-4 text-primary" />
              <h2>2. How We Use Your Information</h2>
            </div>
            <p>We use the collected information exclusively to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Process, pack, and deliver your orders accurately to your doorstep.</li>
              <li>Send automated order confirmations, dispatch notices, and tracking updates via SMS, WhatsApp, or Email.</li>
              <li>Provide responsive customer support and resolve any inquiries or return requests.</li>
              <li>Improve our organic cotton baby products, user interface, and website reliability.</li>
            </ul>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <UserCheck className="h-4 w-4 text-primary" />
              <h2>3. Data Protection &amp; Sharing</h2>
            </div>
            <p>
              We respect your privacy and <strong>never sell, rent, or trade</strong> your personal data to third parties. Information is only shared with trusted partners necessary to fulfill services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Courier &amp; Logistics Partners:</strong> (e.g., Delhivery, BlueDart, India Post) solely for shipping your packages.</li>
              <li><strong>Secure Payment Gateways:</strong> For processing encrypted electronic payments.</li>
            </ul>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-base">
              <Mail className="h-4 w-4 text-primary" />
              <h2>4. Contact Us Regarding Your Privacy</h2>
            </div>
            <p>
              If you have any questions about this Privacy Policy or wish to review, update, or delete your personal details, feel free to reach out:
            </p>
            <div className="p-4 rounded-2xl bg-secondary/60 border border-border text-foreground space-y-1 text-xs sm:text-sm">
              <p><strong>Little Sunbeam Baby Wear</strong></p>
              <p>Email: <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a></p>
              <p>Phone: <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="text-primary hover:underline">{phone}</a></p>
              <p>Location: Tiruppur, Tamil Nadu, India</p>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
