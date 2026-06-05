import React, { useEffect, useState } from "react";
import LoginScreen from "./components/auth/LoginScreen.jsx";
import FinanceApp from "./features/finance/FinanceApp.jsx";
import { apiUrl } from "./services/platform.js";
import "./styles.css";

// App decide si mostrar el login visual o la aplicacion.
// El token queda en localStorage y se elimina al cerrar sesion.
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
        const response = await fetch(apiUrl("/api/auth/me"), {
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
    localStorage.setItem("finanzas_access_token", session.access_token);
    setIsCheckingSession(true);
    setAccessToken(session.access_token);
  }

  function handleLogout() {
    localStorage.removeItem("finanzas_access_token");
    setAccessToken("");
    setIsCheckingSession(false);
  }

  if (!accessToken) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (isCheckingSession) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <FinanceApp accessToken={accessToken} onLogout={handleLogout} />;
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
