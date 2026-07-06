import React, { useState } from "react";
import { Building2, CalendarDays, CreditCard, Landmark, Pencil, ReceiptText, Trash2 } from "lucide-react";
import AddInlineForm from "../../components/forms/AddInlineForm.jsx";
import { currency } from "../../utils/formatters.js";
import CardExpenseForm from "./CardExpenseForm.jsx";
import CardExpenseList from "./CardExpenseList.jsx";
import "./cards.css";

// Pantalla principal de tarjetas: bancos a la izquierda, detalle de tarjeta a la derecha.
export default function CardsModule({
  addBank,
  addCard,
  addExpense,
  banks,
  fixedCategories,
  removeBank,
  removeCard,
  removeExpense,
  selectBank,
  selectedBank,
  selectedBankId,
  selectedCard,
  selectedCardId,
  setSelectedCardId,
  isSelectedCardPaidForPaymentMonth,
  onRegisterCardPayment,
  paymentMonthTitle,
  statementMonthTitle,
  updateBank,
  updateCard,
  updateExpense,
}) {
  const [showNextMonthTable, setShowNextMonthTable] = useState(false);

  return (
    <section className="workspace cards-workspace">
      <aside className="cards-panel" aria-label="Bancos y tarjetas">
        <section className="selector-section">
          <div className="panel-title selector-title">
            <Landmark size={20} />
            <span>
              <small>1. Elegi banco</small>
              <strong>Bancos</strong>
            </span>
          </div>

          <AddInlineForm buttonLabel="Banco" inputLabel="Nombre del banco" onSubmit={addBank} placeholder="Ej: Galicia" />

          <div className="bank-list" role="tablist" aria-label="Bancos disponibles">
            {banks.map((bank) => (
              <EditableTab
                countLabel={`${bank.cards.length} tarjetas`}
                icon={<Building2 size={19} />}
                isActive={bank.id === selectedBankId}
                className={`bank-tab ${bank.id === selectedBankId ? "active" : ""}`}
                key={bank.id}
                name={bank.name}
                onDelete={() => removeBank(bank.id)}
                onSave={(name) => updateBank(bank.id, name)}
                onSelect={() => selectBank(bank.id)}
              />
            ))}
          </div>
        </section>

        {selectedBank && (
          <section className="selector-section selector-section-card">
            <div className="panel-title selector-title">
              <CreditCard size={20} />
              <span>
                <small>2. Elegi tarjeta</small>
                <strong>{selectedBank.name}</strong>
              </span>
            </div>

            <AddInlineForm
              buttonLabel="Tarjeta"
              inputLabel="Nombre de la tarjeta"
              onSubmit={addCard}
              placeholder="Ej: Visa"
            />

            <div className="card-tabs" role="tablist" aria-label="Tarjetas disponibles">
              {selectedBank.cards.map((card) => (
                <EditableTab
                  className={`card-tab ${card.id === selectedCardId ? "active" : ""}`}
                  countLabel={`${currency.format(card.monthlyTotal)} / mes`}
                  icon={<CreditCard size={22} />}
                  isActive={card.id === selectedCardId}
                  key={card.id}
                  name={card.name}
                  onDelete={() => removeCard(card.id)}
                  onSave={(name) => updateCard(card.id, name)}
                  onSelect={() => setSelectedCardId(card.id)}
                  style={{ "--accent": card.accent }}
                />
              ))}
            </div>
          </section>
        )}
      </aside>

      <section className="detail-panel card-detail-panel">
        {selectedBank && selectedCard ? (
          <>
            <div className="section-heading card-main-heading" style={{ "--card-accent": selectedCard.accent || "#5db6c6" }}>
              <div>
                <p>{selectedBank.name}</p>
                <h2>{selectedCard.name}</h2>
                <small className="card-statement-note">
                  Proximo resumen cierra en {statementMonthTitle} (dia {selectedCard.dueDay ?? 10}) · se paga con
                  sueldo de {paymentMonthTitle}
                </small>
                <div className="card-hero-stats" aria-label="Resumen de tarjeta">
                  <CardHeroStat label="Este mes" value={currency.format(selectedCard.monthlyTotal)} />
                  <CardHeroStat label="Deuda total" value={currency.format(selectedCard.totalDebt)} />
                  <CardHeroStat label="Ahorrado" value={currency.format(selectedCard.savingsTotal)} />
                </div>
              </div>
              <div className="section-heading-actions card-heading-actions">
                <label className="due-control">
                  <span>Cierra dia</span>
                  <input
                    key={selectedCard.id}
                    min="1"
                    max="31"
                    type="number"
                    defaultValue={selectedCard.dueDay ?? 10}
                    onBlur={(event) => {
                      const nextDueDay = Math.min(Math.max(Number(event.target.value) || 10, 1), 31);
                      event.target.value = String(nextDueDay);

                      if (nextDueDay !== (selectedCard.dueDay ?? 10)) {
                        updateCard(selectedCard.id, { dueDay: nextDueDay });
                      }
                    }}
                  />
                </label>
                <button
                  className="payment-button"
                  disabled={isSelectedCardPaidForPaymentMonth}
                  onClick={() => onRegisterCardPayment(selectedCard.id)}
                  type="button"
                >
                  <ReceiptText size={18} />
                  {isSelectedCardPaidForPaymentMonth ? "Pago registrado" : `Registrar pago (${paymentMonthTitle})`}
                </button>
                <button
                  className={`payment-preview-button ${showNextMonthTable ? "active" : ""}`}
                  onClick={() => setShowNextMonthTable((current) => !current)}
                  type="button"
                >
                  <CalendarDays size={18} />
                  {showNextMonthTable ? "Ver mes actual" : "Ver mes siguiente"}
                </button>
                <CreditCard size={34} strokeWidth={1.7} />
              </div>
            </div>

            <div className="expense-entry-panel">
              <div className="card-form-heading">
                <div>
                  <span>Nuevo consumo</span>
                  <strong>Cargar gasto en {selectedCard.name}</strong>
                </div>
                <small>Cuotas, compra unica o gasto fijo recurrente.</small>
              </div>
              <CardExpenseForm
                key={selectedCard.id}
                fixedCategories={fixedCategories}
                onSubmit={addExpense}
                cardName={selectedCard.name}
              />
            </div>

            <CardExpenseList
              card={selectedCard}
              fixedCategories={fixedCategories}
              onRemove={removeExpense}
              onUpdate={updateExpense}
              onUpdateSummarySavings={(summarySavings) => updateCard(selectedCard.id, { summarySavings })}
              showNextMonthTable={showNextMonthTable}
            />
          </>
        ) : (
          <div className="empty-state tall">
            <CreditCard size={30} />
            <p>Agrega una tarjeta para empezar a cargar consumos en este banco.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function CardHeroStat({ label, value }) {
  return (
    <article className="card-hero-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function EditableTab({ className, countLabel, icon, name, onDelete, onSave, onSelect, style }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  function handleSave() {
    if (!draft.trim()) {
      return;
    }

    onSave(draft.trim());
    setIsEditing(false);
  }

  function handleCancel() {
    setDraft(name);
    setIsEditing(false);
  }

  function handleDelete(event) {
    event.stopPropagation();
    onDelete();
  }

  return (
    <div className={className} onClick={onSelect} role="button" style={style} tabIndex={0}>
      {icon}
      <span>
        <strong>{name}</strong>
        <small>{countLabel}</small>
      </span>
      <div className="tab-actions">
        <button
          className="mini-icon-button"
          onClick={(event) => {
            event.stopPropagation();
            setIsEditing(true);
          }}
          title="Editar"
          type="button"
        >
          <Pencil size={14} />
        </button>
        <button className="mini-icon-button danger" onClick={handleDelete} title="Eliminar" type="button">
          <Trash2 size={14} />
        </button>
      </div>
      {isEditing ? (
        <div className="confirm-backdrop" role="presentation" onClick={(event) => event.stopPropagation()}>
          <section
            aria-labelledby="tab-edit-title"
            aria-modal="true"
            className="confirm-modal record-edit-modal"
            role="dialog"
          >
            <h2 id="tab-edit-title">Editar nombre</h2>
            <form
              className="record-edit-form"
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleSave();
              }}
            >
              <label>
                Nombre
                <input
                  autoComplete="off"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
              </label>
              <div className="confirm-actions">
                <button
                  className="confirm-button confirm-button-secondary"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleCancel();
                  }}
                  type="button"
                >
                  Cancelar
                </button>
                <button className="confirm-button confirm-button-primary" disabled={!draft.trim()} type="submit">
                  Guardar cambios
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
