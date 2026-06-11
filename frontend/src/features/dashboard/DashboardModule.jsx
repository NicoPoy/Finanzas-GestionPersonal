import React from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Home,
  LayoutDashboard,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { currency } from "../../utils/formatters.js";

export default function DashboardModule({ currentMonthSummary, dueItems, history, monthZeroDate, nextMonthSummary }) {
  const recentHistory = history.slice(0, 6);
  const isMonthZero = isSummaryMonthZero(currentMonthSummary, monthZeroDate);

  return (
    <section className="workspace single-column">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>Proximo sueldo</p>
            <h2>Dashboard</h2>
          </div>
          <LayoutDashboard size={34} strokeWidth={1.7} />
        </div>

        <p className="dashboard-month-label">
          Sueldo de {nextMonthSummary.monthTitle}
          <span>
            Tarjetas: resumen de {nextMonthSummary.statementMonthTitle}
          </span>
        </p>
        <DashboardSummaryGrid cardHint="Resumen que cierra este mes" summary={nextMonthSummary} />

        {!isMonthZero ? (
          <section className="dashboard-month-section">
          <div className="dashboard-month-heading">
            <div>
              <p>Sueldo actual</p>
              <h3>{currentMonthSummary.monthTitle}</h3>
              <small>
                Tarjetas: resumen de {currentMonthSummary.statementMonthTitle}
              </small>
            </div>
          </div>

          <DashboardSummaryGrid cardHint="Resumen del mes anterior" compact summary={currentMonthSummary} />

          <div className="split-panels">
            <section className="inline-panel">
              <div className="inline-panel-heading">
                <CalendarClock size={19} />
                <h3>Vencimientos</h3>
              </div>
              {dueItems.length ? (
                <div className="due-list">
                  {dueItems.slice(0, 10).map((item) => (
                    <div className={`due-item due-${item.status}`} key={item.paymentKey}>
                      <span>
                        <strong>{item.name}</strong>
                        <small>
                          {item.category} · vence el {item.dueDate.toLocaleDateString("es-AR")}
                        </small>
                      </span>
                      <DueBadge item={item} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="panel-empty">Todavia no hay vencimientos para mostrar.</p>
              )}
            </section>

            <section className="inline-panel">
              <div className="inline-panel-heading">
                <CheckCircle2 size={19} />
                <h3>Ultimos pagos</h3>
              </div>
              {recentHistory.length ? (
                <div className="history-list compact-history">
                  {recentHistory.map((item) => (
                    <div className="history-item" key={item.id}>
                      <span>
                        <strong>{item.serviceName}</strong>
                        <small>
                          {item.period} · {item.category}
                        </small>
                      </span>
                      <b>{currency.format(item.paidAmount)}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="panel-empty">Todavia no registraste pagos.</p>
              )}
            </section>
          </div>
          </section>
        ) : null}
      </section>
    </section>
  );
}

function isSummaryMonthZero(summary, monthZeroDate) {
  const monthZero = new Date(monthZeroDate);

  if (Number.isNaN(monthZero.getTime())) {
    return summary.monthTitle === "Junio de 2026";
  }

  if (summary.year != null && summary.monthIndex != null) {
    return summary.year === monthZero.getFullYear() && summary.monthIndex === monthZero.getMonth();
  }

  const monthZeroTitle = monthZero.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const normalizedMonthZeroTitle = monthZeroTitle.charAt(0).toUpperCase() + monthZeroTitle.slice(1);

  return summary.monthTitle === normalizedMonthZeroTitle || summary.monthTitle === "Junio de 2026";
}

function DashboardSummaryGrid({
  cardHint = "Cuotas y consumos de tarjetas",
  compact = false,
  summary,
}) {
  return (
    <div className={`dashboard-grid ${compact ? "dashboard-grid-compact" : ""}`}>
      <DashboardCard
        compact={compact}
        hint="Ingreso mensual configurado"
        icon={<Banknote size={20} />}
        label="Sueldo"
        tone="income"
        value={currency.format(summary.salary)}
      />
      <DashboardCard
        compact={compact}
        hint={cardHint}
        icon={<CreditCard size={20} />}
        label="Gastos tarjetas"
        tone="expense"
        value={currency.format(summary.cardExpenses)}
      />
      <DashboardCard
        compact={compact}
        hint="Departamento, suscripciones y mas"
        icon={<Home size={20} />}
        label="Gastos fijos"
        tone="expense"
        value={currency.format(summary.fixedExpenses)}
      />
      <DashboardCard
        compact={compact}
        hint="Tarjetas + fijos + extraordinarios"
        icon={<Wallet size={20} />}
        label="Gasto total"
        tone="total"
        value={currency.format(summary.totalExpenses)}
      />
      <DashboardCard
        compact={compact}
        hint="Sueldo menos gasto total planificado"
        icon={<PiggyBank size={20} />}
        label="Restante"
        tone={summary.remaining < 0 ? "danger" : "success"}
        value={currency.format(summary.remaining)}
      />
      <DashboardCard
        compact={compact}
        hint="Lo que falta marcar como pagado en el mes"
        icon={<CalendarClock size={20} />}
        label="Pendiente del mes"
        tone={summary.pendingTotal > 0 ? "warning" : "neutral"}
        value={currency.format(summary.pendingTotal)}
      />
    </div>
  );
}

function DashboardCard({ compact = false, hint, icon, label, tone = "", value }) {
  return (
    <article className={`dashboard-card ${compact ? "dashboard-card-compact" : ""} ${tone ? `dashboard-card-${tone}` : ""}`}>
      <div className="dashboard-card-top">
        <span className="dashboard-card-icon">{icon}</span>
        <span className="dashboard-card-label">{label}</span>
      </div>
      <strong>{value}</strong>
      {hint ? <small className="dashboard-card-hint">{hint}</small> : null}
    </article>
  );
}

function DueBadge({ item }) {
  if (item.status === "paid") {
    return <em className="status-pill paid">Pagado</em>;
  }

  if (item.status === "overdue") {
    return (
      <em className="status-pill overdue">
        <AlertTriangle size={14} />
        Vencido
      </em>
    );
  }

  if (item.status === "soon") {
    return <em className="status-pill soon">Vence en {item.diffInDays} dias</em>;
  }

  return <em className="status-pill pending">En {item.diffInDays} dias</em>;
}
