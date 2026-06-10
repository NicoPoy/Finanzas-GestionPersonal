import React from "react";
import { ArrowLeft, NotebookPen } from "lucide-react";

export default function NotesModule({ onBackToHome }) {
  return (
    <main className="app-shell">
      <section className="notes-shell">
        <header className="notes-header">
          <button
            aria-label="Volver al inicio"
            className="header-action-button"
            onClick={onBackToHome}
            title="Volver al inicio"
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="notes-title">
            <NotebookPen size={22} />
            <h1>Notas</h1>
          </div>
        </header>

        <div className="notes-empty">
          <NotebookPen size={40} strokeWidth={1.5} />
          <p>Todavia no hay nada aca.</p>
          <span>Esta seccion se va a armar mas adelante.</span>
        </div>
      </section>
    </main>
  );
}
