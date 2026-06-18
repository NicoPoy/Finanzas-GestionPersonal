import React, { useEffect, useState } from "react";
import { Check, Pencil, PiggyBank, ReceiptText, Trash2, X } from "lucide-react";
import MoneyInput from "../../components/forms/MoneyInput.jsx";
import {
  getExpenseSavings,
  getCardSummarySavings,
  getNetExpenseAmount,
  getOwnExpenseAmount,
  isExpenseSaved,
  isFixedCardExpense,
  isPaidByOther,
  isSharedHalf,
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
  const [showNextMonthSummary, setShowNextMonthSummary] = useState(false);
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
      isSharedHalf: isSharedHalf(expense),
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
      isSharedHalf: !draft.isPaidByOther && draft.isSharedHalf,
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

  const currentMonthGrossTotal = card.expenses.reduce((sum, expense) => sum + getCurrentMonthGrossAmount(expense), 0);
  const currentMonthNetTotal = Math.max(
    card.expenses.reduce((sum, expense) => sum + getOwnExpenseAmount(expense), 0) - summarySavings,
    0,
  );
  const nextMonthGrossTotal = card.expenses.reduce((sum, expense) => sum + getNextMonthGrossAmount(expense), 0);
  const nextMonthNetTotal = Math.max(
    card.expenses.reduce((sum, expense) => sum + getNextMonthNetAmount(expense), 0) - summarySavings,
    0,
  );
  const parsedSummarySavingsDraft = Number(summarySavingsDraft) || 0;
  const canSaveSummarySavings =
    parsedSummarySavingsDraft >= 0 && parsedSummarySavingsDraft !== summarySavings && Boolean(onUpdateSummarySavings);
  const sortedExpenses = [...card.expenses].sort(compareCardExpenses);

  return (
    <>
      <div className="expense-table card-expense-table" style={{ "--card-accent": card.accent || "#2563eb" }}>
        <div className="table-header">
          <span>Origen</span>
          <span>Por mes</span>
          <span>Cuotas</span>
          <span>Ahorro</span>
          <span>Neto</span>
          <span>Pendiente</span>
          <span aria-label="Acciones" />
        </div>

        {sortedExpenses.map((expense) => {
          const savings = getExpenseSavings(expense);
          const ownAmount = getOwnExpenseAmount(expense);
          const isSaved = Boolean(expense.isSaved);
          const isHalfShared = isSharedHalf(expense);
          const fixedCategoryName =
            fixedCategories.find((category) => category.id === expense.fixedCategory)?.name || "Sin seccion";
          const isFinalPayment = !isFixedCardExpense(expense) && Number(expense.installments) === 1;
          const pendingValue = isFixedCardExpense(expense)
            ? null
            : ownAmount +
              (isPaidByOther(expense)
                ? 0
                : (isHalfShared ? expense.amount / 2 : expense.amount) * Math.max(expense.installments - 1, 0));
          const isEditingSavings = editingExpenseId === expense.id;
          const parsedDraft = Number(draft?.savings);
          const canSaveSavings =
            isEditingSavings && !Number.isNaN(parsedDraft) && parsedDraft >= 0 && parsedDraft <= Number(draft?.amount);

          return (
            <div
              className={`table-row ${isPaidByOther(expense) ? "paid-by-other-row" : ""} ${isHalfShared ? "shared-half-row" : ""} ${isFixedCardExpense(expense) ? "fixed-card-row" : ""} ${isSaved ? "saved-expense-row" : ""} ${isFinalPayment ? "final-payment-row" : ""}`}
              key={expense.id}
            >
              <strong className="origin-cell" data-label="Origen">
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
                      {isFixedCardExpense(expense) ? (
                        <small className="fixed-expense-note">Fijo - {fixedCategoryName}</small>
                      ) : null}
                      {isHalfShared ? <small className="shared-half-note">A medias</small> : null}
                    </span>
                    {isPaidByOther(expense) ? <small>Lo paga otra persona</small> : null}
                    {isHalfShared ? <small>Pago la mitad</small> : null}
                  </>
                )}
              </strong>
              <span className="money-cell monthly-cell" data-label="Por mes">
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
              <span className="installments-cell" data-label="Cuotas">
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
              <span className={`money-cell savings-cell ${savings === 0 ? "zero-value-cell" : ""}`} data-label="Ahorro">
                {isEditingSavings ? (
                  <MoneyInput
                    aria-label={`Ahorro de ${expense.origin}`}
                    className="savings-input"
                    value={draft.savings}
                    onValueChange={(value) => updateDraft("savings", value)}
                  />
                ) : (
                  formatTableAmount(savings)
                )}
              </span>
              <span className={`amount-emphasis money-cell net-cell ${ownAmount === 0 ? "zero-value-cell" : ""}`} data-label="Neto">
                {formatTableAmount(ownAmount)}
              </span>
              <span className={`pending-amount money-cell pending-cell ${!isFixedCardExpense(expense) && pendingValue === 0 ? "zero-value-cell" : ""}`} data-label="Pendiente">
                {isFixedCardExpense(expense) ? "Mensual" : formatTableAmount(pendingValue)}
              </span>
              <div className={`row-actions card-row-actions ${isEditingSavings ? "card-row-actions-editing" : ""}`}>
                {isEditingSavings ? (
                  <>
                    <button
                      aria-label={`Guardar ahorro de ${expense.origin}`}
                      className="card-row-action card-row-action-save"
                      disabled={!canSaveSavings}
                      onClick={() => saveSavingsEdit(expense)}
                      title="Guardar ahorro"
                      type="button"
                    >
                      <Check size={17} />
                      <span>Guardar</span>
                    </button>
                    <button
                      aria-label={`Cancelar edicion de ahorro de ${expense.origin}`}
                      className="card-row-action card-row-action-cancel"
                      onClick={cancelSavingsEdit}
                      title="Cancelar"
                      type="button"
                    >
                      <X size={17} />
                      <span>Cancelar</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      aria-label={isSaved ? `Quitar ahorro de ${expense.origin}` : `Marcar ${expense.origin} como ahorrado`}
                      className={`card-row-action card-row-action-saved ${isSaved ? "active" : ""}`}
                      onClick={() => onUpdate(expense.id, { isSaved: !isSaved })}
                      title={isSaved ? "Quitar ahorrado" : "Marcar como ahorrado"}
                      type="button"
                    >
                      <PiggyBank size={16} />
                      <span>{isSaved ? "Quitar" : "Ahorrar"}</span>
                    </button>
                    <button
                      aria-label={`Editar ${expense.origin}`}
                      className="card-row-action card-row-action-edit"
                      onClick={() => startSavingsEdit(expense)}
                      title="Editar gasto"
                      type="button"
                    >
                      <Pencil size={16} />
                      <span>Editar</span>
                    </button>
                    <button
                      aria-label={`Eliminar ${expense.origin}`}
                      className="card-row-action card-row-action-delete"
                      onClick={() => onRemove(expense.id)}
                      title="Eliminar gasto"
                      type="button"
                    >
                      <Trash2 size={17} />
                      <span>Borrar</span>
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
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          isPaidByOther: event.target.checked,
                          isSharedHalf: event.target.checked ? false : current.isSharedHalf,
                        }))
                      }
                    />
                    Lo paga otra persona
                  </label>
                </div>
              ) : null}
              {isEditingSavings ? (
                <div className="row-edit-extra">
                  <label className="checkbox-field inline-checkbox-field">
                    <input
                      checked={draft.isSharedHalf}
                      type="checkbox"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          isPaidByOther: event.target.checked ? false : current.isPaidByOther,
                          isSharedHalf: event.target.checked,
                        }))
                      }
                    />
                    A medias
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

      <section className="card-summary-breakdown">
        <div className="card-summary-heading">
          <span>Resumen</span>
          <button
            className="summary-toggle-button"
            onClick={() => setShowNextMonthSummary((current) => !current)}
            type="button"
          >
            {showNextMonthSummary ? "Ocultar proximo mes" : "Mostrar proximo mes"}
          </button>
        </div>
        <div className="card-summary-groups">
          <SummaryGroup
            variant="current"
            title="Resumen de este mes"
            grossLabel="Neto sin ahorros"
            grossTotal={currentMonthGrossTotal}
            netLabel="Neto con ahorros"
            netTotal={currentMonthNetTotal}
          />
          {showNextMonthSummary ? (
            <SummaryGroup
              variant="next"
              title="Resumen del proximo mes"
              grossLabel="Neto sin ahorros"
              grossTotal={nextMonthGrossTotal}
              netLabel="Neto con ahorros"
              netTotal={nextMonthNetTotal}
            />
          ) : null}
        </div>
      </section>
    </>
  );
}

function SummaryGroup({ grossLabel, grossTotal, netLabel, netTotal, title, variant }) {
  return (
    <article className={`card-summary-group card-summary-group-${variant}`}>
      <h3>{title}</h3>
      <div>
        <span>{grossLabel}</span>
        <strong>{currency.format(grossTotal)}</strong>
      </div>
      <div className="summary-net-row">
        <span>{netLabel}</span>
        <strong>{currency.format(netTotal)}</strong>
      </div>
    </article>
  );
}

function formatTableAmount(value) {
  return Number(value) === 0 ? "•" : currency.format(value);
}

function compareCardExpenses(firstExpense, secondExpense) {
  const firstSaved = isExpenseSaved(firstExpense) ? 1 : 0;
  const secondSaved = isExpenseSaved(secondExpense) ? 1 : 0;

  if (firstSaved !== secondSaved) {
    return firstSaved - secondSaved;
  }

  const firstInstallments = getSortableInstallments(firstExpense);
  const secondInstallments = getSortableInstallments(secondExpense);

  if (firstInstallments !== secondInstallments) {
    return firstInstallments - secondInstallments;
  }

  const firstNetAmount = getOwnExpenseAmount(firstExpense);
  const secondNetAmount = getOwnExpenseAmount(secondExpense);

  if (firstNetAmount !== secondNetAmount) {
    return firstNetAmount - secondNetAmount;
  }

  return String(firstExpense.origin).localeCompare(String(secondExpense.origin), "es");
}

function getSortableInstallments(expense) {
  if (isFixedCardExpense(expense)) {
    return Number.POSITIVE_INFINITY;
  }

  return Number(expense.installments) || 0;
}

function getCurrentMonthGrossAmount(expense) {
  if (isPaidByOther(expense)) {
    return 0;
  }

  const amount = Number(expense.amount) || 0;

  return isSharedHalf(expense) ? amount / 2 : amount;
}

function getNextMonthGrossAmount(expense) {
  if (isPaidByOther(expense) || isFixedCardExpense(expense)) {
    if (!isFixedCardExpense(expense) || isPaidByOther(expense)) {
      return 0;
    }

    const amount = Number(expense.amount) || 0;

    return isSharedHalf(expense) ? amount / 2 : amount;
  }

  const amount = Number(expense.amount) || 0;

  return Number(expense.installments) > 1 ? (isSharedHalf(expense) ? amount / 2 : amount) : 0;
}

function getNextMonthNetAmount(expense) {
  if (isPaidByOther(expense) || isExpenseSaved(expense)) {
    return 0;
  }

  if (isFixedCardExpense(expense)) {
    return getNetExpenseAmount(expense);
  }

  return Number(expense.installments) > 1 ? getNetExpenseAmount(expense) : 0;
}
