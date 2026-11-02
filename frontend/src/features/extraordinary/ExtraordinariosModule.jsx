import React, { useState } from "react";
import { Check, Plus, ReceiptText, Star } from "lucide-react";
import MoneyInput from "../../components/forms/MoneyInput.jsx";
import SectionTabs from "../../components/SectionTabs.jsx";
import { getCalendarMonth } from "../../domain/financeCalculations.js";
import { currency } from "../../utils/formatters.js";

export default function ExtraordinariosModule({ expenses, onAdd, onMarkPaid, tabs, activeTab, onSelectTab }) {
  const nextPaymentMonth = getCalendarMonth(1);
  const total = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("amount");
  const query = searchTerm.trim().toLocaleLowerCase("es-AR");
  const visibleExpenses = expenses
    .filter((expense) => expense.name.toLocaleLowerCase("es-AR").includes(query))
    .sort((first, second) => sortBy === "amount"
      ? (Number(second.amount) || 0) - (Number(first.amount) || 0)
      : first.name.localeCompare(second.name, "es"));

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

        {tabs?.length ? (
          <SectionTabs activeId={activeTab} ariaLabel="Categorías de gastos" onSelect={onSelectTab} tabs={tabs} variant="category" />
        ) : null}

        <ExtraordinaryExpenseForm onSubmit={onAdd} />

        <div className="total-strip">
          <span>Total previsto para el proximo mes</span>
          <strong>{currency.format(total)}</strong>
        </div>

        {expenses.length ? (
          <div className="simple-expense-list-toolbar">
            <label className="simple-expense-search">
              <span>Buscar extraordinario</span>
              <input
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nombre del gasto"
                type="search"
                value={searchTerm}
              />
            </label>
            <label className="simple-expense-sort">
              <span>Ordenar por</span>
              <select onChange={(event) => setSortBy(event.target.value)} value={sortBy}>
                <option value="name">Nombre</option>
                <option value="amount">Monto más alto</option>
              </select>
            </label>
            <small className="simple-expense-result-count">{visibleExpenses.length} de {expenses.length} gastos</small>
          </div>
        ) : null}

        {expenses.length ? (
          visibleExpenses.length ? <div className="expense-card-list">
            {visibleExpenses.map((expense) => (
              <article className="expense-card item-active" key={expense.id}>
                <div className="expense-card-left">
                  <div className="expense-card-icon">
                    <Star size={18} />
                  </div>
                  <div className="expense-card-info">
                    <h4>{expense.name}</h4>
                    <p>
                      <span>Previsto para el próximo mes</span>
                    </p>
                  </div>
                </div>
                <div className="expense-card-right">
                  <span className="expense-card-amount">{currency.format(expense.amount)}</span>
                  <div className="expense-card-actions">
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
              </article>
            ))}
          </div> : (
            <div className="empty-state simple-expense-no-results">
              <p>No hay extraordinarios que coincidan con la búsqueda.</p>
              <button onClick={() => setSearchTerm("")} type="button">Limpiar búsqueda</button>
            </div>
          )
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
