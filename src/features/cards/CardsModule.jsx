import React from "react";
import { Building2, CreditCard, Landmark } from "lucide-react";
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
  removeExpense,
  selectBank,
  selectedBank,
  selectedBankId,
  selectedCard,
  selectedCardId,
  setSelectedCardId,
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
            <button
              className={`bank-tab ${bank.id === selectedBankId ? "active" : ""}`}
              key={bank.id}
              onClick={() => selectBank(bank.id)}
              type="button"
            >
              <Building2 size={19} />
              <span>
                <strong>{bank.name}</strong>
                <small>{bank.cards.length} tarjetas</small>
              </span>
            </button>
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
                <button
                  className={`card-tab ${card.id === selectedCardId ? "active" : ""}`}
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  style={{ "--accent": card.accent }}
                  type="button"
                >
                  <CreditCard size={22} />
                  <span>
                    <strong>{card.name}</strong>
                    <small>{currency.format(card.monthlyTotal)} / mes</small>
                  </span>
                </button>
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

            <CardExpenseList card={selectedCard} onRemove={removeExpense} onUpdateSavings={updateExpenseSavings} />
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
