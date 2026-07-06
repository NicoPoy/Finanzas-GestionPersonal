import React, { useState } from "react";
import { Database, ListChecks, ReceiptText, ChevronLeft, ChevronRight, CheckCircle2, Clock, Calendar, FileText } from "lucide-react";
import { getPaymentKey } from "../../domain/financeCalculations.js";
import { currency } from "../../utils/formatters.js";
import "./registry.css";

const PAYMENT_STATUS = {
  DEBITED: "debited",
  NONE: "none",
  PAID: "paid",
  TRANSFERRED: "transferred",
};

const FIRST_REGISTRY_YEAR = 2026;
const MONTHS = [
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

// Registro mensual basado en paymentRegistry/paymentDetails guardados en el perfil.
export default function RegistryModule({ paymentDetails, paymentRegistry, services, onSetPaymentStatus }) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIndex = today.getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonthIndex);
  const selectedMonth = MONTHS[selectedMonthIndex];
  const monthStates = MONTHS.map((_, monthIndex) => buildMonthState({
    monthIndex,
    paymentDetails,
    paymentRegistry,
    selectedYear,
    services,
    today,
  }));
  const selectedState = monthStates[selectedMonthIndex] ?? { completedCount: 0, savedCount: 0 };

  return (
    <section className="workspace single-column registry-workspace">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p className="section-subtitle">Control mensual</p>
            <h2>Registro de pagos</h2>
            <small className="section-desc">
              Registra y realiza un seguimiento mensual de los pagos de tus servicios, suscripciones y tarjetas de crédito.
            </small>
          </div>
          <ListChecks size={34} strokeWidth={1.7} />
        </div>

        <div className="registry-header-row">
          {/* Selector de Año Premium */}
          <div className="registry-year-selector">
            <button
              className="year-nav-btn"
              disabled={selectedYear <= FIRST_REGISTRY_YEAR}
              onClick={() => setSelectedYear((year) => Math.max(FIRST_REGISTRY_YEAR, year - 1))}
              type="button"
              aria-label="Año anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="year-display">
              <span className="year-subtitle">Período</span>
              <span className="year-value">{selectedYear}</span>
            </div>
            <button
              className="year-nav-btn"
              disabled={selectedYear >= currentYear}
              onClick={() => setSelectedYear((year) => Math.min(currentYear, year + 1))}
              type="button"
              aria-label="Año siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Estadísticas Rápidas de Resumen */}
          <div className="registry-summary-grid" aria-label="Resumen del registro">
            <RegistryStat
              label={`${selectedMonth.label}: completados`}
              value={`${selectedState.completedCount} de ${services.length}`}
              icon={<CheckCircle2 size={18} />}
              tone="success"
            />
            <RegistryStat
              label={`${selectedMonth.label}: registrados`}
              value={`${selectedState.savedCount} de ${services.length}`}
              icon={<Database size={18} />}
              tone="info"
            />
          </div>
        </div>

        {services.length ? (
          <>
            {/* Carrusel de Meses del Año */}
            <div className="registry-month-strip" aria-label="Meses del anio">
              {MONTHS.map((month, monthIndex) => {
                const state = monthStates[monthIndex];
                const pct = services.length > 0 ? (state.completedCount / services.length) * 100 : 0;

                return (
                  <button
                    className={[
                      "registry-month-card",
                      selectedMonthIndex === monthIndex ? "selected" : "",
                      state.isComplete ? "complete" : "",
                      state.isCurrent ? "current" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={month.label}
                    onClick={() => setSelectedMonthIndex(monthIndex)}
                    type="button"
                  >
                    <div className="month-card-header">
                      <span>{month.label}</span>
                      {state.isComplete && <CheckCircle2 size={13} className="month-complete-check" />}
                    </div>
                    <strong>
                      {state.completedCount} / {services.length}
                    </strong>
                    <div className="month-progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <small>{state.savedCount} registrados</small>
                  </button>
                );
              })}
            </div>

            <div className="registry-service-list">
              {services.map((service) => (
                <RegistryServiceCard
                  key={service.id}
                  month={selectedMonth.label}
                  monthIndex={selectedMonthIndex}
                  onSetPaymentStatus={onSetPaymentStatus}
                  paymentDetails={paymentDetails}
                  paymentRegistry={paymentRegistry}
                  selectedYear={selectedYear}
                  service={service}
                />
              ))}
            </div>
          </>
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

function RegistryServiceCard({
  month,
  monthIndex,
  onSetPaymentStatus,
  paymentDetails,
  paymentRegistry,
  selectedYear,
  service,
}) {
  const paymentKey = getPaymentKey(selectedYear, monthIndex, service.id);
  const detail = paymentDetails[paymentKey] ?? {};
  const status = getRegistryStatus(paymentRegistry, paymentDetails, paymentKey, service);
  const amount = Number(detail.expectedAmount) || Number(detail.paidAmount) || service.amount;
  const method = detail.method || service.paymentCard || "";
  const isSaved = hasSavedRegistryInfo(paymentRegistry, paymentDetails, paymentKey);

  return (
    <article className={`registry-service-card registry-service-${status}`}>
      <div className="registry-service-main">
        <div>
          <span className="registry-category">{service.category}</span>
          <h3>{service.name}</h3>
          <p>
            <b>{currency.format(amount)}</b>
            {method ? ` - Método: ${method}` : ""}
          </p>
        </div>
        <RegistrySavedBadge detail={detail} isSaved={isSaved} registryValue={paymentRegistry[paymentKey]} status={status} />
      </div>

      <div className="registry-service-meta">
        <span>
          {isSaved ? <Database size={13} /> : <Clock size={13} />}
          {isSaved ? "Registrado en perfil" : "Sin registrar este mes"}
        </span>
        {detail.paidAt ? (
          <span>
            <Calendar size={13} /> Movimiento: {formatRegistryDate(detail.paidAt)}
          </span>
        ) : null}
        {detail.notes ? (
          <span>
            <FileText size={13} /> Nota: {detail.notes}
          </span>
        ) : null}
      </div>

      {service.paymentCard ? (
        <DebitStatusControl
          month={month}
          service={service}
          status={status}
          year={selectedYear}
          onChange={(nextStatus) => onSetPaymentStatus(selectedYear, monthIndex, service.id, nextStatus)}
        />
      ) : (
        <PaidStatusControl
          month={month}
          service={service}
          status={status}
          year={selectedYear}
          onChange={(nextStatus) => onSetPaymentStatus(selectedYear, monthIndex, service.id, nextStatus)}
        />
      )}
    </article>
  );
}

function RegistryStat({ label, value, icon, tone }) {
  return (
    <article className={`registry-stat-card stat-tone-${tone}`}>
      <div className="stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="stat-icon">{icon}</div>
    </article>
  );
}

function RegistrySavedBadge({ detail, isSaved, registryValue, status }) {
  const badgeMeta = {
    debited: { label: "Debitado", icon: <CheckCircle2 size={14} />, tone: "success" },
    transferred: { label: "Transferido", icon: <CheckCircle2 size={14} />, tone: "warning" },
    paid: { label: "Pagado", icon: <CheckCircle2 size={14} />, tone: "success" },
    none: { label: "Sin pagar", icon: <Clock size={14} />, tone: "none" },
  };

  const meta = badgeMeta[status] ?? { label: status, icon: <Clock size={14} />, tone: "none" };

  return (
    <div className={`registry-saved-badge badge-tone-${meta.tone} ${isSaved ? "saved" : "empty"}`}>
      <span className="badge-status-row">
        {meta.icon}
        <strong>{meta.label}</strong>
      </span>
      <span className="badge-subtitle">
        {isSaved
          ? `Registrado${registryValue === false ? " como pendiente" : ""}`
          : detail?.status
            ? "Detalle parcial"
            : "Sin registrar"}
      </span>
    </div>
  );
}

function DebitStatusControl({ month, service, status, year, onChange }) {
  return (
    <div className="registry-status-group registry-status-group-three" aria-label={`${service.name} ${month} ${year}`}>
      <StatusButton isActive={status === PAYMENT_STATUS.NONE} label="No" tone="pending" onClick={() => onChange(PAYMENT_STATUS.NONE)} />
      <StatusButton
        isActive={status === PAYMENT_STATUS.TRANSFERRED}
        label="Transferido"
        mobileLabel="Transf."
        tone="warning"
        onClick={() => onChange(PAYMENT_STATUS.TRANSFERRED)}
      />
      <StatusButton
        isActive={status === PAYMENT_STATUS.DEBITED}
        label="Debitado"
        mobileLabel="Deb."
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
      <StatusButton isActive={status === PAYMENT_STATUS.PAID} label="Pagado" mobileLabel="Pag." tone="success" onClick={() => onChange(PAYMENT_STATUS.PAID)} />
    </div>
  );
}

function StatusButton({ isActive, label, mobileLabel, tone, onClick }) {
  return (
    <button
      aria-label={label}
      className={`registry-status-button ${isActive ? "active" : ""} ${isActive ? tone : "muted"}`}
      data-mobile-label={mobileLabel ?? label}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function buildMonthState({ monthIndex, paymentDetails, paymentRegistry, selectedYear, services, today }) {
  const completedCount = services.filter((service) => {
    const paymentKey = getPaymentKey(selectedYear, monthIndex, service.id);
    const status = getRegistryStatus(paymentRegistry, paymentDetails, paymentKey, service);

    return status === PAYMENT_STATUS.PAID || status === PAYMENT_STATUS.DEBITED;
  }).length;
  const savedCount = services.filter((service) => {
    const paymentKey = getPaymentKey(selectedYear, monthIndex, service.id);

    return hasSavedRegistryInfo(paymentRegistry, paymentDetails, paymentKey);
  }).length;

  return {
    completedCount,
    isComplete: services.length > 0 && completedCount === services.length,
    isCurrent: selectedYear === today.getFullYear() && monthIndex === today.getMonth(),
    savedCount,
  };
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

function hasSavedRegistryInfo(paymentRegistry, paymentDetails, paymentKey) {
  return Object.hasOwn(paymentRegistry, paymentKey) || Object.hasOwn(paymentDetails, paymentKey);
}

function formatRegistryDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
