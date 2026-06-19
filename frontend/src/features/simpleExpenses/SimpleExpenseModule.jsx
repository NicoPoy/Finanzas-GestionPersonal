import React, { useState } from "react";
import { Pencil, Plus, ReceiptText, Trash2 } from "lucide-react";
import MoneyInput from "../../components/forms/MoneyInput.jsx";
import { currency } from "../../utils/formatters.js";

// Modulo generico para Departamento, Suscripciones, Actividades y Extras.
// Recibe la configuracion de la seccion desde FinanceApp para evitar duplicar pantallas casi iguales.
export default function SimpleExpenseModule({ module, onAdd, onRemove, onUpdate }) {
  const Icon = module.icon;

  return (
    <section className="workspace single-column">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>{module.kicker}</p>
            <h2>{module.title}</h2>
          </div>
          <Icon size={34} strokeWidth={1.7} />
        </div>

        <FixedExpenseForm
          debitCards={module.debitCards}
          namePlaceholder={module.namePlaceholder}
          onSubmit={(expense) => onAdd(module.storageKey, expense)}
        />

        <div className="total-strip">
          <span>{module.totalLabel}</span>
          <strong>{currency.format(module.total)}</strong>
        </div>
        {module.cardExpenses?.length ? (
          <p className="total-note">Los gastos pagados con tarjeta se muestran abajo, pero ya estan incluidos en Tarjetas.</p>
        ) : null}

        <FixedExpenseList
          cardExpenses={module.cardExpenses}
          debitCards={module.debitCards}
          emptyMessage={module.emptyMessage}
          expenses={module.expenses}
          onRemove={(expenseId) => onRemove(module.storageKey, expenseId)}
          onUpdate={(expenseId, updates) => onUpdate(module.storageKey, expenseId, updates)}
        />
      </section>
    </section>
  );
}

// Formulario simple de nombre + monto para gastos fijos no asociados a tarjeta.
function FixedExpenseForm({ debitCards = [], namePlaceholder = "Ej: luz", onSubmit }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("10");
  const [paymentCard, setPaymentCard] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!name.trim() || parsedAmount <= 0) {
      return;
    }

    onSubmit({
      name: name.trim(),
      amount: parsedAmount,
      dueDay: Math.min(Math.max(Number(dueDay) || 10, 1), 31),
      paymentCard,
    });

    setName("");
    setAmount("");
    setDueDay("10");
    setPaymentCard("");
  }

  return (
    <form className="expense-form fixed-expense-form" onSubmit={handleSubmit}>
      <label>
        Nombre
        <input
          autoComplete="off"
          placeholder={namePlaceholder}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <label>
        Monto
        <MoneyInput
          value={amount}
          onValueChange={setAmount}
        />
      </label>

      <label>
        Vence dia
        <input
          min="1"
          max="31"
          placeholder="10"
          type="number"
          value={dueDay}
          onChange={(event) => setDueDay(event.target.value)}
        />
      </label>

      <label>
        Debita de
        <select value={paymentCard} onChange={(event) => setPaymentCard(event.target.value)}>
          <option value="">Sin asociar</option>
          {debitCards.map((card) => (
            <option key={card} value={card}>
              {card}
            </option>
          ))}
        </select>
      </label>

      <button type="submit">
        <Plus size={18} />
        Agregar
      </button>
    </form>
  );
}

// Lista gastos propios de la seccion y gastos fijos pagados con tarjeta como referencia no sumable.
function FixedExpenseList({
  cardExpenses = [],
  debitCards = [],
  emptyMessage = "Todavia no cargaste gastos fijos del departamento.",
  expenses,
  onRemove,
  onUpdate,
}) {
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState({ amount: "", dueDay: "", name: "", paymentCard: "" });
  const editingExpense = expenses.find((expense) => expense.id === editingId);
  const parsedDraftAmount = Number(draft.amount);
  const canSaveEdit = Boolean(editingExpense) && draft.name.trim() && parsedDraftAmount > 0;

  function closeEditModal() {
    setEditingId("");
    setDraft({ amount: "", dueDay: "", name: "", paymentCard: "" });
  }

  function startEdit(expense) {
    setEditingId(expense.id);
    setDraft({
      amount: String(expense.amount),
      dueDay: String(expense.dueDay ?? 10),
      name: expense.name,
      paymentCard: expense.paymentCard ?? "",
    });
  }

  function saveEdit() {
    if (!editingExpense || !canSaveEdit) {
      return;
    }

    onUpdate(editingExpense.id, {
      amount: parsedDraftAmount,
      dueDay: Math.min(Math.max(Number(draft.dueDay) || 10, 1), 31),
      name: draft.name.trim(),
      paymentCard: draft.paymentCard,
    });
    closeEditModal();
  }

  if (!expenses.length && !cardExpenses.length) {
    return (
      <div className="empty-state">
        <ReceiptText size={28} />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="expense-table fixed-expense-table">
        <div className="table-header fixed-table-row">
          <span>Nombre</span>
          <span>Monto</span>
          <span>Vence</span>
          <span>Debita de</span>
          <span aria-label="Acciones" />
        </div>

      {expenses.map((expense) => (
        <SimpleExpenseRow
          expense={expense}
          key={expense.id}
          onDelete={() => onRemove(expense.id)}
          onEdit={() => startEdit(expense)}
        />
      ))}

      {cardExpenses.map((expense) => (
        <div className="table-row fixed-table-row card-paid-row" key={`card-${expense.id}`}>
          <strong>
            {expense.name}
            <small>Pagado con tarjeta {expense.source}</small>
          </strong>
          <span className="amount-emphasis">{currency.format(expense.amount)}</span>
          <span>Dia {expense.dueDay ?? 10}</span>
          <span>{expense.paymentCard || "Sin asociar"}</span>
          <span className="card-paid-badge">Ya incluido en Tarjetas</span>
        </div>
      ))}
      </div>

      {editingExpense ? (
        <div className="confirm-backdrop" role="presentation">
          <section
            aria-labelledby="simple-expense-edit-title"
            aria-modal="true"
            className="confirm-modal record-edit-modal"
            role="dialog"
          >
            <h2 id="simple-expense-edit-title">Editar gasto</h2>
            <form
              className="record-edit-form"
              onSubmit={(event) => {
                event.preventDefault();
                saveEdit();
              }}
            >
              <label>
                Nombre
                <input
                  autoComplete="off"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                Monto
                <MoneyInput
                  value={draft.amount}
                  onValueChange={(value) => setDraft((current) => ({ ...current, amount: value }))}
                />
              </label>
              <label>
                Vence dia
                <input
                  max="31"
                  min="1"
                  type="number"
                  value={draft.dueDay}
                  onChange={(event) => setDraft((current) => ({ ...current, dueDay: event.target.value }))}
                />
              </label>
              <label>
                Debita de
                <select
                  value={draft.paymentCard ?? ""}
                  onChange={(event) => setDraft((current) => ({ ...current, paymentCard: event.target.value }))}
                >
                  <option value="">Sin asociar</option>
                  {debitCards.map((card) => (
                    <option key={card} value={card}>
                      {card}
                    </option>
                  ))}
                </select>
              </label>
              <div className="confirm-actions">
                <button className="confirm-button confirm-button-secondary" onClick={closeEditModal} type="button">
                  Cancelar
                </button>
                <button className="confirm-button confirm-button-primary" disabled={!canSaveEdit} type="submit">
                  Guardar cambios
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function SimpleExpenseRow({ expense, onDelete, onEdit }) {
  return (
    <div className="table-row fixed-table-row" key={expense.id}>
      <strong>{expense.name}</strong>
      <span>
        <strong className="amount-emphasis">{currency.format(expense.amount)}</strong>
      </span>
      <span>{`Dia ${expense.dueDay ?? 10}`}</span>
      <span>{expense.paymentCard || "Sin asociar"}</span>
      <div className="row-actions">
        <button className="icon-button icon-button-neutral" onClick={onEdit} title="Editar gasto" type="button">
          <Pencil size={16} />
        </button>
        <button
          aria-label={`Eliminar ${expense.name}`}
          className="icon-button"
          onClick={onDelete}
          title="Eliminar gasto"
          type="button"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}
