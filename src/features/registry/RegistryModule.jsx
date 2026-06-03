import React, { useState } from "react";
import { ListChecks, ReceiptText } from "lucide-react";
import { getPaymentKey } from "../../domain/financeCalculations.js";
import { currency } from "../../utils/formatters.js";

// Matriz anual: filas son cosas a pagar y columnas son meses.
export default function RegistryModule({ onTogglePayment, paymentRegistry, services }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const months = [
    { label: "Enero", short: "Ene" },
    { label: "Febrero", short: "Feb" },
    { label: "Marzo", short: "Mar" },
    { label: "Abril", short: "Abr" },
    { label: "Mayo", short: "May" },
    { label: "Junio", short: "Jun" },
    { label: "Julio", short: "Jul" },
    { label: "Agosto", short: "Ago" },
    { label: "Septiembre", short: "Sep" },
    { label: "Octubre", short: "Oct" },
    { label: "Noviembre", short: "Nov" },
    { label: "Diciembre", short: "Dic" },
  ];

  const paidCount = services.reduce((sum, service) => {
    return (
      sum +
      months.filter((_, monthIndex) => paymentRegistry[getPaymentKey(selectedYear, monthIndex, service.id)]).length
    );
  }, 0);
  const totalCells = services.length * months.length;

  function handleYearChange(event) {
    const parsedYear = Number(event.target.value);

    if (parsedYear >= 2000 && parsedYear <= 2100) {
      setSelectedYear(parsedYear);
    }
  }

  return (
    <section className="workspace single-column registry-workspace">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>Control anual</p>
            <h2>Registro</h2>
          </div>
          <ListChecks size={34} strokeWidth={1.7} />
        </div>

        <div className="registry-toolbar">
          <button type="button" onClick={() => setSelectedYear((year) => year - 1)}>
            {selectedYear - 1}
          </button>
          <label>
            Año
            <input min="2000" max="2100" type="number" value={selectedYear} onChange={handleYearChange} />
          </label>
          <button type="button" onClick={() => setSelectedYear((year) => year + 1)}>
            {selectedYear + 1}
          </button>
        </div>

        <div className="total-strip">
          <span>Abonados en {selectedYear}</span>
          <strong>
            {paidCount} / {totalCells}
          </strong>
        </div>

        {services.length ? (
          <div className="registry-table-wrap">
            <table className="registry-table">
              <thead>
                <tr>
                  <th>Cosa a pagar</th>
                  {months.map((month) => (
                    <th className="month-heading" key={month.label} title={month.label}>
                      {month.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <th>
                      <span>{service.name}</span>
                      <small>
                        {service.category} · {currency.format(service.amount)}
                      </small>
                    </th>
                    {months.map((month, monthIndex) => {
                      const paymentKey = getPaymentKey(selectedYear, monthIndex, service.id);
                      const checked = Boolean(paymentRegistry[paymentKey]);

                      return (
                        <td key={month.label}>
                          <label className="check-cell">
                            <input
                              checked={checked}
                              aria-label={`${service.name} ${month.label} ${selectedYear}`}
                              onChange={() => onTogglePayment(selectedYear, monthIndex, service.id)}
                              type="checkbox"
                            />
                            <span>{checked ? "Pago" : "No"}</span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ReceiptText size={28} />
            <p>Carga algun servicio o gasto para empezar a usar el registro.</p>
          </div>
        )}
      </section>
    </section>
  );
}
