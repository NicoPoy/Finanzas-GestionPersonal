import React from "react";
import { LogOut, NotebookPen, Wallet } from "lucide-react";
import ThemeToggle from "../../components/common/ThemeToggle.jsx";

export default function HomeScreen({ isDemoMode = false, onOpenFinanzas, onOpenNotas, onLogout, onToggleTheme, theme }) {
  return (
    <main className="home-shell">
      <section className="home-panel" aria-label="Inicio">
        <header className="home-header">
          <div className="brand-lockup brand-lockup-login">
            <img alt="" src="/logo_app_finanzas.png" />
            <p>Finanzas personales</p>
          </div>
          <div className="home-header-actions">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button
              aria-label={isDemoMode ? "Salir del modo demo" : "Cerrar sesion"}
              className="header-action-button home-logout"
              onClick={onLogout}
              title={isDemoMode ? "Salir del modo demo" : "Cerrar sesion"}
              type="button"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <div className="home-copy">
          {isDemoMode ? <span className="demo-pill">Modo demo</span> : null}
          <h1>Inicio</h1>
          <p>
            {isDemoMode
              ? "Explora la app con datos de prueba. Nada se guarda en la base de datos."
              : "Elegi que queres abrir."}
          </p>
        </div>

        <div className="home-options">
          <button className="home-option" onClick={onOpenFinanzas} type="button">
            <span className="home-option-icon home-option-icon-finance">
              <Wallet size={28} />
            </span>
            <span className="home-option-text">
              <strong>Finanzas</strong>
              <small>Gastos, tarjetas y proyeccion mensual</small>
            </span>
          </button>

          <button className="home-option" onClick={onOpenNotas} type="button">
            <span className="home-option-icon home-option-icon-notes">
              <NotebookPen size={28} />
            </span>
            <span className="home-option-text">
              <strong>Notas</strong>
              <small>Productos por local</small>
            </span>
          </button>
        </div>
      </section>
    </main>
  );
}
