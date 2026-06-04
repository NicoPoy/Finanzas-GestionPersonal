import React, { useState } from "react";
import { Plus } from "lucide-react";
import { CARD_FIXED_CATEGORIES } from "../../data/initialData.js";

// Formulario de consumos de tarjeta. Soporta cuotas, compra unica y gasto fijo recurrente.
export default function CardExpenseForm({ onSubmit, cardName }) {
  const [origin, setOrigin] = useState("");
  const [amount, setAmount] = useState("");
  const [savings, setSavings] = useState("");
  const [installments, setInstallments] = useState("");
  const [expenseType, setExpenseType] = useState("installments");
  const [fixedCategory, setFixedCategory] = useState("subscriptions");

  function handleSubmit(event) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const parsedInstallments = expenseType === "single" ? 1 : Number(installments);
    const parsedSavings = Number(savings) || 0;
    const isFixed = expenseType === "fixed";

    if (
      !origin.trim() ||
      parsedAmount <= 0 ||
      (!isFixed && parsedInstallments <= 0) ||
      parsedSavings < 0 ||
      parsedSavings > parsedAmount
    ) {
      return;
    }

    onSubmit({
      origin: origin.trim(),
      amount: parsedAmount,
      savings: parsedSavings,
      fixedCategory: isFixed ? fixedCategory : "",
      installments: isFixed ? 0 : parsedInstallments,
      isFixed,
    });

    setOrigin("");
    setAmount("");
    setSavings("");
    setInstallments("");
    setExpenseType("installments");
    setFixedCategory("subscriptions");
  }

  return (
    <form className="expense-form card-expense-form" onSubmit={handleSubmit}>
      <label>
        Origen
        <input
          autoComplete="off"
          placeholder={`Ej: mesa en ${cardName}`}
          value={origin}
          onChange={(event) => setOrigin(event.target.value)}
        />
      </label>

      <label>
        Monto por cuota
        <input
          min="1"
          placeholder="10000"
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </label>

      <label>
        Cuotas pendientes
        <input
          disabled={expenseType !== "installments"}
          min="1"
          placeholder={expenseType === "fixed" ? "Sin limite" : "6"}
          type="number"
          value={expenseType === "installments" ? installments : expenseType === "single" ? "1" : ""}
          onChange={(event) => setInstallments(event.target.value)}
        />
      </label>

      <div className="expense-kind-field" aria-label="Tipo de gasto">
        <span>Tipo de gasto</span>
        <div className="segmented-control">
          <button
            className={expenseType === "installments" ? "active" : ""}
            onClick={() => setExpenseType("installments")}
            type="button"
          >
            Cuotas
          </button>
          <button
            className={expenseType === "single" ? "active" : ""}
            onClick={() => setExpenseType("single")}
            type="button"
          >
            Unica
          </button>
          <button
            className={expenseType === "fixed" ? "active" : ""}
            onClick={() => setExpenseType("fixed")}
            type="button"
          >
            Fijo
          </button>
        </div>
      </div>

      {expenseType === "fixed" && (
        <label className="fixed-category-field">
          Seccion
          <select value={fixedCategory} onChange={(event) => setFixedCategory(event.target.value)}>
            {Object.entries(CARD_FIXED_CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="savings-field">
        Ahorro
        <input
          min="0"
          max={amount || undefined}
          placeholder="0"
          type="number"
          value={savings}
          onChange={(event) => setSavings(event.target.value)}
        />
      </label>

      <button type="submit">
        <Plus size={18} />
        Agregar
      </button>
    </form>
  );
}
