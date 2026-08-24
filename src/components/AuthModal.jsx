import { useState } from "react";
import { X, Eye, EyeOff, Mail, Lock, User, Phone, Leaf, AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useShop } from "@/context/ShopContext.jsx";

export default function AuthModal({ open, onClose }) {
  const { loginCustomer, registerCustomer, authNotice, setAuthNotice } = useShop();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleClose = () => {
    if (setAuthNotice) setAuthNotice("");
    onClose();
  };

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (mode === "login") {
        if (!form.email || !form.password) {
          throw new Error("Please enter both email and password");
        }
        await loginCustomer(form.email, form.password);
        setSuccessMsg("Welcome back! Signed in successfully.");
      } else {
        if (!form.name || !form.email || !form.password) {
          throw new Error("Please fill in all required fields");
        }
        if (form.password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }
        if (form.password !== form.confirmPassword) {
          throw new Error("Passwords do not match");
        }
        await registerCustomer({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          confirmPassword: form.confirmPassword,
        });
        setSuccessMsg("Account created! Welcome to Little Sunbeam.");
      }

      setTimeout(() => {
        setLoading(false);
        setSuccessMsg("");
        if (setAuthNotice) setAuthNotice("");
        onClose();
      }, 1000);
    } catch (err) {
      setLoading(false);
      setError(err.message || "An error occurred during authentication");
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-background p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand mark */}
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sun/15 border border-sun/30 text-sun-foreground">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {mode === "login" ? "Customer Sign In" : "Create Customer Account"}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to track baby orders, wishlist & receive special offers."
              : "Join Little Sunbeam to enjoy effortless baby shopping."}
          </p>
        </div>

        {/* Auth Notice Alert (e.g. "Please login to continue.") */}
        {authNotice && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 p-3 text-xs font-bold text-amber-900 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{authNotice}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "register" && (
            <>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={update("name")}
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border border-border bg-muted/40 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition disabled:opacity-50"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="Phone Number (e.g. +91 98765 12345)"
                  value={form.phone}
                  onChange={update("phone")}
                  disabled={loading}
                  className="w-full rounded-2xl border border-border bg-muted/40 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition disabled:opacity-50"
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={update("email")}
              required
              disabled={loading}
              className="w-full rounded-2xl border border-border bg-muted/40 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition disabled:opacity-50"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password (min. 6 characters)"
              value={form.password}
              onChange={update("password")}
              required
              disabled={loading}
              className="w-full rounded-2xl border border-border bg-muted/40 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle password visibility"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {mode === "register" && (
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showConfirmPass ? "text" : "password"}
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                required
                disabled={loading}
                className="w-full rounded-2xl border border-border bg-muted/40 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 shadow-md hover:shadow-lg active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Please wait...</span>
              </>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="mt-5 text-center text-xs text-muted-foreground">
          {mode === "login" ? "Don't have a customer account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
              setSuccessMsg("");
            }}
            className="font-bold text-primary hover:underline ml-1"
          >
            {mode === "login" ? "Sign up now" : "Sign in here"}
          </button>
        </p>
      </div>
    </>
  );
}
