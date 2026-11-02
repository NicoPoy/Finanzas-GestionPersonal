import {
  AlertTriangle,
  ArrowRightLeft,
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
  previousMonthSummary,
  disappearingExpenses = [],
  dueItems,
  monthSummary,
  onMarkAccountTransferred,
  onSetPaymentStatus,
  transferAccounts = [],
  transferMonth,
  transferServices = [],
  topExpenses = [],
  upcomingCardExpenses = [],
}) {
  const totalIncome = monthSummary.salary || 0;
  const cardsPercent = getPercent(monthSummary.cardExpenses, totalIncome);
  const fixedPercent = getPercent(monthSummary.fixedExpenses, totalIncome);
  const totalPercent = getPercent(monthSummary.totalExpenses, totalIncome);
  const health = getFinancialHealth(monthSummary, totalPercent);
  const topExpensesTotal = topExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const disappearingTotal = disappearingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const visibleTopExpenses = topExpenses.slice(0, 5);
  const topExpenseGroups = buildExpenseGroups(topExpenses);
  const planningActions = buildPlanningActions({
    cardsPercent,
    disappearingTotal,
    dueItems,
    health,
    nextMonthSummary: monthSummary,
    totalPercent,
    upcomingCardExpenses,
  });
  const trendComparison = buildTrendComparison(previousMonthSummary, monthSummary);
  const riskRanking = buildRiskRanking({ cardsPercent, dueItems, nextMonthSummary: monthSummary, topExpenseGroups, totalPercent, upcomingCardExpenses });
  const activeTab = "actions";

  return (
    <section className="dashboard-view">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="dashboard-kicker">
            <LayoutDashboard size={18} />
            Centro de control
          </span>
          <span className="dashboard-period-badge"><CalendarClock size={15} /> Proyección para {monthSummary.monthTitle}</span>
          <h2>Así está parado tu próximo sueldo</h2>
          <p>{monthSummary.monthTitle}: cuánto entra, cuánto está comprometido y cuánto queda disponible.</p>
        </div>

        <article className={`dashboard-health dashboard-health-${health.tone}`}>
          <span>{health.label}</span>
          <strong>{currency.format(monthSummary.remaining)}</strong>
          <small>{health.description}</small>
        </article>
      </section>

      <section className="dashboard-main-grid dashboard-main-grid-compact" aria-label="Resumen del próximo sueldo">
        <DashboardMetric detail="Sueldo configurado más otros ingresos." icon={<Banknote size={21} />} label="Ingresos disponibles" tone="income" value={currency.format(monthSummary.salary)} />
        <DashboardMetric detail={`${cardsPercent}% de tus ingresos.`} icon={<CreditCard size={21} />} label="Tarjetas" tone="cards" value={currency.format(monthSummary.cardExpenses)} />
        <DashboardMetric detail={`Fijos y compras mensuales: ${fixedPercent}% del ingreso.`} icon={<Home size={21} />} label="Gastos obligatorios" tone="fixed" value={currency.format(monthSummary.fixedExpenses)} />
        <DashboardMetric detail={`Tarjetas, fijos y extraordinarios: ${totalPercent}% del ingreso.`} icon={<Wallet size={21} />} label="Gasto proyectado" tone="total" value={currency.format(monthSummary.totalExpenses)} />
      </section>

      <>
          {activeTab === "actions" ? (
            <section className="dashboard-tab-content dashboard-action-content" aria-label="Qué hacer ahora">
              <ActionPanel actions={planningActions} title="Qué conviene mirar ahora" />
              <TransferScheduleSection
                accounts={transferAccounts}
                monthIndex={transferMonth.monthIndex}
                monthTitle={transferMonth.title}
                onMarkAccountTransferred={onMarkAccountTransferred}
                onSetPaymentStatus={onSetPaymentStatus}
                paymentServices={transferServices}
                year={transferMonth.year}
              />
            </section>
          ) : null}

          {activeTab === "expenses" ? (
            <section className="dashboard-tab-content" aria-label="Detalle de gastos">
            <article className="dashboard-panel dashboard-health-panel dashboard-decision-health">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-panel-kicker">Distribución</span>
                  <h3>Cómo se usa el sueldo</h3>
                </div>
                <TrendingDown size={22} />
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
                <BreakdownRow label="Tarjetas" value={monthSummary.cardExpenses} note="Resumen que se paga este mes" />
                <BreakdownRow label="Gastos obligatorios" value={monthSummary.fixedExpenses} note="Fijos, compras mensuales y recurrentes" />
                <BreakdownRow label="Extraordinarios" value={monthSummary.extraordinaryExpenses} note="Gastos puntuales cargados para este mes" />
              </div>
            </article>
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

          </section>

          </section>
          ) : null}

          {activeTab === "accounts" ? (
            <section className="dashboard-tab-content" aria-label="Cuentas">
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
          ) : null}

          {activeTab === "expenses" ? (
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
          ) : null}

          {activeTab === "analysis" ? (
            <section className="dashboard-tab-content dashboard-analysis-content" aria-label="Análisis del mes">
              <TrendComparisonCard comparison={trendComparison} />
              <RiskRankingPanel risks={riskRanking} />
              <GlossaryPanel />
            </section>
          ) : null}
      </>
    </section>
  );
}

function TrendComparisonCard({ comparison }) {
  return (
    <article className="dashboard-panel dashboard-trend-card">
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-panel-kicker">Comparación</span>
          <h3>Contra el mes anterior</h3>
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
  activeTab,
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
            Consultá primero las tareas pendientes. Los pagos y movimientos por cuenta están en las pestañas.
          </p>
        </div>
        <div className="dashboard-current-total">
          <small>Total a transferir</small>
          <strong>{currency.format(transferTotal)}</strong>
          <span>{currency.format(pendingDebitTotal)} ya transferido, esperando débito</span>
        </div>
      </div>

      {activeTab === "actions" ? (
        <section className="dashboard-tab-content" aria-label="Acciones del mes">
          <ActionPanel actions={currentActions} title="Qué tengo que hacer ahora" />
          <CloseMonthChecklist checklist={closeChecklist} />
        </section>
      ) : null}

      {activeTab === "payments" ? (
      <div className="dashboard-tab-content">
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

      </div>
      ) : null}

      {activeTab === "accounts" ? (
        <section className="dashboard-tab-content" aria-label="Cuentas y transferencias">
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
        </section>
      ) : null}

      {activeTab === "payments" ? (
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
      ) : null}
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

function TransferScheduleSection({
  accounts = [],
  monthIndex,
  monthTitle,
  onMarkAccountTransferred,
  onSetPaymentStatus,
  paymentServices,
  year,
}) {
  const activeAccounts = accounts.filter((account) => account.pendingTransfer > 0 || account.pendingDebit > 0);
  const transferTotal = activeAccounts.reduce((sum, account) => sum + account.pendingTransfer, 0);

  return (
    <article className="dashboard-panel dashboard-transfer-schedule">
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-panel-kicker">Mes actual</span>
          <h3>Transferencias y débitos por cuenta</h3>
          <p>Pagos de {monthTitle}. El seguimiento empieza de nuevo el día 1 de cada mes.</p>
        </div>
        <div className="dashboard-transfer-total">
          <span>Total a transferir</span>
          <strong>{currency.format(transferTotal)}</strong>
        </div>
      </div>

      {activeAccounts.length ? (
        <div className="dashboard-transfer-schedule-list">
          {activeAccounts.map((account) => {
            const pendingItems = account.items.filter((item) => item.status === "pending" && item.amount > 0);
            const transferredItems = account.items.filter((item) => item.status === "transferred" && item.amount > 0);
            const nearestDueDay = pendingItems.reduce(
              (nearest, item) => Math.min(nearest, Number(item.dueDay) || 31),
              31,
            );

            return (
              <article className="dashboard-transfer-account" key={account.account}>
                <div className="dashboard-transfer-schedule-row">
                  <div className="dashboard-transfer-account-name">
                    <strong>{account.account}</strong>
                    <small>
                      {account.pendingTransfer > 0
                        ? `${pendingItems.length} ${pendingItems.length === 1 ? "pago" : "pagos"} pendientes de fondeo`
                        : "Transferencia realizada"}
                    </small>
                  </div>
                  {account.pendingTransfer > 0 ? (
                    <>
                      <span className="dashboard-transfer-due"><CalendarClock size={16} /> Transferir antes del día {nearestDueDay}</span>
                      <strong className="dashboard-transfer-amount">{currency.format(account.pendingTransfer)}</strong>
                      <button
                        className="dashboard-transfer-action"
                        onClick={() => onMarkAccountTransferred?.(
                          year,
                          monthIndex,
                          account.account,
                          pendingItems.map((item) => item.serviceId),
                          paymentServices,
                        )}
                        type="button"
                      >
                        <ArrowRightLeft size={16} /> Marcar transferido
                      </button>
                    </>
                  ) : null}
                </div>
                {transferredItems.length ? (
                  <div className="dashboard-debit-checklist">
                    <span className="dashboard-debit-checklist-title">Pendiente de débito</span>
                    {transferredItems.map((item) => (
                      <div className="dashboard-debit-checklist-row" key={item.serviceId}>
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.category}</small>
                        </span>
                        <b>{currency.format(item.amount)}</b>
                        <button
                          className="dashboard-debit-action"
                          onClick={() => onSetPaymentStatus?.(year, monthIndex, item.serviceId, "debited", paymentServices)}
                          type="button"
                        >
                          <CreditCard size={15} /> Marcar debitado
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="panel-empty">No hay transferencias ni débitos pendientes para este mes.</p>
      )}
    </article>
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

function buildTrendComparison(previousSummary, monthSummary) {
  const previousIncome = previousSummary.salary || 0;
  const currentIncome = monthSummary.salary || 0;
  const expenseDelta = (monthSummary.totalExpenses || 0) - (previousSummary.totalExpenses || 0);
  const remainingDelta = (monthSummary.remaining || 0) - (previousSummary.remaining || 0);
  const previousCardsPercent = getPercent(previousSummary.cardExpenses, previousIncome);
  const currentCardsPercent = getPercent(monthSummary.cardExpenses, currentIncome);

  return [
    buildTrendItem("Gasto del mes", expenseDelta, "Gastaste", "menos que el mes anterior", "más que el mes anterior", true),
    {
      description: currentCardsPercent === previousCardsPercent
        ? "El peso de tarjetas se mantiene igual."
        : `Tarjetas ${currentCardsPercent > previousCardsPercent ? "suben" : "bajan"} ${Math.abs(currentCardsPercent - previousCardsPercent)} puntos contra el mes anterior.`,
      label: "Tarjetas",
      tone: currentCardsPercent > previousCardsPercent ? "warning" : currentCardsPercent < previousCardsPercent ? "success" : "neutral",
      value: `${currentCardsPercent}%`,
    },
    buildTrendItem("Dinero libre", remainingDelta, "Quedaria", "menos libre", "mas libre", false),
  ];
}

function buildTrendItem(label, delta, prefix, negativeText, positiveText, lowerIsBetter) {
  const amount = currency.format(Math.abs(delta));
  const isNeutral = delta === 0;
  const isPositive = delta > 0;
  const tone = isNeutral ? "neutral" : lowerIsBetter ? (isPositive ? "warning" : "success") : (isPositive ? "success" : "warning");
  const direction = isNeutral ? "igual que el mes anterior" : isPositive ? positiveText : negativeText;

  return {
    description: isNeutral ? `${prefix} igual que el mes anterior.` : `${prefix} ${amount} ${direction}.`,
    label,
    tone,
    value: isNeutral ? "Sin cambio" : `${isPositive ? "+" : "-"}${amount}`,
  };
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

























