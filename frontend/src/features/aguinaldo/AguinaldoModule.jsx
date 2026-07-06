import React, { useEffect, useMemo, useState } from "react";
import { Banknote, PiggyBank, Plus, ReceiptText, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import MoneyInput from "../../components/forms/MoneyInput.jsx";
import { currency } from "../../utils/formatters.js";
import "./aguinaldo.css";

const DOLLAR_API_URL = "https://dolarapi.com/v1/dolares";

export default function AguinaldoModule({
  aguinaldo,
  onAddDollarPurchase,
  onAddExpense,
  onRemoveDollarPurchase,
  onRemoveExpense,
  onReset,
  onUpdateAmount,
  onUpdateSavings,
}) {
  const [amountDraft, setAmountDraft] = useState("");
  const [savingsDraft, setSavingsDraft] = useState("");
  const [expenseOrigin, setExpenseOrigin] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [dollarAmount, setDollarAmount] = useState("");
  const [quote, setQuote] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const baseAmount = Number(aguinaldo?.amount) || 0;
  const savingsAmount = Number(aguinaldo?.savingsAmount) || 0;
  const expenses = aguinaldo?.expenses ?? [];
  const dollarPurchases = aguinaldo?.dollarPurchases ?? [];
  const history = aguinaldo?.history ?? [];
  const expensesTotal = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  const dollarsTotal = dollarPurchases.reduce((sum, purchase) => sum + (Number(purchase.amount) || 0), 0);
  const dollarUsdTotal = dollarPurchases.reduce((sum, purchase) => sum + (Number(purchase.usdAmount) || 0), 0);
  const assignedTotal = savingsAmount + expensesTotal + dollarsTotal;
  const remainingTotal = baseAmount - assignedTotal;
  const maxSavings = Math.max(baseAmount - expensesTotal - dollarsTotal, 0);
  const saleRate = Number(quote?.venta) || 0;
  const parsedDollarAmount = Number(dollarAmount);
  const parsedAmountDraft = Number(amountDraft);
  const dollarPurchaseTotal = useMemo(
    () => (parsedDollarAmount > 0 && saleRate > 0 ? parsedDollarAmount * saleRate : 0),
    [parsedDollarAmount, saleRate],
  );
  const parsedExpenseAmount = Number(expenseAmount);
  const parsedSavingsDraft = Number(savingsDraft);
  const canSaveAmount = parsedAmountDraft >= assignedTotal && parsedAmountDraft !== baseAmount;
  const canSaveSavings = parsedSavingsDraft >= 0 && parsedSavingsDraft <= maxSavings && parsedSavingsDraft !== savingsAmount;
  const canAddExpense = expenseOrigin.trim() && parsedExpenseAmount > 0 && parsedExpenseAmount <= Math.max(remainingTotal, 0);
  const canAddDollar = parsedDollarAmount > 0 && dollarPurchaseTotal > 0 && dollarPurchaseTotal <= Math.max(remainingTotal, 0);
  const canReset = baseAmount > 0 || assignedTotal > 0 || expenses.length > 0 || dollarPurchases.length > 0;

  useEffect(() => {
    setAmountDraft(baseAmount ? String(baseAmount) : "");
  }, [baseAmount]);

  useEffect(() => {
    setSavingsDraft(savingsAmount ? String(savingsAmount) : "");
  }, [savingsAmount]);

  useEffect(() => {
    loadBlueQuote();
  }, []);

  async function loadBlueQuote() {
    setIsLoadingQuote(true);
    setQuoteError("");

    try {
      const response = await fetch(DOLLAR_API_URL);

      if (!response.ok) {
        throw new Error("No se pudo consultar la cotizacion.");
      }

      const quotes = await response.json();
      const blueQuote = quotes.find((item) => item.casa === "blue");

      if (!blueQuote) {
        throw new Error("No se encontro la cotizacion del dolar blue.");
      }

      setQuote(blueQuote);
    } catch (error) {
      setQuoteError(error.message || "No se pudo consultar la cotizacion.");
    } finally {
      setIsLoadingQuote(false);
    }
  }

  function saveAmount(event) {
    event.preventDefault();

    if (canSaveAmount) {
      onUpdateAmount(Number(amountDraft) || 0);
    }
  }

  function saveSavings(event) {
    event.preventDefault();

    if (canSaveSavings) {
      onUpdateSavings(Number(savingsDraft) || 0);
    }
  }

  function addExpense(event) {
    event.preventDefault();

    if (!canAddExpense) {
      return;
    }

    onAddExpense({
      amount: Number(parsedExpenseAmount.toFixed(2)),
      origin: expenseOrigin.trim(),
    });
    setExpenseOrigin("");
    setExpenseAmount("");
  }

  function addDollarPurchase(event) {
    event.preventDefault();

    if (!canAddDollar) {
      return;
    }

    const safeDollarAmount = Number(parsedDollarAmount.toFixed(2));
    const safeTotalPesos = Number(dollarPurchaseTotal.toFixed(2));
    const safeRate = Number(saleRate.toFixed(2));

    onAddDollarPurchase({
      amount: safeTotalPesos,
      casa: "blue",
      fechaActualizacion: quote.fechaActualizacion,
      rate: safeRate,
      rateType: "venta",
      usdAmount: safeDollarAmount,
    });
    setDollarAmount("");
  }

  function resetAguinaldo() {
    if (!canReset) {
      return;
    }

    onReset({
      amount: baseAmount,
      assignedTotal,
      dollarPurchases,
      dollarsTotal,
      expenses,
      expensesTotal,
      remainingTotal,
      savingsAmount,
    });
  }

  return (
    <section className="workspace single-column">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>Subsistema independiente</p>
            <h2>Aguinaldo</h2>
            <small className="card-statement-note">Este modulo no impacta en Dashboard, Extras ni Registro.</small>
          </div>
          <div className="aguinaldo-heading-actions">
            <button className="aguinaldo-reset-button" disabled={!canReset} onClick={resetAguinaldo} type="button">
              <RotateCcw size={17} />
              Finalizar ciclo
            </button>
            <PiggyBank size={34} strokeWidth={1.7} />
          </div>
        </div>

        <div className="dashboard-grid dashboard-grid-compact aguinaldo-summary-grid">
          <SummaryCard label="Aguinaldo" value={baseAmount} />
          <SummaryCard label="Asignado" value={assignedTotal} />
          <SummaryCard label="Disponible" tone={remainingTotal < 0 ? "danger" : "success"} value={remainingTotal} />
        </div>

        <form className="expense-form aguinaldo-amount-form" onSubmit={saveAmount}>
          <label>
            Monto de aguinaldo
            <MoneyInput value={amountDraft} onValueChange={setAmountDraft} />
          </label>
          <button disabled={!canSaveAmount} type="submit">Guardar monto</button>
        </form>

        <div className="aguinaldo-grid">
          <section className="aguinaldo-panel">
            <PanelHeading title="Ahorros" description="Monto reservado del aguinaldo." />
            <form className="expense-form aguinaldo-mini-form" onSubmit={saveSavings}>
              <label>
                Monto para ahorrar
                <MoneyInput value={savingsDraft} onValueChange={setSavingsDraft} />
              </label>
              <button disabled={!canSaveSavings} type="submit">Guardar</button>
            </form>
            <div className="total-strip aguinaldo-total-strip">
              <span>Total ahorros</span>
              <strong>{currency.format(savingsAmount)}</strong>
            </div>
          </section>

          <section className="aguinaldo-panel">
            <PanelHeading title="Gastos" description="Usos puntuales que salen del aguinaldo." />
            <form className="expense-form aguinaldo-expense-form" onSubmit={addExpense}>
              <label>
                Origen
                <input
                  autoComplete="off"
                  placeholder="Ej: regalo"
                  value={expenseOrigin}
                  onChange={(event) => setExpenseOrigin(event.target.value)}
                />
              </label>
              <label>
                Monto
                <MoneyInput value={expenseAmount} onValueChange={setExpenseAmount} />
              </label>
              <button disabled={!canAddExpense} type="submit">
                <Plus size={18} />
                Agregar
              </button>
            </form>
            <div className="total-strip aguinaldo-total-strip">
              <span>Total gastos</span>
              <strong>{currency.format(expensesTotal)}</strong>
            </div>
            <MovementList emptyMessage="Todavia no cargaste gastos." items={expenses} onRemove={onRemoveExpense} />
          </section>

          <section className="aguinaldo-panel">
            <PanelHeading title="Dolares" description="Compra estimada con dolar blue venta." />
            <form className="expense-form aguinaldo-dollar-form" onSubmit={addDollarPurchase}>
              <label>
                Dolares a comprar
                <input
                  inputMode="decimal"
                  min="0"
                  placeholder="Ej: 100"
                  step="0.01"
                  type="number"
                  value={dollarAmount}
                  onChange={(event) => setDollarAmount(event.target.value)}
                />
              </label>
              <label>
                Total en pesos
                <input disabled readOnly value={dollarPurchaseTotal ? currency.format(dollarPurchaseTotal) : "$0"} />
              </label>
              <button disabled={!canAddDollar} type="submit">
                <Banknote size={18} />
                Comprar
              </button>
            </form>

            <div className="total-strip dollar-quote-strip aguinaldo-total-strip">
              <span>{saleRate ? "Blue venta" : "Cotizacion dolar blue"}</span>
              <strong>{saleRate ? currency.format(saleRate) : "--"}</strong>
              <button className="quote-refresh-button" disabled={isLoadingQuote} onClick={loadBlueQuote} type="button">
                <RefreshCw size={16} />
                Actualizar
              </button>
            </div>
            <div className="total-strip aguinaldo-total-strip">
              <span>{dollarUsdTotal ? `Total dolares (USD ${dollarUsdTotal})` : "Total dolares"}</span>
              <strong>{currency.format(dollarsTotal)}</strong>
            </div>
            {quoteError ? <p className="form-status-message error">{quoteError}</p> : null}
            <DollarPurchaseList purchases={dollarPurchases} onRemove={onRemoveDollarPurchase} />
          </section>
        </div>

        <AguinaldoHistory history={history} />
      </section>
    </section>
  );
}

function SummaryCard({ label, tone = "", value }) {
  return (
    <article className={`dashboard-card dashboard-card-compact ${tone ? `dashboard-card-${tone}` : ""}`}>
      <span className="dashboard-card-label">{label}</span>
      <strong>{currency.format(value)}</strong>
    </article>
  );
}

function PanelHeading({ description, title }) {
  return (
    <div className="aguinaldo-panel-heading">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function MovementList({ emptyMessage, items, onRemove }) {
  if (!items.length) {
    return (
      <div className="empty-state aguinaldo-empty-state">
        <ReceiptText size={24} />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="expense-table aguinaldo-table">
      {items.map((item) => (
        <div className="table-row aguinaldo-table-row" key={item.id}>
          <strong>{item.origin}</strong>
          <span className="amount-emphasis">{currency.format(item.amount)}</span>
          <button className="icon-button" onClick={() => onRemove(item.id)} title="Eliminar" type="button">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function DollarPurchaseList({ purchases, onRemove }) {
  if (!purchases.length) {
    return (
      <div className="empty-state aguinaldo-empty-state">
        <Banknote size={24} />
        <p>Todavia no cargaste compras de dolares.</p>
      </div>
    );
  }

  return (
    <div className="expense-table aguinaldo-table">
      {purchases.map((purchase) => (
        <div className="table-row aguinaldo-table-row" key={purchase.id}>
          <strong>
            USD {purchase.usdAmount}
            <small>Blue venta {currency.format(purchase.rate)}</small>
          </strong>
          <span className="amount-emphasis">{currency.format(purchase.amount)}</span>
          <button className="icon-button" onClick={() => onRemove(purchase.id)} title="Eliminar" type="button">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function AguinaldoHistory({ history }) {
  if (!history.length) {
    return null;
  }

  return (
    <section className="aguinaldo-panel aguinaldo-history-panel">
      <h3>Historial finalizado</h3>
      <div className="expense-table aguinaldo-table">
        {history.map((item) => (
          <div className="table-row aguinaldo-history-row" key={item.id}>
            <strong>
              {new Date(item.closedAt).toLocaleDateString("es-AR")}
              <small>Asignado {currency.format(item.assignedTotal)}</small>
            </strong>
            <span>Ahorros {currency.format(item.savingsAmount)}</span>
            <span>Gastos {currency.format(item.expensesTotal)}</span>
            <span>Dolares {currency.format(item.dollarsTotal)}</span>
            <span>Disponible {currency.format(item.remainingTotal)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
