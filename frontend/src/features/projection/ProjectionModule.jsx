import React, { useMemo } from "react";
import { BarChart3, CalendarDays, Info, ReceiptText } from "lucide-react";
import {
  buildCardMonthlyTotalForPaymentMonth,
  getCalendarMonth,
  getExpenseAmountForStatementOffset,
  getStatementOffsetForPaymentMonth,
} from "../../domain/financeCalculations.js";
import { currency } from "../../utils/formatters.js";
import "./projection.css";

// Pantalla de proyección: calcula cuánto se pagará en tarjetas por mes de sueldo.
export default function ProjectionModule({ banks }) {
  const months = useMemo(() => getProjectionMonths(7), []);
  const projectionRows = useMemo(
    () =>
      banks.flatMap((bank) =>
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
      ),
    [banks, months],
  );

  const monthlyTotals = useMemo(
    () => months.map((month) => buildCardMonthlyTotalForPaymentMonth(banks, month.paymentMonthOffset)),
    [banks, months],
  );
  const projectionStats = useMemo(() => buildProjectionStats(months, monthlyTotals), [monthlyTotals, months]);
  const debtStats = useMemo(() => buildDebtStats(banks, months, monthlyTotals), [banks, monthlyTotals, months]);
  const currentSalaryTotal = monthlyTotals[0] ?? 0;
  const nextSalaryTotal = monthlyTotals[1] ?? 0;
  const currentMonth = months[0];
  const nextMonth = months[1];
  const visibleMonthCount = projectionStats.activeMonths || months.length;

  return (
    <section className="workspace single-column projection-workspace">
      <section className="detail-panel projection-panel">
        <div className="section-heading projection-main-heading">
          <div>
            <p>Cuotas pendientes</p>
            <h2>Proyección</h2>
          </div>
          <BarChart3 size={34} strokeWidth={1.7} />
        </div>

        <div className="projection-intro">
          <div>
            <span>Cómo leer esta vista</span>
            <p>
              La tabla proyecta cuánto vas a pagar de tarjetas con cada sueldo. Cada columna representa el sueldo que
              usás para pagar el resumen cerrado el mes anterior.
            </p>
          </div>
          <CalendarDays size={24} strokeWidth={1.8} />
        </div>

        <div className="projection-summary-grid">
          <ProjectionSummaryCard
            label={`Sueldo ${currentMonth.salaryLabel}`}
            note={`Paga resumen ${currentMonth.statementLabel}`}
            detail="Total de tarjetas calculado para ese sueldo puntual."
            value={currency.format(currentSalaryTotal)}
          />
          <ProjectionSummaryCard
            label={`Sueldo ${nextMonth.salaryLabel}`}
            note={`Paga resumen ${nextMonth.statementLabel}`}
            detail="Total comprometido para ese sueldo si no cargás nuevos gastos."
            tone="next"
            value={currency.format(nextSalaryTotal)}
          />
          <ProjectionSummaryCard
            label="Mayor pago proyectado"
            note={projectionStats.peakPaymentLabel}
            detail={projectionStats.peakDetail}
            tone="peak"
            value={currency.format(projectionStats.peakAmount)}
          />
          <ProjectionSummaryCard
            label="Promedio mensual"
            note={projectionStats.averageLabel}
            detail="Promedio de los totales mensuales con saldo, sin contar meses en cero."
            value={currency.format(projectionStats.averageAmount)}
          />
        </div>

        <section className="projection-explainer" aria-label="Qué se está calculando">
          <Info size={20} strokeWidth={1.9} />
          <div>
            <strong>Qué entra en estos números</strong>
            <p>
              Cada monto mensual sale de sumar las tarjetas para ese sueldo. En compras en cuotas se toma la cuota que
              sigue vigente ese mes; en gastos fijos de tarjeta se repite el importe mensual; y si marcaste ahorro,
              mitad compartida o pagado por otra persona, se descuenta según esa configuración.
            </p>
          </div>
        </section>

        <section className="debt-mode-grid" aria-label="Resumen de deuda y cuotas">
          <DebtStat
            label="Deuda total"
            note="Suma de cuotas pendientes que todavía tenés que pagar. No incluye gastos fijos de tarjeta."
            value={currency.format(debtStats.totalDebt)}
          />
          <DebtStat
            label="Cuotas activas"
            note="Cantidad de compras con cuotas pendientes cargadas en tus tarjetas."
            value={debtStats.activeInstallmentExpenses}
          />
          <DebtStat
            label="Próximo alivio"
            note={`${debtStats.nextReliefLabel}. Es la primera baja detectada contra el sueldo anterior.`}
            value={currency.format(debtStats.nextReliefAmount)}
          />
          <DebtStat
            label="Mayor baja"
            note={`${debtStats.biggestDropLabel}. Es la caída más grande dentro de ${visibleMonthCount} meses.`}
            value={currency.format(debtStats.biggestDropAmount)}
          />
        </section>

        {projectionRows.length ? (
          <section className="projection-detail-block">
            <div className="projection-detail-heading">
              <div>
                <span>Detalle mensual</span>
                <h3>Cuánto paga cada tarjeta por sueldo</h3>
              </div>
              <p>
                El total inferior es la suma de todas las tarjetas para ese sueldo. Los guiones indican que esa tarjeta
                no tiene saldo proyectado en ese mes.
              </p>
            </div>

            <div className="registry-table-wrap projection-table-wrap">
              <table className="registry-table projection-table">
                <thead>
                  <tr>
                    <th>Tarjeta</th>
                    {months.map((month, index) => (
                      <th className={`month-heading ${index === 0 ? "projection-next-month" : ""}`} key={month.key}>
                        <span>Sueldo {month.salaryLabel}</span>
                        <small>Paga resumen {month.statementLabel}</small>
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
          </section>
        ) : (
          <div className="empty-state">
            <ReceiptText size={28} />
            <p>Cargá consumos con cuotas pendientes para ver la proyección.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function buildDebtStats(banks, months, monthlyTotals) {
  const installmentExpenses = banks.flatMap((bank) =>
    bank.cards.flatMap((card) =>
      card.expenses
        .filter((expense) => !expense.isFixed && Number(expense.installments) > 0)
        .map((expense) => ({
          amount: Number(expense.amount) || 0,
          installments: Number(expense.installments) || 0,
          isPaidByOther: Boolean(expense.isPaidByOther),
          isSaved: Boolean(expense.isSaved),
          isSharedHalf: Boolean(expense.isSharedHalf),
        })),
    ),
  );
  const totalDebt = installmentExpenses.reduce((sum, expense) => {
    if (expense.isPaidByOther || expense.isSaved) {
      return sum;
    }

    const ownAmount = expense.isSharedHalf ? expense.amount / 2 : expense.amount;
    return sum + ownAmount * expense.installments;
  }, 0);
  const nextReliefIndex = monthlyTotals.findIndex((amount, index) => amount > 0 && (monthlyTotals[index + 1] ?? 0) < amount);
  const drops = monthlyTotals.slice(0, -1).map((amount, index) => ({
    amount: Math.max(amount - (monthlyTotals[index + 1] ?? 0), 0),
    label: months[index + 1]?.salaryLabel ?? "Sin baja proyectada",
  }));
  const biggestDrop = drops.sort((a, b) => b.amount - a.amount)[0] ?? { amount: 0, label: "Sin baja proyectada" };

  return {
    activeInstallmentExpenses: installmentExpenses.length,
    biggestDropAmount: biggestDrop.amount,
    biggestDropLabel: biggestDrop.amount ? `Desde sueldo ${biggestDrop.label}` : "Sin baja proyectada",
    nextReliefAmount: nextReliefIndex >= 0 ? monthlyTotals[nextReliefIndex] - (monthlyTotals[nextReliefIndex + 1] ?? 0) : 0,
    nextReliefLabel: nextReliefIndex >= 0 ? `Sueldo ${months[nextReliefIndex + 1]?.salaryLabel}` : "Sin alivio en la ventana",
    totalDebt,
  };
}

function DebtStat({ label, note, value }) {
  return (
    <article className="debt-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function buildProjectionStats(months, monthlyTotals) {
  const activeTotals = monthlyTotals.filter((amount) => amount > 0);
  const peakAmount = Math.max(0, ...monthlyTotals);
  const peakIndex = monthlyTotals.findIndex((amount) => amount === peakAmount);
  const firstActiveIndex = monthlyTotals.findIndex((amount) => amount > 0);
  const lastActiveIndex = monthlyTotals.findLastIndex((amount) => amount > 0);

  return {
    activeMonths: activeTotals.length,
    averageAmount: activeTotals.length
      ? activeTotals.reduce((sum, amount) => sum + amount, 0) / activeTotals.length
      : 0,
    averageLabel:
      firstActiveIndex >= 0 && lastActiveIndex >= 0
        ? `${months[firstActiveIndex].salaryLabel} a ${months[lastActiveIndex].salaryLabel}`
        : "Sin consumos proyectados",
    peakAmount,
    peakDetail:
      peakIndex >= 0
        ? `Es el monto más alto de la fila Total. Usás el sueldo ${months[peakIndex].salaryLabel} para pagar el resumen ${months[peakIndex].statementLabel}.`
        : "Todavía no hay meses con consumos para comparar.",
    peakLabel: peakIndex >= 0 ? `Sueldo ${months[peakIndex].salaryLabel}` : "Sin consumos proyectados",
    peakPaymentLabel:
      peakIndex >= 0
        ? `Usás sueldo ${months[peakIndex].salaryLabel} · Pagás resumen ${months[peakIndex].statementLabel}`
        : "Sin consumos proyectados",
  };
}

function ProjectionSummaryCard({ detail, label, note, tone = "", value }) {
  return (
    <article className={`projection-summary-card ${tone ? `projection-summary-card-${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
      <p>{detail}</p>
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
    const statementLabel = new Date(paymentMonth.year, paymentMonth.monthIndex, 1)
      .toLocaleDateString("es-AR", { month: "long", year: "numeric" });

    return {
      key: `${paymentMonth.year}-${paymentMonth.monthIndex}`,
      label,
      paymentMonthOffset: index,
      salaryLabel: capitalizeDateLabel(salaryLabel),
      statementLabel: capitalizeDateLabel(statementLabel),
      year: paymentMonth.year,
    };
  });
}

function capitalizeDateLabel(label) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}