import React, { useState } from "react";
import { Check, Plus, Split, UserRound } from "lucide-react";
import MoneyInput from "../../components/forms/MoneyInput.jsx";

// Formulario de consumos de tarjeta. Soporta cuotas, compra unica y gasto fijo recurrente.
export default function CardExpenseForm({ fixedCategories = [], onSubmit, cardName }) {
  const [origin, setOrigin] = useState("");
  const [amount, setAmount] = useState("");
  const [savings, setSavings] = useState("");
  const [installments, setInstallments] = useState("");
  const [expenseType, setExpenseType] = useState("installments");
  const [pendingFixedExpense, setPendingFixedExpense] = useState(null);
  const [pendingExpense, setPendingExpense] = useState(null);
  const [selectedFixedCategory, setSelectedFixedCategory] = useState("");
  const [fixedCategoryError, setFixedCategoryError] = useState("");
  const [paymentShare, setPaymentShare] = useState("self");
  const [validationErrors, setValidationErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const parsedInstallments = expenseType === "single" ? 1 : Number(installments);
    const parsedSavings = Number(savings) || 0;
    const isFixed = expenseType === "fixed";
    const maxSavings = paymentShare === "half" ? parsedAmount / 2 : parsedAmount;
    const nextErrors = {};

    if (!origin.trim()) {
      nextErrors.origin = "Completa el origen.";
    }

    if (parsedAmount <= 0) {
      nextErrors.amount = "Completa el monto.";
    }

    if (!isFixed && parsedInstallments <= 0) {
      nextErrors.installments = "Completa las cuotas.";
    }

    if (parsedSavings < 0 || parsedSavings > maxSavings) {
      nextErrors.savings = "El ahorro no puede superar tu parte a pagar.";
    }

    setValidationErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    const expense = {
      origin: origin.trim(),
      amount: parsedAmount,
      savings: parsedSavings,
      fixedCategory: "",
      installments: isFixed ? 0 : parsedInstallments,
      isFixed,
      isPaidByOther: paymentShare === "other",
      isSharedHalf: paymentShare === "half",
    };

    if (isFixed) {
      setPendingFixedExpense(expense);
      setSelectedFixedCategory("");
      return;
    }

    setPendingExpense(expense);
  }

  function submitExpense(expense) {
    onSubmit(expense);

    setOrigin("");
    setAmount("");
    setSavings("");
    setInstallments("");
    setExpenseType("installments");
    setPaymentShare("self");
    setValidationErrors({});
  }

  function cancelExpenseConfirmation() {
    setPendingExpense(null);
  }

  function confirmExpenseConfirmation() {
    if (!pendingExpense) {
      return;
    }

    submitExpense(pendingExpense);
    setPendingExpense(null);
  }

  function cancelFixedCategoryStep() {
    setPendingFixedExpense(null);
    setSelectedFixedCategory("");
    setFixedCategoryError("");
  }

  return (
    <>
    <form className="expense-form card-expense-form" onSubmit={handleSubmit}>
      <label className={`card-origin-field ${validationErrors.origin ? "field-error" : ""}`}>
        Origen
        <input
          autoComplete="off"
          placeholder="Nombre del gasto"
          value={origin}
          onChange={(event) => {
            setOrigin(event.target.value);
            setValidationErrors((current) => ({ ...current, origin: "" }));
          }}
        />
        {validationErrors.origin ? <small className="field-error-message">{validationErrors.origin}</small> : null}
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

      <label className={`card-installments-field ${validationErrors.installments ? "field-error" : ""}`}>
        Cuotas pendientes
        <input
          disabled={expenseType !== "installments"}
          min="1"
          placeholder={expenseType === "installments" ? "0" : "No disponible"}
          type="number"
          value={expenseType === "installments" ? installments : expenseType === "single" ? "1" : ""}
          onChange={(event) => {
            setInstallments(event.target.value);
            setValidationErrors((current) => ({ ...current, installments: "" }));
          }}
        />
        {validationErrors.installments ? (
          <small className="field-error-message">{validationErrors.installments}</small>
        ) : null}
      </label>

      <label className={`card-amount-field ${validationErrors.amount ? "field-error" : ""}`}>
        Monto cuota
        <MoneyInput
          value={amount}
          onValueChange={(value) => {
            setAmount(value);
            setValidationErrors((current) => ({ ...current, amount: "" }));
          }}
        />
        {validationErrors.amount ? <small className="field-error-message">{validationErrors.amount}</small> : null}
      </label>

      <label className={`card-savings-field ${validationErrors.savings ? "field-error" : ""}`}>
        Ahorro
        <MoneyInput
          value={savings}
          onValueChange={(value) => {
            setSavings(value);
            setValidationErrors((current) => ({ ...current, savings: "" }));
          }}
        />
        {validationErrors.savings ? <small className="field-error-message">{validationErrors.savings}</small> : null}
      </label>

      <button
        aria-pressed={paymentShare === "other"}
        className={`paid-by-other-field ${paymentShare === "other" ? "active" : ""}`}
        onClick={() => setPaymentShare((current) => (current === "other" ? "self" : "other"))}
        type="button"
      >
        <span className="paid-by-other-check">
          {paymentShare === "other" ? <Check size={14} /> : <UserRound size={15} />}
        </span>
        <span>
          <strong>Otra persona</strong>
          <small>No lo pago yo</small>
        </span>
      </button>

      <button
        aria-pressed={paymentShare === "half"}
        className={`paid-by-other-field shared-half-field ${paymentShare === "half" ? "active" : ""}`}
        onClick={() => setPaymentShare((current) => (current === "half" ? "self" : "half"))}
        type="button"
      >
        <span className="paid-by-other-check">
          {paymentShare === "half" ? <Check size={14} /> : <Split size={15} />}
        </span>
        <span>
          <strong>A medias</strong>
          <small>Pago la mitad</small>
        </span>
      </button>

      <button className="card-submit-button" type="submit">
        <Plus size={18} />
        Agregar
      </button>
    </form>
    {pendingFixedExpense ? (
      <div className="confirm-backdrop" role="presentation">
        <section className="confirm-modal fixed-category-modal" aria-labelledby="fixed-category-title" role="dialog">
          <h2 id="fixed-category-title">Seleccionar seccion</h2>
          <p>Este gasto es fijo. Elegi en que seccion va a aparecer antes de registrarlo.</p>
          <label className={fixedCategoryError ? "field-error" : ""}>
            Seccion
            <select
              value={selectedFixedCategory}
              onChange={(event) => {
                setSelectedFixedCategory(event.target.value);
                setFixedCategoryError("");
              }}
            >
              <option value="">Seleccionar seccion</option>
              {fixedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {fixedCategoryError ? <small className="field-error-message">{fixedCategoryError}</small> : null}
          </label>
          <div className="confirm-actions">
            <button className="confirm-button confirm-button-secondary" onClick={cancelFixedCategoryStep} type="button">
              Cancelar
            </button>
            <button
              className="confirm-button confirm-button-primary"
              onClick={() => {
                if (!pendingFixedExpense || !selectedFixedCategory) {
                  setFixedCategoryError("Elegí una sección para continuar.");
                  return;
                }

                setPendingExpense({
                  ...pendingFixedExpense,
                  fixedCategory: selectedFixedCategory,
                });
                cancelFixedCategoryStep();
              }}
              type="button"
            >
              Registrar fijo
            </button>
          </div>
        </section>
      </div>
    ) : null}
    {pendingExpense ? (
      <div className="confirm-backdrop" role="presentation">
        <section className="confirm-modal fixed-category-modal" aria-labelledby="card-expense-confirm-title" role="dialog">
          <h2 id="card-expense-confirm-title">Confirmar gasto</h2>
          <p>Se va a agregar este gasto a la tarjeta. Revisalo antes de registrarlo.</p>
          <div className="card-expense-confirm-summary">
            <span>
              <small>Origen</small>
              <strong>{pendingExpense.origin}</strong>
            </span>
            <span>
              <small>Monto cuota</small>
              <strong>${pendingExpense.amount.toLocaleString("es-AR")}</strong>
            </span>
            <span>
              <small>Tipo</small>
              <strong>{pendingExpense.isFixed ? "Fijo" : pendingExpense.installments === 1 ? "Unica" : `${pendingExpense.installments} cuotas`}</strong>
            </span>
          </div>
          <div className="confirm-actions">
            <button className="confirm-button confirm-button-secondary" onClick={cancelExpenseConfirmation} type="button">
              Cancelar
            </button>
            <button className="confirm-button confirm-button-primary" onClick={confirmExpenseConfirmation} type="button">
              Agregar gasto
            </button>
          </div>
        </section>
      </div>
    ) : null}
    </>
  );
}
