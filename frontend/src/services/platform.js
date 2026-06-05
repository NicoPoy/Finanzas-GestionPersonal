import { Capacitor } from "@capacitor/core";

const PRODUCTION_API_BASE_URL = "https://finanzas-gestion.vercel.app";

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function apiUrl(path) {
  return isNativeApp() ? `${PRODUCTION_API_BASE_URL}${path}` : path;
}

export function applyPlatformClass() {
  document.documentElement.classList.toggle("native-app", isNativeApp());
}
