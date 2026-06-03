import React, { useState } from "react";
import { Plus, ReceiptText, Trash2 } from "lucide-react";
import { currency } from "../../utils/formatters.js";

// Modulo generico para Departamento, Suscripciones, Actividades y Extras.
// Recibe la configuracion de la seccion desde FinanceApp para evitar duplicar pantallas casi iguales.
export default function SimpleExpenseModule({ module, onAdd, onRemove }) {
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
          emptyMessage={module.emptyMessage}
          expenses={module.expenses}
          onRemove={(expenseId) => onRemove(module.storageKey, expenseId)}
        />
      </section>
    </section>
  );
}

// Formulario simple de nombre + monto para gastos fijos no asociados a tarjeta.
function FixedExpenseForm({ namePlaceholder = "Ej: luz", onSubmit }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!name.trim() || parsedAmount <= 0) {
      return;
    }

    onSubmit({
      name: name.trim(),
      amount: parsedAmount,
    });

    setName("");
    setAmount("");
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
        <input
          min="1"
          placeholder="10000"
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
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
  emptyMessage = "Todavia no cargaste gastos fijos del departamento.",
  expenses,
  onRemove,
}) {
  if (!expenses.length && !cardExpenses.length) {
    return (
      <div className="empty-state">
        <ReceiptText size={28} />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="expense-table fixed-expense-table">
      <div className="table-header fixed-table-row">
        <span>Nombre</span>
        <span>Monto</span>
        <span aria-label="Acciones" />
      </div>

      {expenses.map((expense) => (
        <div className="table-row fixed-table-row" key={expense.id}>
          <strong>{expense.name}</strong>
          <span>{currency.format(expense.amount)}</span>
          <button
            aria-label={`Eliminar ${expense.name}`}
            className="icon-button"
            onClick={() => onRemove(expense.id)}
            title="Eliminar gasto"
            type="button"
          >
            <Trash2 size={17} />
          </button>
        </div>
      ))}

      {cardExpenses.map((expense) => (
        <div className="table-row fixed-table-row card-paid-row" key={`card-${expense.id}`}>
          <strong>
            <span>{expense.name}</span>
            <small>Pagado con tarjeta {expense.source}</small>
          </strong>
          <span>{currency.format(expense.amount)}</span>
          <span className="card-paid-badge">Ya incluido en Tarjetas</span>
        </div>
      ))}
    </div>
  );
}
