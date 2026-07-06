import React, { useEffect, useState } from "react";
import { CalendarDays, Check, CreditCard, Pencil, PiggyBank, ReceiptText, Split, Trash2, UserRound } from "lucide-react";
import MoneyInput from "../../components/forms/MoneyInput.jsx";
import {
  getExpenseSavings,
  getCardSummarySavings,
  getExpenseSavingsLimit,
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
  onUpdateSummarySavings,
  showNextMonthTable = false,
}) {
  const [editingExpenseId, setEditingExpenseId] = useState("");
  const [draft, setDraft] = useState(null);
  const [showNextMonthSummary, setShowNextMonthSummary] = useState(false);
  const summarySavings = getCardSummarySavings(card);
  const [summarySavingsDraft, setSummarySavingsDraft] = useState(summarySavings ? String(summarySavings) : "");
  const previewCard = showNextMonthTable ? buildCardAfterPayment(card) : card;
  const previewSummarySavings = showNextMonthTable ? Math.min(summarySavings, getPreviewSummarySavingsLimit(previewCard)) : summarySavings;

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
    const savingsLimit = getExpenseSavingsLimit({
      amount: parsedAmount,
      isSharedHalf: !draft.isPaidByOther && draft.isSharedHalf,
    });

    if (
      !draft.origin.trim() ||
      parsedAmount <= 0 ||
      parsedSavings < 0 ||
      parsedSavings > savingsLimit ||
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
  const previewNetTotal = Math.max(
    previewCard.expenses.reduce((sum, expense) => sum + getOwnExpenseAmount(expense), 0) - previewSummarySavings,
    0,
  );
  const parsedSummarySavingsDraft = Number(summarySavingsDraft) || 0;
  const canSaveSummarySavings =
    parsedSummarySavingsDraft >= 0 && parsedSummarySavingsDraft !== summarySavings && Boolean(onUpdateSummarySavings);
  const sortedExpenses = [...previewCard.expenses].sort(compareCardExpenses);
  const editingExpense = draft ? card.expenses.find((expense) => expense.id === editingExpenseId) : null;
  const parsedDraftSavings = Number(draft?.savings);
  const draftSavingsLimit = draft
    ? getExpenseSavingsLimit({
        amount: Number(draft.amount),
        isSharedHalf: !draft.isPaidByOther && draft.isSharedHalf,
      })
    : 0;
  const parsedDraftAmount = Number(draft?.amount);
  const parsedDraftInstallments = draft?.expenseType === "single" ? 1 : Number(draft?.installments);
  const canSaveExpenseEdit =
    Boolean(editingExpense) &&
    Boolean(draft?.origin.trim()) &&
    parsedDraftAmount > 0 &&
    !Number.isNaN(parsedDraftSavings) &&
    parsedDraftSavings >= 0 &&
    parsedDraftSavings <= draftSavingsLimit &&
    (draft?.expenseType === "fixed" || parsedDraftInstallments > 0);

  return (
    <>
      {showNextMonthTable ? (
        <section className="payment-preview-banner" aria-live="polite">
          <div>
            <strong>Vista del mes siguiente</strong>
            <span>Asi quedaria la tabla despues de registrar el pago: baja una cuota y desaparecen las finalizadas.</span>
          </div>
          <strong>{currency.format(previewNetTotal)}</strong>
        </section>
      ) : null}

      <div className="expense-card-list card-expense-card-list" style={{ "--card-accent": card.accent || "#2563eb" }}>
        {sortedExpenses.length ? sortedExpenses.map((expense) => {
          const savings = getExpenseSavings(expense);
          const ownAmount = getOwnExpenseAmount(expense);
          const isSaved = Boolean(expense.isSaved);
          const isHalfShared = isSharedHalf(expense);
          const fixedCategoryName =
            fixedCategories.find((category) => category.id === expense.fixedCategory)?.name || "Sin seccion";
          const isFinalPayment = !isFixedCardExpense(expense) && Number(expense.installments) === 1;
          const visualTag = getExpenseVisualTag({
            isFinalPayment,
            isFixed: isFixedCardExpense(expense),
            isHalfShared,
            isPaidByOther: isPaidByOther(expense),
            isSaved,
          });
          const pendingValue = isFixedCardExpense(expense)
            ? null
            : ownAmount +
              (isPaidByOther(expense)
                ? 0
                : (isHalfShared ? expense.amount / 2 : expense.amount) * Math.max(expense.installments - 1, 0));

          // Select icon based on tag
          let IconComponent = CreditCard;
          if (isSaved) IconComponent = PiggyBank;
          else if (isPaidByOther(expense)) IconComponent = UserRound;
          else if (isHalfShared) IconComponent = Split;
          else if (isFixedCardExpense(expense)) IconComponent = ReceiptText;
          else if (isFinalPayment) IconComponent = CalendarDays;

          return (
            <article
              className={`expense-card card-expense-card card-row-tag-${visualTag} ${isPaidByOther(expense) ? "paid-by-other-row" : ""} ${isHalfShared ? "shared-half-row" : ""} ${isFixedCardExpense(expense) ? "fixed-card-row" : ""} ${isSaved ? "saved-expense-row" : ""} ${isFinalPayment ? "final-payment-row" : ""}`}
              key={expense.id}
            >
              <div className="expense-card-left">
                <div className="expense-card-icon card-icon-box" style={{ color: "var(--card-accent)", background: getIconBgColor(card.accent) }}>
                  <IconComponent size={18} />
                </div>
                <div className="expense-card-info">
                  <h4 className="expense-title-line">
                    {expense.origin}
                    {isFinalPayment && <span className="badge-tag tag-final">Última</span>}
                    {isSaved && <span className="badge-tag tag-saved">Ahorrado</span>}
                    {isFixedCardExpense(expense) && (
                      <span className="badge-tag tag-fixed">Fijo • {fixedCategoryName}</span>
                    )}
                    {isHalfShared && <span className="badge-tag tag-shared">A medias</span>}
                    {isPaidByOther(expense) && <span className="badge-tag tag-other">Paga otro</span>}
                  </h4>
                  <p>
                    <span>Monto cuotas: {currency.format(expense.amount)}</span>
                    <span className="bullet">•</span>
                    <span>
                      {isFixedCardExpense(expense) ? (
                        <strong>Fijo</strong>
                      ) : expense.installments === 1 ? (
                        <strong>Compra única</strong>
                      ) : (
                        <strong>Restan {expense.installments} cuotas</strong>
                      )}
                    </span>
                    {savings > 0 && (
                      <>
                        <span className="bullet">•</span>
                        <span>Ahorro: -{currency.format(savings)}</span>
                      </>
                    )}
                    {!isFixedCardExpense(expense) && pendingValue > 0 && (
                      <>
                        <span className="bullet">•</span>
                        <span>Pendiente: {currency.format(pendingValue)}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="expense-card-right">
                <span className="expense-card-amount">
                  {currency.format(ownAmount)}
                </span>
                <div className="expense-card-actions">
                  {showNextMonthTable ? (
                    <span className="preview-only-pill">Vista</span>
                  ) : (
                    <>
                      <button
                        aria-label={isSaved ? `Quitar ahorro de ${expense.origin}` : `Marcar ${expense.origin} como ahorrado`}
                        className={`icon-button btn-save-action ${isSaved ? "active" : ""}`}
                        onClick={() => onUpdate(expense.id, { isSaved: !isSaved })}
                        title={isSaved ? "Quitar ahorrado" : "Marcar como ahorrado"}
                        type="button"
                      >
                        <PiggyBank size={15} />
                      </button>
                      <button
                        aria-label={`Editar ${expense.origin}`}
                        className="icon-button btn-edit-expense"
                        onClick={() => startSavingsEdit(expense)}
                        title="Editar gasto"
                        type="button"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        aria-label={`Eliminar ${expense.origin}`}
                        className="icon-button btn-delete-expense"
                        onClick={() => onRemove(expense.id)}
                        title="Eliminar gasto"
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        }) : (
          <div className="empty-state">
            <ReceiptText size={28} />
            <p>No quedarían consumos pendientes para el mes siguiente.</p>
          </div>
        )}
      </div>

      {!showNextMonthTable && editingExpense && draft ? (
        <div className="confirm-backdrop" role="presentation">
          <section
            aria-labelledby="card-expense-edit-title"
            aria-modal="true"
            className="confirm-modal card-expense-edit-modal"
            role="dialog"
          >
            <h2 id="card-expense-edit-title">Editar gasto</h2>
            <form
              className="card-expense-edit-form"
              onSubmit={(event) => {
                event.preventDefault();
                saveSavingsEdit(editingExpense);
              }}
            >
              <label>
                Origen
                <input
                  autoComplete="off"
                  value={draft.origin}
                  onChange={(event) => updateDraft("origin", event.target.value)}
                />
              </label>
              <label>
                Monto cuota
                <MoneyInput value={draft.amount} onValueChange={(value) => updateDraft("amount", value)} />
              </label>
              <label>
                Tipo
                <select
                  value={draft.expenseType}
                  onChange={(event) => updateDraft("expenseType", event.target.value)}
                >
                  <option value="installments">Cuotas</option>
                  <option value="single">Unica</option>
                  <option value="fixed">Fijo</option>
                </select>
              </label>
              {draft.expenseType === "installments" ? (
                <label>
                  Cuotas
                  <input
                    min="1"
                    type="number"
                    value={draft.installments}
                    onChange={(event) => updateDraft("installments", event.target.value)}
                  />
                </label>
              ) : null}
              {draft.expenseType === "fixed" ? (
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
              ) : null}
              <label>
                Ahorro
                <MoneyInput value={draft.savings} onValueChange={(value) => updateDraft("savings", value)} />
              </label>
              <div className="card-expense-edit-flags">
                <button
                  aria-pressed={draft.isPaidByOther}
                  className={`paid-by-other-field ${draft.isPaidByOther ? "active" : ""}`}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      isPaidByOther: !current.isPaidByOther,
                      isSharedHalf: !current.isPaidByOther ? false : current.isSharedHalf,
                    }))
                  }
                  type="button"
                >
                  <span className="paid-by-other-check">
                    {draft.isPaidByOther ? <Check size={14} /> : <UserRound size={15} />}
                  </span>
                  <span>
                    <strong>Otra persona</strong>
                    <small>No lo pago yo</small>
                  </span>
                </button>
                <button
                  aria-pressed={draft.isSharedHalf}
                  className={`paid-by-other-field shared-half-field ${draft.isSharedHalf ? "active" : ""}`}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      isPaidByOther: current.isSharedHalf ? current.isPaidByOther : false,
                      isSharedHalf: !current.isSharedHalf,
                    }))
                  }
                  type="button"
                >
                  <span className="paid-by-other-check">
                    {draft.isSharedHalf ? <Check size={14} /> : <Split size={15} />}
                  </span>
                  <span>
                    <strong>A medias</strong>
                    <small>Pago la mitad</small>
                  </span>
                </button>
              </div>
              <div className="confirm-actions">
                <button className="confirm-button confirm-button-secondary" onClick={cancelSavingsEdit} type="button">
                  Cancelar
                </button>
                <button className="confirm-button confirm-button-primary" disabled={!canSaveExpenseEdit} type="submit">
                  Guardar cambios
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {!showNextMonthTable ? (
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
      ) : null}

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

function buildCardAfterPayment(card) {
  return {
    ...card,
    expenses: card.expenses
      .map((expense) => {
        if (isFixedCardExpense(expense)) {
          return expense;
        }

        return {
          ...expense,
          installments: Math.max((Number(expense.installments) || 1) - 1, 0),
        };
      })
      .filter((expense) => isFixedCardExpense(expense) || expense.installments > 0),
  };
}

function getPreviewSummarySavingsLimit(card) {
  return card.expenses.reduce((sum, expense) => sum + getOwnExpenseAmount(expense), 0);
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
    return getOwnExpenseAmount(expense);
  }

  return Number(expense.installments) > 1 ? getOwnExpenseAmount(expense) : 0;
}

function getExpenseVisualTag({ isFinalPayment, isFixed, isHalfShared, isPaidByOther, isSaved }) {
  if (isSaved) return "saved";
  if (isPaidByOther) return "other";
  if (isFixed) return "fixed";
  if (isHalfShared) return "shared";
  if (isFinalPayment) return "final";
  return "normal";
}

function getIconBgColor(accent) {
  if (accent && accent.startsWith("#")) {
    const hex = accent.replace("#", "");
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return `rgba(${r}, ${g}, ${b}, 0.1)`;
      }
    } else if (hex.length === 3) {
      const r = parseInt(hex.substring(0, 1) + hex.substring(0, 1), 16);
      const g = parseInt(hex.substring(1, 2) + hex.substring(1, 2), 16);
      const b = parseInt(hex.substring(2, 3) + hex.substring(2, 3), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return `rgba(${r}, ${g}, ${b}, 0.1)`;
      }
    }
  }
  return "rgba(93, 182, 198, 0.1)"; // default fallback color
}
