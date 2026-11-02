import React, { useEffect, useState } from "react";
import { CalendarDays, Check, CreditCard, Pencil, PiggyBank, ReceiptText, Search, Split, Trash2, UserRound } from "lucide-react";
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
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseFilter, setExpenseFilter] = useState("all");
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
      expenseType: getCardPurchaseType(expense),
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
      purchaseType: draft.expenseType === "unknown" ? expense.purchaseType : draft.expenseType,
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
  const currentMonthNetBeforeSummarySavings = card.expenses.reduce(
    (sum, expense) => sum + getOwnExpenseAmount(expense),
    0,
  );
  const currentMonthExpenseSavings = Math.max(currentMonthGrossTotal - currentMonthNetBeforeSummarySavings, 0);
  const currentMonthSummarySavings = Math.min(summarySavings, currentMonthNetBeforeSummarySavings);
  const currentMonthNetTotal = Math.max(currentMonthNetBeforeSummarySavings - summarySavings, 0);
  const nextMonthGrossTotal = card.expenses.reduce((sum, expense) => sum + getNextMonthGrossAmount(expense), 0);
  const nextMonthNetBeforeSummarySavings = card.expenses.reduce(
    (sum, expense) => sum + getNextMonthNetAmount(expense),
    0,
  );
  const nextMonthExpenseSavings = Math.max(nextMonthGrossTotal - nextMonthNetBeforeSummarySavings, 0);
  const nextMonthSummarySavings = Math.min(summarySavings, nextMonthNetBeforeSummarySavings);
  const nextMonthNetTotal = Math.max(nextMonthNetBeforeSummarySavings - summarySavings, 0);
  const previewNetTotal = Math.max(
    previewCard.expenses.reduce((sum, expense) => sum + getOwnExpenseAmount(expense), 0) - previewSummarySavings,
    0,
  );
  const parsedSummarySavingsDraft = Number(summarySavingsDraft) || 0;
  const canSaveSummarySavings =
    parsedSummarySavingsDraft >= 0 && parsedSummarySavingsDraft !== summarySavings && Boolean(onUpdateSummarySavings);
  const sortedExpenses = [...previewCard.expenses].sort(compareCardExpenses);
  const searchTerm = expenseSearch.trim().toLocaleLowerCase("es-AR");
  const matchesExpenseFilter = (expense) => {
    if (expenseFilter === "installments") return getCardPurchaseType(expense) === "installments" && Number(expense.installments) > 1;
    if (expenseFilter === "last") return getCardPurchaseType(expense) === "installments" && Number(expense.installments) === 1;
    if (expenseFilter === "single") return getCardPurchaseType(expense) === "single";
    if (expenseFilter === "unknown") return getCardPurchaseType(expense) === "unknown";
    if (expenseFilter === "saved") return isExpenseSaved(expense) || getExpenseSavings(expense) > 0;
    return true;
  };
  const filteredExpenses = sortedExpenses.filter((expense) => {
    const categoryName = fixedCategories.find((category) => category.id === expense.fixedCategory)?.name || "";
    const matchesSearch = !searchTerm || `${expense.origin} ${categoryName}`.toLocaleLowerCase("es-AR").includes(searchTerm);
    return matchesSearch && matchesExpenseFilter(expense);
  });
  const expenseFilterCounts = {
    all: previewCard.expenses.length,
    installments: previewCard.expenses.filter((expense) => getCardPurchaseType(expense) === "installments" && Number(expense.installments) > 1).length,
    last: previewCard.expenses.filter((expense) => getCardPurchaseType(expense) === "installments" && Number(expense.installments) === 1).length,
    single: previewCard.expenses.filter((expense) => getCardPurchaseType(expense) === "single").length,
    unknown: previewCard.expenses.filter((expense) => getCardPurchaseType(expense) === "unknown").length,
    saved: previewCard.expenses.filter((expense) => isExpenseSaved(expense) || getExpenseSavings(expense) > 0).length,
  };
  const expenseGroups = [
    { id: "installments", label: "En cuotas", match: (expense) => getCardPurchaseType(expense) === "installments" && Number(expense.installments) > 1 },
    { id: "last", label: "Última cuota", match: (expense) => getCardPurchaseType(expense) === "installments" && Number(expense.installments) === 1 },
    { id: "single", label: "Compras únicas", match: (expense) => getCardPurchaseType(expense) === "single" },
    { id: "fixed", label: "Gastos fijos", match: (expense) => isFixedCardExpense(expense) },
    { id: "unknown", label: "Tipo por confirmar", match: (expense) => getCardPurchaseType(expense) === "unknown" },
  ]
    .map((group) => {
      const expenses = filteredExpenses.filter(group.match);

      if (group.id === "installments") {
        expenses.sort(compareInstallmentExpenses);
      }

      return {
        ...group,
        expenses,
        total: expenses.reduce((sum, expense) => sum + getOwnExpenseAmount(expense), 0),
      };
    })
    .filter((group) => group.expenses.length > 0);
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

      <section className="card-expense-browser" aria-label="Buscar y filtrar consumos">
        <div className="card-expense-toolbar">
          <label className="card-expense-search">
            <Search size={18} aria-hidden="true" />
            <input
              aria-label="Buscar consumos por nombre o categoría"
              onChange={(event) => setExpenseSearch(event.target.value)}
              placeholder="Buscar consumo o categoría"
              type="search"
              value={expenseSearch}
            />
          </label>
          <div className="card-expense-filters" role="group" aria-label="Filtrar consumos">
            {[
              { id: "all", label: "Todos" },
              { id: "installments", label: "En cuotas" },
              { id: "last", label: "Última cuota" },
              { id: "single", label: "Compra única" },
              ...(expenseFilterCounts.unknown ? [{ id: "unknown", label: "Por confirmar" }] : []),
              { id: "saved", label: "Con ahorro" },
            ].map((filter) => (
              <button
                aria-pressed={expenseFilter === filter.id}
                className={expenseFilter === filter.id ? "active" : ""}
                key={filter.id}
                onClick={() => setExpenseFilter(filter.id)}
                type="button"
              >
                {filter.label}<span>{expenseFilterCounts[filter.id]}</span>
              </button>
            ))}
          </div>
          <p className="card-expense-result-count">
            {filteredExpenses.length} de {sortedExpenses.length} consumos
          </p>
        </div>

        <div className="expense-card-list card-expense-card-list" style={{ "--card-accent": card.accent || "#2563eb" }}>
        {expenseGroups.length ? expenseGroups.flatMap((group) => [
          <div className="card-expense-group-heading" key={`${group.id}-heading`}>
            <h3>{group.label}</h3>
            <div className="card-expense-group-meta">
              <span className="card-expense-group-total">
                <small>Suma de importes</small>
                <strong>{currency.format(group.total)}</strong>
              </span>
              <span className="card-expense-group-count">{group.expenses.length}</span>
            </div>
          </div>,
          ...group.expenses.map((expense) => {
          const savings = getExpenseSavings(expense);
          const ownAmount = getOwnExpenseAmount(expense);
          const isSaved = Boolean(expense.isSaved);
          const isHalfShared = isSharedHalf(expense);
          const purchaseType = getCardPurchaseType(expense);
          const isInstallmentGroup = purchaseType === "installments" && Number(expense.installments) > 1;
          const fixedCategoryName =
            fixedCategories.find((category) => category.id === expense.fixedCategory)?.name || "Sin seccion";
          const isFinalPayment = purchaseType === "installments" && Number(expense.installments) === 1;
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
              className={`expense-card card-expense-card card-row-tag-${visualTag} ${isInstallmentGroup ? "installment-key-facts-row" : ""} ${isPaidByOther(expense) ? "paid-by-other-row" : ""} ${isHalfShared ? "shared-half-row" : ""} ${isFixedCardExpense(expense) ? "fixed-card-row" : ""} ${isSaved ? "saved-expense-row" : ""} ${isFinalPayment ? "final-payment-row" : ""}`}
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
                    {purchaseType === "single" && <span className="badge-tag tag-single">Única</span>}
                    {purchaseType === "unknown" && <span className="badge-tag tag-unknown">Tipo pendiente</span>}
                    {isSaved && <span className="badge-tag tag-saved">Ahorrado</span>}
                    {isFixedCardExpense(expense) && (
                      <span className="badge-tag tag-fixed">Fijo • {fixedCategoryName}</span>
                    )}
                    {isHalfShared && <span className="badge-tag tag-shared">A medias</span>}
                    {isPaidByOther(expense) && <span className="badge-tag tag-other">Paga otro</span>}
                  </h4>
                  {savings > 0 || (isInstallmentGroup && pendingValue > 0) ? <p>
                    {savings > 0 ? (
                      <>
                        <span>Ahorro: -{currency.format(savings)}</span>
                      </>
                    ) : null}
                    {isInstallmentGroup && pendingValue > 0 ? (
                      <>
                        {savings > 0 ? <span className="bullet">•</span> : null}
                        <span>Pendiente: {currency.format(pendingValue)}</span>
                      </>
                    ) : null}
                  </p> : null}
                </div>
              </div>
              <div className={`expense-card-right ${isInstallmentGroup ? "expense-card-right-installments" : "expense-card-right-key-facts"}`}>
                <div className={`card-installment-key-facts ${isInstallmentGroup ? "" : "single"}`} aria-label={isInstallmentGroup ? "Cuotas restantes y monto por cuota" : "Importe"}>
                  {isInstallmentGroup ? (
                    <div className="card-installment-key-fact card-installment-count-fact">
                      <span>Cuotas restantes</span>
                      <strong>{expense.installments}</strong>
                    </div>
                  ) : null}
                  <div className="card-installment-key-fact card-installment-amount-fact">
                    <span>{isInstallmentGroup ? "A pagar por cuota" : isFixedCardExpense(expense) ? "Monto mensual" : "Importe a pagar"}</span>
                    <strong>{currency.format(ownAmount)}</strong>
                  </div>
                </div>
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
        })
        ]) : (
          <div className="empty-state">
            <ReceiptText size={28} />
            <span>
              <p>{sortedExpenses.length ? "No hay consumos que coincidan con la búsqueda o los filtros." : "No quedarían consumos pendientes para el mes siguiente."}</p>
              {sortedExpenses.length && (searchTerm || expenseFilter !== "all") ? (
                <button
                  className="card-expense-reset-filters"
                  onClick={() => {
                    setExpenseSearch("");
                    setExpenseFilter("all");
                  }}
                  type="button"
                >
                  Limpiar búsqueda y filtros
                </button>
              ) : null}
            </span>
          </div>
        )}
        </div>
      </section>

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
                  {draft.expenseType === "unknown" ? <option value="unknown">Tipo por confirmar</option> : null}
                  <option value="installments">Cuotas</option>
                  <option value="single">Compra única</option>
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

      <section className="card-summary-breakdown">
        <div className="card-summary-heading card-summary-heading-rich">
          <div>
            <span>Resumen</span>
            <h3>Balance de la tarjeta</h3>
            <p>Consultá cuánto pagar y cómo impactan los ahorros.</p>
          </div>
          <div className="summary-period-switch" role="group" aria-label="Período del resumen">
            <button
              aria-pressed={!showNextMonthSummary}
              className={!showNextMonthSummary ? "active" : ""}
              onClick={() => setShowNextMonthSummary(false)}
              type="button"
            >
              Este mes
            </button>
            <button
              aria-pressed={showNextMonthSummary}
              className={showNextMonthSummary ? "active" : ""}
              onClick={() => setShowNextMonthSummary(true)}
              type="button"
            >
              Próximo mes
            </button>
          </div>
        </div>

        {!showNextMonthTable ? (
          <form className="summary-savings-form" onSubmit={saveSummarySavings}>
            <div className="summary-savings-copy">
              <span className="summary-savings-icon">
                <PiggyBank size={18} />
              </span>
              <div>
                <strong>Ahorro adicional del resumen</strong>
                <small>{showNextMonthSummary ? "Este importe también se considera en la proyección." : "Se descuenta después de los ahorros registrados en consumos."}</small>
              </div>
            </div>
            <label>
              <span>Monto adicional</span>
              <MoneyInput
                value={summarySavingsDraft}
                onValueChange={setSummarySavingsDraft}
              />
            </label>
            <button disabled={!canSaveSummarySavings} type="submit">
              Guardar ahorro
            </button>
          </form>
        ) : null}

        <div className="card-summary-groups">
          {showNextMonthSummary ? (
            <SummaryGroup
              variant="next"
              title="Proyección del próximo mes"
              grossTotal={nextMonthGrossTotal}
              expenseSavingsTotal={nextMonthExpenseSavings}
              summarySavingsTotal={nextMonthSummarySavings}
              netTotal={nextMonthNetTotal}
            />
          ) : (
            <SummaryGroup
              variant="current"
              title="Resumen de este mes"
              grossTotal={currentMonthGrossTotal}
              expenseSavingsTotal={currentMonthExpenseSavings}
              summarySavingsTotal={currentMonthSummarySavings}
              netTotal={currentMonthNetTotal}
            />
          )}
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

function SummaryGroup({ expenseSavingsTotal, grossTotal, netTotal, summarySavingsTotal, title, variant }) {
  return (
    <article className={`card-summary-preview card-summary-preview-${variant}`}>
      <div className="card-summary-preview-title">
        <span>{variant === "next" ? "Proyeccion" : "Actual"}</span>
        <h3>{title}</h3>
      </div>
      <div className="card-summary-mini-grid">
        <div className="card-summary-mini-card card-summary-mini-card-base">
          <span>Base antes de ahorros</span>
          <strong>{currency.format(grossTotal)}</strong>
        </div>
        <div className="card-summary-mini-card card-summary-mini-card-expense-savings">
          <span>Ahorros en consumos</span>
          <strong>{formatSummaryDeduction(expenseSavingsTotal)}</strong>
        </div>
        <div className="card-summary-mini-card card-summary-mini-card-summary-savings">
          <span>Ahorro adicional</span>
          <strong>{formatSummaryDeduction(summarySavingsTotal)}</strong>
        </div>
      </div>
      <div className="summary-net-row">
        <span>Total a pagar</span>
        <strong>{currency.format(netTotal)}</strong>
      </div>
    </article>
  );
}

function formatSummaryDeduction(value) {
  return value > 0 ? `−${currency.format(value)}` : currency.format(0);
}

function formatTableAmount(value) {
  return Number(value) === 0 ? "•" : currency.format(value);
}

function getCardPurchaseType(expense) {
  if (isFixedCardExpense(expense)) {
    return "fixed";
  }

  if (expense.purchaseType === "single" || expense.purchaseType === "installments") {
    return expense.purchaseType;
  }

  if (expense.purchaseType === "unknown") {
    return "unknown";
  }

  return Number(expense.installments) > 1 ? "installments" : "unknown";
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

function compareInstallmentExpenses(firstExpense, secondExpense) {
  const installmentDifference = Number(firstExpense.installments) - Number(secondExpense.installments);

  if (installmentDifference !== 0) {
    return installmentDifference;
  }

  const amountDifference = getOwnExpenseAmount(firstExpense) - getOwnExpenseAmount(secondExpense);

  if (amountDifference !== 0) {
    return amountDifference;
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
