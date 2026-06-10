const ACCESS_TOKEN_KEY = "finanzas_access_token";

function decodeTokenPayload(token) {
  try {
    const payloadSegment = token.split(".")[1];

    if (!payloadSegment) {
      return null;
    }

    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function getTokenExpirationMs(token) {
  const payload = decodeTokenPayload(token);
  const expiresAt = Number(payload?.exp);

  if (!Number.isFinite(expiresAt) || expiresAt <= 0) {
    return null;
  }

  return expiresAt * 1000;
}

export function isTokenExpired(token, nowMs = Date.now()) {
  const expiresAtMs = getTokenExpirationMs(token);

  if (!expiresAtMs) {
    return true;
  }

  return nowMs >= expiresAtMs;
}

export function getStoredAccessToken() {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!token || isTokenExpired(token)) {
    clearStoredAccessToken();
    return "";
  }

  return token;
}

export function storeAccessToken(token) {
  if (!token || isTokenExpired(token)) {
    clearStoredAccessToken();
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearStoredAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}
