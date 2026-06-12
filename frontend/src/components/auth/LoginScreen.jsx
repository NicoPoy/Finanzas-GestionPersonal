import React, { useState } from "react";
import ThemeToggle from "../common/ThemeToggle.jsx";

export default function LoginScreen({ onLogin, onToggleTheme, theme }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedEmail = email.trim();
  const canSubmit = trimmedEmail.length > 0 && password.length > 0;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Completa email y contrasena para ingresar.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onLogin({ email: trimmedEmail, password });
    } catch (loginError) {
      setError(loginError.message || "No se pudo iniciar sesion.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel" aria-label="Inicio de sesion">
        <header className="login-header">
          <div className="login-copy">
            <div className="brand-lockup brand-lockup-login">
              <img alt="" src="/logo_app_finanzas.png" />
              <p>Finanzas personales</p>
            </div>
            <h1>Ingresar</h1>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              placeholder="tu@email.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Contrasena
            <input
              autoComplete="current-password"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button disabled={isSubmitting || !canSubmit} type="submit">
            {isSubmitting ? "Ingresando..." : "Entrar"}
          </button>
        </form>

        <p className="login-note">Los usuarios se crean desde Swagger por ahora.</p>
      </section>
    </main>
  );
}
