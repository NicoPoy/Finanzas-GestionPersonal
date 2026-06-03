import React, { useState } from "react";
import { Check, Pencil, ReceiptText, Trash2, X } from "lucide-react";
import { getExpenseSavings, getNetExpenseAmount, isFixedCardExpense } from "../../domain/financeCalculations.js";
import { currency } from "../../utils/formatters.js";

// Tabla de consumos de una tarjeta, con edicion puntual del ahorro de cada cuota.
export default function CardExpenseList({ card, onRemove, onUpdateSavings }) {
  const [editingExpenseId, setEditingExpenseId] = useState("");
  const [savingsDraft, setSavingsDraft] = useState("");

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
    setSavingsDraft(String(getExpenseSavings(expense)));
  }

  function cancelSavingsEdit() {
    setEditingExpenseId("");
    setSavingsDraft("");
  }

  function saveSavingsEdit(expense) {
    const parsedSavings = Number(savingsDraft);

    if (Number.isNaN(parsedSavings) || parsedSavings < 0 || parsedSavings > expense.amount) {
      return;
    }

    onUpdateSavings(expense.id, parsedSavings);
    cancelSavingsEdit();
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
        const parsedDraft = Number(savingsDraft);
        const canSaveSavings =
          isEditingSavings && !Number.isNaN(parsedDraft) && parsedDraft >= 0 && parsedDraft <= expense.amount;

        return (
          <div className="table-row" key={expense.id}>
            <strong>{expense.origin}</strong>
            <span>{currency.format(expense.amount)}</span>
            <span>
              {isEditingSavings ? (
                <input
                  aria-label={`Ahorro de ${expense.origin}`}
                  className="savings-input"
                  min="0"
                  max={expense.amount}
                  type="number"
                  value={savingsDraft}
                  onChange={(event) => setSavingsDraft(event.target.value)}
                />
              ) : (
                currency.format(savings)
              )}
            </span>
            <span>{currency.format(netAmount)}</span>
            <span>{isFixedCardExpense(expense) ? "Fijo" : expense.installments === 1 ? "Unica" : expense.installments}</span>
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
                    aria-label={`Editar ahorro de ${expense.origin}`}
                    className="icon-button icon-button-neutral"
                    onClick={() => startSavingsEdit(expense)}
                    title="Editar ahorro"
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
          </div>
        );
      })}
    </div>
  );
}
