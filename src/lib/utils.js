import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function isInstagramUrl(url) {
  if (!url || typeof url !== "string") return false;
  const str = url.toLowerCase().trim();
  return str.includes("instagram.com/") || str.includes("instagr.am/");
}

export function getInstagramEmbedUrl(url) {
  if (!url || typeof url !== "string") return "";
  const match = url.match(/instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i) ||
                url.match(/instagr\.am\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (match && match[1]) {
    return `https://www.instagram.com/p/${match[1]}/embed/?autoplay=1`;
  }
  const clean = url.split("?")[0].replace(/\/+$/, "");
  return `${clean}/embed/?autoplay=1`;
}

export function getApiBaseUrl() {
  const raw = (import.meta.env.VITE_API_URL || "http://localhost:3046/api").trim();
  const cleaned = raw.replace(/\/+$/, "");
  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
}

export const API_BASE_URL = getApiBaseUrl();
const resolvedMediaCache = new Map();

/**
 * Safely parse a Fetch Response as JSON.
 * Prevents `Unexpected token '<', "<html>" is not valid JSON` when a proxy/server
 * returns an HTML error page (e.g., Nginx 502 Bad Gateway, 504 Timeout, or 404).
 */
export async function safeParseJson(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const status = res?.status || 500;
    if (status === 502 || status === 503 || status === 504) {
      throw new Error(`Server is temporarily unavailable (HTTP ${status}). Please try again in a moment.`);
    }
    throw new Error(`Unexpected server response (HTTP ${status}). Please try again.`);
  }
}

export async function resolveInstagramVideoUrl(url) {
  if (!url || typeof url !== "string") return { resolvedVideoUrl: null, isFallbackNeeded: false };
  const cleanUrl = url.trim();

  if (!isInstagramUrl(cleanUrl)) {
    return { resolvedVideoUrl: cleanUrl, isFallbackNeeded: false };
  }

  if (resolvedMediaCache.has(cleanUrl)) {
    return resolvedMediaCache.get(cleanUrl);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(`${API_BASE_URL}/upload/resolve-instagram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: cleanUrl }),
      signal: controller.signal,
    });

    if (res.ok) {
      const data = await safeParseJson(res);
      if (data.success && data.data?.resolvedVideoUrl) {
        const result = {
          resolvedVideoUrl: data.data.resolvedVideoUrl,
          thumbnailUrl: data.data.thumbnailUrl || null,
          isFallbackNeeded: false,
          source: data.data.source || "resolved",
        };
        resolvedMediaCache.set(cleanUrl, result);
        return result;
      }
      // Success=false but we have a thumbnailUrl for a pretty fallback
      if (!data.success && data.data?.thumbnailUrl) {
        const result = {
          resolvedVideoUrl: null,
          thumbnailUrl: data.data.thumbnailUrl,
          isFallbackNeeded: true,
          message: data.message || "Instagram video could not be resolved.",
          source: data.data.source || "thumbnail-only",
        };
        resolvedMediaCache.set(cleanUrl, result);
        return result;
      }
    }
  } catch (err) {
    console.warn("[Instagram Resolver Client Error]:", err.message);
  } finally {
    clearTimeout(timer);
  }

  const fallbackResult = {
    resolvedVideoUrl: null,
    thumbnailUrl: null,
    isFallbackNeeded: true,
    message: "Instagram video cannot be autoplayed. Please upload the video file directly.",
  };
  resolvedMediaCache.set(cleanUrl, fallbackResult);
  return fallbackResult;
}

/**
 * Standard Phone Number Validation & Sanitization Helpers
 */
export const PHONE_VALIDATION_ERROR = "Please enter a valid 10-digit mobile number.";

export function sanitizePhoneNumber(value) {
  if (!value) return "";
  return String(value).replace(/\D/g, "").slice(0, 10);
}

export function isValidPhoneNumber(value) {
  if (!value || typeof value !== "string") return false;
  return /^\d{10}$/.test(value.trim());
}

export function handlePhoneKeyDown(e) {
  // Allow control/action keys: Backspace, Tab, Enter, Escape, Arrow keys, Delete, Home, End
  if (
    [
      "Backspace",
      "Tab",
      "Enter",
      "Escape",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Delete",
      "Home",
      "End",
    ].includes(e.key) ||
    // Allow keyboard shortcuts (Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Cmd+A, etc.)
    e.ctrlKey ||
    e.metaKey
  ) {
    return;
  }

  // Block any non-digit character (alphabets, symbols, spaces, etc.)
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
}

export function handlePhonePaste(e, onUpdate) {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData)?.getData("text") || "";
  const cleaned = sanitizePhoneNumber(text);
  if (onUpdate) {
    onUpdate(cleaned);
  }
  return cleaned;
}




