import { Capacitor } from "@capacitor/core";

const PRODUCTION_API_BASE_URL = "https://finanzas-gestion.vercel.app";
const WEB_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function apiUrl(path) {
  if (isNativeApp()) {
    return `${PRODUCTION_API_BASE_URL}${path}`;
  }

  return WEB_API_BASE_URL ? `${WEB_API_BASE_URL}${path}` : path;
}

export function applyPlatformClass() {
  document.documentElement.classList.toggle("native-app", isNativeApp());
}
