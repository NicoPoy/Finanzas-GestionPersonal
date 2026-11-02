import React, { useState } from "react";
import { CreditCard, Database, ListChecks, ReceiptText, ChevronLeft, ChevronRight, CheckCircle2, Clock, Calendar, FileText, Search } from "lucide-react";
import { getPaymentKey, getSimpleExpenseAmountForMonth, isSimpleExpenseActiveForMonth } from "../../domain/financeCalculations.js";
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
export default function RegistryModule({
  historicalCardPayments = {},
  onMarkHistoricalCardPaid,
  onSetPaymentStatus,
  paymentDetails,
  paymentHistory = [],
  paymentRegistry,
  services,
}) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIndex = today.getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonthIndex);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const selectedMonth = MONTHS[selectedMonthIndex];
  const monthStates = MONTHS.map((_, monthIndex) => buildMonthState({
    monthIndex,
    historicalCardPayments,
    paymentDetails,
    paymentHistory,
    paymentRegistry,
    selectedYear,
    services,
    today,
  }));
  const selectedState = monthStates[selectedMonthIndex] ?? { completedCount: 0, savedCount: 0 };
  const selectedServices = getServicesForMonth(services, selectedYear, selectedMonthIndex);
  const registryRows = selectedServices.map((service) => buildRegistryRow({
    monthIndex: selectedMonthIndex,
    historicalCardPayments,
    paymentDetails,
    paymentHistory,
    paymentRegistry,
    selectedYear,
    service,
  }));
  const searchValue = searchTerm.trim().toLocaleLowerCase("es-AR");
  const searchedRows = registryRows.filter((row) =>
    `${row.service.name} ${row.service.category}`.toLocaleLowerCase("es-AR").includes(searchValue),
  );
  const registryFilters = buildRegistryFilters(searchedRows);
  const visibleRows = sortRegistryRows(filterRegistryRows(searchedRows, activeFilter));
  const periodSummary = buildPeriodSummary(registryRows);
  const isPastMonth = selectedYear * 12 + selectedMonthIndex < currentYear * 12 + currentMonthIndex;
  const hasCardServices = selectedServices.some(isCardService);

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
              label="Pendiente"
              detail="Pagos que aún requieren atención"
              value={currency.format(periodSummary.pendingAmount)}
              icon={<Clock size={18} />}
              tone="warning"
            />
            <RegistryStat
              label="Vencidos"
              detail="Servicios con fecha vencida"
              value={periodSummary.overdueCount}
              icon={<Calendar size={18} />}
              tone={periodSummary.overdueCount ? "warning" : "success"}
            />
            <RegistryStat
              label="Próximos 3 días"
              detail="Servicios con fecha definida"
              value={periodSummary.soonCount}
              icon={<Clock size={18} />}
              tone="info"
            />
            <RegistryStat
              label="Completados"
              detail="Pagados o debitados"
              value={`${selectedState.completedCount} de ${selectedState.serviceCount}`}
              icon={<CheckCircle2 size={18} />}
              tone="success"
            />
          </div>
        </div>

        {services.length ? (
          <>
            {/* Carrusel de Meses del Año */}
            <div className="registry-month-strip" aria-label="Meses del anio">
              {MONTHS.map((month, monthIndex) => {
                const state = monthStates[monthIndex];
                const pct = state.serviceCount > 0 ? (state.completedCount / state.serviceCount) * 100 : 0;

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
                      {state.completedCount} / {state.serviceCount}
                    </strong>
                    <div className="month-progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <small aria-label={`${state.savedCount} servicios con datos guardados`}>{state.savedCount} datos</small>
                  </button>
                );
              })}
            </div>

            <div className="registry-list-toolbar">
              <label className="registry-search">
                <Search size={17} aria-hidden="true" />
                <input
                  aria-label="Buscar pagos por nombre o categoría"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar servicio o categoría"
                  type="search"
                  value={searchTerm}
                />
              </label>
              <span className="registry-result-count">{visibleRows.length} visibles · {registryRows.length} pagos del mes</span>
            </div>

            <div className="registry-filter-bar" aria-label="Filtros del registro">
              {registryFilters.map((filter) => (
                <button
                  className={activeFilter === filter.id ? "active" : ""}
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  type="button"
                >
                  <span>{filter.label}</span>
                  <strong>{filter.count}</strong>
                </button>
              ))}
            </div>

            {hasCardServices && !isPastMonth ? (
              <p className="registry-card-payment-note registry-card-payment-note-global">
                <CreditCard size={15} />
                Los pagos de tarjetas se registran desde “Tarjetas de Crédito”.
              </p>
            ) : null}

            <div className="registry-service-list">
              {visibleRows.map((row) => (
                <RegistryServiceCard
                  key={row.service.id}
                  month={selectedMonth.label}
                  monthIndex={selectedMonthIndex}
                  historicalCardPayments={historicalCardPayments}
                  onMarkHistoricalCardPaid={onMarkHistoricalCardPaid}
                  onSetPaymentStatus={onSetPaymentStatus}
                  paymentDetails={paymentDetails}
                  paymentHistory={paymentHistory}
                  paymentRegistry={paymentRegistry}
                  selectedYear={selectedYear}
                  service={row.service}
                />
              ))}
              {!selectedServices.length ? (
                <div className="empty-state registry-period-empty">
                  <ReceiptText size={24} />
                  <p>No hay gastos activos para {selectedMonth.label} de {selectedYear}.</p>
                </div>
              ) : null}
              {selectedServices.length && !visibleRows.length ? (
                <div className="empty-state registry-period-empty">
                  <Search size={24} />
                  <p>No hay pagos que coincidan con la búsqueda o los filtros.</p>
                  <button
                    className="registry-clear-search"
                    onClick={() => { setSearchTerm(""); setActiveFilter("all"); }}
                    type="button"
                  >
                    Limpiar búsqueda y filtros
                  </button>
                </div>
              ) : null}
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

function buildRegistryRow({ historicalCardPayments, monthIndex, paymentDetails, paymentHistory, paymentRegistry, selectedYear, service }) {
  const paymentKey = getPaymentKey(selectedYear, monthIndex, service.id);
  const detail = paymentDetails[paymentKey] ?? {};
  const status = getRegistryStatus(paymentRegistry, paymentDetails, paymentKey, service, paymentHistory, historicalCardPayments, selectedYear, monthIndex);
  const isCard = isCardService(service);
  const dueDate = isCard
    ? null
    : new Date(selectedYear, monthIndex, Math.min(service.dueDay ?? 10, new Date(selectedYear, monthIndex + 1, 0).getDate()));
  const today = new Date();
  const diffInDays = dueDate
    ? Math.ceil((startOfRegistryDay(dueDate) - startOfRegistryDay(today)) / 86400000)
    : null;

  return {
    detail,
    diffInDays,
    dueDate,
    isCard,
    isDebit: Boolean(service.paymentCard),
    key: paymentKey,
    amount: Number(detail.expectedAmount) || Number(detail.paidAmount) || service.amount,
    service,
    status,
  };
}

function isCardService(service) {
  return service.category === "Tarjetas" || String(service.id).startsWith("card:");
}

function buildRegistryFilters(rows) {
  const isUnresolved = (row) => row.status === PAYMENT_STATUS.NONE || row.status === PAYMENT_STATUS.TRANSFERRED;

  return [
    { count: rows.length, id: "all", label: "Todos" },
    { count: rows.filter(isUnresolved).length, id: "pending", label: "Pendientes" },
    { count: rows.filter((row) => !row.isCard && isUnresolved(row) && row.diffInDays < 0).length, id: "overdue", label: "Vencidos" },
    { count: rows.filter((row) => row.status === PAYMENT_STATUS.PAID || row.status === PAYMENT_STATUS.DEBITED).length, id: "paid", label: "Pagados" },
    { count: rows.filter((row) => !row.isCard && isUnresolved(row) && row.diffInDays >= 0 && row.diffInDays <= 3).length, id: "soon", label: "Vencen pronto" },
    { count: rows.filter((row) => row.isCard).length, id: "cards", label: "Tarjetas" },
    { count: rows.filter((row) => row.isDebit).length, id: "debits", label: "Débitos" },
    { count: rows.filter((row) => row.service.paymentCard).length, id: "account", label: "Cuenta/banco" },
  ];
}

function filterRegistryRows(rows, filter) {
  if (filter === "pending") return rows.filter((row) => row.status === PAYMENT_STATUS.NONE || row.status === PAYMENT_STATUS.TRANSFERRED);
  if (filter === "overdue") return rows.filter((row) => !row.isCard && (row.status === PAYMENT_STATUS.NONE || row.status === PAYMENT_STATUS.TRANSFERRED) && row.diffInDays < 0);
  if (filter === "paid") return rows.filter((row) => row.status === PAYMENT_STATUS.PAID || row.status === PAYMENT_STATUS.DEBITED);
  if (filter === "soon") return rows.filter((row) => !row.isCard && (row.status === PAYMENT_STATUS.NONE || row.status === PAYMENT_STATUS.TRANSFERRED) && row.diffInDays >= 0 && row.diffInDays <= 3);
  if (filter === "cards") return rows.filter((row) => row.isCard);
  if (filter === "debits") return rows.filter((row) => row.isDebit);
  if (filter === "account") return rows.filter((row) => row.service.paymentCard);
  return rows;
}

function sortRegistryRows(rows) {
  const statusWeight = {
    [PAYMENT_STATUS.NONE]: 0,
    [PAYMENT_STATUS.TRANSFERRED]: 0,
    [PAYMENT_STATUS.PAID]: 2,
    [PAYMENT_STATUS.DEBITED]: 2,
  };

  return [...rows].sort((first, second) =>
    statusWeight[first.status] - statusWeight[second.status] ||
    (first.dueDate?.getTime() ?? Number.POSITIVE_INFINITY) - (second.dueDate?.getTime() ?? Number.POSITIVE_INFINITY) ||
    first.service.name.localeCompare(second.service.name, "es"),
  );
}

function buildPeriodSummary(rows) {
  const pendingRows = rows.filter((row) =>
    row.status === PAYMENT_STATUS.NONE || row.status === PAYMENT_STATUS.TRANSFERRED,
  );

  return {
    pendingAmount: pendingRows.reduce((total, row) => total + row.amount, 0),
    overdueCount: pendingRows.filter((row) => !row.isCard && row.diffInDays < 0).length,
    soonCount: pendingRows.filter((row) => !row.isCard && row.diffInDays >= 0 && row.diffInDays <= 3).length,
  };
}

function startOfRegistryDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function RegistryServiceCard({
  month,
  monthIndex,
  historicalCardPayments,
  onMarkHistoricalCardPaid,
  onSetPaymentStatus,
  paymentDetails,
  paymentHistory,
  paymentRegistry,
  selectedYear,
  service,
}) {
  const paymentKey = getPaymentKey(selectedYear, monthIndex, service.id);
  const detail = paymentDetails[paymentKey] ?? {};
  const status = getRegistryStatus(paymentRegistry, paymentDetails, paymentKey, service, paymentHistory, historicalCardPayments, selectedYear, monthIndex);
  const amount = Number(detail.expectedAmount) || Number(detail.paidAmount) || service.amount;
  const method = detail.method || service.paymentCard || "";
  const isSaved = hasSavedRegistryInfo(paymentRegistry, paymentDetails, paymentKey);
  const isHistoricalCardPayment = Boolean(historicalCardPayments[paymentKey]) && isCardService(service);
  const cardPaymentRecorded = isCardService(service) && paymentHistory.some(
    (item) => item.type === "card_payment" && item.serviceId === service.id && item.period === `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}`,
  );
  const isPastMonth = selectedYear * 12 + monthIndex < new Date().getFullYear() * 12 + new Date().getMonth();
  const canMarkHistoricalCardPaid = isPastMonth && isCardService(service) && status === PAYMENT_STATUS.NONE;

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
        <div className="registry-service-status-tools">
          <RegistrySavedBadge
            detail={detail}
            cardPaymentRecorded={cardPaymentRecorded}
            historicalOnly={isHistoricalCardPayment}
            isSaved={isSaved || isHistoricalCardPayment}
            registryValue={paymentRegistry[paymentKey]}
            status={status}
          />
          {canMarkHistoricalCardPaid ? (
            <button
              className="registry-historical-card-paid"
              onClick={() => onMarkHistoricalCardPaid?.(selectedYear, monthIndex, service.id)}
              title="Marca solo el estado de este mes; no modifica la tarjeta ni sus cuotas."
              type="button"
            >
              Marcar pagada
            </button>
          ) : null}
        </div>
      </div>

      {!isCardService(service) || detail.paidAt || detail.notes ? (
        <div className="registry-service-meta">
          {!isCardService(service) ? (
            <span>
              {isSaved ? <Database size={13} /> : <Clock size={13} />}
              {isSaved ? "Datos guardados en perfil" : "Sin datos guardados"}
            </span>
          ) : null}
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
      ) : null}

      {isCardService(service) ? null : service.paymentCard ? (
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

function RegistryStat({ label, detail, value, icon, tone }) {
  return (
    <article className={`registry-stat-card stat-tone-${tone}`}>
      <div className="stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
      <div className="stat-icon">{icon}</div>
    </article>
  );
}

function RegistrySavedBadge({ cardPaymentRecorded = false, detail, historicalOnly = false, isSaved, registryValue, status }) {
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
        {historicalOnly
          ? "Marcado solo en registro"
          : cardPaymentRecorded
            ? "Pago desde Tarjetas"
          : isSaved
          ? `Datos guardados${registryValue === false ? " · pendiente" : ""}`
          : detail?.status
            ? "Detalle guardado"
            : "Sin datos"}
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

function buildMonthState({ historicalCardPayments, monthIndex, paymentDetails, paymentHistory, paymentRegistry, selectedYear, services, today }) {
  const activeServices = getServicesForMonth(services, selectedYear, monthIndex);
  const completedCount = activeServices.filter((service) => {
    const paymentKey = getPaymentKey(selectedYear, monthIndex, service.id);
    const status = getRegistryStatus(paymentRegistry, paymentDetails, paymentKey, service, paymentHistory, historicalCardPayments, selectedYear, monthIndex);

    return status === PAYMENT_STATUS.PAID || status === PAYMENT_STATUS.DEBITED;
  }).length;
  const savedCount = activeServices.filter((service) => {
    const paymentKey = getPaymentKey(selectedYear, monthIndex, service.id);

    return hasSavedRegistryInfo(paymentRegistry, paymentDetails, paymentKey) || Boolean(historicalCardPayments[paymentKey]);
  }).length;

  return {
    completedCount,
    isComplete: activeServices.length > 0 && completedCount === activeServices.length,
    isCurrent: selectedYear === today.getFullYear() && monthIndex === today.getMonth(),
    savedCount,
    serviceCount: activeServices.length,
  };
}

function getServicesForMonth(services, year, monthIndex) {
  return services
    .filter((service) => {
      const prefix = String(service.id).split(":", 1)[0];
      const isSimpleService = ["department", "subscriptions", "activities", "extras"].includes(prefix);

      return !isSimpleService || isSimpleExpenseActiveForMonth(service, year, monthIndex);
    })
    .map((service) => {
      const prefix = String(service.id).split(":", 1)[0];
      const isSimpleService = ["department", "subscriptions", "activities", "extras"].includes(prefix);

      return isSimpleService ? { ...service, amount: getSimpleExpenseAmountForMonth(service, year, monthIndex) } : service;
    });
}

function getRegistryStatus(paymentRegistry, paymentDetails, paymentKey, service, paymentHistory = [], historicalCardPayments = {}, year, monthIndex) {
  const detail = paymentDetails[paymentKey];
  if (isCardService(service)) {
    const registeredFromCard = paymentHistory.some(
      (item) => item.type === "card_payment" && item.serviceId === service.id && item.period === `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    );

    return registeredFromCard || historicalCardPayments[paymentKey]
      ? PAYMENT_STATUS.PAID
      : PAYMENT_STATUS.NONE;
  }

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

