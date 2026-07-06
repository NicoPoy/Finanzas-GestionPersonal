import React from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  Home,
  Info,
  LayoutDashboard,
  PiggyBank,
  TrendingDown,
  WalletCards,
  Wallet,
} from "lucide-react";
import { currency } from "../../utils/formatters.js";
import "./dashboard.css";

export default function DashboardModule({
  accountFlow,
  currentMonthSummary,
  debitTransfers = [],
  disappearingExpenses = [],
  dueItems,
  history,
  monthZeroDate,
  nextMonthSummary,
  topExpenses = [],
  upcomingCardExpenses = [],
}) {
  const currentMonthPeriod = getSummaryPeriod(currentMonthSummary);
  const currentMonthEntries = history.filter((item) => item.period === currentMonthPeriod && item.type !== "other_income");
  const cardPayments = buildCardPaymentSummaries(currentMonthEntries.filter(isCardPayment));
  const currentMonthHistory = currentMonthEntries.filter((item) => !isCardPayment(item)).slice(0, 6);
  const cardPaymentsTotal = cardPayments.reduce((sum, item) => sum + (Number(item.paidAmount) || 0), 0);
  const isMonthZero = isSummaryMonthZero(currentMonthSummary, monthZeroDate);
  const health = getFinancialHealth(nextMonthSummary);
  const dueStats = getDueStats(dueItems);
  const paidThisMonth = currentMonthEntries.reduce((sum, item) => sum + (Number(item.paidAmount) || 0), 0);
  const totalIncome = nextMonthSummary.salary || 0;
  const cardsPercent = getPercent(nextMonthSummary.cardExpenses, totalIncome);
  const fixedPercent = getPercent(nextMonthSummary.fixedExpenses, totalIncome);
  const totalPercent = getPercent(nextMonthSummary.totalExpenses, totalIncome);
  const transferTotal = debitTransfers.reduce((sum, account) => sum + account.pendingTransfer, 0);
  const pendingDebitTotal = debitTransfers.reduce((sum, account) => sum + account.pendingDebit, 0);
  const topExpensesTotal = topExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const disappearingTotal = disappearingExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <section className="dashboard-view">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="dashboard-kicker">
            <LayoutDashboard size={18} />
            Centro de control
          </span>
          <h2>Asi esta parado tu proximo sueldo</h2>
          <p>
            Esta pantalla resume el sueldo de {nextMonthSummary.monthTitle}, usando las tarjetas del resumen de{" "}
            {nextMonthSummary.statementMonthTitle}, tus gastos fijos cargados y los pagos que ya marcaste en el registro.
          </p>
        </div>

        <article className={`dashboard-health dashboard-health-${health.tone}`}>
          <span>{health.label}</span>
          <strong>{currency.format(nextMonthSummary.remaining)}</strong>
          <small>{health.description}</small>
        </article>
      </section>

      <section className="dashboard-main-grid">
        <DashboardMetric
          detail="Sueldo configurado mas otros ingresos."
          icon={<Banknote size={21} />}
          label="Ingresos disponibles"
          tone="income"
          value={currency.format(nextMonthSummary.salary)}
        />
        <DashboardMetric
          detail={`Equivale al ${cardsPercent}% de tus ingresos.`}
          icon={<CreditCard size={21} />}
          label="Tarjetas"
          tone="cards"
          value={currency.format(nextMonthSummary.cardExpenses)}
        />
        <DashboardMetric
          detail={`Departamento, suscripciones, actividades y extras: ${fixedPercent}% del ingreso.`}
          icon={<Home size={21} />}
          label="Gastos fijos"
          tone="fixed"
          value={currency.format(nextMonthSummary.fixedExpenses)}
        />
        <DashboardMetric
          detail={`Tarjetas + fijos + extraordinarios: ${totalPercent}% del ingreso.`}
          icon={<Wallet size={21} />}
          label="Gasto proyectado"
          tone="total"
          value={currency.format(nextMonthSummary.totalExpenses)}
        />
      </section>

      <section className="dashboard-story-grid">
        <article className="dashboard-panel dashboard-panel-large">
          <div className="dashboard-panel-heading">
            <div>
              <span className="dashboard-panel-kicker">Como se calcula</span>
              <h3>Origen de la informacion</h3>
            </div>
            <Info size={22} />
          </div>

          <div className="dashboard-formula">
            <div>
              <small>Formula principal</small>
              <strong>Ingresos - gastos proyectados = restante</strong>
            </div>
            <p>
              {currency.format(nextMonthSummary.salary)} - {currency.format(nextMonthSummary.totalExpenses)} ={" "}
              <b>{currency.format(nextMonthSummary.remaining)}</b>
            </p>
          </div>

          <div className="dashboard-source-list">
            <SourceItem
              icon={<Banknote size={18} />}
              label="Ingresos"
              text="Sale del sueldo configurado en Configuracion y suma los otros ingresos guardados."
            />
            <SourceItem
              icon={<CreditCard size={18} />}
              label="Tarjetas"
              text="Usa los bancos, tarjetas, cuotas y ajustes de resumen. Si una tarjeta ya fue pagada, toma el monto real guardado."
            />
            <SourceItem
              icon={<Home size={18} />}
              label="Gastos fijos"
              text="Suma departamento, suscripciones, actividades y extras cargados en sus secciones."
            />
            <SourceItem
              icon={<CalendarClock size={18} />}
              label="Pendientes"
              text="Lee Registro de Pagos: paymentRegistry y paymentDetails para saber que esta pagado, transferido o pendiente."
            />
          </div>
        </article>

        <article className="dashboard-panel dashboard-health-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="dashboard-panel-kicker">Semaforo financiero</span>
              <h3>{health.label}</h3>
            </div>
            <TrendingDown size={22} />
          </div>

          <div className={`health-light health-light-${health.tone}`}>
            <strong>{currency.format(nextMonthSummary.remaining)}</strong>
            <span>{health.description}</span>
          </div>

          <div className="salary-meter" aria-label={`Uso del sueldo: ${totalPercent}%`}>
            <span style={{ width: `${Math.min(totalPercent, 100)}%` }} />
          </div>
          <div className="salary-meter-labels">
            <span>0%</span>
            <strong>{totalPercent}% usado</strong>
            <span>100%</span>
          </div>

          <div className="dashboard-mini-breakdown">
            <BreakdownRow label="Tarjetas" value={nextMonthSummary.cardExpenses} />
            <BreakdownRow label="Gastos fijos" value={nextMonthSummary.fixedExpenses} />
            <BreakdownRow label="Extraordinarios" value={nextMonthSummary.extraordinaryExpenses} />
          </div>
        </article>
      </section>

      <section className="dashboard-insights-grid">
        <article className="dashboard-panel top-expenses-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="dashboard-panel-kicker">Top gastos</span>
              <h3>Lo que mas pesa</h3>
            </div>
            <FileText size={22} />
          </div>
          <div className="insight-total-line">
            <span>Top 15 del proximo resumen</span>
            <strong>{currency.format(topExpensesTotal)}</strong>
          </div>
          {topExpenses.length ? (
            <div className="insight-list top-expenses-list">
              {topExpenses.map((expense, index) => (
                <div className="insight-row" key={expense.id}>
                  <em>{index + 1}</em>
                  <span>
                    <strong>{expense.name}</strong>
                    <small>
                      {expense.category} - {expense.source}
                    </small>
                  </span>
                  <i className="insight-percent">{getPercent(expense.amount, totalIncome)}%</i>
                  <b>{currency.format(expense.amount)}</b>
                </div>
              ))}
            </div>
          ) : (
            <p className="panel-empty">No hay gastos para ordenar todavia.</p>
          )}
        </article>

        <article className="dashboard-panel account-flow-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="dashboard-panel-kicker">Flujo por cuenta</span>
              <h3>Ruta del dinero</h3>
            </div>
            <WalletCards size={22} />
          </div>
          <div className="flow-summary-grid">
            <FlowStat label="Ingresos" value={accountFlow?.incomeTotal ?? 0} />
            <FlowStat label="A transferir" value={accountFlow?.transferTotal ?? 0} tone="warning" />
            <FlowStat label="Despues de transferir" value={accountFlow?.afterTransfers ?? 0} tone="success" />
          </div>
          {accountFlow?.accounts?.length ? (
            <div className="flow-account-list">
              {accountFlow.accounts.map((account) => (
                <div className="flow-account-row" key={account.account}>
                  <span>
                    <strong>{account.account}</strong>
                    <small>
                      Transferir {currency.format(account.pendingTransfer)} - pendiente debito{" "}
                      {currency.format(account.pendingDebit)}
                    </small>
                  </span>
                  <b>{currency.format(account.total)}</b>
                </div>
              ))}
            </div>
          ) : (
            <p className="panel-empty">No hay cuentas con transferencias pendientes.</p>
          )}
        </article>

        <article className="dashboard-panel disappearing-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="dashboard-panel-kicker">Se liberan</span>
              <h3>Gastos que desaparecen</h3>
            </div>
            <CreditCard size={22} />
          </div>
          <div className="insight-total-line">
            <span>Alivio estimado siguiente resumen</span>
            <strong>{currency.format(disappearingTotal)}</strong>
          </div>
          {disappearingExpenses.length ? (
            <div className="insight-list">
              {disappearingExpenses.slice(0, 6).map((expense) => (
                <div className="insight-row" key={expense.id}>
                  <em>OK</em>
                  <span>
                    <strong>{expense.name}</strong>
                    <small>{expense.card} - ultima cuota o compra unica</small>
                  </span>
                  <b>{currency.format(expense.amount)}</b>
                </div>
              ))}
            </div>
          ) : (
            <p className="panel-empty">No hay cuotas que desaparezcan en el proximo pago.</p>
          )}
        </article>
      </section>

      <section className="dashboard-panel upcoming-card-expenses-panel">
        <div className="dashboard-panel-heading">
          <div>
            <span className="dashboard-panel-kicker">Proximo resumen</span>
            <h3>Gastos nuevos de tarjeta</h3>
          </div>
          <CreditCard size={22} />
        </div>

        <p className="upcoming-card-note">
          Estos son los gastos del resumen vigente que no estaban en el resumen anterior de cada tarjeta.
        </p>

        <div className="upcoming-card-grid">
          {upcomingCardExpenses.map((card) => (
            <UpcomingCardExpensesCard card={card} key={card.cardId} />
          ))}
        </div>
      </section>

      <section className="dashboard-current-section">
        <div className="dashboard-current-header">
          <div>
            <span className="dashboard-kicker">
              <CheckCircle2 size={18} />
              Seguimiento operativo
            </span>
            <h3>Mes actual: {currentMonthSummary.monthTitle}</h3>
            <p>
              Esta seccion mira los estados guardados del mes actual y calcula cuanto tenes que mover a cada cuenta
              configurada en "Debita de".
            </p>
          </div>
          <div className="dashboard-current-total">
            <small>Total a transferir</small>
            <strong>{currency.format(transferTotal)}</strong>
            <span>{currency.format(pendingDebitTotal)} ya transferido, esperando debito</span>
          </div>
        </div>

        <div className="dashboard-current-grid">
          <article className="dashboard-panel dashboard-movement-panel">
            <div className="dashboard-panel-heading">
              <div>
                <span className="dashboard-panel-kicker">Pagos reales</span>
                <h3>Movimiento del mes actual</h3>
              </div>
              <CheckCircle2 size={22} />
            </div>

            <div className="dashboard-current-month">
              <div>
                <small>{isMonthZero ? "Mes inicial" : currentMonthSummary.monthTitle}</small>
                <strong>{currency.format(paidThisMonth)}</strong>
                <span>pagado registrado</span>
              </div>
              <div>
                <small>Pendiente actual</small>
                <strong>{currency.format(currentMonthSummary.pendingTotal)}</strong>
                <span>segun estados guardados</span>
              </div>
            </div>

            <section className="card-payments-summary">
              <div className="card-payments-total">
                <span className="card-payments-icon">
                  <CreditCard size={20} />
                </span>
                <div>
                  <small>Total tarjetas pagadas</small>
                  <strong>{currency.format(cardPaymentsTotal)}</strong>
                </div>
              </div>

              {cardPayments.length ? (
                <div className="card-payments-list">
                  {cardPayments.map((item) => (
                    <CardPaymentDetail item={item} key={item.id} />
                  ))}
                </div>
              ) : (
                <p className="card-payments-empty">Todavia no hay tarjetas pagadas en este mes.</p>
              )}
            </section>

            {currentMonthHistory.length ? (
              <div className="dashboard-list">
                {currentMonthHistory.map((item) => (
                  <div className="dashboard-list-row" key={item.id}>
                    <span>
                      <strong>{item.serviceName}</strong>
                      <small>
                        {item.period} - {item.category}
                      </small>
                    </span>
                    <b>{currency.format(item.paidAmount)}</b>
                  </div>
                ))}
              </div>
            ) : (
              <p className="panel-empty">Todavia no registraste otros pagos del mes.</p>
            )}
          </article>

          <article className="dashboard-panel dashboard-transfer-panel">
            <div className="dashboard-panel-heading">
              <div>
                <span className="dashboard-panel-kicker">Debita de</span>
                <h3>Transferencias por cuenta</h3>
              </div>
              <WalletCards size={22} />
            </div>

            {debitTransfers.length ? (
              <div className="transfer-account-list">
                {debitTransfers.map((account) => (
                  <TransferAccountCard account={account} key={account.account} />
                ))}
              </div>
            ) : (
              <p className="panel-empty">No hay gastos del mes asociados a una cuenta "Debita de".</p>
            )}
          </article>
        </div>

        <article className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="dashboard-panel-kicker">Registro</span>
              <h3>Vencimientos</h3>
            </div>
            <CalendarClock size={22} />
          </div>

          <div className="due-status-grid">
            <StatusTile label="Vencidos" tone="danger" value={dueStats.overdue} />
            <StatusTile label="Proximos" tone="warning" value={dueStats.soon} />
            <StatusTile label="Pendientes" value={dueStats.pending} />
            <StatusTile label="Pagados" tone="success" value={dueStats.paid} />
          </div>

          {dueItems.length ? (
            <div className="dashboard-list">
              {dueItems.slice(0, 7).map((item) => (
                <div className={`dashboard-list-row due-${item.status}`} key={item.paymentKey}>
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.category} - vence el {item.dueDate.toLocaleDateString("es-AR")}
                    </small>
                  </span>
                  <DueBadge item={item} />
                </div>
              ))}
            </div>
          ) : (
            <p className="panel-empty">Todavia no hay vencimientos para mostrar.</p>
          )}
        </article>
      </section>

      <section className="dashboard-panel dashboard-explain-panel">
        <div className="dashboard-panel-heading">
          <div>
            <span className="dashboard-panel-kicker">Lectura rapida</span>
            <h3>Que significa cada numero</h3>
          </div>
          <FileText size={22} />
        </div>

        <div className="dashboard-explain-grid">
          <ExplainCard title="Restante">
            Es el dinero que queda despues de restar tarjetas, gastos fijos y gastos extraordinarios del ingreso total.
          </ExplainCard>
          <ExplainCard title="Pendiente">
            Es lo que todavia no aparece como pagado o transferido en el registro del mes.
          </ExplainCard>
          <ExplainCard title="Tarjetas">
            Para el proximo sueldo toma el resumen que corresponde al mes anterior. Para meses ya pagados usa el monto real guardado.
          </ExplainCard>
          <ExplainCard title="Gasto proyectado">
            Es una foto anticipada del mes: sirve para decidir antes de que llegue el cierre real.
          </ExplainCard>
        </div>
      </section>
    </section>
  );
}

function DashboardMetric({ detail, icon, label, tone, value }) {
  return (
    <article className={`dashboard-metric dashboard-metric-${tone}`}>
      <div className="dashboard-metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function SourceItem({ icon, label, text }) {
  return (
    <div className="dashboard-source-item">
      <span>{icon}</span>
      <div>
        <strong>{label}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value }) {
  return (
    <div className="breakdown-row">
      <span>{label}</span>
      <strong>{currency.format(value)}</strong>
    </div>
  );
}

function StatusTile({ label, tone = "neutral", value }) {
  return (
    <div className={`status-tile status-tile-${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function FlowStat({ label, tone = "neutral", value }) {
  return (
    <div className={`flow-stat flow-stat-${tone}`}>
      <span>{label}</span>
      <strong>{currency.format(value)}</strong>
    </div>
  );
}

function CardPaymentDetail({ item }) {
  const paidItems = Array.isArray(item.items) ? item.items : [];
  const settledItems = paidItems.filter(isSettledCardExpense);

  return (
    <article className="card-payment-detail">
      <div className="card-payment-row">
        <span>
          <strong>{item.serviceName}</strong>
          <small>{item.period} - Tarjetas</small>
        </span>
        <b>{currency.format(item.paidAmount)}</b>
      </div>

      <div className="settled-expenses-block">
        <div className="settled-expenses-heading">
          <span>Gastos saldados</span>
          <strong>{settledItems.length}</strong>
        </div>

        {settledItems.length ? (
          <div className="settled-expenses-list">
            {settledItems.map((expense) => (
              <div className="settled-expense-row" key={expense.expenseId ?? `${item.id}-${expense.origin}`}>
                <span>
                  <strong>{expense.origin || "Gasto sin nombre"}</strong>
                  <small>Ultima cuota pagada, sale de la tarjeta</small>
                </span>
                <b>{currency.format(expense.amount)}</b>
              </div>
            ))}
          </div>
        ) : (
          <p className="settled-expenses-empty">
            No se saldo ninguna cuota final en este pago. Fueron cuotas en curso o gastos fijos.
          </p>
        )}
      </div>
    </article>
  );
}

function UpcomingCardExpensesCard({ card }) {
  return (
    <article className="upcoming-card-card">
      <div className="upcoming-card-header">
        <div>
          <strong>{card.cardName}</strong>
          <small>{card.bankName}</small>
        </div>
        <b>{card.hasPreviousStatementDetail ? currency.format(card.total) : "Sin base"}</b>
      </div>

      {!card.hasPreviousStatementDetail ? (
        <p className="upcoming-card-empty">
          No hay detalle del resumen anterior para comparar contra {card.previousStatementPeriod}.
        </p>
      ) : card.expenses.length ? (
        <div className="upcoming-expense-list">
          {card.expenses.map((expense) => (
            <div className="upcoming-expense-row" key={expense.id}>
              <span>
                <strong>{expense.origin}</strong>
                <small>{getUpcomingExpenseDetail(expense)}</small>
              </span>
              <b>{currency.format(expense.amount)}</b>
            </div>
          ))}
        </div>
      ) : (
        <p className="upcoming-card-empty">No tiene gastos nuevos frente al resumen anterior.</p>
      )}
    </article>
  );
}

function TransferAccountCard({ account }) {
  const previewItems = account.items.slice(0, 3);

  return (
    <article className="transfer-account-card">
      <div className="transfer-account-main">
        <div>
          <span>Cuenta</span>
          <strong>{account.account}</strong>
        </div>
        <div className="transfer-account-amount">
          <span>A transferir</span>
          <strong>{currency.format(account.pendingTransfer)}</strong>
        </div>
      </div>

      <div className="transfer-account-stats">
        <small>Total asociado: {currency.format(account.total)}</small>
        <small>Transferido pendiente: {currency.format(account.pendingDebit)}</small>
        <small>Debitado/pagado: {currency.format(account.debited)}</small>
      </div>

      <div className="transfer-item-list">
        {previewItems.map((item) => (
          <div className={`transfer-item transfer-item-${item.status}`} key={`${account.account}-${item.name}`}>
            <span>
              {item.name}
              <small>{item.category}</small>
            </span>
            <b>{currency.format(item.amount)}</b>
          </div>
        ))}
        {account.items.length > previewItems.length ? (
          <small className="transfer-more">+{account.items.length - previewItems.length} gastos mas</small>
        ) : null}
      </div>
    </article>
  );
}

function ExplainCard({ children, title }) {
  return (
    <article className="dashboard-explain-card">
      <strong>{title}</strong>
      <p>{children}</p>
    </article>
  );
}

function getSummaryPeriod(summary) {
  if (summary.year == null || summary.monthIndex == null) {
    return "";
  }

  return `${summary.year}-${String(summary.monthIndex + 1).padStart(2, "0")}`;
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

function getPercent(value, total) {
  if (!total) {
    return 0;
  }

  return Math.max(0, Math.round(((Number(value) || 0) / total) * 100));
}

function getFinancialHealth(summary) {
  const remaining = summary.remaining || 0;
  const income = summary.salary || 0;
  const ratio = income > 0 ? remaining / income : 0;

  if (remaining < 0) {
    return {
      description: "Los gastos proyectados superan los ingresos disponibles.",
      label: "Atencion",
      tone: "danger",
    };
  }

  if (ratio <= 0.2) {
    return {
      description: "Queda poco margen despues de pagar lo planificado.",
      label: "Margen ajustado",
      tone: "warning",
    };
  }

  return {
    description: "Hay margen disponible despues de los gastos proyectados.",
    label: "Saldo saludable",
    tone: "success",
  };
}

function getDueStats(items) {
  return items.reduce(
    (stats, item) => ({
      ...stats,
      [item.status]: (stats[item.status] ?? 0) + 1,
    }),
    { overdue: 0, paid: 0, pending: 0, soon: 0 },
  );
}

function isCardPayment(item) {
  return item.category === "Tarjetas" || String(item.serviceId ?? "").startsWith("card:");
}

function buildCardPaymentSummaries(items) {
  const byCard = new Map();

  items.forEach((item) => {
    const key = item.serviceId || item.serviceName;
    const previous = byCard.get(key);

    if (!previous) {
      byCard.set(key, {
        ...item,
        items: Array.isArray(item.items) ? item.items : [],
      });
      return;
    }

    byCard.set(key, {
      ...previous,
      expectedAmount: previous.expectedAmount + (Number(item.expectedAmount) || 0),
      items: [...previous.items, ...(Array.isArray(item.items) ? item.items : [])],
      paidAmount: previous.paidAmount + (Number(item.paidAmount) || 0),
    });
  });

  return Array.from(byCard.values()).sort((a, b) => a.serviceName.localeCompare(b.serviceName));
}

function getUpcomingExpenseDetail(expense) {
  const details = [];

  if (expense.installments <= 1) {
    details.push("compra unica o ultima cuota");
  } else {
    details.push(`restan ${expense.installments} cuotas`);
  }

  if (expense.isSharedHalf) {
    details.push("a medias");
  }

  if (expense.isSaved) {
    details.push("ahorrado");
  }

  return details.join(" - ");
}

function isSettledCardExpense(expense) {
  if (expense.installmentPaid === "fixed") {
    return false;
  }

  return Number(expense.installmentPaid) <= 1;
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
