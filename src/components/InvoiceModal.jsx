import { useState } from "react";
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  FileText,
  ShieldCheck,
} from "lucide-react";
import lsbLogo from "@/assets/LSB_Logo1.jpg";
import { generateInvoicePdf, printInvoice } from "@/lib/exportUtils";

export default function InvoiceModal({ order, isOpen, onClose, storeInfo }) {
  if (!isOpen || !order) return null;

  const [downloading, setDownloading] = useState(false);

  const info = {
    name: "Little Sunbeam Baby Clothing",
    tagline: "Premium Organic Essentials for Newborns & Toddlers",
    email: "littlesunbeamkidswear@gmail.com",
    phone: "+91 93615 03943",
    address: "1/95m Bandari Nagar, Veerapandi, Tirupur, Tamil Nadu - 641605",
    website: "www.littlesunbeam.com",
    gstin: "33AAAAA0000A1Z5",
    ...storeInfo,
  };

  const invoiceNo =
    order.invoiceNumber ||
    `INV-${order.orderNumber?.replace(/[^a-zA-Z0-9]/g, "") || Date.now()}`;
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  const custName =
    order.shippingAddress?.name ||
    order.user?.name ||
    order.customerName ||
    "Valued Customer";
  const custPhone =
    order.shippingAddress?.phone || order.user?.phone || order.customerPhone || "N/A";
  const custEmail = order.shippingAddress?.email || order.user?.email || "N/A";
  const custStreet =
    order.shippingAddress?.address ||
    order.shippingAddress?.street ||
    order.address?.street ||
    "";
  const custCity = order.shippingAddress?.city || order.address?.city || "";
  const custState = order.shippingAddress?.state || order.address?.state || "";
  const custPin = order.shippingAddress?.pincode || order.address?.pincode || "";

  const fullAddress = [
    custStreet,
    custCity,
    custState,
    custPin,
  ]
    .filter(Boolean)
    .join(", ");

  const items = order.items || [];
  const subtotal = order.subtotal || order.itemsPrice || order.totalAmount || 0;
  const shippingFee = Number(order.shippingPrice) || 0;
  const discount = Number(order.discount) || 0;
  const grandTotal = Number(order.totalAmount) || subtotal + shippingFee - discount;
  const gstAmount = Math.round((grandTotal * 5) / 105);
  const isPaid = (order.paymentStatus || "").toLowerCase() === "paid";

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await generateInvoicePdf(order, info);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    printInvoice(order, info);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl border border-amber-200/80 bg-card shadow-2xl overflow-hidden">
        {/* Top Floating Action Bar */}
        <div className="flex items-center justify-between border-b border-border/80 bg-muted/40 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-foreground">Tax Invoice Preview</h2>
              <p className="text-[11px] text-muted-foreground font-mono">{invoiceNo}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition shadow-2xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{downloading ? "Saving..." : "Download PDF"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Invoice Document Body */}
        <div className="overflow-y-auto p-5 sm:p-8 space-y-6 bg-gradient-to-b from-amber-50/20 via-card to-card">
          {/* Top Brand Stripe */}
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400" />

          {/* 1. Header: Brand Logo & Details (Left) + Invoice Meta (Right) */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-amber-200/80 pb-6">
            {/* Store Branding (Left) */}
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className="h-16 w-28 rounded-2xl bg-white p-1.5 shadow-xs border border-amber-200 flex items-center justify-center shrink-0">
                <img
                  src={lsbLogo}
                  alt="Little Sunbeam Logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-black tracking-tight text-primary uppercase">
                  {info.name}
                </h1>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{info.tagline}</p>
                <div className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed space-y-0.5">
                  <p className="line-clamp-2">{info.address}</p>
                  <p>
                    Phone: <span className="font-semibold text-foreground">{info.phone}</span> • Email:{" "}
                    <span className="font-semibold text-foreground">{info.email}</span>
                  </p>
                  <p>
                    <strong className="text-foreground">GSTIN:</strong> {info.gstin} •{" "}
                    <span className="text-primary font-medium">{info.website}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Meta (Right) */}
            <div className="text-left sm:text-right shrink-0 sm:min-w-[200px]">
              <span className="inline-block text-2xl font-black text-foreground tracking-tight">
                TAX INVOICE
              </span>
              <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                <p className="flex sm:justify-end items-center gap-1.5">
                  <strong className="text-primary font-bold">Invoice #:</strong>{" "}
                  <span className="font-mono font-bold text-foreground">{invoiceNo}</span>
                </p>
                <p className="flex sm:justify-end items-center gap-1.5">
                  <strong className="text-foreground font-semibold">Order #:</strong>{" "}
                  <span className="font-mono font-medium text-foreground">{order.orderNumber || "ORD-DEFAULT"}</span>
                </p>
                <p className="flex sm:justify-end items-center gap-1.5">
                  <strong className="text-foreground font-semibold">Date:</strong>{" "}
                  <span className="text-foreground">{orderDate}</span>
                </p>
              </div>
              <div className="mt-3 flex sm:justify-end">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                    isPaid
                      ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-700 border border-amber-500/25 dark:text-amber-400"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {order.paymentStatus || "Paid"} • {order.paymentMethod || "Online"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Customer Billing & Delivery Info Cards (Symmetrical Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bill To */}
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/15 p-4 flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 block mb-2">
                  BILLED TO / CUSTOMER DETAILS
                </span>
                <p className="text-sm font-black text-foreground">{custName}</p>
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-primary shrink-0" />
                    <span>{custPhone}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-primary shrink-0" />
                    <span className="truncate">{custEmail}</span>
                  </p>
                  <p className="flex items-center gap-1.5 mt-0.5">
                    <MapPin className="h-3 w-3 text-primary shrink-0" />
                    <span>{custCity ? `${[custCity, custState].filter(Boolean).join(", ")}${custPin ? ` - ${custPin}` : ""}` : "India"}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Ship To & Payment */}
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/15 p-4 flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 block mb-2">
                  SHIPPING & DELIVERY INFO
                </span>
                <p className="text-xs font-semibold text-foreground flex items-start gap-1.5 leading-relaxed">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{fullAddress || "Standard Delivery Address"}</span>
                </p>
                <div className="mt-3 pt-2.5 border-t border-amber-200/60 text-xs text-muted-foreground space-y-1">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="font-semibold text-foreground">{order.paymentMethod || "Online"} ({order.paymentStatus || "Paid"})</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Fulfillment Status:</span>
                    <span className="font-semibold text-foreground">{order.orderStatus || "Confirmed"}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Line Items Table */}
          <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-card shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-3.5 py-3 text-center w-12">#</th>
                    <th className="px-3.5 py-3 text-left">Item Description</th>
                    <th className="px-3.5 py-3 text-center w-24">HSN Code</th>
                    <th className="px-3.5 py-3 text-center w-16">Qty</th>
                    <th className="px-3.5 py-3 text-right w-28">Unit Price</th>
                    <th className="px-3.5 py-3 text-right w-28">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 dark:divide-amber-900/20">
                  {items.map((it, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-card" : "bg-amber-50/30 dark:bg-amber-950/5"}
                    >
                      <td className="px-3.5 py-3.5 text-center text-muted-foreground font-mono font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-3.5 py-3.5">
                        <div className="flex items-center gap-3">
                          {it.image && (
                            <img
                              src={it.image}
                              alt={it.name}
                              className="h-10 w-10 rounded-xl object-cover border border-amber-200/60 shrink-0 bg-muted"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-foreground leading-tight">{it.name}</p>
                            {(it.size || it.color) && (
                              <p className="text-[11px] font-semibold text-primary mt-1 flex items-center gap-1.5">
                                {[it.size ? `Size: ${it.size}` : "", it.color ? `Color: ${it.color}` : ""]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-3.5 text-center text-muted-foreground font-mono text-[11px]">
                        HSN-6111
                      </td>
                      <td className="px-3.5 py-3.5 text-center font-bold text-foreground text-sm">
                        {it.quantity || 1}
                      </td>
                      <td className="px-3.5 py-3.5 text-right text-muted-foreground whitespace-nowrap">
                        ₹{(it.price || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-3.5 py-3.5 text-right font-black text-primary whitespace-nowrap text-sm">
                        ₹{((it.price || 0) * (it.quantity || 1)).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Financial Totals & Customer Note Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Left: Customer Note Box */}
            <div className="md:col-span-7 rounded-2xl border border-amber-200/80 bg-amber-50/60 dark:bg-amber-950/20 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 font-black uppercase text-[11px] tracking-wider text-amber-800 dark:text-amber-300">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Customer Note & Care Promise</span>
              </div>
              <ul className="text-[11px] leading-relaxed space-y-1 text-muted-foreground">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>7-day hassle-free exchange on baby clothing with tags intact.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Crafted with 100% pure organic breathable cotton safe for newborn skin.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Need assistance? Contact support at <strong className="text-foreground">{info.phone}</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>This is a computer-generated tax invoice and requires no physical signature.</span>
                </li>
              </ul>
            </div>

            {/* Right: Calculations Summary */}
            <div className="md:col-span-5 rounded-2xl border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/15 p-4 space-y-2.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground whitespace-nowrap">
                  ₹{Number(subtotal).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Shipping Fee</span>
                <span className={`font-semibold whitespace-nowrap ${shippingFee === 0 ? "text-emerald-600 font-bold" : "text-foreground"}`}>
                  {shippingFee > 0 ? `₹${shippingFee.toLocaleString("en-IN")}` : "FREE"}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                  <span>Discount</span>
                  <span className="whitespace-nowrap">-₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-amber-800 dark:text-amber-400 font-semibold">
                <span>GST (5% Included)</span>
                <span className="whitespace-nowrap">₹{gstAmount.toLocaleString("en-IN")}</span>
              </div>

              {/* Grand Total Highlight Box */}
              <div className="pt-2 border-t border-amber-200/80">
                <div className="rounded-xl bg-orange-500/10 border border-orange-500/30 p-2.5 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    Grand Total
                  </span>
                  <span className="text-lg font-black text-primary whitespace-nowrap">
                    ₹{Number(grandTotal).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Signatory & Bottom Footer */}
          <div className="pt-5 border-t border-dashed border-amber-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground text-center sm:text-left gap-3">
              <p className="text-foreground font-medium">
                Thank you for choosing <span className="text-primary font-bold">{info.name}</span>! ❤️ Keep your little sunbeam smiling.
              </p>
              <div className="text-center sm:text-right shrink-0">
                <div className="w-40 border-b border-border/80 pb-1 mb-1 mx-auto sm:ml-auto">
                  <p className="font-bold text-foreground text-xs">Authorized Signatory</p>
                </div>
                <p className="text-[10px] text-muted-foreground">{info.name}</p>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground text-center pt-1">
              Computer generated invoice • No physical signature required
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
