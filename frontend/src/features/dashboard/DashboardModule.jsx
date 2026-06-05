import React from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, LayoutDashboard } from "lucide-react";
import { currency } from "../../utils/formatters.js";

export default function DashboardModule({ dashboard, dueItems, history }) {
  const recentHistory = history.slice(0, 6);

  return (
    <section className="workspace single-column">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>Mes actual</p>
            <h2>Dashboard</h2>
          </div>
          <LayoutDashboard size={34} strokeWidth={1.7} />
        </div>

        <div className="dashboard-grid">
          <DashboardCard label="Sueldo" value={currency.format(dashboard.salary)} />
          <DashboardCard label="Gastos esperados" value={currency.format(dashboard.expectedTotal)} />
          <DashboardCard label="Gastos pagados" value={currency.format(dashboard.paidTotal)} />
          <DashboardCard label="Pendiente por pagar" value={currency.format(dashboard.pendingTotal)} />
          <DashboardCard label="Restante real" tone={dashboard.realRemaining < 0 ? "danger" : "success"} value={currency.format(dashboard.realRemaining)} />
          <DashboardCard label="% usado del sueldo" value={`${dashboard.usedPercentage.toFixed(1)}%`} />
        </div>

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
                      <small>{item.category} · vence el {item.dueDate.toLocaleDateString("es-AR")}</small>
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
                      <small>{item.period} · {item.category}</small>
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
    </section>
  );
}

function DashboardCard({ label, tone = "", value }) {
  return (
    <div className={`dashboard-card ${tone ? `dashboard-card-${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
