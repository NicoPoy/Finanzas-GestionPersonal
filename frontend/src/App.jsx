import React, { Suspense, useEffect, useState } from "react";
import LoginScreen from "./components/auth/LoginScreen.jsx";
import { apiUrl } from "./services/platform.js";
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  getTokenExpirationMs,
  isTokenExpired,
  storeAccessToken,
} from "./services/session.js";
import "./styles/base.css";
import "./styles/components.css";

const FinanceApp = React.lazy(() => import("./features/finance/FinanceApp.jsx"));

// App decide si mostrar login o la aplicacion autenticada.
// En esta app solo se utiliza el "dark mode".
export default function App() {
  const [accessToken, setAccessToken] = useState(() => getStoredAccessToken());
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(accessToken));
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    window.localStorage.setItem("finanzas-theme", "dark");
  }, []);

  function toggleTheme() {
    // Solo se utiliza el modo oscuro (no-op)
  }

  function closeSession() {
    clearStoredAccessToken();
    localStorage.removeItem("last-activity");
    setAccessToken("");
    setIsDemoMode(false);
    setIsCheckingSession(false);
  }

  useEffect(() => {
    if (!accessToken) {
      setIsCheckingSession(false);
      return;
    }

    if (isTokenExpired(accessToken)) {
      closeSession();
      return;
    }

    async function verifySession() {
      try {
        const response = await fetch(apiUrl("/api/auth/me"), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Sesion invalida");
        }

        await response.json();
        setTheme("dark");
      } catch {
        closeSession();
      } finally {
        setIsCheckingSession(false);
      }
    }

    verifySession();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const expirationMs = getTokenExpirationMs(accessToken);

    if (!expirationMs) {
      closeSession();
      return;
    }

    const remainingMs = expirationMs - Date.now();

    if (remainingMs <= 0) {
      closeSession();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      closeSession();
    }, remainingMs);

    return () => window.clearTimeout(timeoutId);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken && !isDemoMode) {
      return;
    }

    const INACTIVITY_LIMIT = 4 * 60 * 60 * 1000; // 4 hours in ms

    // Check inactivity on mount/change
    const lastActivity = localStorage.getItem("last-activity");
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed >= INACTIVITY_LIMIT) {
        closeSession();
        return;
      }
    } else {
      localStorage.setItem("last-activity", String(Date.now()));
    }

    let lastSaved = Date.now();
    const updateActivity = () => {
      const now = Date.now();
      if (now - lastSaved > 5000) {
        localStorage.setItem("last-activity", String(now));
        lastSaved = now;
      }
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    const intervalId = window.setInterval(() => {
      const last = localStorage.getItem("last-activity");
      if (last) {
        const elapsed = Date.now() - parseInt(last, 10);
        if (elapsed >= INACTIVITY_LIMIT) {
          closeSession();
        }
      }
    }, 30000); // Check every 30 seconds

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      window.clearInterval(intervalId);
    };
  }, [accessToken, isDemoMode]);

  async function handleLogin(credentials) {
    const response = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorMessage = await getApiErrorMessage(response);
      throw new Error(errorMessage);
    }

    const session = await response.json();
    storeAccessToken(session.access_token);
    setIsDemoMode(false);
    setTheme("dark");
    window.history.replaceState({}, "", "/finanzas");
    localStorage.setItem("last-activity", String(Date.now()));
    setAccessToken(session.access_token);
  }

  function handleStartDemo() {
    clearStoredAccessToken();
    setAccessToken("");
    setIsDemoMode(true);
    setIsCheckingSession(false);
    localStorage.setItem("last-activity", String(Date.now()));
    window.history.replaceState({}, "", "/finanzas");
  }

  function handleLogout() {
    closeSession();
  }

  if (!accessToken && !isDemoMode) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onStartDemo={handleStartDemo}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (isCheckingSession) {
    return (
      <main className="app-shell">
        <section className="loading-screen">
          <strong>Verificando sesion...</strong>
        </section>
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="app-shell">
          <section className="loading-screen">
            <strong>Cargando interfaz...</strong>
          </section>
        </main>
      }
    >
      <FinanceApp
        accessToken={accessToken}
        isDemoMode={isDemoMode}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </Suspense>
  );
}

async function getApiErrorMessage(response) {
  try {
    const payload = await response.json();

    if (payload.detail) {
      return payload.detail;
    }
  } catch {
    // Si la API no devuelve JSON, usamos un mensaje generico por status.
  }

  if (response.status === 401) {
    return "Email o password incorrectos.";
  }

  return "No se pudo iniciar sesion. Revisa la configuracion del backend.";
}
