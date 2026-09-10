import { useState, useEffect } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Search,
  AlertCircle,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Building2,
  Navigation,
} from "lucide-react";
import { adminService } from "@/lib/adminService";
import { toast } from "sonner";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Track Your Order — Little Sunbeam Baby Clothing" },
      {
        name: "description",
        content:
          "Track your Little Sunbeam order in real time using your Order ID and Mobile Number or Email. View courier details, tracking numbers, and delivery timeline.",
      },
    ],
  }),
  validateSearch: (search) => ({
    orderNumber: typeof search.orderNumber === "string" ? search.orderNumber : "",
    contact: typeof search.contact === "string" ? search.contact : "",
  }),
  component: TrackOrderPage,
});

function TrackOrderPage() {
  const searchParams = useSearch({ from: "/track-order" });
  const [orderNumberInput, setOrderNumberInput] = useState(searchParams.orderNumber || "");
  const [contactInput, setContactInput] = useState(searchParams.contact || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [copiedAWB, setCopiedAWB] = useState(false);

  // Auto-search if query params are present in URL
  useEffect(() => {
    if (searchParams.orderNumber && searchParams.contact) {
      performTracking(searchParams.orderNumber, searchParams.contact);
    }
  }, [searchParams.orderNumber, searchParams.contact]);

  const performTracking = async (ordNum, contactVal) => {
    const cleanOrd = (ordNum || "").trim();
    const cleanCont = (contactVal || "").trim();

    if (!cleanOrd || !cleanCont) {
      setError("Please provide both your Order ID and Registered Mobile Number or Email.");
      return;
    }

    setLoading(true);
    setError("");
    setOrderData(null);

    try {
      const res = await adminService.trackOrderPublic({
        orderNumber: cleanOrd,
        contact: cleanCont,
      });

      if (res?.order) {
        setOrderData(res.order);
      } else {
        setError("No tracking information found for this order.");
      }
    } catch (err) {
      setError(
        err.message ||
          "Could not find matching order details. Please check your Order ID and Contact information."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performTracking(orderNumberInput, contactInput);
  };

  const handleCopyAWB = (awb) => {
    if (!awb) return;
    navigator.clipboard.writeText(awb);
    setCopiedAWB(true);
    toast.success("Tracking number copied to clipboard!");
    setTimeout(() => setCopiedAWB(false), 2000);
  };

  // Stepper milestones list
  const steps = [
    { key: "Placed", label: "Order Placed", icon: ShoppingBag },
    { key: "Confirmed", label: "Confirmed", icon: CheckCircle2 },
    { key: "Packed", label: "Packed", icon: Package },
    { key: "Shipped", label: "Shipped", icon: Truck },
    { key: "Out for Delivery", label: "Out for Delivery", icon: Navigation },
    { key: "Delivered", label: "Delivered", icon: Sparkles },
  ];

  const getStepProgressIndex = (status) => {
    switch (status) {
      case "Pending":
        return 0;
      case "Confirmed":
      case "Processing":
        return 1;
      case "Packed":
        return 2;
      case "Shipped":
        return 3;
      case "Out for Delivery":
        return 4;
      case "Delivered":
        return 5;
      case "Cancelled":
        return -1;
      default:
        return 1;
    }
  };

  const currentStepIndex = orderData ? getStepProgressIndex(orderData.orderStatus) : 0;
  const isCancelled = orderData?.orderStatus === "Cancelled";

  return (
    <div className="min-h-screen bg-linear-to-b from-[#FFFDF9] via-[#FAF5EE] to-[#F5EFE6] py-8 sm:py-14 font-sans selection:bg-amber-100 selection:text-amber-900">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-black uppercase tracking-wider mb-4 shadow-2xs">
            <Truck className="h-3.5 w-3.5 text-amber-700 animate-bounce" />
            <span>Live Courier & Order Tracking</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
            Track Your <span className="text-primary">Little Sunbeam</span> Package
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Enter your Order Number and Registered Email or Phone number to view live courier status, AWB tracking, and expected delivery timeline.
          </p>
        </div>

        {/* Tracking Input Card */}
        <div className="bg-card/90 backdrop-blur-md border border-amber-200/60 rounded-3xl p-6 sm:p-8 shadow-xl shadow-amber-950/5 mb-10">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="track-order-id"
                  className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-2"
                >
                  Order ID / Number <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Package className="h-4 w-4 text-amber-600" />
                  </div>
                  <input
                    id="track-order-id"
                    type="text"
                    required
                    placeholder="e.g. ORD-94281"
                    value={orderNumberInput}
                    onChange={(e) => setOrderNumberInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-primary transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="track-contact"
                  className="block text-xs font-black uppercase tracking-wider text-muted-foreground mb-2"
                >
                  Registered Mobile or Email <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="h-4 w-4 text-amber-600" />
                  </div>
                  <input
                    id="track-contact"
                    type="text"
                    required
                    placeholder="e.g. 9876543210 or name@example.com"
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-primary transition"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Encrypted & secure order verification</span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider shadow-md hover:bg-primary/95 transition active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Searching Order...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Track Order</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3 text-destructive animate-in fade-in duration-200">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">Tracking Lookup Failed</h4>
                <p className="text-xs mt-0.5 leading-relaxed font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* ORDER DETAILS & TRACKING VIEW */}
        {orderData && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Top Summary Banner */}
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Order ID
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-foreground font-mono">
                      {orderData.orderNumber}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>
                      Placed on {new Date(orderData.createdAt).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      Total Amount
                    </span>
                    <span className="text-lg font-black text-primary">
                      ₹{orderData.totalAmount}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black uppercase tracking-wider">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
                    </span>
                    <span>{orderData.orderStatus}</span>
                  </div>
                </div>
              </div>

              {/* Multi-Step Visual Progress Tracker */}
              {!isCancelled ? (
                <div className="mt-8 pt-2">
                  <div className="relative">
                    {/* Desktop Step Bar */}
                    <div className="hidden sm:grid grid-cols-6 gap-2 text-center relative z-10">
                      {steps.map((step, idx) => {
                        const isCompleted = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        const StepIcon = step.icon;

                        return (
                          <div key={step.key} className="flex flex-col items-center group">
                            <div
                              className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-300 shadow-sm ${
                                isCurrent
                                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110"
                                  : isCompleted
                                  ? "bg-emerald-500 text-white"
                                  : "bg-muted text-muted-foreground border border-border"
                              }`}
                            >
                              {isCompleted && !isCurrent ? (
                                <Check className="h-5 w-5 stroke-3" />
                              ) : (
                                <StepIcon className="h-5 w-5" />
                              )}
                            </div>
                            <span
                              className={`mt-2.5 text-xs font-bold leading-tight ${
                                isCurrent
                                  ? "text-primary font-black"
                                  : isCompleted
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Progress Connecting Line (Desktop) */}
                    <div className="hidden sm:block absolute top-5.5 left-10 right-10 h-1 bg-muted rounded-full -z-0">
                      <div
                        className="h-full bg-linear-to-r from-emerald-500 via-primary to-amber-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, (currentStepIndex / 5) * 100))}%`,
                        }}
                      />
                    </div>

                    {/* Mobile Stepper (Stacked cards) */}
                    <div className="sm:hidden grid grid-cols-3 gap-2">
                      {steps.map((step, idx) => {
                        const isCompleted = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        const StepIcon = step.icon;

                        return (
                          <div
                            key={step.key}
                            className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center ${
                              isCurrent
                                ? "bg-primary/10 border-primary text-primary font-black shadow-xs"
                                : isCompleted
                                ? "bg-emerald-50/50 border-emerald-200 text-emerald-800"
                                : "bg-muted/30 border-border/50 text-muted-foreground opacity-60"
                            }`}
                          >
                            <StepIcon className="h-4 w-4 mb-1" />
                            <span className="text-[10px] font-bold leading-tight line-clamp-1">
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-center text-destructive">
                  <p className="text-xs font-black uppercase tracking-wider">
                    This order has been cancelled
                  </p>
                </div>
              )}
            </div>

            {/* Courier & Delivery Highlight Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Courier Partner Card */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-amber-600" />
                      Courier Partner
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                      Express
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-black text-foreground">
                    {orderData.courierName || "Standard Dispatch Partner"}
                  </h3>
                  
                  {orderData.shippingDate && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Shipped:{" "}
                      <strong className="text-foreground">
                        {new Date(orderData.shippingDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </strong>
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Carrier Status</span>
                    <span className="font-bold text-foreground">
                      {orderData.orderStatus === "Delivered" ? "Delivered" : "In Transit"}
                    </span>
                  </div>
                </div>
              </div>

              {/* AWB / Tracking ID Card */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-amber-600" />
                      AWB / Tracking Number
                    </span>
                  </div>

                  {orderData.trackingNumber ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/60 border border-border">
                        <span className="font-mono font-black text-sm text-foreground tracking-wider select-all">
                          {orderData.trackingNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAWB(orderData.trackingNumber)}
                          className="p-1.5 rounded-xl hover:bg-background text-muted-foreground hover:text-foreground transition cursor-pointer"
                          title="Copy AWB Number"
                        >
                          {copiedAWB ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {orderData.trackingUrl && (
                        <a
                          href={orderData.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 font-extrabold text-xs transition uppercase tracking-wider"
                        >
                          <span>Open Courier Tracking Page</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-muted/30 border border-dashed border-border text-center">
                      <p className="text-xs text-muted-foreground">
                        Tracking number will be assigned once dispatched by courier.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Direct Sync</span>
                  <span className="font-bold text-emerald-600">Active</span>
                </div>
              </div>

              {/* Estimated Delivery Date Card */}
              <div className="bg-linear-to-br from-amber-500/10 via-amber-100/30 to-amber-500/5 border border-amber-200 rounded-3xl p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-700" />
                      Expected Delivery
                    </span>
                    <span className="text-xs">✨</span>
                  </div>

                  <h3 className="text-2xl font-black text-amber-950">
                    {orderData.expectedDeliveryDate ? (
                      new Date(orderData.expectedDeliveryDate).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })
                    ) : (
                      "3 - 5 Business Days"
                    )}
                  </h3>

                  <p className="text-xs text-amber-900/80 mt-2 leading-relaxed">
                    {orderData.orderStatus === "Delivered"
                      ? "Parcel has been successfully handed over to you."
                      : "Direct door-step delivery via certified courier executive."}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-amber-200/60 flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Destination Hub</span>
                  <span>{orderData.shippingAddress?.city || "Destination City"}</span>
                </div>
              </div>
            </div>

            {/* Complete Chronological Tracking Timeline */}
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                <div>
                  <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-primary" />
                    Tracking Activity &amp; Checkpoints
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Real-time timeline of your package journey from Tiruppur to your doorstep
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground">
                  {orderData.trackingHistory?.length || 1} update(s)
                </span>
              </div>

              {orderData.trackingHistory && orderData.trackingHistory.length > 0 ? (
                <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:inset-y-2 before:left-2.5 sm:before:left-3.5 before:w-0.5 before:bg-linear-to-b before:from-primary before:via-amber-300 before:to-muted">
                  {orderData.trackingHistory.map((item, idx) => (
                    <div key={item._id || idx} className="relative group">
                      {/* Timeline Node Point */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-1 h-5 w-5 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-xs font-black ring-4 ring-card ${
                          idx === 0
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {idx === 0 ? "📍" : "✓"}
                      </div>

                      {/* Content Card */}
                      <div className="bg-muted/30 hover:bg-muted/50 transition border border-border/70 rounded-2xl p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900">
                              {item.status || "In Transit"}
                            </span>
                            {item.location && (
                              <span className="text-xs font-bold text-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-primary shrink-0" />
                                {item.location}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-bold text-muted-foreground">
                            {item.date && <span>{item.date}</span>}
                            {item.time && <span> · {item.time}</span>}
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/20 rounded-2xl border border-dashed border-border">
                  <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-foreground">
                    Order confirmed and queued for fulfillment.
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Live transit checkpoints will appear here once the courier partner performs the first facility scan.
                  </p>
                </div>
              )}
            </div>

            {/* Purchased Items & Shipping Address Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Items List */}
              <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-md">
                <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-4">
                  Items in this Shipment ({orderData.items?.length || 0})
                </h3>

                <div className="divide-y divide-border/60">
                  {orderData.items?.map((item, idx) => (
                    <div key={idx} className="py-3.5 first:pt-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-14 w-14 rounded-2xl object-cover border border-border shrink-0 bg-muted"
                          onError={(e) => {
                            e.currentTarget.src = "/favicon.png";
                          }}
                        />
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Qty: <span className="font-bold text-foreground">{item.quantity}</span>
                            {item.selectedSize && <span> · Size: {item.selectedSize}</span>}
                            {item.selectedColor && <span> · Color: {item.selectedColor}</span>}
                          </p>
                        </div>
                      </div>

                      <span className="font-black text-sm text-foreground shrink-0">
                        ₹{(item.price || 0) * (item.quantity || 1)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground">Order Total (Paid/Payable):</span>
                  <span className="font-black text-base text-primary">₹{orderData.totalAmount}</span>
                </div>
              </div>

              {/* Delivery Destination & Support Card */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-md flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-3">
                    Delivery Destination
                  </h3>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs leading-relaxed space-y-1">
                    <p className="font-bold text-foreground text-sm">
                      {orderData.shippingAddress?.name || "Valued Customer"}
                    </p>
                    <p className="text-muted-foreground">
                      {orderData.shippingAddress?.city}
                      {orderData.shippingAddress?.state ? `, ${orderData.shippingAddress.state}` : ""} -{" "}
                      <span className="font-mono font-bold text-foreground">
                        {orderData.shippingAddress?.pincode}
                      </span>
                    </p>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">
                      Need Help With Delivery?
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                      Our Tiruppur customer care team is here to assist with address changes, delivery rescheduling, or tracking questions.
                    </p>

                    <div className="space-y-2">
                      <a
                        href="https://wa.me/919361503943?text=Hi%20Little%20Sunbeam,%20I%20need%20help%20tracking%20my%20order"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Chat on WhatsApp</span>
                      </a>

                      <a
                        href="tel:+919361503943"
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border border-border hover:bg-muted font-bold text-xs text-foreground transition"
                      >
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Call +91 93615 03943</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border text-center">
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
                  >
                    <span>Continue Shopping</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
