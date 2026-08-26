import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin, MessageSquare, Send, CheckCircle2, Home, ChevronRight, Sparkles, MessageCircle } from "lucide-react";
import SiteHeader from "@/components/SiteHeader.jsx";
import SiteFooter from "@/components/SiteFooter.jsx";
import { useShop } from "@/context/ShopContext.jsx";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us | Little Sunbeam Baby Shop" },
      {
        name: "description",
        content: "Get in touch with Little Sunbeam via WhatsApp or Call at +91 93615 03943. We are here to assist you with orders, organic cotton baby clothing, and support.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { footerInfo } = useShop();
  const phone = footerInfo?.phone || "+91 93615 03943";
  const email = footerInfo?.email || "littlesunbeamkidswear@gmail.com";
  const address =
    footerInfo?.address ||
    "1/95m Bandari Nagar, Veerapandi, Tirupur, Tamil Nadu - 641605";

  const whatsappDigits = "919361503943";
  const cleanPhone = phone.replace(/[^0-9+]/g, "");

  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    // Construct WhatsApp formatted message
    const lines = [
      `👋 *Hello Little Sunbeam Team,*`,
      ``,
      `I have an inquiry from your website:`,
      `👤 *Name:* ${formData.name}`,
      `📞 *Phone:* ${formData.phone || "Not provided"}`,
      `📧 *Email:* ${formData.email}`,
      ``,
      `💬 *Message:*`,
      `${formData.message}`,
    ];

    const waText = encodeURIComponent(lines.join("\n"));
    const waUrl = `https://wa.me/${whatsappDigits}?text=${waText}`;

    // Open WhatsApp in new tab
    window.open(waUrl, "_blank", "noopener,noreferrer");

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream text-foreground font-sans">
      <SiteHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          <span className="font-bold text-foreground">Contact Us</span>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>We're Here to Help</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Get in Touch With Little Sunbeam
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Have questions about sizes, materials, order tracking, or custom hospital kits? Chat directly with us on WhatsApp or reach out below.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Cards */}
          <div className="space-y-4">
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-4 p-5 rounded-3xl bg-card border border-border hover:border-green-500/50 hover:bg-green-500/5 transition-all shadow-xs group"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-green-500/15 text-green-600 group-hover:scale-110 transition-transform shrink-0">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <span>WhatsApp Chat &amp; Call</span>
                </h3>
                <p className="text-sm font-bold text-foreground mt-0.5">+91 93615 03943</p>
                <p className="text-xs text-green-600 font-semibold mt-1">Tap to chat on WhatsApp →</p>
              </div>
            </a>

            <a
              href={`mailto:${email}`}
              className="flex items-start gap-4 p-5 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs group"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Email Support</h3>
                <p className="text-sm font-bold text-foreground mt-0.5 break-all">{email}</p>
                <p className="text-xs text-muted-foreground mt-1">Quick replies within 24 business hours</p>
              </div>
            </a>

            <div className="flex items-start gap-4 p-5 rounded-3xl bg-card border border-border shadow-xs">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Workshop &amp; Studio</h3>
                <p className="text-sm text-foreground leading-relaxed mt-0.5">{address}</p>
                <p className="text-xs text-primary font-bold mt-1">Tiruppur, Tamil Nadu, India</p>
              </div>
            </div>
          </div>

          {/* Contact Message Form */}
          <div className="lg:col-span-2 rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-xs">
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-green-500/15 text-green-600 mb-4 animate-bounce">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Message Sent to WhatsApp!</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  Your message has been formatted and opened in WhatsApp chat (+91 93615 03943). Our team will respond to you right away!
                </p>
                <div className="flex flex-wrap gap-3 justify-center mt-6">
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-green-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-green-700 transition flex items-center gap-1.5"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Open WhatsApp Again</span>
                  </a>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", email: "", phone: "", message: "" });
                    }}
                    className="rounded-full border border-border px-6 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Send us a Message
                  </h2>
                  <span className="text-xs font-bold text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Direct WhatsApp to +91 93615 03943
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-foreground">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-xs sm:text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-xs sm:text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. priya@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-xs sm:text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">How can we help? *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us what you're looking for or your order query..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-xs sm:text-sm text-foreground outline-none focus:border-primary resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-green-600 px-8 py-3 text-xs sm:text-sm font-extrabold text-white hover:bg-green-700 transition shadow-xs cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Send via WhatsApp (+91 93615 03943)</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
