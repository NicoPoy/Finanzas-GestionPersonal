import React from "react";
import { BarChart3, ReceiptText } from "lucide-react";
import { getOwnExpenseAmount, isFixedCardExpense, isPaidByOther } from "../../domain/financeCalculations.js";
import { currency } from "../../utils/formatters.js";

// Pantalla de proyeccion: calcula cuanto se pagara en tarjetas durante los proximos meses.
export default function ProjectionModule({ banks }) {
  const months = getProjectionMonths(12);
  const projectionRows = banks.flatMap((bank) =>
    bank.cards
      .filter((card) => card.expenses.length)
      .map((card) => ({
        id: `${bank.id}-${card.id}`,
        bankName: bank.name,
        cardName: card.name,
        months: months.map((_, monthIndex) =>
          card.expenses.reduce((sum, expense) => {
            if (!isFixedCardExpense(expense) && expense.installments <= monthIndex) {
              return sum;
            }

            if (isPaidByOther(expense)) {
              return sum;
            }

            return sum + (monthIndex === 0 ? getOwnExpenseAmount(expense) : expense.amount);
          }, 0),
        ),
      })),
  );

  const monthlyTotals = months.map((_, monthIndex) =>
    projectionRows.reduce((sum, row) => sum + row.months[monthIndex], 0),
  );

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

        <div className="total-strip">
          <span>Proximo mes en tarjetas</span>
          <strong>{currency.format(monthlyTotals[0] ?? 0)}</strong>
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
                      <small>{month.year}</small>
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

// Genera meses desde el mes actual para columnas de proyeccion.
function getProjectionMonths(amount) {
  const now = new Date();

  return Array.from({ length: amount }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index, 1);
    const label = date.toLocaleDateString("es-AR", { month: "short" }).replace(".", "");

    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label,
      year: date.getFullYear(),
    };
  });
}
