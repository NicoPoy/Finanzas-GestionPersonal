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
  const months = getProjectionMonths(12);
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

        <div className="total-strip">
          <span>Proximo mes de sueldo en tarjetas</span>
          <strong>{currency.format(monthlyTotals[1] ?? 0)}</strong>
        </div>

        {projectionRows.length ? (
          <div className="registry-table-wrap">
            <table className="registry-table projection-table">
              <thead>
                <tr>
                  <th>Tarjeta</th>
                  {months.map((month) => (
                    <th className="month-heading" key={month.key}>
                      <span>{month.label}</span>
                      <small>Sueldo {month.year}</small>
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
                      <td key={`${row.id}-${months[index].key}`}>
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
                    <td key={months[index].key}>
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

function getProjectionMonths(amount) {
  return Array.from({ length: amount }, (_, index) => {
    const paymentMonth = getCalendarMonth(index);
    const label = new Date(paymentMonth.year, paymentMonth.monthIndex, 1)
      .toLocaleDateString("es-AR", { month: "short" })
      .replace(".", "");

    return {
      key: `${paymentMonth.year}-${paymentMonth.monthIndex}`,
      label,
      paymentMonthOffset: index,
      year: paymentMonth.year,
    };
  });
}
