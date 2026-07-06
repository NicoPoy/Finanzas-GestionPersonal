import React, { useState } from "react";
import { Pencil, Plus, ReceiptText, Trash2, CreditCard } from "lucide-react";
import MoneyInput from "../../components/forms/MoneyInput.jsx";
import { currency } from "../../utils/formatters.js";
import "./simpleExpenses.css";

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
          <p className="total-note">Los gastos pagados con tarjeta se muestran abajo, pero ya están incluidos en Tarjetas.</p>
        ) : null}

        <FixedExpenseList
          cardExpenses={module.cardExpenses}
          debitCards={module.debitCards}
          emptyMessage={module.emptyMessage}
          expenses={module.expenses}
          icon={Icon}
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
  icon: Icon,
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
      <div className="expense-card-list">
        {expenses.map((expense) => (
          <SimpleExpenseRow
            expense={expense}
            icon={Icon}
            key={expense.id}
            onDelete={() => onRemove(expense.id)}
            onEdit={() => startEdit(expense)}
          />
        ))}

        {cardExpenses.map((expense) => (
          <article className="expense-card item-card-paid" key={`card-${expense.id}`}>
            <div className="expense-card-left">
              <div className="expense-card-icon card-icon-secondary">
                <CreditCard size={18} />
              </div>
              <div className="expense-card-info">
                <h4>{expense.name}</h4>
                <p>
                  <span>Vence: Día {expense.dueDay ?? 10}</span>
                  <span className="bullet">•</span>
                  <span>Tarjeta: {expense.source}</span>
                </p>
              </div>
            </div>
            <div className="expense-card-right">
              <span className="expense-card-amount">{currency.format(expense.amount)}</span>
              <span className="card-paid-badge">Incluido en Tarjetas</span>
            </div>
          </article>
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

function SimpleExpenseRow({ expense, icon: Icon, onDelete, onEdit }) {
  return (
    <article className="expense-card item-active" key={expense.id}>
      <div className="expense-card-left">
        <div className="expense-card-icon">
          <Icon size={18} />
        </div>
        <div className="expense-card-info">
          <h4>{expense.name}</h4>
          <p>
            <span>Vence: Día {expense.dueDay ?? 10}</span>
            <span className="bullet">•</span>
            <span>Debita de: {expense.paymentCard || "Sin asociar"}</span>
          </p>
        </div>
      </div>
      <div className="expense-card-right">
        <span className="expense-card-amount">{currency.format(expense.amount)}</span>
        <div className="expense-card-actions">
          <button className="icon-button btn-edit-expense" onClick={onEdit} title="Editar gasto" type="button">
            <Pencil size={15} />
          </button>
          <button
            aria-label={`Eliminar ${expense.name}`}
            className="icon-button btn-delete-expense"
            onClick={onDelete}
            title="Eliminar gasto"
            type="button"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
