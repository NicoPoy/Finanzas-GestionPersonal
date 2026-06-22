import React, { useEffect, useState } from "react";
import LoginScreen from "./components/auth/LoginScreen.jsx";
import FinanceApp from "./features/finance/FinanceApp.jsx";
import HomeScreen from "./features/home/HomeScreen.jsx";
import NotesModule from "./features/notes/NotesModule.jsx";
import { apiUrl } from "./services/platform.js";
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  getTokenExpirationMs,
  isTokenExpired,
  storeAccessToken,
} from "./services/session.js";
import "./styles.css";

// App decide si mostrar login, home o cada modulo autenticado.
// El token queda en localStorage y expira a las 24 horas.
export default function App() {
  const [accessToken, setAccessToken] = useState(() => getStoredAccessToken());
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(accessToken));
  const [activeSection, setActiveSection] = useState("home");
  const [theme, setTheme] = useState(() => {
    const storedTheme = window.localStorage.getItem("finanzas-theme");

    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }

    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("finanzas-theme", theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);

    if (accessToken) {
      saveThemePreference(accessToken, nextTheme);
    }
  }

  function closeSession() {
    clearStoredAccessToken();
    setAccessToken("");
    setIsDemoMode(false);
    setIsCheckingSession(false);
    setActiveSection("home");
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

        const user = await response.json();
        setTheme(user.dark_mode ? "dark" : "light");
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
    setTheme(session.dark_mode ? "dark" : "light");
    setActiveSection("home");
    setAccessToken(session.access_token);
  }

  function handleStartDemo() {
    clearStoredAccessToken();
    setAccessToken("");
    setIsDemoMode(true);
    setIsCheckingSession(false);
    setActiveSection("home");
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

  if (activeSection === "finanzas") {
    return (
      <FinanceApp
        accessToken={accessToken}
        isDemoMode={isDemoMode}
        onBackToHome={() => setActiveSection("home")}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeSection === "notas") {
    return (
      <NotesModule
        accessToken={accessToken}
        isDemoMode={isDemoMode}
        onBackToHome={() => setActiveSection("home")}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <HomeScreen
      isDemoMode={isDemoMode}
      onLogout={handleLogout}
      onOpenFinanzas={() => setActiveSection("finanzas")}
      onOpenNotas={() => setActiveSection("notas")}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}

async function saveThemePreference(accessToken, theme) {
  try {
    await fetch(apiUrl("/api/auth/theme"), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dark_mode: theme === "dark" }),
    });
  } catch {
    // La preferencia local queda aplicada aunque falle el guardado remoto.
  }
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
