import React, { useState } from "react";
import { Pencil, Plus, ReceiptText, Trash2, CreditCard } from "lucide-react";
import MoneyInput from "../../components/forms/MoneyInput.jsx";
import SectionTabs from "../../components/SectionTabs.jsx";
import { currency } from "../../utils/formatters.js";
import "./simpleExpenses.css";

const MONTH_OPTIONS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function getCurrentStartPeriod() {
  const today = new Date();

  return {
    startMonth: today.getMonth(),
    startYear: today.getFullYear(),
  };
}

function normalizeStartMonth(value) {
  const parsed = Number(value);
  return Math.min(Math.max(Number.isFinite(parsed) ? parsed : getCurrentStartPeriod().startMonth, 0), 11);
}

function normalizeStartYear(value) {
  const currentYear = getCurrentStartPeriod().startYear;
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 1900 ? Math.round(parsed) : currentYear;
}

function formatStartPeriod(expense) {
  if (expense.isPermanent) {
    return "Permanente · todos los meses";
  }

  if (expense.startMonth == null || expense.startYear == null) {
    return "Desde: siempre";
  }

  return `Desde: ${MONTH_OPTIONS[normalizeStartMonth(expense.startMonth)]} ${normalizeStartYear(expense.startYear)}`;
}

function formatAmountHistory(expense) {
  const history = Array.isArray(expense.amountHistory) ? expense.amountHistory : [];

  if (!history.length) {
    return [];
  }

  return history
    .slice()
    .sort((a, b) => a.startYear * 12 + a.startMonth - (b.startYear * 12 + b.startMonth))
    .map((item) => `${MONTH_OPTIONS[normalizeStartMonth(item.startMonth)]} ${normalizeStartYear(item.startYear)}: ${currency.format(item.amount)}`);
}
// Módulo genérico para Departamento, Suscripciones, Actividades y Extras.
// Recibe la configuración de la sección desde FinanceApp para evitar duplicar pantallas casi iguales.
export default function SimpleExpenseModule({ module, onAdd, onRemove, onUpdate, tabs, activeTab, onSelectTab }) {
  const Icon = module.icon;

  return (
    <section className="workspace single-column">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>{module.kicker}</p>
            <h2>{module.title}</h2>
          </div>
          <Icon size={34} strokeWidth={1.7} />
        </div>

        {tabs?.length ? (
          <SectionTabs activeId={activeTab} ariaLabel="Categorías de gastos" onSelect={onSelectTab} tabs={tabs} variant="category" />
        ) : null}

        <FixedExpenseForm
          debitCards={module.debitCards}
          namePlaceholder={module.namePlaceholder}
          onSubmit={(expense) => onAdd(module.storageKey, expense)}
        />

        <div className="total-strip">
          <div className="expense-total-copy">
            <span>Total de la categoría</span>
            <small>
              En cuentas y otros medios: {currency.format(module.total)}
              {module.cardExpenses?.length
                ? ` · Ya incluido en Tarjetas: ${currency.format(module.cardExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0))}`
                : " · Sin gastos asociados a tarjetas"}
            </small>
          </div>
          <strong>
            {currency.format(
              module.total + (module.cardExpenses ?? []).reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0),
            )}
          </strong>
        </div>

        <FixedExpenseList
          cardExpenses={module.cardExpenses}
          debitCards={module.debitCards}
          emptyMessage={module.emptyMessage}
          expenses={module.expenses}
          icon={Icon}
          onRemove={(expenseId) => onRemove(module.storageKey, expenseId)}
          onUpdate={(expenseId, updates) => onUpdate(module.storageKey, expenseId, updates)}
        />
      </section>
    </section>
  );
}

// Formulario simple de nombre + monto para gastos fijos no asociados a tarjeta.
function FixedExpenseForm({ debitCards = [], namePlaceholder = "Ej: luz", onSubmit }) {
  const defaultStart = getCurrentStartPeriod();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("10");
  const [startMonth, setStartMonth] = useState(String(defaultStart.startMonth));
  const [startYear, setStartYear] = useState(String(defaultStart.startYear));
  const [isPermanent, setIsPermanent] = useState(false);
  const [paymentCard, setPaymentCard] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!name.trim() || parsedAmount <= 0) {
      return;
    }

    onSubmit({
      name: name.trim(),
      amount: parsedAmount,
      dueDay: Math.min(Math.max(Number(dueDay) || 10, 1), 31),
      isPermanent,
      startMonth: isPermanent ? null : normalizeStartMonth(startMonth),
      startYear: isPermanent ? null : normalizeStartYear(startYear),
      paymentCard,
    });

    const nextDefaultStart = getCurrentStartPeriod();
    setName("");
    setAmount("");
    setDueDay("10");
    setStartMonth(String(nextDefaultStart.startMonth));
    setStartYear(String(nextDefaultStart.startYear));
    setIsPermanent(false);
    setPaymentCard("");
  }

  return (
    <form className={`expense-form fixed-expense-form ${isPermanent ? "is-permanent" : ""}`} onSubmit={handleSubmit}>
      <div className="fixed-expense-primary-fields">
        <label className="fixed-expense-name">
          Nombre del gasto
          <input
            autoComplete="off"
            placeholder={namePlaceholder}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className="fixed-expense-amount">
          Monto mensual
          <MoneyInput value={amount} onValueChange={setAmount} />
        </label>

        <label className="fixed-expense-payment">
          Medio de débito
          <select value={paymentCard} onChange={(event) => setPaymentCard(event.target.value)}>
            <option value="">Sin asociar</option>
            {debitCards.map((card) => (
              <option key={card} value={card}>{card}</option>
            ))}
          </select>
        </label>

        <button type="submit">
          <Plus size={18} />
          Agregar gasto
        </button>
      </div>

      <div className={`fixed-expense-secondary-fields ${isPermanent ? "is-permanent" : ""}`}>
        <div className="fixed-expense-secondary-heading">
          <strong>Vencimiento y vigencia</strong>
          <small>Definí cuándo vence y desde cuándo se repite.</small>
        </div>
        <div className="fixed-expense-secondary-options">
          <label>
            Vence el día
            <input
              min="1"
              max="31"
              placeholder="10"
              type="number"
              value={dueDay}
              onChange={(event) => setDueDay(event.target.value)}
            />
          </label>

          <label>
            Desde el mes
            <select disabled={isPermanent} value={startMonth} onChange={(event) => setStartMonth(event.target.value)}>
              {MONTH_OPTIONS.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
          </label>

          <label>
            Año de inicio
            <input
              disabled={isPermanent}
              min="2000"
              max="2100"
              type="number"
              value={startYear}
              onChange={(event) => setStartYear(event.target.value)}
            />
          </label>

          <label className="simple-expense-permanent-toggle">
            <input checked={isPermanent} onChange={(event) => setIsPermanent(event.target.checked)} type="checkbox" />
            <span>
              <strong>Permanente</strong>
              <small>Se repite todos los meses, sin fecha de inicio.</small>
            </span>
          </label>
        </div>
      </div>
    </form>
  );
}

// Lista gastos propios de la sección y gastos fijos pagados con tarjeta como referencia no sumable.
function FixedExpenseList({
  cardExpenses = [],
  debitCards = [],
  emptyMessage = "Todavía no cargaste gastos fijos del departamento.",
  expenses,
  icon: Icon,
  onRemove,
  onUpdate,
}) {
  const [editingId, setEditingId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("amount");
  const [draft, setDraft] = useState({ amount: "", dueDay: "", isPermanent: false, name: "", paymentCard: "", startMonth: "", startYear: "" });
  const editingExpense = expenses.find((expense) => expense.id === editingId);
  const parsedDraftAmount = Number(draft.amount);
  const canSaveEdit = Boolean(editingExpense) && draft.name.trim() && parsedDraftAmount > 0;
  const searchValue = searchTerm.trim().toLocaleLowerCase("es-AR");
  const visibleRows = [
    ...expenses.map((expense) => ({ expense, type: "fixed" })),
    ...cardExpenses.map((expense) => ({ expense, type: "card" })),
  ]
    .filter(({ expense }) => `${expense.name ?? ""} ${expense.source ?? ""} ${expense.paymentCard ?? ""}`
      .toLocaleLowerCase("es-AR")
      .includes(searchValue))
    .sort((first, second) => {
      if (sortBy === "amount") return (Number(second.expense.amount) || 0) - (Number(first.expense.amount) || 0);
      if (sortBy === "name") return String(first.expense.name ?? "").localeCompare(String(second.expense.name ?? ""), "es");
      return (Number(first.expense.dueDay) || 10) - (Number(second.expense.dueDay) || 10) ||
        String(first.expense.name ?? "").localeCompare(String(second.expense.name ?? ""), "es");
    });

  function closeEditModal() {
    setEditingId("");
    setDraft({ amount: "", dueDay: "", isPermanent: false, name: "", paymentCard: "", startMonth: "", startYear: "" });
  }

  function startEdit(expense) {
    const defaultStart = getCurrentStartPeriod();

    setEditingId(expense.id);
    setDraft({
      amount: String(expense.amount),
      dueDay: String(expense.dueDay ?? 10),
      isPermanent: Boolean(expense.isPermanent),
      name: expense.name,
      paymentCard: expense.paymentCard ?? "",
      startMonth: String(expense.startMonth ?? defaultStart.startMonth),
      startYear: String(expense.startYear ?? defaultStart.startYear),
    });
  }

  function saveEdit() {
    if (!editingExpense || !canSaveEdit) {
      return;
    }

    onUpdate(editingExpense.id, {
      amount: parsedDraftAmount,
      dueDay: Math.min(Math.max(Number(draft.dueDay) || 10, 1), 31),
      name: draft.name.trim(),
      paymentCard: draft.paymentCard,
      isPermanent: draft.isPermanent,
      startMonth: draft.isPermanent ? null : normalizeStartMonth(draft.startMonth),
      startYear: draft.isPermanent ? null : normalizeStartYear(draft.startYear),
    });
    closeEditModal();
  }

  if (!expenses.length && !cardExpenses.length) {
    return (
      <div className="empty-state">
        <ReceiptText size={28} />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="simple-expense-list-toolbar">
        <label className="simple-expense-search">
          <span>Buscar gasto</span>
          <input
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Nombre o tarjeta"
            type="search"
            value={searchTerm}
          />
        </label>
        <label className="simple-expense-sort">
          <span>Ordenar por</span>
          <select onChange={(event) => setSortBy(event.target.value)} value={sortBy}>
            <option value="dueDay">Vencimiento</option>
            <option value="amount">Monto más alto</option>
            <option value="name">Nombre</option>
          </select>
        </label>
        <small className="simple-expense-result-count">{visibleRows.length} de {expenses.length + cardExpenses.length} gastos</small>
      </div>

      {visibleRows.length ? (
        <div className="expense-card-list">
          {visibleRows.map(({ expense, type }) => type === "fixed" ? (
            <SimpleExpenseRow
              expense={expense}
              icon={Icon}
              key={expense.id}
              onDelete={() => onRemove(expense.id)}
              onEdit={() => startEdit(expense)}
            />
          ) : (
            <article className="expense-card item-card-paid" key={`card-${expense.id}`}>
              <div className="expense-card-left">
                <div className="expense-card-icon card-icon-secondary">
                  <CreditCard size={18} />
                </div>
                <div className="expense-card-info">
                  <h4>{expense.name}</h4>
                  <div className="simple-expense-meta">
                    <span>Vence día {expense.dueDay ?? 10}</span>
                    <span className="expense-meta-source"><CreditCard size={13} /> {expense.source}</span>
                  </div>
                </div>
              </div>
              <div className="expense-card-right">
                <span className="expense-card-amount">{currency.format(expense.amount)}</span>
                <span className="card-paid-badge">Incluido en Tarjetas</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state simple-expense-no-results">
          <p>No hay gastos que coincidan con la búsqueda.</p>
          <button onClick={() => setSearchTerm("")} type="button">Limpiar búsqueda</button>
        </div>
      )}

      {editingExpense ? (
        <div className="confirm-backdrop" role="presentation">
          <section
            aria-labelledby="simple-expense-edit-title"
            aria-modal="true"
            className="confirm-modal record-edit-modal"
            role="dialog"
          >
            <h2 id="simple-expense-edit-title">Editar gasto</h2>
            <form
              className="record-edit-form"
              onSubmit={(event) => {
                event.preventDefault();
                saveEdit();
              }}
            >
              <label>
                Nombre
                <input
                  autoComplete="off"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                Monto
                <MoneyInput
                  value={draft.amount}
                  onValueChange={(value) => setDraft((current) => ({ ...current, amount: value }))}
                />
              </label>
              <label>
                Vence día
                <input
                  max="31"
                  min="1"
                  type="number"
                  value={draft.dueDay}
                  onChange={(event) => setDraft((current) => ({ ...current, dueDay: event.target.value }))}
                />
              </label>
              <label className="simple-expense-permanent-toggle">
                <input
                  checked={draft.isPermanent}
                  onChange={(event) => setDraft((current) => ({ ...current, isPermanent: event.target.checked }))}
                  type="checkbox"
                />
                <span>
                  <strong>Permanente</strong>
                  <small>Se incluye en todos los meses.</small>
                </span>
              </label>
              {!draft.isPermanent ? (
                <>
                  <label>
                    Desde mes
                    <select
                      value={draft.startMonth}
                      onChange={(event) => setDraft((current) => ({ ...current, startMonth: event.target.value }))}
                    >
                      {MONTH_OPTIONS.map((month, index) => (
                        <option key={month} value={index}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Año
                    <input
                      min="2000"
                      max="2100"
                      type="number"
                      value={draft.startYear}
                      onChange={(event) => setDraft((current) => ({ ...current, startYear: event.target.value }))}
                    />
                  </label>
                </>
              ) : null}
              <label>
                Debita de
                <select
                  value={draft.paymentCard ?? ""}
                  onChange={(event) => setDraft((current) => ({ ...current, paymentCard: event.target.value }))}
                >
                  <option value="">Sin asociar</option>
                  {debitCards.map((card) => (
                    <option key={card} value={card}>
                      {card}
                    </option>
                  ))}
                </select>
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

function SimpleExpenseRow({ expense, icon: Icon, onDelete, onEdit }) {
  return (
    <article className="expense-card item-active" key={expense.id}>
      <div className="expense-card-left">
        <div className="expense-card-icon">
          <Icon size={18} />
        </div>
        <div className="expense-card-info">
          <h4>{expense.name}</h4>
          <div className="simple-expense-meta">
            <span>Vence día {expense.dueDay ?? 10}</span>
            <span>{formatStartPeriod(expense)}</span>
            <span className="expense-meta-source"><CreditCard size={13} /> {expense.paymentCard || "Sin asociar"}</span>
          </div>
        </div>
      </div>
      <div className="expense-card-right">
        <span className="expense-card-amount">{currency.format(expense.amount)}</span>
        <div className="expense-card-actions">
          <button className="icon-button btn-edit-expense" onClick={onEdit} title="Editar gasto" type="button">
            <Pencil size={15} />
          </button>
          <button
            aria-label={`Eliminar ${expense.name}`}
            className="icon-button btn-delete-expense"
            onClick={onDelete}
            title="Eliminar gasto"
            type="button"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
