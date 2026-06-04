import React, { useState } from "react";
import { Building2, Check, CreditCard, Landmark, Pencil, Trash2, X } from "lucide-react";
import AddInlineForm from "../../components/forms/AddInlineForm.jsx";
import { currency } from "../../utils/formatters.js";
import CardExpenseForm from "./CardExpenseForm.jsx";
import CardExpenseList from "./CardExpenseList.jsx";

// Pantalla principal de tarjetas: bancos a la izquierda, detalle de tarjeta a la derecha.
export default function CardsModule({
  addBank,
  addCard,
  addExpense,
  banks,
  removeBank,
  removeCard,
  removeExpense,
  selectBank,
  selectedBank,
  selectedBankId,
  selectedCard,
  selectedCardId,
  setSelectedCardId,
  updateBank,
  updateCard,
  updateExpense,
  updateExpenseSavings,
}) {
  return (
    <section className="workspace">
      <aside className="cards-panel" aria-label="Bancos y tarjetas">
        <div className="panel-title">
          <Landmark size={20} />
          <span>Bancos</span>
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

        {selectedBank && (
          <>
            <div className="panel-title nested-title">
              <CreditCard size={20} />
              <span>Tarjetas</span>
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
          </>
        )}
      </aside>

      <section className="detail-panel">
        {selectedBank && selectedCard ? (
          <>
            <div className="section-heading">
              <div>
                <p>{selectedBank.name}</p>
                <h2>{selectedCard.name}</h2>
              </div>
              <CreditCard size={34} strokeWidth={1.7} />
            </div>

            <CardExpenseForm key={selectedCard.id} onSubmit={addExpense} cardName={selectedCard.name} />

            <CardExpenseList
              card={selectedCard}
              onRemove={removeExpense}
              onUpdate={updateExpense}
              onUpdateSavings={updateExpenseSavings}
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

function EditableTab({ className, countLabel, icon, name, onDelete, onSave, onSelect, style }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  function handleSave(event) {
    event.stopPropagation();

    if (!draft.trim()) {
      return;
    }

    onSave(draft.trim());
    setIsEditing(false);
  }

  function handleCancel(event) {
    event.stopPropagation();
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
        {isEditing ? (
          <input
            autoFocus
            className="tab-edit-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onClick={(event) => event.stopPropagation()}
          />
        ) : (
          <strong>{name}</strong>
        )}
        <small>{countLabel}</small>
      </span>
      <div className="tab-actions">
        {isEditing ? (
          <>
            <button className="mini-icon-button" onClick={handleSave} title="Guardar" type="button">
              <Check size={14} />
            </button>
            <button className="mini-icon-button" onClick={handleCancel} title="Cancelar" type="button">
              <X size={14} />
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
