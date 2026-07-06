import React, { useMemo, useState } from "react";
import { History, ReceiptText } from "lucide-react";
import { currency } from "../../utils/formatters.js";
import "./history.css";

const MONTHS = [
  { label: "Enero", value: "01" },
  { label: "Febrero", value: "02" },
  { label: "Marzo", value: "03" },
  { label: "Abril", value: "04" },
  { label: "Mayo", value: "05" },
  { label: "Junio", value: "06" },
  { label: "Julio", value: "07" },
  { label: "Agosto", value: "08" },
  { label: "Septiembre", value: "09" },
  { label: "Octubre", value: "10" },
  { label: "Noviembre", value: "11" },
  { label: "Diciembre", value: "12" },
];

export default function HistoryModule({ history }) {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const filteredHistory = useMemo(
    () => filterHistory(history, selectedMonth, selectedYear),
    [history, selectedMonth, selectedYear],
  );

  return (
    <section className="workspace single-column">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>Trazabilidad</p>
            <h2>Historial</h2>
          </div>
          <History size={34} strokeWidth={1.7} />
        </div>

        <div className="history-filters" aria-label="Filtros de historial">
          <label>
            Mes
            <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
              <option value="">Actual y anterior</option>
              {MONTHS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Año
            <input
              inputMode="numeric"
              placeholder="Actual"
              type="number"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
            />
          </label>
          <button
            disabled={!selectedMonth && !selectedYear}
            onClick={() => {
              setSelectedMonth("");
              setSelectedYear("");
            }}
            type="button"
          >
            Limpiar
          </button>
        </div>

        {filteredHistory.length ? (
          <div className="history-list">
            {filteredHistory.map((item) => {
              const isIncome = item.type === "other_income";

              return (
                <article className={`history-item large ${isIncome ? "history-item-income" : ""}`} key={item.id}>
                  <span>
                    <strong>{item.serviceName}</strong>
                    <small>
                      {item.period} - {isIncome ? "Ingreso" : item.category} -{" "}
                      {new Date(item.paidAt).toLocaleDateString("es-AR")}
                    </small>
                    {item.notes ? <small>{item.notes}</small> : null}
                  </span>
                  <b>{isIncome ? `+ ${currency.format(item.paidAmount)}` : currency.format(item.paidAmount)}</b>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <ReceiptText size={28} />
            <p>No hay movimientos para el periodo seleccionado.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function filterHistory(history, selectedMonth, selectedYear) {
  if (selectedMonth || selectedYear) {
    return history.filter((item) => {
      const [year = "", month = ""] = String(item.period ?? "").split("-");

      return (!selectedYear || year === selectedYear) && (!selectedMonth || month === selectedMonth);
    });
  }

  const now = new Date();
  const currentPeriod = getPeriod(now);
  const previousPeriod = getPeriod(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  return history.filter((item) => item.period === currentPeriod || item.period === previousPeriod);
}

function getPeriod(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
