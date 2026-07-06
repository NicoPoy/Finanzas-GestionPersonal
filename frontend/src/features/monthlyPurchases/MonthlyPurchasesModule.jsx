import React, { useState } from "react";
import { Check, ClipboardList, Pencil, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import MoneyInput from "../../components/forms/MoneyInput.jsx";
import { currency } from "../../utils/formatters.js";
import "./monthlyPurchases.css";

const CATEGORY_OPTIONS = ["Alimentos", "Limpieza", "Higiene", "Farmacia", "Mascotas", "Obligatorio", "Otro"];
const PRIORITY_OPTIONS = ["baja", "media", "alta"];

export default function MonthlyPurchasesModule({ purchases, onAdd, onRemove, onTogglePurchased, onUpdate }) {
  const total = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const purchasedTotal = purchases
    .filter((purchase) => purchase.purchased)
    .reduce((sum, purchase) => sum + purchase.amount, 0);
  const pendingTotal = total - purchasedTotal;
  const pendingCount = purchases.filter((purchase) => !purchase.purchased).length;

  return (
    <section className="monthly-purchases-view">
      <section className="monthly-purchases-hero">
        <div>
          <span>Presupuesto mensual</span>
          <h2>Compras mensuales</h2>
          <p>
            Carga alimentos, limpieza, farmacia u otras compras obligatorias del mes. Este total se descuenta del
            presupuesto general.
          </p>
        </div>
        <ShoppingBasket size={38} />
      </section>

      <section className="monthly-purchases-summary">
        <SummaryCard label="Presupuestado" value={total} />
        <SummaryCard label="Pendiente de comprar" tone="warning" value={pendingTotal} />
        <SummaryCard label="Ya comprado" tone="success" value={purchasedTotal} />
        <SummaryCard label="Items pendientes" rawValue={pendingCount} />
      </section>

      <section className="monthly-purchases-panel">
        <div className="monthly-purchases-heading">
          <div>
            <span>Nueva compra</span>
            <h3>Agregar al presupuesto</h3>
          </div>
          <ClipboardList size={22} />
        </div>
        <MonthlyPurchaseForm onSubmit={onAdd} />
      </section>

      <section className="monthly-purchases-panel">
        <div className="monthly-purchases-heading">
          <div>
            <span>Listado mensual</span>
            <h3>Compras obligatorias</h3>
          </div>
          <ShoppingBasket size={22} />
        </div>

        {purchases.length ? (
          <div className="monthly-purchases-list">
            {purchases.map((purchase) => (
              <MonthlyPurchaseRow
                key={purchase.id}
                onRemove={() => onRemove(purchase.id)}
                onToggle={() => onTogglePurchased(purchase.id)}
                onUpdate={(updates) => onUpdate(purchase.id, updates)}
                purchase={purchase}
              />
            ))}
          </div>
        ) : (
          <div className="monthly-purchases-empty">
            <ShoppingBasket size={30} />
            <p>Todavia no cargaste compras mensuales.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function SummaryCard({ label, rawValue, tone = "neutral", value }) {
  return (
    <article className={`monthly-summary-card monthly-summary-${tone}`}>
      <span>{label}</span>
      <strong>{rawValue ?? currency.format(value)}</strong>
    </article>
  );
}

function MonthlyPurchaseForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Alimentos");
  const [priority, setPriority] = useState("media");
  const [note, setNote] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!name.trim() || parsedAmount <= 0) {
      return;
    }

    onSubmit({
      amount: parsedAmount,
      category,
      name: name.trim(),
      note: note.trim(),
      priority,
      purchased: false,
    });

    setName("");
    setAmount("");
    setCategory("Alimentos");
    setPriority("media");
    setNote("");
  }

  return (
    <form className="monthly-purchase-form" onSubmit={handleSubmit}>
      <label>
        Compra
        <input
          autoComplete="off"
          placeholder="Ej: carne, arroz, farmacia"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label>
        Monto estimado
        <MoneyInput value={amount} onValueChange={setAmount} />
      </label>
      <label>
        Categoria
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label>
        Prioridad
        <select value={priority} onChange={(event) => setPriority(event.target.value)}>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="monthly-note-field">
        Nota
        <input
          autoComplete="off"
          placeholder="Opcional"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <button type="submit">
        <Plus size={18} />
        Agregar
      </button>
    </form>
  );
}

function MonthlyPurchaseRow({ onRemove, onToggle, onUpdate, purchase }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    amount: String(purchase.amount),
    category: purchase.category,
    name: purchase.name,
    note: purchase.note ?? "",
    priority: purchase.priority ?? "media",
  });
  const parsedDraftAmount = Number(draft.amount);
  const canSave = draft.name.trim() && parsedDraftAmount > 0;

  function saveEdit() {
    if (!canSave) {
      return;
    }

    onUpdate({
      amount: parsedDraftAmount,
      category: draft.category,
      name: draft.name.trim(),
      note: draft.note.trim(),
      priority: draft.priority,
    });
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <article className="monthly-purchase-row editing">
        <div className="monthly-edit-grid">
          <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          <MoneyInput
            value={draft.amount}
            onValueChange={(value) => setDraft((current) => ({ ...current, amount: value }))}
          />
          <select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} />
        </div>
        <div className="monthly-row-actions">
          <button className="monthly-secondary-button" onClick={() => setIsEditing(false)} type="button">
            Cancelar
          </button>
          <button className="monthly-primary-button" disabled={!canSave} onClick={saveEdit} type="button">
            Guardar
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className={`monthly-purchase-row ${purchase.purchased ? "purchased" : ""}`}>
      <button
        aria-label={purchase.purchased ? `Marcar ${purchase.name} como pendiente` : `Marcar ${purchase.name} como comprado`}
        className="monthly-check-button"
        onClick={onToggle}
        type="button"
      >
        {purchase.purchased ? <Check size={17} /> : null}
      </button>
      <div className="monthly-row-copy">
        <strong>{purchase.name}</strong>
        <small>
          {purchase.category} - prioridad {purchase.priority}
          {purchase.note ? ` - ${purchase.note}` : ""}
        </small>
      </div>
      <b>{currency.format(purchase.amount)}</b>
      <div className="monthly-row-actions">
        <button className="icon-button btn-edit-expense" onClick={() => setIsEditing(true)} type="button">
          <Pencil size={15} />
        </button>
        <button className="icon-button btn-delete-expense" onClick={onRemove} type="button">
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}
