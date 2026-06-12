import React, { useState } from "react";
import { Check, Plus, UserRound } from "lucide-react";
import MoneyInput from "../../components/forms/MoneyInput.jsx";

// Formulario de consumos de tarjeta. Soporta cuotas, compra unica y gasto fijo recurrente.
export default function CardExpenseForm({ fixedCategories = [], onSubmit, cardName }) {
  const [origin, setOrigin] = useState("");
  const [amount, setAmount] = useState("");
  const [savings, setSavings] = useState("");
  const [installments, setInstallments] = useState("");
  const [expenseType, setExpenseType] = useState("installments");
  const [fixedCategory, setFixedCategory] = useState(fixedCategories[0]?.id ?? "subscriptions");
  const [isPaidByOther, setIsPaidByOther] = useState(false);

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
      fixedCategory: isFixed ? fixedCategory || fixedCategories[0]?.id || "" : "",
      installments: isFixed ? 0 : parsedInstallments,
      isFixed,
      isPaidByOther,
    });

    setOrigin("");
    setAmount("");
    setSavings("");
    setInstallments("");
    setExpenseType("installments");
    setFixedCategory(fixedCategories[0]?.id ?? "subscriptions");
    setIsPaidByOther(false);
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
        <MoneyInput
          value={amount}
          onValueChange={setAmount}
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
            {fixedCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="savings-field">
        Ahorro
        <MoneyInput
          value={savings}
          onValueChange={setSavings}
        />
      </label>

      <label className={`paid-by-other-field ${isPaidByOther ? "active" : ""}`}>
        <input
          checked={isPaidByOther}
          type="checkbox"
          onChange={(event) => setIsPaidByOther(event.target.checked)}
        />
        <span className="paid-by-other-check">
          {isPaidByOther ? <Check size={14} /> : <UserRound size={15} />}
        </span>
        <span>
          <strong>Otra persona</strong>
          <small>No lo pago yo</small>
        </span>
      </label>

      <button type="submit">
        <Plus size={18} />
        Agregar
      </button>
    </form>
  );
}
