import { useState, useEffect, useRef } from "react";
import { X, Eye, EyeOff, Mail, Lock, User, Phone, Leaf, AlertCircle, CheckCircle2, Loader2, ArrowLeft, KeyRound, RefreshCw } from "lucide-react";
import { useShop } from "@/context/ShopContext.jsx";
import { API_BASE_URL, PHONE_VALIDATION_ERROR, handlePhoneKeyDown, handlePhonePaste, sanitizePhoneNumber, isValidPhoneNumber, safeParseJson } from "@/lib/utils.js";

export default function AuthModal({ open, onClose }) {
  const { loginCustomer, registerCustomer, authNotice, setAuthNotice } = useShop();
  // "login" | "register" | "forgot" | "verify-otp" | "reset-password"
  const [mode, setMode] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Resend OTP cooldown (60 seconds)
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const startCooldown = () => {
    setResendCooldown(60);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clear timer on unmount
  useEffect(() => () => clearInterval(cooldownRef.current), []);

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

  // Switch to a mode and reset messages
  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setSuccessMsg("");
  };

  // Handle Login / Register
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
        if (!form.name || !form.email || !form.phone || !form.password) {
          throw new Error("Please fill in all required fields");
        }
        if (!isValidPhoneNumber(form.phone)) {
          throw new Error(PHONE_VALIDATION_ERROR);
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

  // Handle Forgot Password - Send OTP
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const input = forgotEmail.trim();
      if (!input) {
        throw new Error("Please enter your registered email address");
      }

      // Email-only validation
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      if (!isEmail) {
        throw new Error("Please enter a valid email address");
      }

      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: input }),
      });
      const data = await safeParseJson(res);

      if (!res.ok) {
        // Handle cooldown error from server
        if (res.status === 429 && data.retryAfter) {
          setResendCooldown(data.retryAfter);
          clearInterval(cooldownRef.current);
          cooldownRef.current = setInterval(() => {
            setResendCooldown((prev) => {
              if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
              return prev - 1;
            });
          }, 1000);
        }
        throw new Error(data.message || "Failed to send OTP");
      }

      // Store the resolved email for subsequent steps
      if (data.data?.email) {
        setForgotEmail(data.data.email);
      }

      startCooldown();
      setOtp("");
      setSuccessMsg(data.message || "OTP sent! Check your email inbox.");
      setMode("verify-otp");
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP from verify-otp screen
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await safeParseJson(res);
      if (!res.ok) {
        if (res.status === 429 && data.retryAfter) {
          setResendCooldown(data.retryAfter);
          clearInterval(cooldownRef.current);
          cooldownRef.current = setInterval(() => {
            setResendCooldown((prev) => {
              if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
              return prev - 1;
            });
          }, 1000);
        }
        throw new Error(data.message || "Failed to resend OTP");
      }
      setOtp("");
      startCooldown();
      setSuccessMsg("New OTP sent! Check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (!otp || otp.length !== 6) {
        throw new Error("Please enter the 6-digit OTP");
      }

      const res = await fetch(`${API_BASE_URL}/auth/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.toLowerCase().trim(), otp }),
      });
      const data = await safeParseJson(res);

      if (!res.ok) {
        throw new Error(data.message || "Invalid OTP. Please try again.");
      }

      setResetToken(data.data.resetToken);
      setSuccessMsg(data.message || "OTP verified! Set your new password.");
      setMode("reset-password");
    } catch (err) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }
      if (newPassword !== confirmNewPassword) {
        throw new Error("Passwords do not match");
      }

      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.toLowerCase().trim(),
          resetToken,
          password: newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });
      const data = await safeParseJson(res);

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      // Auto-login with new credentials if token returned
      if (data.data?.token && data.data?.user) {
        try {
          await loginCustomer(forgotEmail, newPassword);
        } catch {
          // Auto-login failed — user can sign in manually
        }
      }

      setSuccessMsg("Password reset successful! Signing you in...");

      setTimeout(() => {
        setForgotEmail("");
        setOtp("");
        setResetToken("");
        setNewPassword("");
        setConfirmNewPassword("");
        setMode("login");
        setSuccessMsg("");
        setLoading(false);
        if (setAuthNotice) setAuthNotice("");
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
      setLoading(false);
    }
  };

  if (!open) return null;

  const titles = {
    login: "Customer Sign In",
    register: "Create Customer Account",
    forgot: "Forgot Password",
    "verify-otp": "Verify OTP",
    "reset-password": "Set New Password",
  };

  const subtitles = {
    login: "Sign in to track baby orders, wishlist & receive special offers.",
    register: "Join Little Sunbeam to enjoy effortless baby shopping.",
    forgot: "Enter your registered email address to receive an OTP.",
    "verify-otp": "Enter the 6-digit code sent to your email. Valid for 5 minutes.",
    "reset-password": "Create a strong new password for your account.",
  };

  const isForgotFlow = ["forgot", "verify-otp", "reset-password"].includes(mode);

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
            {isForgotFlow ? (
              <KeyRound className="h-6 w-6 text-primary" />
            ) : (
              <Leaf className="h-6 w-6 text-primary" />
            )}
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {titles[mode]}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {subtitles[mode]}
          </p>
        </div>

        {/* Auth Notice Alert */}
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

        {/* ─── LOGIN / REGISTER FORM ─── */}
        {(mode === "login" || mode === "register") && (
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
                    placeholder="Phone Number (10 digits)"
                    value={form.phone}
                    onKeyDown={handlePhoneKeyDown}
                    onPaste={(e) => {
                      handlePhonePaste(e, (val) => {
                        setForm((f) => ({ ...f, phone: val }));
                        if (error) setError("");
                      });
                    }}
                    onChange={(e) => {
                      const val = sanitizePhoneNumber(e.target.value);
                      setForm((f) => ({ ...f, phone: val }));
                      if (error) setError("");
                    }}
                    required
                    maxLength={10}
                    inputMode="numeric"
                    autoComplete="tel"
                    pattern="[0-9]{10}"
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

            {/* Forgot password link (only on login) */}
            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(form.email);
                    switchMode("forgot");
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot Password?
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
        )}

        {/* ─── FORGOT PASSWORD FORM ─── */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-3.5">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="Enter your registered email address"
                value={forgotEmail}
                onChange={(e) => { setForgotEmail(e.target.value); if (error) setError(""); }}
                required
                disabled={loading}
                autoComplete="email"
                className="w-full rounded-2xl border border-border bg-muted/40 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || resendCooldown > 0}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 shadow-md hover:shadow-lg active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending OTP...</span>
                </>
              ) : resendCooldown > 0 ? (
                `Wait ${resendCooldown}s before retrying`
              ) : (
                "Send OTP"
              )}
            </button>
          </form>
        )}

        {/* ─── VERIFY OTP FORM ─── */}
        {mode === "verify-otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-3.5">
            <p className="text-xs text-muted-foreground text-center -mt-2 mb-1">
              OTP sent to <strong className="text-foreground">{forgotEmail}</strong>
            </p>

            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); if (error) setError(""); }}
                required
                disabled={loading}
                autoFocus
                className="w-full rounded-2xl border border-border bg-muted/40 py-2.5 pl-10 pr-4 text-sm font-mono tracking-[0.3em] text-center outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 shadow-md hover:shadow-lg active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                "Verify OTP"
              )}
            </button>

            {/* Resend OTP with cooldown */}
            <p className="text-center text-xs text-muted-foreground">
              Didn't receive the code?{" "}
              {resendCooldown > 0 ? (
                <span className="font-semibold text-muted-foreground">
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="inline-flex items-center gap-1 font-bold text-primary hover:underline disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  Resend OTP
                </button>
              )}
            </p>
          </form>
        )}

        {/* ─── RESET PASSWORD FORM ─── */}
        {mode === "reset-password" && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="New Password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); if (error) setError(""); }}
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

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showConfirmPass ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmNewPassword}
                onChange={(e) => { setConfirmNewPassword(e.target.value); if (error) setError(""); }}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 shadow-md hover:shadow-lg active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

        {/* Toggle mode / Back buttons */}
        <div className="mt-5 text-center text-xs text-muted-foreground">
          {isForgotFlow ? (
            <button
              type="button"
              onClick={() => {
                switchMode("login");
                setForgotEmail("");
                setOtp("");
                setResetToken("");
                setNewPassword("");
                setConfirmNewPassword("");
                setResendCooldown(0);
                clearInterval(cooldownRef.current);
              }}
              className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Sign In
            </button>
          ) : (
            <p>
              {mode === "login" ? "Don't have a customer account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
                className="font-bold text-primary hover:underline ml-1"
              >
                {mode === "login" ? "Sign up now" : "Sign in here"}
              </button>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
