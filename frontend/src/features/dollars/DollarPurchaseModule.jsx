import React, { useEffect, useMemo, useState } from "react";
import { Banknote, Plus, RefreshCw } from "lucide-react";
import { currency } from "../../utils/formatters.js";

const DOLLAR_API_URL = "https://dolarapi.com/v1/dolares";

export default function DollarPurchaseModule({ onAddPurchase }) {
  const [dollarAmount, setDollarAmount] = useState("");
  const [quote, setQuote] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const parsedDollarAmount = Number(dollarAmount);
  const saleRate = Number(quote?.venta) || 0;
  const totalPesos = useMemo(
    () => (parsedDollarAmount > 0 && saleRate > 0 ? parsedDollarAmount * saleRate : 0),
    [parsedDollarAmount, saleRate],
  );
  const canSubmit = parsedDollarAmount > 0 && totalPesos > 0;

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

  function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const today = new Date();
    const safeDollarAmount = Number(parsedDollarAmount.toFixed(2));
    const safeTotalPesos = Number(totalPesos.toFixed(2));
    const safeRate = Number(saleRate.toFixed(2));

    onAddPurchase({
      amount: safeTotalPesos,
      dueDay: today.getDate(),
      name: `Compra USD ${safeDollarAmount} - Dolar blue`,
      paymentCard: "",
      dollarPurchase: {
        casa: "blue",
        fechaActualizacion: quote.fechaActualizacion,
        rate: safeRate,
        rateType: "venta",
        usdAmount: safeDollarAmount,
      },
    });

    setDollarAmount("");
    setSuccessMessage(`Se agrego a Extras: USD ${safeDollarAmount} por ${currency.format(safeTotalPesos)}.`);
  }

  return (
    <section className="workspace single-column">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>Operacion cambiaria</p>
            <h2>Compra de dolares</h2>
          </div>
          <Banknote size={34} strokeWidth={1.7} />
        </div>

        <form className="expense-form dollar-purchase-form" onSubmit={handleSubmit}>
          <label>
            Dolares a comprar
            <input
              inputMode="decimal"
              min="0"
              placeholder="Ej: 100"
              step="0.01"
              type="number"
              value={dollarAmount}
              onChange={(event) => {
                setDollarAmount(event.target.value);
                setSuccessMessage("");
              }}
            />
          </label>

          <label>
            Cotizacion blue venta
            <input disabled value={saleRate ? currency.format(saleRate) : "Sin cotizacion"} readOnly />
          </label>

          <label>
            Total en pesos
            <input disabled value={totalPesos ? currency.format(totalPesos) : "$0"} readOnly />
          </label>

          <button disabled={!canSubmit} type="submit">
            <Plus size={18} />
            Agregar gasto
          </button>
        </form>

        <div className="total-strip dollar-quote-strip">
          <span>
            {quote?.fechaActualizacion
              ? `Blue actualizado ${new Date(quote.fechaActualizacion).toLocaleString("es-AR")}`
              : "Cotizacion dolar blue"}
          </span>
          <strong>{saleRate ? currency.format(saleRate) : "--"}</strong>
          <button className="quote-refresh-button" disabled={isLoadingQuote} onClick={loadBlueQuote} type="button">
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>

        {quoteError ? <p className="form-status-message error">{quoteError}</p> : null}
        {successMessage ? <p className="form-status-message success">{successMessage}</p> : null}
      </section>
    </section>
  );
}
