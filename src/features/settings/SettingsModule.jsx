import React from "react";
import { Settings } from "lucide-react";
import { currency } from "../../utils/formatters.js";
import SalaryForm from "./SalaryForm.jsx";

// Pantalla de configuracion. Por ahora administra sueldo y resumen de restante.
export default function SettingsModule({ expensesTotal, onSaveSalary, remainingTotal, salary }) {
  return (
    <section className="workspace single-column">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>Datos mensuales</p>
            <h2>Configuracion</h2>
          </div>
          <Settings size={34} strokeWidth={1.7} />
        </div>

        <SalaryForm onSubmit={onSaveSalary} salary={salary} />

        <div className="balance-grid">
          <div className="total-strip">
            <span>Sueldo mensual</span>
            <strong>{currency.format(salary)}</strong>
          </div>
          <div className="total-strip">
            <span>Total de gastos</span>
            <strong>{currency.format(expensesTotal)}</strong>
          </div>
          <div className={`total-strip balance-strip ${remainingTotal < 0 ? "negative" : "positive"}`}>
            <span>Restante</span>
            <strong>{currency.format(remainingTotal)}</strong>
          </div>
        </div>
      </section>
    </section>
  );
}
