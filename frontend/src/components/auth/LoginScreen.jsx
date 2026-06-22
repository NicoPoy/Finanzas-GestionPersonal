import React, { useState } from "react";
import { AlertTriangle, Mail, X } from "lucide-react";
import ThemeToggle from "../common/ThemeToggle.jsx";

export default function LoginScreen({ onLogin, onStartDemo, onToggleTheme, theme }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

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

        <div className="login-divider" aria-hidden="true">
          <span />
          <small>o</small>
          <span />
        </div>

        <button className="login-demo-button" onClick={onStartDemo} type="button">
          Probar modo demo
        </button>

        <p className="login-note">
          En demo podes usar el sistema sin cuenta. Los cambios se pierden al salir o recargar y no se guardan en la base de datos.
        </p>
      </section>

      <button className="login-contact-button" onClick={() => setIsContactModalOpen(true)} type="button">
        <Mail size={17} />
        Solicitar acceso
      </button>

      <aside className="login-service-alert" role="status">
        <AlertTriangle size={18} />
        <p>
          <strong>Registro de usuarios limitado</strong>
          <span>
            Para cuidar la capacidad del plan gratuito de la base de datos, los nuevos usuarios se habilitan manualmente. Podes usar el modo demo para probar el sistema.
          </span>
        </p>
      </aside>

      {isContactModalOpen ? (
        <div className="login-contact-backdrop" role="presentation">
          <section aria-modal="true" className="login-contact-modal" role="dialog">
            <header>
              <div>
                <p>Solicitud de acceso</p>
                <h2>Contactame para habilitar tu usuario</h2>
              </div>
              <button
                aria-label="Cerrar"
                className="login-contact-close"
                onClick={() => setIsContactModalOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </header>
            <p>
              Por ahora el alta de cuentas se revisa manualmente para no exceder los limites del plan gratuito de la base de datos.
            </p>
            <p>
              Escribime por el mismo canal donde recibiste este link e inclui tu nombre y el email que queres usar para ingresar.
            </p>
            <button className="login-contact-primary" onClick={() => setIsContactModalOpen(false)} type="button">
              Entendido
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
