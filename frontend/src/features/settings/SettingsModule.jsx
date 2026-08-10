import React, { useState } from "react";
import { Pencil, Plus, Settings, Trash2 } from "lucide-react";
import MoneyInput from "../../components/forms/MoneyInput.jsx";
import { currency } from "../../utils/formatters.js";
import SalaryForm from "./SalaryForm.jsx";
import "./settings.css";

// Pantalla de configuracion. Por ahora administra sueldo y resumen de restante.
export default function SettingsModule({
  debitCards,
  expensesTotal,
  incomeTotal,
  onAddDebitCard,
  onAddOtherIncome,
  onRemoveDebitCard,
  onRemoveOtherIncome,
  onSaveSalary,
  onUpdateDebitCard,
  onUpdateOtherIncome,
  otherIncomes,
  otherIncomesTotal,
  remainingTotal,
  salary,
}) {
  return (
    <section className="workspace single-column">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>Datos mensuales</p>
            <h2>Configuración</h2>
          </div>
          <Settings size={34} strokeWidth={1.7} />
        </div>

        <section className="settings-block" aria-label="Sueldo mensual">
          <div className="settings-subheading">
            <div>
              <p>Ingreso principal</p>
              <h3>Sueldo mensual</h3>
            </div>
          </div>
          <SalaryForm onSubmit={onSaveSalary} salary={salary} />
        </section>

        <section className="settings-block" aria-label="Otros ingresos">
          <div className="settings-subheading">
            <div>
              <p>Ingresos adicionales</p>
              <h3>Otros ingresos</h3>
            </div>
          </div>

          <OtherIncomeForm onSubmit={onAddOtherIncome} />

          <OtherIncomeList
            incomes={otherIncomes}
            onRemove={onRemoveOtherIncome}
            onUpdate={onUpdateOtherIncome}
          />
        </section>

        <section className="settings-block settings-summary-block" aria-label="Resumen mensual">
          <div className="settings-subheading">
            <div>
              <p>Resumen</p>
              <h3>Balance mensual</h3>
            </div>
          </div>

          <div className="balance-grid">
            <div className="total-strip">
              <span>Sueldo base</span>
              <strong>{currency.format(salary)}</strong>
            </div>
            <div className="total-strip income-strip">
              <span>Otros ingresos</span>
              <strong>{currency.format(otherIncomesTotal)}</strong>
            </div>
            <div className="total-strip income-strip">
              <span>Ingresos mensuales</span>
              <strong>{currency.format(incomeTotal)}</strong>
            </div>
            <div className="total-strip">
              <span>Total de gastos</span>
              <strong>{currency.format(expensesTotal)}</strong>
            </div>
            <div className={`total-strip balance-strip ${remainingTotal < 0 ? "negative" : "positive"}`}>
              <span>Restante</span>
              <strong>{currency.format(remainingTotal)}</strong>
            </div>
          </div>
        </section>

        <section className="settings-block" aria-label="Listas configurables">
          <div className="settings-subheading">
            <div>
              <p>Opciones</p>
              <h3>Listas configurables</h3>
            </div>
          </div>

          <div className="settings-options-grid">
            <ConfigurableOptionPanel
              addPlaceholder="Ej: Cuenta sueldo"
              emptyMessage="No hay opciónes de débito cargadas."
              items={debitCards.map((card) => ({ id: card, name: card }))}
              label="Opciones para Debita de"
              nameKey="name"
              onAdd={onAddDebitCard}
              onRemove={onRemoveDebitCard}
              onUpdate={onUpdateDebitCard}
            />
          </div>
        </section>
      </section>
    </section>
  );
}

function OtherIncomeForm({ onSubmit }) {
  const [origin, setOrigin] = useState("");
  const [amount, setAmount] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const parsedAmount = Number(amount);

    if (!origin.trim() || parsedAmount <= 0) {
      return;
    }

    onSubmit({
      amount: parsedAmount,
      origin: origin.trim(),
    });
    setOrigin("");
    setAmount("");
  }

  return (
    <form className="expense-form other-income-form" onSubmit={handleSubmit}>
      <label>
        Origen
        <input
          autoComplete="off"
          placeholder="Ej: freelance"
          value={origin}
          onChange={(event) => setOrigin(event.target.value)}
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

function OtherIncomeList({ incomes, onRemove, onUpdate }) {
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState({ amount: "", origin: "" });
  const editingIncome = incomes.find((income) => income.id === editingId);
  const parsedDraftAmount = Number(draft.amount);
  const canSaveEdit = Boolean(editingIncome) && draft.origin.trim() && parsedDraftAmount > 0;

  function closeEditModal() {
    setEditingId("");
    setDraft({ amount: "", origin: "" });
  }

  function startEdit(income) {
    setEditingId(income.id);
    setDraft({
      amount: String(income.amount),
      origin: income.origin,
    });
  }

  function saveEdit() {
    if (!editingIncome || !canSaveEdit) {
      return;
    }

    onUpdate(editingIncome.id, {
      amount: parsedDraftAmount,
      origin: draft.origin.trim(),
    });
    closeEditModal();
  }

  if (!incomes.length) {
    return <p className="panel-empty settings-empty">Todavía no cargaste otros ingresos.</p>;
  }

  return (
    <>
      <div className="expense-table other-income-table">
        <div className="table-header other-income-row">
          <span>Origen</span>
          <span>Monto</span>
          <span aria-label="Acciones" />
        </div>
        {incomes.map((income) => (
          <div className="table-row other-income-row" key={income.id}>
            <strong>{income.origin}</strong>
            <span>
              <strong className="amount-emphasis">{currency.format(income.amount)}</strong>
            </span>
            <div className="row-actions">
              <button
                className="icon-button icon-button-neutral"
                onClick={() => startEdit(income)}
                title="Editar ingreso"
                type="button"
              >
                <Pencil size={16} />
              </button>
              <button
                aria-label={`Eliminar ${income.origin}`}
                className="icon-button"
                onClick={() => onRemove(income.id)}
                title="Eliminar ingreso"
                type="button"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingIncome ? (
        <div className="confirm-backdrop" role="presentation">
          <section
            aria-labelledby="other-income-edit-title"
            aria-modal="true"
            className="confirm-modal record-edit-modal"
            role="dialog"
          >
            <h2 id="other-income-edit-title">Editar ingreso</h2>
            <form
              className="record-edit-form"
              onSubmit={(event) => {
                event.preventDefault();
                saveEdit();
              }}
            >
              <label>
                Origen
                <input
                  autoComplete="off"
                  value={draft.origin}
                  onChange={(event) => setDraft((current) => ({ ...current, origin: event.target.value }))}
                />
              </label>
              <label>
                Monto
                <MoneyInput
                  value={draft.amount}
                  onValueChange={(value) => setDraft((current) => ({ ...current, amount: value }))}
                />
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

function ConfigurableOptionPanel({
  addPlaceholder,
  emptyMessage,
  items,
  label,
  minItems = 0,
  onAdd,
  onRemove,
  onUpdate,
}) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState("");
  const [draftName, setDraftName] = useState("");
  const editingItem = items.find((item) => item.id === editingId);

  function submitNewItem(event) {
    event.preventDefault();

    if (!newName.trim()) {
      return;
    }

    onAdd(newName.trim());
    setNewName("");
  }

  return (
    <section className="settings-option-panel">
      <h4>{label}</h4>
      <form className="settings-option-form" onSubmit={submitNewItem}>
        <input
          autoComplete="off"
          placeholder={addPlaceholder}
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
        />
        <button type="submit">
          <Plus size={16} />
        </button>
      </form>

      {items.length ? (
        <div className="settings-option-list">
          {items.map((item) => {
            const canRemove = items.length > minItems;

            return (
              <div className="settings-option-row" key={item.id}>
                <strong>{item.name}</strong>

                <div className="row-actions">
                  <button
                    className="icon-button icon-button-neutral"
                    onClick={() => {
                      setEditingId(item.id);
                      setDraftName(item.name);
                    }}
                    title="Editar"
                    type="button"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button"
                    disabled={!canRemove}
                    onClick={() => onRemove(item.id)}
                    title={canRemove ? "Eliminar" : "Debe quedar al menos una sección"}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="panel-empty settings-empty">{emptyMessage}</p>
      )}

      {editingItem ? (
        <div className="confirm-backdrop" role="presentation">
          <section
            aria-labelledby="config-option-edit-title"
            aria-modal="true"
            className="confirm-modal record-edit-modal"
            role="dialog"
          >
            <h2 id="config-option-edit-title">Editar opción</h2>
            <form
              className="record-edit-form"
              onSubmit={(event) => {
                event.preventDefault();

                if (!draftName.trim()) {
                  return;
                }

                onUpdate(editingItem.id, draftName.trim());
                setEditingId("");
              }}
            >
              <label>
                Nombre
                <input
                  autoComplete="off"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                />
              </label>
              <div className="confirm-actions">
                <button className="confirm-button confirm-button-secondary" onClick={() => setEditingId("")} type="button">
                  Cancelar
                </button>
                <button className="confirm-button confirm-button-primary" disabled={!draftName.trim()} type="submit">
                  Guardar cambios
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
