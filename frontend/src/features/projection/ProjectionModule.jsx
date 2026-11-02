import React, { useMemo, useState } from "react";
import { BarChart3, ChevronDown, Info, ReceiptText } from "lucide-react";
import {
  buildCardMonthlyTotalForPaymentMonth,
  getCalendarMonth,
  getExpenseAmountForStatementOffset,
  getStatementOffsetForPaymentMonth,
} from "../../domain/financeCalculations.js";
import { currency } from "../../utils/formatters.js";
import "./projection.css";

// Proyecta los pagos de tarjeta organizados por sueldo y resumen.
export default function ProjectionModule({ banks }) {
  const [horizon, setHorizon] = useState(6);
  const [selectedCardId, setSelectedCardId] = useState("all");
  const months = useMemo(() => getProjectionMonths(horizon), [horizon]);
  const cardOptions = useMemo(
    () => banks.flatMap((bank) => bank.cards
      .filter((card) => card.expenses.length)
      .map((card) => ({ id: `${bank.id}-${card.id}`, label: `${card.name} · ${bank.name}` }))),
    [banks],
  );
  const visibleBanks = useMemo(
    () => selectedCardId === "all"
      ? banks
      : banks.map((bank) => ({
        ...bank,
        cards: bank.cards.filter((card) => `${bank.id}-${card.id}` === selectedCardId),
      })),
    [banks, selectedCardId],
  );
  const projectionRows = useMemo(
    () => visibleBanks.flatMap((bank) =>
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
        }))),
    [visibleBanks, months],
  );
  const monthlyTotals = useMemo(
    () => months.map((month) => buildCardMonthlyTotalForPaymentMonth(visibleBanks, month.paymentMonthOffset)),
    [visibleBanks, months],
  );
  const debtStats = useMemo(
    () => buildDebtStats(visibleBanks, months, monthlyTotals),
    [visibleBanks, monthlyTotals, months],
  );
  const maxMonthlyTotal = Math.max(0, ...monthlyTotals);
  const upcomingMonth = months[0];

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
            <span>Proyección de pagos</span>
            <p>El próximo sueldo cubre el resumen cerrado el mes anterior. Los importes estiman tus cuotas y gastos de tarjeta cargados.</p>
          </div>
          <BarChart3 size={24} strokeWidth={1.8} />
        </div>

        <div className="projection-summary-grid projection-summary-grid-primary">
          <ProjectionSummaryCard
            label={`Próximo sueldo · ${upcomingMonth.salaryLabel}`}
            note={`Paga resumen ${upcomingMonth.statementLabel}`}
            value={currency.format(monthlyTotals[0] ?? 0)}
          />
          <ProjectionSummaryCard
            label="Deuda total en cuotas"
            note={`${debtStats.activeInstallmentExpenses} compras activas · no incluye gastos fijos`}
            tone="debt"
            value={currency.format(debtStats.totalDebt)}
          />
          <ProjectionSummaryCard
            label="Primera baja"
            note={debtStats.nextReliefLabel}
            tone="relief"
            value={currency.format(debtStats.nextReliefAmount)}
          />
        </div>

        <section className="projection-chart-block" aria-label="Evolución de pagos proyectados">
          <div className="projection-chart-heading">
            <div>
              <span>Mes a mes</span>
              <h3>Total por sueldo</h3>
            </div>
            <label className="projection-control">
              Ver próximos
              <select value={horizon} onChange={(event) => setHorizon(Number(event.target.value))}>
                <option value={3}>3 meses</option>
                <option value={6}>6 meses</option>
                <option value={12}>12 meses</option>
              </select>
            </label>
          </div>
          <div className="projection-chart-scroll">
            <div
              className="projection-chart"
              role="img"
              aria-label={`Proyección de ${months.length} sueldos`}
              style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`, minWidth: `${months.length * 125}px` }}
            >
              {months.map((month, index) => {
                const amount = monthlyTotals[index] ?? 0;
                const ratio = maxMonthlyTotal ? Math.max((amount / maxMonthlyTotal) * 100, amount > 0 ? 3 : 0) : 0;
                return (
                  <div className={`projection-chart-column ${index === 0 ? "is-next" : ""}`} key={month.key}>
                    <strong>{currency.format(amount)}</strong>
                    <div className="projection-chart-track">
                      <span className={amount > 0 ? "" : "is-zero"} style={{ "--bar-ratio": ratio }} />
                    </div>
                    <span className="projection-chart-salary">{month.shortSalaryLabel}</span>
                    <small>Resumen {month.shortStatementLabel}</small>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <details className="projection-explainer">
          <summary>
            <Info size={18} strokeWidth={1.9} />
            Cómo se calcula
            <ChevronDown className="projection-explainer-chevron" size={17} />
          </summary>
          <p>
            Se suman las cuotas vigentes y los gastos fijos de cada tarjeta. Se descuentan los ahorros, los gastos compartidos y los pagos asignados a otra persona.
          </p>
        </details>

        <section className="projection-detail-block">
          <div className="projection-detail-heading">
            <div>
              <span>Detalle</span>
              <h3>Pagos por tarjeta y sueldo</h3>
            </div>
            <label className="projection-control projection-card-filter">
              Tarjeta
              <select value={selectedCardId} onChange={(event) => setSelectedCardId(event.target.value)}>
                <option value="all">Todas las tarjetas</option>
                {cardOptions.map((card) => <option key={card.id} value={card.id}>{card.label}</option>)}
              </select>
            </label>
          </div>
          <p className="projection-table-help">Cada columna indica el sueldo y el resumen que cubre. El total suma las tarjetas visibles.</p>

          {projectionRows.length ? (
            <div className="registry-table-wrap projection-table-wrap">
              <table className="registry-table projection-table">
                <thead>
                  <tr>
                    <th>Tarjeta</th>
                    {months.map((month, index) => (
                      <th className={`month-heading ${getProjectionColumnClass(index)}`} key={month.key}>
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
                        <td className={getProjectionColumnClass(index)} key={`${row.id}-${months[index].key}`}>
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
                      <td className={getProjectionColumnClass(index)} key={months[index].key}>
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
              <p>{selectedCardId === "all" ? "Cargá consumos con cuotas pendientes para ver la proyección." : "Esta tarjeta no tiene consumos proyectados."}</p>
            </div>
          )}
        </section>
      </section>
    </section>
  );
}

function getProjectionColumnClass(index) {
  if (index === 0) return "projection-priority-month";
  if (index === 1) return "projection-secondary-month";
  return "";
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
    if (expense.isPaidByOther || expense.isSaved) return sum;
    const ownAmount = expense.isSharedHalf ? expense.amount / 2 : expense.amount;
    return sum + ownAmount * expense.installments;
  }, 0);
  const reliefIndex = monthlyTotals.findIndex((amount, index) => amount > 0 && (monthlyTotals[index + 1] ?? 0) < amount);

  return {
    activeInstallmentExpenses: installmentExpenses.length,
    nextReliefAmount: reliefIndex >= 0 ? monthlyTotals[reliefIndex] - (monthlyTotals[reliefIndex + 1] ?? 0) : 0,
    nextReliefLabel: reliefIndex >= 0 ? `Desde sueldo ${months[reliefIndex + 1]?.salaryLabel}` : "Sin baja proyectada en este período",
    totalDebt,
  };
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
    const salaryDate = new Date(salaryMonth.year, salaryMonth.monthIndex, 1);
    const statementDate = new Date(paymentMonth.year, paymentMonth.monthIndex, 1);
    const salaryLabel = salaryDate.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    const statementLabel = statementDate.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

    return {
      key: `${paymentMonth.year}-${paymentMonth.monthIndex}`,
      paymentMonthOffset: index,
      salaryLabel: capitalizeDateLabel(salaryLabel),
      statementLabel: capitalizeDateLabel(statementLabel),
      shortSalaryLabel: capitalizeDateLabel(salaryDate.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }).replace(".", "")),
      shortStatementLabel: capitalizeDateLabel(statementDate.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }).replace(".", "")),
    };
  });
}

function capitalizeDateLabel(label) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}
