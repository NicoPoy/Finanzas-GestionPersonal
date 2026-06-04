import React, { useState } from "react";
import { Check, Pencil, ReceiptText, Trash2, X } from "lucide-react";
import { CARD_FIXED_CATEGORIES } from "../../data/initialData.js";
import { getExpenseSavings, getNetExpenseAmount, isFixedCardExpense } from "../../domain/financeCalculations.js";
import { currency } from "../../utils/formatters.js";

// Tabla de consumos de una tarjeta, con edicion puntual del ahorro de cada cuota.
export default function CardExpenseList({ card, onRemove, onUpdate, onUpdateSavings }) {
  const [editingExpenseId, setEditingExpenseId] = useState("");
  const [draft, setDraft] = useState(null);

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
      fixedCategory: expense.fixedCategory || "subscriptions",
      installments: String(expense.installments || ""),
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
      fixedCategory: isFixed ? draft.fixedCategory : "",
      installments: isFixed ? 0 : parsedInstallments,
      isFixed,
      origin: draft.origin.trim(),
      savings: parsedSavings,
    });
    cancelSavingsEdit();
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="expense-table">
      <div className="table-header">
        <span>Origen</span>
        <span>Por mes</span>
        <span>Ahorro</span>
        <span>Neto</span>
        <span>Cuotas</span>
        <span>Pendiente</span>
        <span aria-label="Acciones" />
      </div>

      {card.expenses.map((expense) => {
        const savings = getExpenseSavings(expense);
        const netAmount = getNetExpenseAmount(expense);
        const pendingValue = isFixedCardExpense(expense)
          ? null
          : netAmount + expense.amount * Math.max(expense.installments - 1, 0);
        const isEditingSavings = editingExpenseId === expense.id;
        const parsedDraft = Number(draft?.savings);
        const canSaveSavings =
          isEditingSavings && !Number.isNaN(parsedDraft) && parsedDraft >= 0 && parsedDraft <= Number(draft?.amount);

        return (
          <div className="table-row" key={expense.id}>
            <strong>
              {isEditingSavings ? (
                <input
                  className="row-edit-input"
                  value={draft.origin}
                  onChange={(event) => updateDraft("origin", event.target.value)}
                />
              ) : (
                expense.origin
              )}
            </strong>
            <span>
              {isEditingSavings ? (
                <input
                  className="row-edit-input"
                  min="1"
                  type="number"
                  value={draft.amount}
                  onChange={(event) => updateDraft("amount", event.target.value)}
                />
              ) : (
                currency.format(expense.amount)
              )}
            </span>
            <span>
              {isEditingSavings ? (
                <input
                  aria-label={`Ahorro de ${expense.origin}`}
                  className="savings-input"
                  min="0"
                  max={draft.amount || undefined}
                  type="number"
                  value={draft.savings}
                  onChange={(event) => updateDraft("savings", event.target.value)}
                />
              ) : (
                currency.format(savings)
              )}
            </span>
            <span>{currency.format(netAmount)}</span>
            <span>
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
                "Fijo"
              ) : expense.installments === 1 ? (
                "Unica"
              ) : (
                expense.installments
              )}
            </span>
            <span>{isFixedCardExpense(expense) ? "Mensual" : currency.format(pendingValue)}</span>
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
                    {Object.entries(CARD_FIXED_CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
