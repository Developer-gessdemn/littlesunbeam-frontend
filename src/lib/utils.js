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
  const raw = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").trim();
  const cleaned = raw.replace(/\/+$/, "");
  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
}

export const API_BASE_URL = getApiBaseUrl();
const resolvedMediaCache = new Map();

export async function resolveInstagramVideoUrl(url) {
  if (!url || typeof url !== "string") return { resolvedVideoUrl: null, isFallbackNeeded: false };
  const cleanUrl = url.trim();

  if (!isInstagramUrl(cleanUrl)) {
    return { resolvedVideoUrl: cleanUrl, isFallbackNeeded: false };
  }

  if (resolvedMediaCache.has(cleanUrl)) {
    return resolvedMediaCache.get(cleanUrl);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/upload/resolve-instagram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: cleanUrl }),
    });

    if (res.ok) {
      const data = await res.json();
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



