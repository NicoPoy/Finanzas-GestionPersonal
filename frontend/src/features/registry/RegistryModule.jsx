import React, { useState } from "react";
import { ListChecks, ReceiptText } from "lucide-react";
import { getPaymentKey } from "../../domain/financeCalculations.js";
import { currency } from "../../utils/formatters.js";

const PAYMENT_STATUS = {
  DEBITED: "debited",
  NONE: "none",
  PAID: "paid",
  TRANSFERRED: "transferred",
};

// Matriz anual: filas son cosas a pagar y columnas son meses.
export default function RegistryModule({ paymentDetails, paymentRegistry, services, onSetPaymentStatus }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
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
      months.filter((_, monthIndex) => {
        const paymentKey = getPaymentKey(selectedYear, monthIndex, service.id);
        const status = getRegistryStatus(paymentRegistry, paymentDetails, paymentKey, service);

        return status === PAYMENT_STATUS.PAID || status === PAYMENT_STATUS.DEBITED;
      }).length
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
          <span>Debitados / pagados en {selectedYear}</span>
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
                        {service.paymentCard ? ` · Debita de ${service.paymentCard}` : ""}
                      </small>
                    </th>
                    {months.map((month, monthIndex) => {
                      const paymentKey = getPaymentKey(selectedYear, monthIndex, service.id);
                      const status = getRegistryStatus(paymentRegistry, paymentDetails, paymentKey, service);
                      const usesDebitCard = Boolean(service.paymentCard);

                      return (
                        <td key={month.label}>
                          {usesDebitCard ? (
                            <DebitStatusControl
                              month={month.label}
                              service={service}
                              status={status}
                              year={selectedYear}
                              onChange={(nextStatus) =>
                                onSetPaymentStatus(selectedYear, monthIndex, service.id, nextStatus)
                              }
                            />
                          ) : (
                            <PaidStatusControl
                              month={month.label}
                              service={service}
                              status={status}
                              year={selectedYear}
                              onChange={(nextStatus) =>
                                onSetPaymentStatus(selectedYear, monthIndex, service.id, nextStatus)
                              }
                            />
                          )}
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
      </section>
    </section>
  );
}

function DebitStatusControl({ month, service, status, year, onChange }) {
  return (
    <div className="registry-status-group registry-status-group-three" aria-label={`${service.name} ${month} ${year}`}>
      <StatusButton isActive={status === PAYMENT_STATUS.NONE} label="No" tone="pending" onClick={() => onChange(PAYMENT_STATUS.NONE)} />
      <StatusButton
        isActive={status === PAYMENT_STATUS.TRANSFERRED}
        label="Transferido"
        tone="warning"
        onClick={() => onChange(PAYMENT_STATUS.TRANSFERRED)}
      />
      <StatusButton
        isActive={status === PAYMENT_STATUS.DEBITED}
        label="Debitado"
        tone="success"
        onClick={() => onChange(PAYMENT_STATUS.DEBITED)}
      />
    </div>
  );
}

function PaidStatusControl({ month, service, status, year, onChange }) {
  return (
    <div className="registry-status-group registry-status-group-two" aria-label={`${service.name} ${month} ${year}`}>
      <StatusButton isActive={status === PAYMENT_STATUS.NONE} label="No" tone="pending" onClick={() => onChange(PAYMENT_STATUS.NONE)} />
      <StatusButton isActive={status === PAYMENT_STATUS.PAID} label="Pagado" tone="success" onClick={() => onChange(PAYMENT_STATUS.PAID)} />
    </div>
  );
}

function StatusButton({ isActive, label, tone, onClick }) {
  return (
    <button
      className={`registry-status-button ${isActive ? "active" : ""} ${isActive ? tone : "muted"}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function getRegistryStatus(paymentRegistry, paymentDetails, paymentKey, service) {
  const detail = paymentDetails[paymentKey];
  const isPaid = Boolean(paymentRegistry[paymentKey] || detail?.paid);

  if (service.paymentCard) {
    if (isPaid || detail?.status === PAYMENT_STATUS.DEBITED) {
      return PAYMENT_STATUS.DEBITED;
    }

    if (detail?.status === PAYMENT_STATUS.TRANSFERRED || detail?.transferred) {
      return PAYMENT_STATUS.TRANSFERRED;
    }

    return PAYMENT_STATUS.NONE;
  }

  return isPaid ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.NONE;
}
