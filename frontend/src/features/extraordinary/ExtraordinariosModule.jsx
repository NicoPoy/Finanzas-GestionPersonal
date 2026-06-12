import React, { useState } from "react";
import { Check, Plus, ReceiptText, Star } from "lucide-react";
import MoneyInput from "../../components/forms/MoneyInput.jsx";
import { getCalendarMonth } from "../../domain/financeCalculations.js";
import { currency } from "../../utils/formatters.js";

export default function ExtraordinariosModule({ expenses, onAdd, onMarkPaid }) {
  const nextPaymentMonth = getCalendarMonth(1);
  const total = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

  return (
    <section className="workspace single-column">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>Proximo sueldo</p>
            <h2>Extraordinarios</h2>
            <small className="card-statement-note">
              Gastos previstos para {nextPaymentMonth.title}. Al marcarlos como pagados se eliminan de la lista.
            </small>
          </div>
          <Star size={34} strokeWidth={1.7} />
        </div>

        <ExtraordinaryExpenseForm onSubmit={onAdd} />

        <div className="total-strip">
          <span>Total previsto para el proximo mes</span>
          <strong>{currency.format(total)}</strong>
        </div>

        {expenses.length ? (
          <div className="expense-table extraordinarios-table">
            <div className="table-header extraordinarios-table-row">
              <span>Nombre</span>
              <span>Monto</span>
              <span aria-label="Acciones" />
            </div>

            {expenses.map((expense) => (
              <div className="table-row extraordinarios-table-row" key={expense.id}>
                <strong>{expense.name}</strong>
                <span>
                  <strong className="amount-emphasis">{currency.format(expense.amount)}</strong>
                </span>
                <div className="row-actions">
                  <button
                    className="pay-row-button"
                    onClick={() => onMarkPaid(expense.id)}
                    title="Marcar como pagado"
                    type="button"
                  >
                    <Check size={16} />
                    Pagado
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <ReceiptText size={28} />
            <p>Todavia no cargaste gastos extraordinarios para el proximo mes.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function ExtraordinaryExpenseForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!name.trim() || parsedAmount <= 0) {
      return;
    }

    onSubmit({
      amount: parsedAmount,
      name: name.trim(),
    });

    setName("");
    setAmount("");
  }

  return (
    <form className="expense-form fixed-expense-form extraordinarios-form" onSubmit={handleSubmit}>
      <label>
        Nombre
        <input
          autoComplete="off"
          placeholder="Ej: arreglo del auto"
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

      <button type="submit">
        <Plus size={18} />
        Agregar
      </button>
    </form>
  );
}
