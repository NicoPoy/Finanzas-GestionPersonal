import React, { useEffect, useState } from "react";
import LoginScreen from "./components/auth/LoginScreen.jsx";
import FinanceApp from "./features/finance/FinanceApp.jsx";
import "./styles.css";

// App decide si mostrar el login visual o la aplicacion.
// El token queda en localStorage hasta que sumemos refresh/logout y proteccion completa.
export default function App() {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("finanzas_access_token"));
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(accessToken));

  useEffect(() => {
    if (!accessToken) {
      setIsCheckingSession(false);
      return;
    }

    async function verifySession() {
      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Sesion invalida");
        }
      } catch {
        localStorage.removeItem("finanzas_access_token");
        setAccessToken("");
      } finally {
        setIsCheckingSession(false);
      }
    }

    verifySession();
  }, [accessToken]);

  async function handleLogin(credentials) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error("Email o password incorrectos.");
    }

    const session = await response.json();
    localStorage.setItem("finanzas_access_token", session.access_token);
    setAccessToken(session.access_token);
  }

  if (!accessToken) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (isCheckingSession) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <FinanceApp />;
}
