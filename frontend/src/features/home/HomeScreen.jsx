import React from "react";
import { LogOut, NotebookPen, Wallet } from "lucide-react";

export default function HomeScreen({ onOpenFinanzas, onOpenNotas, onLogout }) {
  return (
    <main className="home-shell">
      <section className="home-panel" aria-label="Inicio">
        <header className="home-header">
          <div className="brand-lockup brand-lockup-login">
            <img alt="" src="/logo_app_finanzas.png" />
            <p>Finanzas personales</p>
          </div>
          <button
            aria-label="Cerrar sesion"
            className="header-action-button home-logout"
            onClick={onLogout}
            title="Cerrar sesion"
            type="button"
          >
            <LogOut size={16} />
          </button>
        </header>

        <div className="home-copy">
          <h1>Inicio</h1>
          <p>Elegi que queres abrir.</p>
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
              <small>Proximamente</small>
            </span>
          </button>
        </div>
      </section>
    </main>
  );
}
