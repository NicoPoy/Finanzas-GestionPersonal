import React, { useEffect, useState } from "react";
import { Check, Pencil, PiggyBank, ReceiptText, Trash2, X } from "lucide-react";
import MoneyInput from "../../components/forms/MoneyInput.jsx";
import {
  applyCardSummarySavings,
  getExpenseSavings,
  getCardSummarySavings,
  getNextMonthCardExpenseAmount,
  getOwnExpenseAmount,
  isFixedCardExpense,
  isPaidByOther,
} from "../../domain/financeCalculations.js";
import { currency } from "../../utils/formatters.js";

// Tabla de consumos de una tarjeta, con edicion puntual del ahorro de cada cuota.
export default function CardExpenseList({
  card,
  fixedCategories = [],
  onRemove,
  onUpdate,
  onUpdateSavings,
  onUpdateSummarySavings,
}) {
  const [editingExpenseId, setEditingExpenseId] = useState("");
  const [draft, setDraft] = useState(null);
  const summarySavings = getCardSummarySavings(card);
  const [summarySavingsDraft, setSummarySavingsDraft] = useState(summarySavings ? String(summarySavings) : "");

  useEffect(() => {
    setSummarySavingsDraft(summarySavings ? String(summarySavings) : "");
  }, [card?.id, summarySavings]);

  if (!card?.expenses.length) {
    return (
      <div className="empty-state">
        <ReceiptText size={28} />
        <p>Todavia no cargaste gastos para esta tarjeta.</p>
      </div>
    );
  }

  function startSavingsEdit(expense) {
    setEditingExpenseId(expense.id);
    setDraft({
      amount: String(expense.amount),
      expenseType: isFixedCardExpense(expense) ? "fixed" : expense.installments === 1 ? "single" : "installments",
      fixedCategory: expense.fixedCategory || fixedCategories[0]?.id || "subscriptions",
      installments: String(expense.installments || ""),
      isPaidByOther: isPaidByOther(expense),
      origin: expense.origin,
      savings: String(getExpenseSavings(expense)),
    });
  }

  function cancelSavingsEdit() {
    setEditingExpenseId("");
    setDraft(null);
  }

  function saveSavingsEdit(expense) {
    const parsedAmount = Number(draft.amount);
    const parsedSavings = Number(draft.savings) || 0;
    const isFixed = draft.expenseType === "fixed";
    const parsedInstallments = draft.expenseType === "single" ? 1 : Number(draft.installments);

    if (
      !draft.origin.trim() ||
      parsedAmount <= 0 ||
      parsedSavings < 0 ||
      parsedSavings > parsedAmount ||
      (!isFixed && parsedInstallments <= 0)
    ) {
      return;
    }

    onUpdate(expense.id, {
      amount: parsedAmount,
      fixedCategory: isFixed ? draft.fixedCategory || fixedCategories[0]?.id || "" : "",
      installments: isFixed ? 0 : parsedInstallments,
      isFixed,
      isPaidByOther: draft.isPaidByOther,
      origin: draft.origin.trim(),
      savings: parsedSavings,
    });
    cancelSavingsEdit();
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function saveSummarySavings(event) {
    event.preventDefault();

    const parsedSavings = Number(summarySavingsDraft) || 0;

    if (parsedSavings < 0 || parsedSavings === summarySavings || !onUpdateSummarySavings) {
      return;
    }

    onUpdateSummarySavings(parsedSavings);
  }

  const resumenSubtotal = card.expenses.reduce((sum, expense) => sum + getOwnExpenseAmount(expense), 0);
  const resumenTotal = applyCardSummarySavings(resumenSubtotal, card);
  const nextMonthSubtotal = card.expenses.reduce((sum, expense) => sum + getNextMonthCardExpenseAmount(expense), 0);
  const nextMonthTotal = applyCardSummarySavings(nextMonthSubtotal, card);
  const hasSummarySavings = summarySavings > 0;
  const parsedSummarySavingsDraft = Number(summarySavingsDraft) || 0;
  const canSaveSummarySavings =
    parsedSummarySavingsDraft >= 0 && parsedSummarySavingsDraft !== summarySavings && Boolean(onUpdateSummarySavings);

  return (
    <>
      <div className="expense-table">
        <div className="table-header">
          <span>Origen</span>
          <span>Por mes</span>
          <span>Cuotas</span>
          <span>Ahorro</span>
          <span>Neto</span>
          <span>Pendiente</span>
          <span aria-label="Acciones" />
        </div>

        {card.expenses.map((expense) => {
          const savings = getExpenseSavings(expense);
          const ownAmount = getOwnExpenseAmount(expense);
          const isSaved = Boolean(expense.isSaved);
          const isFinalPayment = !isFixedCardExpense(expense) && Number(expense.installments) === 1;
          const pendingValue = isFixedCardExpense(expense)
            ? null
            : ownAmount + (isPaidByOther(expense) ? 0 : expense.amount * Math.max(expense.installments - 1, 0));
          const isEditingSavings = editingExpenseId === expense.id;
          const parsedDraft = Number(draft?.savings);
          const canSaveSavings =
            isEditingSavings && !Number.isNaN(parsedDraft) && parsedDraft >= 0 && parsedDraft <= Number(draft?.amount);

          return (
            <div
              className={`table-row ${isPaidByOther(expense) ? "paid-by-other-row" : ""} ${isSaved ? "saved-expense-row" : ""} ${isFinalPayment ? "final-payment-row" : ""}`}
              key={expense.id}
            >
              <strong>
                {isEditingSavings ? (
                  <input
                    className="row-edit-input"
                    value={draft.origin}
                    onChange={(event) => updateDraft("origin", event.target.value)}
                  />
                ) : (
                  <>
                    <span className="expense-origin-line">
                      {expense.origin}
                      {isFinalPayment ? <small className="last-payment-note">Ultima</small> : null}
                      {isSaved ? <small className="saved-expense-note">Ahorrado</small> : null}
                    </span>
                    {isPaidByOther(expense) ? <small>Lo paga otra persona</small> : null}
                  </>
                )}
              </strong>
              <span className="money-cell monthly-cell">
                {isEditingSavings ? (
                  <MoneyInput
                    className="row-edit-input"
                    value={draft.amount}
                    onValueChange={(value) => updateDraft("amount", value)}
                  />
                ) : (
                  currency.format(expense.amount)
                )}
              </span>
              <span className="installments-cell">
                {isEditingSavings ? (
                  <select
                    className="row-edit-input"
                    value={draft.expenseType}
                    onChange={(event) => updateDraft("expenseType", event.target.value)}
                  >
                    <option value="installments">Cuotas</option>
                    <option value="single">Unica</option>
                    <option value="fixed">Fijo</option>
                  </select>
                ) : isFixedCardExpense(expense) ? (
                  <span className="installment-pill installment-pill-fixed">Fijo</span>
                ) : expense.installments === 1 ? (
                  <span className="installment-pill">Unica</span>
                ) : (
                  <span className="installment-pill">{expense.installments}</span>
                )}
              </span>
              <span className="money-cell savings-cell">
                {isEditingSavings ? (
                  <MoneyInput
                    aria-label={`Ahorro de ${expense.origin}`}
                    className="savings-input"
                    value={draft.savings}
                    onValueChange={(value) => updateDraft("savings", value)}
                  />
                ) : (
                  currency.format(savings)
                )}
              </span>
              <span className="amount-emphasis money-cell net-cell">{currency.format(ownAmount)}</span>
              <span className="pending-amount money-cell pending-cell">{isFixedCardExpense(expense) ? "Mensual" : currency.format(pendingValue)}</span>
              <div className="row-actions">
                {isEditingSavings ? (
                  <>
                    <button
                      aria-label={`Guardar ahorro de ${expense.origin}`}
                      className="icon-button icon-button-success"
                      disabled={!canSaveSavings}
                      onClick={() => saveSavingsEdit(expense)}
                      title="Guardar ahorro"
                      type="button"
                    >
                      <Check size={17} />
                    </button>
                    <button
                      aria-label={`Cancelar edicion de ahorro de ${expense.origin}`}
                      className="icon-button icon-button-neutral"
                      onClick={cancelSavingsEdit}
                      title="Cancelar"
                      type="button"
                    >
                      <X size={17} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      aria-label={isSaved ? `Quitar ahorro de ${expense.origin}` : `Marcar ${expense.origin} como ahorrado`}
                      className={`icon-button icon-button-saved ${isSaved ? "active" : ""}`}
                      onClick={() => onUpdate(expense.id, { isSaved: !isSaved })}
                      title={isSaved ? "Quitar ahorrado" : "Marcar como ahorrado"}
                      type="button"
                    >
                      <PiggyBank size={16} />
                    </button>
                    <button
                      aria-label={`Editar ${expense.origin}`}
                      className="icon-button icon-button-neutral"
                      onClick={() => startSavingsEdit(expense)}
                      title="Editar gasto"
                      type="button"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      aria-label={`Eliminar ${expense.origin}`}
                      className="icon-button"
                      onClick={() => onRemove(expense.id)}
                      title="Eliminar gasto"
                      type="button"
                    >
                      <Trash2 size={17} />
                    </button>
                  </>
                )}
              </div>
              {isEditingSavings && draft.expenseType === "installments" ? (
                <div className="row-edit-extra">
                  <label>
                    Cuotas
                    <input
                      min="1"
                      type="number"
                      value={draft.installments}
                      onChange={(event) => updateDraft("installments", event.target.value)}
                    />
                  </label>
                </div>
              ) : null}
              {isEditingSavings && draft.expenseType === "fixed" ? (
                <div className="row-edit-extra">
                  <label>
                    Seccion
                    <select
                      value={draft.fixedCategory}
                      onChange={(event) => updateDraft("fixedCategory", event.target.value)}
                    >
                      {fixedCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
              {isEditingSavings ? (
                <div className="row-edit-extra">
                  <label className="checkbox-field inline-checkbox-field">
                    <input
                      checked={draft.isPaidByOther}
                      type="checkbox"
                      onChange={(event) => updateDraft("isPaidByOther", event.target.checked)}
                    />
                    Lo paga otra persona
                  </label>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <form className="summary-savings-form" onSubmit={saveSummarySavings}>
        <label>
          Ahorros
          <MoneyInput
            value={summarySavingsDraft}
            onValueChange={setSummarySavingsDraft}
          />
        </label>
        <button disabled={!canSaveSummarySavings} type="submit">
          Guardar
        </button>
      </form>

      <section className="next-month-card-summary card-summary-breakdown">
        <div className="summary-total-row summary-current-row">
          <span>{hasSummarySavings ? "Subtotal de este mes" : "Resumen de este mes"}</span>
          <strong>{currency.format(resumenSubtotal)}</strong>
        </div>
        {hasSummarySavings ? (
          <>
            <div className="summary-savings-row">
              <span>Ahorros</span>
              <strong>- {currency.format(summarySavings)}</strong>
            </div>
            <div className="summary-total-row">
              <span>Resumen de este mes</span>
              <strong>{currency.format(resumenTotal)}</strong>
            </div>
          </>
        ) : null}
        <div className="summary-next-row">
          <span>Resumen del proximo mes</span>
          <strong>{currency.format(nextMonthTotal)}</strong>
        </div>
      </section>
    </>
  );
}
