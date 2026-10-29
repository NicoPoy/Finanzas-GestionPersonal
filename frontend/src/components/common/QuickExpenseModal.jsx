import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import MoneyInput from "../forms/MoneyInput.jsx";
import { currency } from "../../utils/formatters.js";

export default function QuickExpenseModal({
  isOpen,
  onClose,
  banks = [],
  debitCards = [],
  onAddCardExpense,
  onAddSimpleExpense,
  onAddExtraordinaryExpense,
}) {
  if (!isOpen) return null;

  const [type, setType] = useState("tarjeta");
  const [selectedCardId, setSelectedCardId] = useState(() => {
    const firstBank = banks[0];
    return firstBank?.cards[0]?.id || "";
  });
  const [selectedDebitCard, setSelectedDebitCard] = useState("");
  const [origin, setOrigin] = useState("");
  const [amount, setAmount] = useState("");
  const [installments, setInstallments] = useState("1");
  const [error, setError] = useState("");

  // Gather all cards
  const allCards = banks.flatMap((bank) =>
    bank.cards.map((card) => ({
      id: card.id,
      name: `${bank.name} - ${card.name}`,
    }))
  );

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const parsedAmount = Number(amount);
    if (!origin.trim()) {
      setError("Por favor completa el concepto del gasto.");
      return;
    }
    if (parsedAmount <= 0) {
      setError("Por favor ingresa un monto válido mayor a 0.");
      return;
    }

    if (type === "tarjeta") {
      if (!selectedCardId) {
        setError("Por favor selecciona una tarjeta de crédito.");
        return;
      }
      onAddCardExpense(selectedCardId, {
        origin: origin.trim(),
        amount: parsedAmount,
        installments: Math.max(1, Number(installments) || 1),
        savings: 0,
        fixedCategory: "",
        isFixed: false,
        isPaidByOther: false,
        isSharedHalf: false,
      });
    } else if (type === "extraordinary") {
      onAddExtraordinaryExpense({
        origin: origin.trim(),
        amount: parsedAmount,
        paid: false,
      });
    } else {
      // Fixed expense (department, subscriptions, activities, extras)
      const storageKey = `${type}Expenses`;
      onAddSimpleExpense(storageKey, {
        name: origin.trim(),
        amount: parsedAmount,
        dueDay: 10,
        paymentCard: selectedDebitCard,
      });
    }

    // Reset and close
    setOrigin("");
    setAmount("");
    setInstallments("1");
    onClose();
  }

  return (
    <div className="login-contact-backdrop" onClick={onClose} role="presentation">
      <section
        aria-modal="true"
        className="login-contact-modal quick-expense-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <header className="quick-expense-header">
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--primary)" }}>Carga Rápida</p>
            <h2>Nuevo consumo rápido</h2>
          </div>
          <button
            aria-label="Cerrar"
            className="login-contact-close"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="expense-form quick-expense-form-body">
          <label>
            Destino del gasto
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="tarjeta">💳 Tarjeta de Crédito</option>
              <option value="department">🏠 Gasto Fijo: Departamento</option>
              <option value="subscriptions">🔁 Gasto Fijo: Suscripciones</option>
              <option value="activities">🏋️ Gasto Fijo: Actividades</option>
              <option value="extras">✨ Gasto Fijo: Extras</option>
              <option value="extraordinary">⚠️ Gasto Extraordinario</option>
            </select>
          </label>

          {type === "tarjeta" && (
            <label>
              Selecciona tarjeta
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
              >
                <option value="">-- Elige una tarjeta --</option>
                {allCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {type !== "tarjeta" && type !== "extraordinary" && (
            <label>
              Debita de (Opcional)
              <select
                value={selectedDebitCard}
                onChange={(e) => setSelectedDebitCard(e.target.value)}
              >
                <option value="">Ninguna / Efectivo / Otro</option>
                {debitCards.map((card) => (
                  <option key={card} value={card}>
                    {card}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Concepto / Detalle
            <input
              autoComplete="off"
              placeholder="Ej: Supermercado, luz, gimnasio..."
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
          </label>

          <label>
            Monto (ARS)
            <MoneyInput value={amount} onValueChange={setAmount} />
          </label>

          {type === "tarjeta" && (
            <label>
              Cuotas
              <input
                type="number"
                min="1"
                max="99"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
              />
            </label>
          )}

          {error && <p className="form-error-message" style={{ color: "var(--danger)", margin: "0", fontSize: "0.85rem", fontWeight: "bold" }}>{error}</p>}

          <div className="confirm-actions" style={{ marginTop: "12px" }}>
            <button
              className="confirm-button"
              style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--line)", color: "var(--ink)" }}
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button className="confirm-button-primary" type="submit">
              <Plus size={18} />
              Cargar gasto
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
