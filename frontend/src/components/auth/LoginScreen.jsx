import React, { useState } from "react";
import { AlertTriangle, Mail, X, Lock, Eye, EyeOff } from "lucide-react";
import "./auth.css";

export default function LoginScreen({ onLogin, onStartDemo, onToggleTheme, theme }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      {/* Columna Izquierda: Branding Hero (Visible en pantallas medianas/grandes) */}
      <section className="login-hero" aria-label="Finanzas Personales">
        <div className="login-hero-logo-box">
          <img className="login-hero-logo" src="/logo_app_finanzas.png" alt="Logo de Finanzas" />
        </div>
        <h1 className="login-hero-title">Finanzas Personales</h1>
        <p className="login-hero-tagline">
          Gestiona, planifica y optimiza tus finanzas con simplicidad, seguridad y elegancia.
        </p>
        <div className="login-hero-features">
          <span className="login-hero-feature-tag">Gastos</span>
          <span className="login-hero-feature-tag">Tarjetas</span>
          <span className="login-hero-feature-tag">Sueldos</span>
          <span className="login-hero-feature-tag">Proyecciones</span>
        </div>
      </section>

      {/* Columna Derecha: Formulario de Login */}
      <section className="login-form-side" aria-label="Inicio de sesión">
        {/* Cabecera compacta para Móviles (Oculta en desktop) */}
        <div className="login-form-header-mobile" aria-hidden="true">
          <div className="login-mobile-logo-box">
            <img className="login-mobile-logo" src="/logo_app_finanzas.png" alt="Logo" />
          </div>
          <h1 className="login-mobile-title">Finanzas Personales</h1>
          <p className="login-mobile-tagline">Tu dinero, inteligente y bajo control</p>
        </div>

        <div className="login-panel-new">
          <header className="login-header-new">
            <h2>Ingresar</h2>
          </header>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-fields">
              <div className="login-input-wrapper">
                <label htmlFor="email-input">Email</label>
                <div className="login-input-group">
                  <input
                    id="email-input"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <Mail size={18} />
                </div>
              </div>

              <div className="login-input-wrapper">
                <label htmlFor="password-input">Contraseña</label>
                <div className="login-input-group">
                  <input
                    id="password-input"
                    className="login-input-password"
                    autoComplete="current-password"
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <Lock size={18} />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {error ? <p className="form-error-new">{error}</p> : null}

            <button className="login-submit-btn" disabled={isSubmitting || !canSubmit} type="submit">
              {isSubmitting ? "Ingresando..." : "Entrar"}
            </button>
          </form>

          <div className="login-divider-new" aria-hidden="true">
            o
          </div>

          <button className="login-demo-btn" onClick={onStartDemo} type="button">
            Probar modo demo
          </button>

          <p className="login-note-new">
            En demo podés usar el sistema sin cuenta. Los cambios se pierden al salir o recargar y no se guardan en la base de datos.
          </p>
        </div>

        {/* Botón flotante para solicitar acceso */}
        <button className="login-contact-btn-new" onClick={() => setIsContactModalOpen(true)} type="button">
          <Mail size={16} />
          Solicitar acceso
        </button>

        {/* Alerta de registro limitado flotante */}
        <aside className="login-alert-new" role="status">
          <AlertTriangle size={18} />
          <p>
            <strong>Registro limitado</strong>
            Para cuidar la capacidad del plan gratuito de la base de datos, los nuevos usuarios se habilitan manualmente. Podés usar demo para probar.
          </p>
        </aside>

        {/* Modal de Solicitud de Acceso */}
        {isContactModalOpen ? (
          <div className="login-contact-backdrop" role="presentation">
            <section aria-modal="true" className="login-contact-modal" role="dialog">
              <header>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--primary)" }}>Solicitud de acceso</p>
                  <h2>Contáctame para habilitar tu usuario</h2>
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
                Por ahora el alta de cuentas se revisa manualmente para no exceder los límites del plan gratuito de la base de datos.
              </p>
              <p>
                Escribime por el mismo canal donde recibiste este link e incluí tu nombre y el email que querés usar para ingresar.
              </p>
              <button className="login-contact-primary" onClick={() => setIsContactModalOpen(false)} type="button">
                Entendido
              </button>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}
