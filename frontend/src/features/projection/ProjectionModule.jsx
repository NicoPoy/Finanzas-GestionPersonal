import React from "react";
import { BarChart3, ReceiptText } from "lucide-react";
import {
  buildCardMonthlyTotalForPaymentMonth,
  getCalendarMonth,
  getExpenseAmountForStatementOffset,
  getStatementOffsetForPaymentMonth,
} from "../../domain/financeCalculations.js";
import { currency } from "../../utils/formatters.js";

// Pantalla de proyeccion: calcula cuanto se pagara en tarjetas por mes de sueldo.
export default function ProjectionModule({ banks }) {
  const months = getProjectionMonths(7);
  const projectionRows = banks.flatMap((bank) =>
    bank.cards
      .filter((card) => card.expenses.length)
      .map((card) => ({
        id: `${bank.id}-${card.id}`,
        bankName: bank.name,
        cardName: card.name,
        months: months.map((month) => {
          const statementOffset = getStatementOffsetForPaymentMonth(month.paymentMonthOffset);

          return card.expenses.reduce(
            (sum, expense) => sum + getExpenseAmountForStatementOffset(expense, statementOffset),
            0,
          );
        }),
      })),
  );

  const monthlyTotals = months.map((month) => buildCardMonthlyTotalForPaymentMonth(banks, month.paymentMonthOffset));
  const currentSalaryTotal = monthlyTotals[0] ?? 0;
  const nextSalaryTotal = monthlyTotals[1] ?? 0;

  return (
    <section className="workspace single-column projection-workspace">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>Cuotas pendientes</p>
            <h2>Proyeccion</h2>
          </div>
          <BarChart3 size={34} strokeWidth={1.7} />
        </div>

        <p className="projection-note">
          Cada columna es el mes de sueldo con el que pagas el resumen que cerro el mes anterior.
        </p>

        <div className="projection-summary-grid">
          <ProjectionSummaryCard
            label="Mes actual"
            note="Primer mes proyectado"
            value={currency.format(currentSalaryTotal)}
          />
          <ProjectionSummaryCard
            label="Mes siguiente"
            note="Proximo mes"
            tone="next"
            value={currency.format(nextSalaryTotal)}
          />
        </div>

        {projectionRows.length ? (
          <div className="registry-table-wrap projection-table-wrap">
            <table className="registry-table projection-table">
              <thead>
                <tr>
                  <th>Tarjeta</th>
                  {months.map((month, index) => (
                    <th className={`month-heading ${index === 0 ? "projection-next-month" : ""}`} key={month.key}>
                      <span>{month.label}</span>
                      <small>Sueldo {month.salaryLabel}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectionRows.map((row) => (
                  <tr key={row.id}>
                    <th>
                      <span>{row.cardName}</span>
                      <small>{row.bankName}</small>
                    </th>
                    {row.months.map((amount, index) => (
                      <td className={index === 0 ? "projection-next-month" : ""} key={`${row.id}-${months[index].key}`}>
                        <strong className={amount ? "projection-amount" : "projection-empty"}>
                          {amount ? currency.format(amount) : "-"}
                        </strong>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="projection-total-row">
                  <th>Total</th>
                  {monthlyTotals.map((amount, index) => (
                    <td className={index === 0 ? "projection-next-month" : ""} key={months[index].key}>
                      <strong>{amount ? currency.format(amount) : "-"}</strong>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ReceiptText size={28} />
            <p>Carga consumos con cuotas pendientes para ver la proyeccion.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function ProjectionSummaryCard({ label, note, tone = "", value }) {
  return (
    <article className={`projection-summary-card ${tone ? `projection-summary-card-${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function getProjectionMonths(amount) {
  return Array.from({ length: amount }, (_, index) => {
    const paymentMonth = getCalendarMonth(index);
    const salaryMonth = getCalendarMonth(index + 1);
    const label = new Date(paymentMonth.year, paymentMonth.monthIndex, 1)
      .toLocaleDateString("es-AR", { month: "short" })
      .replace(".", "");
    const salaryLabel = new Date(salaryMonth.year, salaryMonth.monthIndex, 1)
      .toLocaleDateString("es-AR", { month: "long", year: "numeric" });

    return {
      key: `${paymentMonth.year}-${paymentMonth.monthIndex}`,
      label,
      paymentMonthOffset: index,
      salaryLabel: salaryLabel.charAt(0).toUpperCase() + salaryLabel.slice(1),
      year: paymentMonth.year,
    };
  });
}
