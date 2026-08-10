import React from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
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
  monthOptions = [],
  monthZeroDate,
  nextMonthSummary,
  onSelectMonth,
  selectedMonthOffset,
  topExpenses = [],
  upcomingCardExpenses = [],
}) {
  const currentMonthPeriod = getSummaryPeriod(currentMonthSummary);
  const currentMonthEntries = history.filter((item) => item.period === currentMonthPeriod && item.type !== "other_income");
  const cardPayments = buildCardPaymentSummaries(currentMonthEntries.filter(isCardPayment));
  const currentMonthHistory = currentMonthEntries.filter((item) => !isCardPayment(item)).slice(0, 6);
  const cardPaymentsTotal = cardPayments.reduce((sum, item) => sum + (Number(item.paidAmount) || 0), 0);
  const isMonthZero = isSummaryMonthZero(currentMonthSummary, monthZeroDate);
  const totalIncome = nextMonthSummary.salary || 0;
  const cardsPercent = getPercent(nextMonthSummary.cardExpenses, totalIncome);
  const fixedPercent = getPercent(nextMonthSummary.fixedExpenses, totalIncome);
  const totalPercent = getPercent(nextMonthSummary.totalExpenses, totalIncome);
  const health = getFinancialHealth(nextMonthSummary, totalPercent);
  const dueStats = getDueStats(dueItems);
  const paidThisMonth = currentMonthEntries.reduce((sum, item) => sum + (Number(item.paidAmount) || 0), 0);
  const transferTotal = debitTransfers.reduce((sum, account) => sum + account.pendingTransfer, 0);
  const pendingDebitTotal = debitTransfers.reduce((sum, account) => sum + account.pendingDebit, 0);
  const topExpensesTotal = topExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const disappearingTotal = disappearingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const visibleTopExpenses = topExpenses.slice(0, 5);
  const topExpenseGroups = buildExpenseGroups(topExpenses);
  const currentActions = buildCurrentActions({ debitTransfers, dueItems });
  const planningActions = buildPlanningActions({
    cardsPercent,
    disappearingTotal,
    dueItems,
    health,
    nextMonthSummary,
    totalPercent,
    upcomingCardExpenses,
  });
  const quickRead = buildQuickRead({ health, nextMonthSummary, topExpenseGroups, totalPercent });
  const trendComparison = buildTrendComparison(currentMonthSummary, nextMonthSummary);
  const priorityAlerts = buildPriorityAlerts({ cardsPercent, disappearingTotal, dueItems, nextMonthSummary, totalPercent, upcomingCardExpenses });
  const riskRanking = buildRiskRanking({ cardsPercent, dueItems, nextMonthSummary, topExpenseGroups, totalPercent, upcomingCardExpenses });
  const closeChecklist = buildCloseChecklist({ cardPaymentsTotal, currentMonthSummary, dueStats, pendingDebitTotal, transferTotal });
  const isCurrentMonthView = selectedMonthOffset === 0;

  return (
    <section className="dashboard-view">
      <section className={`dashboard-hero ${isCurrentMonthView ? "dashboard-hero-menu-only" : ""}`}>
        <div className="dashboard-hero-copy">
          <span className="dashboard-kicker">
            <LayoutDashboard size={18} />
            Centro de control
          </span>
          <h2>{isCurrentMonthView ? "Seguimiento del mes actual" : "Lectura clara del mes siguiente"}</h2>
          {!isCurrentMonthView ? (
            <p>
              Lee de arriba hacia abajo: primero cuanto entra, cuanto ya está comprometido, cuanto queda libre y que accion conviene tomar.
            </p>
          ) : null}
          <DashboardMonthMenu
            monthOptions={monthOptions}
            onSelectMonth={onSelectMonth}
            selectedMonthOffset={selectedMonthOffset}
          />
        </div>

        {!isCurrentMonthView ? (
          <article className={`dashboard-health dashboard-health-${health.tone}`}>
            <span>{health.label}</span>
            <strong>{currency.format(nextMonthSummary.remaining)}</strong>
            <small>{health.description}</small>
          </article>
        ) : null}
      </section>

      {isCurrentMonthView ? (
        <CurrentOperationsSection
          cardPayments={cardPayments}
          cardPaymentsTotal={cardPaymentsTotal}
          closeChecklist={closeChecklist}
          currentActions={currentActions}
          currentMonthHistory={currentMonthHistory}
          currentMonthSummary={currentMonthSummary}
          debitTransfers={debitTransfers}
          dueItems={dueItems}
          dueStats={dueStats}
          isMonthZero={isMonthZero}
          paidThisMonth={paidThisMonth}
          pendingDebitTotal={pendingDebitTotal}
          transferTotal={transferTotal}
        />
      ) : (
        <>
          <section className="dashboard-readout-grid">
            <QuickReadCard quickRead={quickRead} />
            <TrendComparisonCard comparison={trendComparison} />
          </section>

          <section className="dashboard-main-grid dashboard-main-grid-compact">
            <DashboardMetric
              detail="Todo el dinero disponible para cubrir este mes: sueldo + otros ingresos."
              icon={<Banknote size={21} />}
              label="Ingresos"
              tone="income"
              value={currency.format(nextMonthSummary.salary)}
            />
            <DashboardMetric
              detail={`Resumen de tarjetas a pagar con este sueldo: ${cardsPercent}% del ingreso.`}
              icon={<CreditCard size={21} />}
              label="Tarjetas"
              tone="cards"
              value={currency.format(nextMonthSummary.cardExpenses)}
            />
            <DashboardMetric
              detail={`Gastos recurrentes que ya sabes que van a salir: ${fixedPercent}% del ingreso.`}
              icon={<Home size={21} />}
              label="Obligatorios"
              tone="fixed"
              value={currency.format(nextMonthSummary.fixedExpenses)}
            />
            <DashboardMetric
              detail={`Suma de tarjetas, fijos y extraordinarios. Ya compromete ${totalPercent}% del sueldo.`}
              icon={<Wallet size={21} />}
              label="Gasto total"
              tone="total"
              value={currency.format(nextMonthSummary.totalExpenses)}
            />
          </section>

          <section className="dashboard-decision-grid">
            <ActionPanel actions={planningActions} title="Que conviene mirar ahora" />

            <article className="dashboard-panel dashboard-health-panel dashboard-decision-health">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-panel-kicker">Semaforo financiero</span>
                  <h3>{health.label}</h3>
                </div>
                <TrendingDown size={22} />
              </div>

              <div className={`health-light health-light-${health.tone}`}>
                <div className="health-summary-row">
                  <span>
                    <small>Dinero que queda libre</small>
                    <strong>{currency.format(nextMonthSummary.remaining)}</strong>
                  </span>
                  <b>{totalPercent}% del sueldo usado</b>
                </div>
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
                <BreakdownRow label="Tarjetas" value={nextMonthSummary.cardExpenses} note="Resumen que se paga con este sueldo" />
                <BreakdownRow label="Gastos obligatorios" value={nextMonthSummary.fixedExpenses} note="Fijos, compras mensuales y recurrentes" />
                <BreakdownRow label="Extraordinarios" value={nextMonthSummary.extraordinaryExpenses} note="Gastos puntuales cargados para este periodo" />
              </div>
            </article>
          </section>

          <section className="dashboard-support-grid">
            <PriorityAlertsPanel alerts={priorityAlerts} />
            <RiskRankingPanel risks={riskRanking} />
            <GlossaryPanel />
          </section>

          <section className="dashboard-insights-grid dashboard-insights-grid-focused">
            <article className="dashboard-panel top-expenses-panel top-expenses-panel-compact">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-panel-kicker">Top gastos</span>
                  <h3>Lo que mas pesa</h3>
                </div>
                <FileText size={22} />
              </div>
              <div className="insight-total-line">
                <span>Top 5 visible de {topExpenses.length} gastos</span>
                <strong>{currency.format(topExpensesTotal)}</strong>
              </div>
              {visibleTopExpenses.length ? (
                <div className="insight-list compact-expense-list">
                  {visibleTopExpenses.map((expense, index) => (
                    <div className="insight-row compact-expense-row" key={expense.id ?? `${expense.name}-${index}`}>
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

              {topExpenseGroups.length ? (
                <div className="expense-group-strip" aria-label="Gastos agrupados por categoría">
                  {topExpenseGroups.map((group) => (
                    <span key={group.category}>
                      {group.category}
                      <strong>{currency.format(group.total)}</strong>
                    </span>
                  ))}
                </div>
              ) : null}
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
                          Transferir {currency.format(account.pendingTransfer)} - pendiente débito {currency.format(account.pendingDebit)}
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
          </section>

          <section className="dashboard-insights-grid dashboard-card-change-grid">
            <article className="dashboard-panel disappearing-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-panel-kicker">Se liberan</span>
                  <h3>Gastos que desaparecen</h3>
                </div>
                <CreditCard size={22} />
              </div>
              <div className="insight-total-line">
                <span>Alivio después de este resumen</span>
                <strong>{currency.format(disappearingTotal)}</strong>
              </div>
              {disappearingExpenses.length ? (
                <div className="insight-list">
                  {disappearingExpenses.slice(0, 5).map((expense, index) => (
                    <div className="insight-row" key={expense.id ?? `${expense.name}-${index}`}>
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
                <p className="panel-empty">No hay cuotas que desaparezcan en este pago.</p>
              )}
            </article>

            <section className="dashboard-panel upcoming-card-expenses-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-panel-kicker">Tarjetas</span>
                  <h3>Gastos nuevos</h3>
                </div>
                <CreditCard size={22} />
              </div>

              <div className="upcoming-card-grid upcoming-card-grid-compact">
                {upcomingCardExpenses.map((card) => (
                  <UpcomingCardExpensesCard card={card} key={card.cardId} />
                ))}
              </div>
            </section>
          </section>
        </>
      )}
    </section>
  );
}

function QuickReadCard({ quickRead }) {
  return (
    <article className={`dashboard-panel dashboard-quick-read dashboard-quick-read-${quickRead.tone}`}>
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-panel-kicker">Lectura rápida</span>
          <h3>{quickRead.title}</h3>
        </div>
        <LayoutDashboard size={22} />
      </div>
      <p>{quickRead.description}</p>
      <div className="quick-read-facts">
        {quickRead.facts.map((fact) => (
          <span key={fact.label}>
            <small>{fact.label}</small>
            <strong>{fact.value}</strong>
          </span>
        ))}
      </div>
    </article>
  );
}
function TrendComparisonCard({ comparison }) {
  return (
    <article className="dashboard-panel dashboard-trend-card">
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-panel-kicker">Comparación</span>
          <h3>Contra el mes actual</h3>
        </div>
        <TrendingDown size={22} />
      </div>
      <div className="trend-comparison-list">
        {comparison.map((item) => (
          <div className={`trend-comparison-row trend-${item.tone}`} key={item.label}>
            <span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </span>
            <b>{item.value}</b>
          </div>
        ))}
      </div>
    </article>
  );
}

function PriorityAlertsPanel({ alerts }) {
  return (
    <article className="dashboard-panel dashboard-priority-panel">
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-panel-kicker">Alertas</span>
          <h3>Prioridad de lectura</h3>
        </div>
        <AlertTriangle size={22} />
      </div>
      <div className="priority-alert-list">
        {alerts.map((alert) => (
          <div className={`priority-alert priority-${alert.tone}`} key={alert.id}>
            <em>{alert.level}</em>
            <span>
              <strong>{alert.title}</strong>
              <small>{alert.detail}</small>
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function RiskRankingPanel({ risks }) {
  return (
    <article className="dashboard-panel dashboard-risk-panel">
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-panel-kicker">Riesgos</span>
          <h3>Donde mirar primero</h3>
        </div>
        <FileText size={22} />
      </div>
      <div className="risk-ranking-list">
        {risks.map((risk, index) => (
          <div className={`risk-ranking-row risk-${risk.tone}`} key={risk.id}>
            <em>{index + 1}</em>
            <span>
              <strong>{risk.title}</strong>
              <small>{risk.detail}</small>
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function CloseMonthChecklist({ checklist }) {
  return (
    <article className="dashboard-panel dashboard-close-panel">
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-panel-kicker">Cierre de mes</span>
          <h3>Checklist operativo</h3>
        </div>
        <CheckCircle2 size={22} />
      </div>
      <div className="close-checklist">
        {checklist.map((item) => (
          <div className={`close-check-item ${item.done ? "done" : "pending"}`} key={item.id}>
            <em>{item.done ? <CheckCircle2 size={14} /> : <ClockIcon />}</em>
            <span>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function ClockIcon() {
  return <CalendarClock size={14} />;
}
function GlossaryPanel() {
  const items = [
    { label: "Tarjetas", text: "Resumen que vas a pagar con este sueldo." },
    { label: "Obligatorios", text: "Gastos que ya están previstos y conviene separar primero." },
    { label: "Libre", text: "Dinero que queda después de todo lo proyectado." },
    { label: "Uso del sueldo", text: "Porcentaje del ingreso que ya está comprometido." },
  ];

  return (
    <article className="dashboard-panel dashboard-glossary-panel">
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-panel-kicker">Glosario</span>
          <h3>Que significa cada cosa</h3>
        </div>
        <Wallet size={22} />
      </div>
      <div className="dashboard-glossary-list">
        {items.map((item) => (
          <div key={item.label}>
            <strong>{item.label}</strong>
            <small>{item.text}</small>
          </div>
        ))}
      </div>
    </article>
  );
}
function CurrentOperationsSection({
  cardPayments,
  cardPaymentsTotal,
  closeChecklist,
  currentActions,
  currentMonthHistory,
  currentMonthSummary,
  debitTransfers,
  dueItems,
  dueStats,
  isMonthZero,
  paidThisMonth,
  pendingDebitTotal,
  transferTotal,
}) {
  return (
    <section className="dashboard-current-section">
      <div className="dashboard-current-header">
        <div>
          <span className="dashboard-kicker">
            <CheckCircle2 size={18} />
            Seguimiento operativo
          </span>
          <h3>Mes actual: {currentMonthSummary.monthTitle}</h3>
          <p>
            Esta vista mira pagos, vencimientos y cuentas con movimiento pendiente. Todo lo demas queda fuera para que puedas operar rapido.
          </p>
        </div>
        <div className="dashboard-current-total">
          <small>Total a transferir</small>
          <strong>{currency.format(transferTotal)}</strong>
          <span>{currency.format(pendingDebitTotal)} ya transferido, esperando débito</span>
        </div>
      </div>

      <ActionPanel actions={currentActions} title="Que tengo que hacer ahora" />

      <CloseMonthChecklist checklist={closeChecklist} />

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
              <span>según estados guardados</span>
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
              <p className="card-payments-empty">Todavía no hay tarjetas pagadas en este mes.</p>
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
            <p className="panel-empty">Todavía no registraste otros pagos del mes.</p>
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
            <p className="panel-empty">No hay gastos de este mes asociados a una cuenta "Debita de".</p>
          )}
        </article>
      </div>

      <article className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <span className="dashboard-panel-kicker">Registro</span>
            <h3>Centro de vencimientos</h3>
          </div>
          <CalendarClock size={22} />
        </div>

        <div className="due-status-grid">
          <StatusTile label="Vencidos" tone="danger" value={dueStats.overdue} />
          <StatusTile label="Hoy" tone="warning" value={dueStats.today} />
          <StatusTile label="Próximos" tone="warning" value={Math.max(dueStats.soon - dueStats.today, 0)} />
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
          <p className="panel-empty">Todavía no hay vencimientos para mostrar.</p>
        )}
      </article>
    </section>
  );
}

function ActionPanel({ actions, title }) {
  return (
    <article className="dashboard-panel dashboard-action-panel">
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-panel-kicker">Acciones</span>
          <h3>{title}</h3>
        </div>
        <AlertTriangle size={22} />
      </div>
      <div className="dashboard-action-list">
        {actions.map((action) => (
          <div className={`dashboard-action-row dashboard-action-${action.tone}`} key={action.id}>
            <em>{action.badge}</em>
            <span>
              <strong>{action.title}</strong>
              <small>{action.detail}</small>
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function DashboardMonthMenu({ monthOptions, onSelectMonth, selectedMonthOffset }) {
  if (!monthOptions.length) {
    return null;
  }

  return (
    <div className="dashboard-month-menu" aria-label="Elegir mes del dashboard">
      {monthOptions.map((option) => (
        <button
          className={option.offset === selectedMonthOffset ? "active" : ""}
          key={option.offset}
          onClick={() => onSelectMonth?.(option.offset)}
          type="button"
        >
          <span>{option.label}</span>
          <strong>{option.title}</strong>
        </button>
      ))}
    </div>
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

function BreakdownRow({ label, note, value }) {
  return (
    <div className="breakdown-row">
      <span>
        {label}
        {note ? <small>{note}</small> : null}
      </span>
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
          {card.expenses.map((expense, index) => (
            <div className="upcoming-expense-row" key={expense.id ?? `${expense.name}-${index}`}>
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
function buildCurrentActions({ debitTransfers, dueItems }) {
  const transferTotal = debitTransfers.reduce((sum, account) => sum + account.pendingTransfer, 0);
  const overdue = dueItems.filter((item) => item.status === "overdue");
  const soon = dueItems.filter((item) => item.status === "soon");
  const transferred = debitTransfers.reduce((sum, account) => sum + account.pendingDebit, 0);
  const actions = [];

  if (transferTotal > 0) {
    actions.push({
      badge: "Mover",
      detail: `Hay ${debitTransfers.filter((account) => account.pendingTransfer > 0).length} cuentas con gastos pendientes de fondeo.`,
      id: "transfer",
      title: `Transferir ${currency.format(transferTotal)}`,
      tone: "warning",
    });
  }

  if (overdue.length) {
    actions.push({
      badge: "Vence",
      detail: `${overdue.length} pagos ya pasaron su fecha de vencimiento.`,
      id: "overdue",
      title: "Resolver vencimientos atrasados",
      tone: "danger",
    });
  }

  if (soon.length) {
    actions.push({
      badge: "3 días",
      detail: `${soon.length} pagos vencen en los proximos días.`,
      id: "soon",
      title: "Revisar pagos cercanos",
      tone: "warning",
    });
  }

  if (transferred > 0) {
    actions.push({
      badge: "Debito",
      detail: `${currency.format(transferred)} ya fue transferido y espera débito.`,
      id: "pending-debit",
      title: "Controlar débitos pendientes",
      tone: "neutral",
    });
  }

  if (!actions.length) {
    actions.push({
      badge: "OK",
      detail: "No aparecen transferencias ni vencimientos urgentes para este mes.",
      id: "clear",
      title: "Sin acciones urgentes",
      tone: "success",
    });
  }

  return actions.slice(0, 4);
}

function buildCloseChecklist({ cardPaymentsTotal, currentMonthSummary, dueStats, pendingDebitTotal, transferTotal }) {
  return [
    {
      detail: dueStats.overdue ? `${dueStats.overdue} vencimientos están atrasados.` : "No hay vencimientos atrasados.",
      done: !dueStats.overdue,
      id: "overdue",
      title: "Revisar vencidos",
    },
    {
      detail: transferTotal ? `Falta transferir ${currency.format(transferTotal)}.` : "No quedan transferencias pendientes.",
      done: transferTotal <= 0,
      id: "transfer",
      title: "Registrar transferencias",
    },
    {
      detail: pendingDebitTotal ? `${currency.format(pendingDebitTotal)} ya transferido espera débito.` : "No hay débitos transferidos pendientes.",
      done: pendingDebitTotal <= 0,
      id: "debit",
      title: "Confirmar débitos",
    },
    {
      detail: cardPaymentsTotal ? `${currency.format(cardPaymentsTotal)} de tarjetas ya figura pagado.` : "Todavía no hay tarjetas pagadas registradas.",
      done: cardPaymentsTotal > 0,
      id: "cards",
      title: "Confirmar tarjetas pagadas",
    },
    {
      detail: currentMonthSummary.pendingTotal ? `Quedan ${currency.format(currentMonthSummary.pendingTotal)} pendientes.` : "Mes actual sin pendiente proyectado.",
      done: currentMonthSummary.pendingTotal <= 0,
      id: "next",
      title: "Preparar mes siguiente",
    },
  ];
}

function buildQuickRead({ health, nextMonthSummary, topExpenseGroups, totalPercent }) {
  const mainWeight = topExpenseGroups[0]?.category || "gastos proyectados";
  const remaining = nextMonthSummary.remaining || 0;
  const title = health.tone === "danger" ? "Necesita ajuste" : health.tone === "warning" ? "Hay que mirarlo de cerca" : "Vas bien";
  const description = health.tone === "danger"
    ? `Los gastos superan los ingresos. Falta cubrir ${currency.format(Math.abs(remaining))} y el mayor peso viene de ${mainWeight}.`
    : health.tone === "warning"
      ? `Todavía hay margen, pero ya tenes ${totalPercent}% del sueldo usado. El mayor peso viene de ${mainWeight} y quedarían ${currency.format(remaining)} libres.`
      : `El mes esta ordenado: solo ${totalPercent}% del sueldo esta usado. El mayor peso viene de ${mainWeight} y quedarían ${currency.format(remaining)} libres.`;

  return {
    description,
    facts: [
      { label: "Sueldo usado", value: `${totalPercent}%` },
      { label: "Dinero libre", value: currency.format(remaining) },
      { label: "Mayor peso", value: mainWeight },
    ],
    title,
    tone: health.tone,
  };
}
function buildTrendComparison(currentSummary, nextSummary) {
  const currentIncome = currentSummary.salary || 0;
  const nextIncome = nextSummary.salary || 0;
  const expenseDelta = (nextSummary.totalExpenses || 0) - (currentSummary.totalExpenses || 0);
  const cardDelta = (nextSummary.cardExpenses || 0) - (currentSummary.cardExpenses || 0);
  const remainingDelta = (nextSummary.remaining || 0) - (currentSummary.remaining || 0);
  const currentCardsPercent = getPercent(currentSummary.cardExpenses, currentIncome);
  const nextCardsPercent = getPercent(nextSummary.cardExpenses, nextIncome);

  return [
    buildTrendItem("Gasto proyectado", expenseDelta, "Vas a gastar", "menos que el mes actual", "mas que el mes actual", true),
    {
      description: nextCardsPercent === currentCardsPercent
        ? "El peso de tarjetas se mantiene igual."
        : `Tarjetas ${nextCardsPercent > currentCardsPercent ? "suben" : "bajan"} ${Math.abs(nextCardsPercent - currentCardsPercent)} puntos contra el mes actual.`,
      label: "Tarjetas",
      tone: nextCardsPercent > currentCardsPercent ? "warning" : nextCardsPercent < currentCardsPercent ? "success" : "neutral",
      value: `${nextCardsPercent}%`,
    },
    buildTrendItem("Dinero libre", remainingDelta, "Quedaria", "menos libre", "mas libre", false),
  ];
}

function buildTrendItem(label, delta, prefix, negativeText, positiveText, lowerIsBetter) {
  const amount = currency.format(Math.abs(delta));
  const isNeutral = delta === 0;
  const isPositive = delta > 0;
  const tone = isNeutral ? "neutral" : lowerIsBetter ? (isPositive ? "warning" : "success") : (isPositive ? "success" : "warning");
  const direction = isNeutral ? "igual que el mes actual" : isPositive ? positiveText : negativeText;

  return {
    description: isNeutral ? `${prefix} igual que el mes actual.` : `${prefix} ${amount} ${direction}.`,
    label,
    tone,
    value: isNeutral ? "Sin cambio" : `${isPositive ? "+" : "-"}${amount}`,
  };
}

function buildPriorityAlerts({ cardsPercent, disappearingTotal, dueItems, nextMonthSummary, totalPercent, upcomingCardExpenses }) {
  const upcomingTotal = upcomingCardExpenses.reduce((sum, card) => sum + (Number(card.total) || 0), 0);
  const dueSoon = dueItems.filter((item) => item.status === "soon" || item.status === "overdue").length;
  const alerts = [];

  if (nextMonthSummary.remaining < 0) {
    alerts.push({ detail: `Faltan ${currency.format(Math.abs(nextMonthSummary.remaining))} para cubrir lo proyectado.`, id: "negative", level: "Crítico", title: "Saldo proyectado negativo", tone: "danger" });
  }

  if (totalPercent >= 40) {
    alerts.push({ detail: `Ya está comprometido ${totalPercent}% del sueldo.`, id: "salary-use", level: "Atención", title: "Uso del sueldo alto", tone: "warning" });
  }

  if (cardsPercent >= 30) {
    alerts.push({ detail: `Tarjetas representan ${cardsPercent}% del ingreso.`, id: "cards", level: "Atención", title: "Tarjetas con mucho peso", tone: "warning" });
  }

  if (dueSoon > 0) {
    alerts.push({ detail: `${dueSoon} vencimientos necesitan revision pronto.`, id: "due", level: "Atención", title: "Vencimientos proximos", tone: "warning" });
  }

  if (upcomingTotal > 0) {
    alerts.push({ detail: `${currency.format(upcomingTotal)} aparece como compras nuevas de tarjeta.`, id: "new-expenses", level: "Info", title: "Aparecieron gastos nuevos", tone: "neutral" });
  }

  if (disappearingTotal > 0) {
    alerts.push({ detail: `${currency.format(disappearingTotal)} dejaria de repetirse mas adelante.`, id: "relief", level: "Info", title: "Gastos que desaparecen", tone: "success" });
  }

  if (!alerts.length) {
    alerts.push({ detail: "No hay alertas importantes para este mes proyectado.", id: "clear", level: "OK", title: "Sin alertas relevantes", tone: "success" });
  }

  const weight = { danger: 0, warning: 1, neutral: 2, success: 3 };
  return alerts.sort((a, b) => weight[a.tone] - weight[b.tone]).slice(0, 4);
}

function buildRiskRanking({ cardsPercent, dueItems, nextMonthSummary, topExpenseGroups, totalPercent, upcomingCardExpenses }) {
  const upcomingTotal = upcomingCardExpenses.reduce((sum, card) => sum + (Number(card.total) || 0), 0);
  const dueSoon = dueItems.filter((item) => item.status === "soon" || item.status === "overdue").length;
  const risks = [
    { detail: `Ya usa ${totalPercent}% del ingreso disponible.`, id: "salary", score: totalPercent, title: "Sueldo comprometido", tone: totalPercent >= 40 ? "warning" : "neutral" },
    { detail: `Tarjetas representan ${cardsPercent}% del sueldo.`, id: "cards", score: cardsPercent + 8, title: "Tarjetas", tone: cardsPercent >= 30 ? "warning" : "neutral" },
    { detail: dueSoon ? `${dueSoon} vencimientos proximos o vencidos.` : "No hay vencimientos urgentes cargados.", id: "due", score: dueSoon * 20, title: "Vencimientos", tone: dueSoon ? "warning" : "success" },
    { detail: upcomingTotal ? `${currency.format(upcomingTotal)} en compras nuevas. Movimiento controlable si lo revisas ahora.` : "No aparecen compras nuevas de tarjeta.", id: "new", score: getPercent(upcomingTotal, nextMonthSummary.salary || 0), title: "Compras nuevas", tone: upcomingTotal ? "neutral" : "success" },
  ];

  if (nextMonthSummary.remaining < 0) {
    risks.push({ detail: `Faltan ${currency.format(Math.abs(nextMonthSummary.remaining))}.`, id: "negative", score: 999, title: "Saldo negativo", tone: "danger" });
  }

  if (topExpenseGroups[0]) {
    risks.push({ detail: `${currency.format(topExpenseGroups[0].total)} agrupado en esta categoría.`, id: "category", score: getPercent(topExpenseGroups[0].total, nextMonthSummary.salary || 0), title: `Categoría: ${topExpenseGroups[0].category}`, tone: "neutral" });
  }

  return risks.sort((a, b) => b.score - a.score).slice(0, 3);
}
function buildPlanningActions({ cardsPercent, disappearingTotal, dueItems, health, nextMonthSummary, totalPercent, upcomingCardExpenses }) {
  const upcomingTotal = upcomingCardExpenses.reduce((sum, card) => sum + (Number(card.total) || 0), 0);
  const dueSoon = dueItems.filter((item) => item.status === "soon" || item.status === "overdue").length;
  const actions = [];

  if (nextMonthSummary.remaining < 0) {
    actions.push({
      badge: "Rojo",
      detail: `Faltan ${currency.format(Math.abs(nextMonthSummary.remaining))} para cubrir lo proyectado.`,
      id: "negative",
      title: "Recortar antes del cierre",
      tone: "danger",
    });
  } else if (health.tone === "warning") {
    actions.push({
      badge: "Margen",
      detail: "El restante existe, pero queda ajustado contra tus ingresos.",
      id: "margin",
      title: "Cuidar gastos variables",
      tone: "warning",
    });
  } else {
    actions.push({
      badge: "OK",
      detail: `${currency.format(nextMonthSummary.remaining)} quedaría libre después de lo proyectado.`,
      id: "healthy",
      title: "Margen saludable",
      tone: "success",
    });
  }

  if (cardsPercent >= 30) {
    actions.push({
      badge: "Tarj",
      detail: `Las tarjetas consumen ${cardsPercent}% del ingreso disponible.`,
      id: "cards-high",
      title: "Revisar peso de tarjetas",
      tone: "warning",
    });
  }

  if (totalPercent >= 40) {
    actions.push({
      badge: "Uso",
      detail: `El gasto proyectado ya usa ${totalPercent}% del sueldo. Desde el 40% conviene mirarlo de cerca.`,
      id: "usage-watch",
      title: totalPercent >= 75 ? "Dejar margen de seguridad" : "Uso del sueldo en observacion",
      tone: totalPercent >= 100 ? "danger" : "warning",
    });
  }

  if (upcomingTotal > 0) {
    actions.push({
      badge: "Nuevo",
      detail: `${currency.format(upcomingTotal)} aparece como gasto nuevo frente al resumen anterior.`,
      id: "new-card-expenses",
      title: "Mirar compras nuevas de tarjeta",
      tone: "neutral",
    });
  }

  if (disappearingTotal > 0) {
    actions.push({
      badge: "Libera",
      detail: `${currency.format(disappearingTotal)} dejaria de repetirse después de este resumen.`,
      id: "disappearing",
      title: "Contar alivio futuro",
      tone: "success",
    });
  }

  if (dueSoon > 0) {
    actions.push({
      badge: "Vence",
      detail: `${dueSoon} vencimientos necesitan atencion pronto.`,
      id: "due-soon",
      title: "No perder vencimientos",
      tone: "warning",
    });
  }

  return actions.slice(0, 4);
}

function buildExpenseGroups(expenses) {
  const byCategory = new Map();

  expenses.forEach((expense) => {
    byCategory.set(expense.category, (byCategory.get(expense.category) || 0) + (Number(expense.amount) || 0));
  });

  return Array.from(byCategory, ([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);
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

function getFinancialHealth(summary, usedPercent = 0) {
  const remaining = summary.remaining || 0;
  const income = summary.salary || 0;
  const ratio = income > 0 ? remaining / income : 0;

  if (remaining < 0) {
    return {
      description: "Los gastos proyectados superan los ingresos disponibles. Este mes necesita ajuste antes de cerrar.",
      label: "Atención",
      tone: "danger",
    };
  }

  if (usedPercent >= 40) {
    return {
      description: `Ya tenes ${usedPercent}% del sueldo comprometido. Todavía hay saldo, pero conviene seguirlo de cerca.`,
      label: "Uso del sueldo en observacion",
      tone: "warning",
    };
  }

  if (ratio <= 0.2) {
    return {
      description: "Queda poco margen después de pagar lo planificado.",
      label: "Margen ajustado",
      tone: "warning",
    };
  }

  return {
    description: `Saldo saludable: solo ${usedPercent}% del sueldo está comprometido.`,
    label: "Saldo saludable",
    tone: "success",
  };
}

function getDueStats(items) {
  return items.reduce(
    (stats, item) => ({
      ...stats,
      [item.status]: (stats[item.status] ?? 0) + 1,
      today: item.status === "soon" && item.diffInDays === 0 ? (stats.today ?? 0) + 1 : stats.today,
    }),
    { overdue: 0, paid: 0, pending: 0, soon: 0, today: 0 },
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
    details.push("a medías");
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
    return <em className="status-pill soon">Vence en {item.diffInDays} días</em>;
  }

  return <em className="status-pill pending">En {item.diffInDays} días</em>;
}

























