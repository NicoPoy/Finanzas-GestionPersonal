import React, { useState } from "react";
import { ListChecks, ReceiptText } from "lucide-react";
import { getPaymentKey } from "../../domain/financeCalculations.js";
import { currency } from "../../utils/formatters.js";

// Matriz anual: filas son cosas a pagar y columnas son meses.
export default function RegistryModule({
  onTogglePayment,
  onUpdatePaymentDetail,
  paymentDetails,
  paymentRegistry,
  services,
}) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPaymentKey, setSelectedPaymentKey] = useState("");
  const months = [
    { label: "Enero", short: "Ene" },
    { label: "Febrero", short: "Feb" },
    { label: "Marzo", short: "Mar" },
    { label: "Abril", short: "Abr" },
    { label: "Mayo", short: "May" },
    { label: "Junio", short: "Jun" },
    { label: "Julio", short: "Jul" },
    { label: "Agosto", short: "Ago" },
    { label: "Septiembre", short: "Sep" },
    { label: "Octubre", short: "Oct" },
    { label: "Noviembre", short: "Nov" },
    { label: "Diciembre", short: "Dic" },
  ];

  const paidCount = services.reduce((sum, service) => {
    return (
      sum +
      months.filter((_, monthIndex) => paymentRegistry[getPaymentKey(selectedYear, monthIndex, service.id)]).length
    );
  }, 0);
  const totalCells = services.length * months.length;

  function handleYearChange(event) {
    const parsedYear = Number(event.target.value);

    if (parsedYear >= 2000 && parsedYear <= 2100) {
      setSelectedYear(parsedYear);
    }
  }

  return (
    <section className="workspace single-column registry-workspace">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>Control anual</p>
            <h2>Registro</h2>
          </div>
          <ListChecks size={34} strokeWidth={1.7} />
        </div>

        <div className="registry-toolbar">
          <button type="button" onClick={() => setSelectedYear((year) => year - 1)}>
            {selectedYear - 1}
          </button>
          <label>
            Año
            <input min="2000" max="2100" type="number" value={selectedYear} onChange={handleYearChange} />
          </label>
          <button type="button" onClick={() => setSelectedYear((year) => year + 1)}>
            {selectedYear + 1}
          </button>
        </div>

        <div className="total-strip">
          <span>Abonados en {selectedYear}</span>
          <strong>
            {paidCount} / {totalCells}
          </strong>
        </div>

        {services.length ? (
          <div className="registry-table-wrap">
            <table className="registry-table">
              <thead>
                <tr>
                  <th>Cosa a pagar</th>
                  {months.map((month) => (
                    <th className="month-heading" key={month.label} title={month.label}>
                      {month.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <th>
                      <span>{service.name}</span>
                      <small>
                        {service.category} · <b className="amount-emphasis">{currency.format(service.amount)}</b>
                      </small>
                    </th>
                    {months.map((month, monthIndex) => {
                      const paymentKey = getPaymentKey(selectedYear, monthIndex, service.id);
                      const checked = Boolean(paymentRegistry[paymentKey] || paymentDetails[paymentKey]?.paid);

                      return (
                        <td key={month.label}>
                          <label className="check-cell">
                            <input
                              checked={checked}
                              aria-label={`${service.name} ${month.label} ${selectedYear}`}
                              onChange={() => {
                                onTogglePayment(selectedYear, monthIndex, service.id);
                                setSelectedPaymentKey(paymentKey);
                              }}
                              type="checkbox"
                            />
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedPaymentKey(paymentKey)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  setSelectedPaymentKey(paymentKey);
                                }
                              }}
                            >
                              {checked ? (paymentDetails[paymentKey]?.transferred ? "Transferido" : "Pago") : "No"}
                            </span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ReceiptText size={28} />
            <p>Carga algun servicio o gasto para empezar a usar el registro.</p>
          </div>
        )}

        {selectedPaymentKey && paymentDetails[selectedPaymentKey] ? (
          <PaymentDetailPanel
            detail={paymentDetails[selectedPaymentKey]}
            onChange={(updates) => onUpdatePaymentDetail(selectedPaymentKey, updates)}
            paymentKey={selectedPaymentKey}
            service={services.find((service) => selectedPaymentKey.endsWith(service.id))}
          />
        ) : null}
      </section>
    </section>
  );
}

function PaymentDetailPanel({ detail, onChange, paymentKey, service }) {
  const expectedAmount = Number(detail.expectedAmount) || service?.amount || 0;
  const paidAmount = Number(detail.paidAmount) || 0;
  const difference = paidAmount - expectedAmount;
  const isTransferred = detail.transferred || false;
  const hasPaymentCard = service?.paymentCard;

  return (
    <section className="payment-detail-panel">
      <div>
        <p>Detalle del pago</p>
        <h3>{service?.name ?? paymentKey}</h3>
      </div>

      <div className="payment-detail-grid">
        <label>
          Fecha de pago
          <input
            type="date"
            value={(detail.paidAt ?? "").slice(0, 10)}
            onChange={(event) =>
              onChange({
                paidAt: event.target.value ? new Date(`${event.target.value}T12:00:00`).toISOString() : "",
              })
            }
          />
        </label>
        <label>
          Monto esperado
          <input
            min="0"
            type="number"
            value={expectedAmount}
            onChange={(event) => onChange({ expectedAmount: Number(event.target.value) || 0 })}
          />
        </label>
        <label>
          Monto pagado
          <input
            min="0"
            type="number"
            value={paidAmount}
            onChange={(event) => onChange({ paidAmount: Number(event.target.value) || 0 })}
          />
        </label>
        <label>
          Medio de pago
          <input
            placeholder="Transferencia, debito, efectivo..."
            value={detail.method ?? ""}
            onChange={(event) => onChange({ method: event.target.value })}
          />
        </label>
        {hasPaymentCard && (
          <label className="checkbox-field">
            <input
              checked={isTransferred}
              onChange={(event) => onChange({ transferred: event.target.checked })}
              type="checkbox"
            />
            <span>Transferido</span>
          </label>
        )}
        <label className="payment-notes-field">
          Observacion
          <input
            placeholder="Detalle opcional"
            value={detail.notes ?? ""}
            onChange={(event) => onChange({ notes: event.target.value })}
          />
        </label>
        <div className={`difference-box ${difference < 0 ? "negative" : difference > 0 ? "warning" : "positive"}`}>
          <span>Diferencia</span>
          <strong>{currency.format(difference)}</strong>
        </div>
      </div>
    </section>
  );
}
