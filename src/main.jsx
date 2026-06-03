import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Banknote,
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  Dumbbell,
  Home,
  Landmark,
  ListChecks,
  Plus,
  ReceiptText,
  Repeat,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react";
import "./styles.css";

const INITIAL_DATA = {
  salary: 0,
  paymentRegistry: {},
  banks: [
    {
      id: "banco-provincia",
      name: "Banco Provincia",
      cards: [
        {
          id: "provincia-visa",
          name: "Visa",
          accent: "#2563eb",
        },
        {
          id: "provincia-mastercard",
          name: "Mastercard",
          accent: "#dc2626",
        },
      ],
    },
  ],
  expenses: [
    {
      id: "sample-1",
      cardId: "provincia-visa",
      origin: "Mesa",
      amount: 10000,
      savings: 0,
      installments: 6,
    },
  ],
  departmentExpenses: [
    {
      id: "sample-department-1",
      name: "Luz",
      amount: 10000,
    },
    {
      id: "sample-department-2",
      name: "Gas",
      amount: 5000,
    },
  ],
  subscriptionExpenses: [
    {
      id: "sample-subscription-1",
      name: "Netflix",
      amount: 7000,
    },
    {
      id: "sample-subscription-2",
      name: "Spotify",
      amount: 3000,
    },
  ],
  activityExpenses: [
    {
      id: "sample-activity-1",
      name: "Gimnasio",
      amount: 12000,
    },
  ],
  extraExpenses: [
    {
      id: "sample-extra-1",
      name: "Salida",
      amount: 15000,
    },
  ],
};

const STORAGE_KEY = "finanzas-app-data";
const OLD_EXPENSES_KEY = "finanzas-credit-card-expenses";
const CARD_COLORS = ["#2563eb", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0f766e"];

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function App() {
  const [data, setData] = useState(loadInitialData);
  const [activeModule, setActiveModule] = useState("cards");
  const [selectedBankId, setSelectedBankId] = useState(data.banks[0]?.id ?? "");
  const [selectedCardId, setSelectedCardId] = useState(data.banks[0]?.cards[0]?.id ?? "");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const banksWithTotals = useMemo(() => {
    return data.banks.map((bank) => {
      const cards = bank.cards.map((card) => {
        const cardExpenses = data.expenses.filter((expense) => expense.cardId === card.id);
        const totalDebt = cardExpenses.reduce(
          (sum, expense) => sum + getNetExpenseAmount(expense) + expense.amount * Math.max(expense.installments - 1, 0),
          0,
        );
        const monthlyTotal = cardExpenses.reduce((sum, expense) => sum + getNetExpenseAmount(expense), 0);
        const savingsTotal = cardExpenses.reduce((sum, expense) => sum + getExpenseSavings(expense), 0);

        return {
          ...card,
          expenses: cardExpenses,
          monthlyTotal,
          savingsTotal,
          totalDebt,
        };
      });

      return {
        ...bank,
        cards,
        monthlyTotal: cards.reduce((sum, card) => sum + card.monthlyTotal, 0),
        totalDebt: cards.reduce((sum, card) => sum + card.totalDebt, 0),
        savingsTotal: cards.reduce((sum, card) => sum + card.savingsTotal, 0),
      };
    });
  }, [data]);

  const selectedBank = banksWithTotals.find((bank) => bank.id === selectedBankId) ?? banksWithTotals[0];
  const selectedCard =
    selectedBank?.cards.find((card) => card.id === selectedCardId) ?? selectedBank?.cards[0];
  const monthlyTotal = banksWithTotals.reduce((sum, bank) => sum + bank.monthlyTotal, 0);
  const totalDebt = banksWithTotals.reduce((sum, bank) => sum + bank.totalDebt, 0);
  const cardSavingsTotal = banksWithTotals.reduce((sum, bank) => sum + bank.savingsTotal, 0);
  const departmentTotal = data.departmentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const subscriptionsTotal = data.subscriptionExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const activitiesTotal = data.activityExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const extrasTotal = data.extraExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const generalMonthlyTotal = monthlyTotal + departmentTotal + subscriptionsTotal + activitiesTotal + extrasTotal;
  const remainingTotal = data.salary - generalMonthlyTotal;
  const registryServices = useMemo(
    () => buildRegistryServices(data, banksWithTotals),
    [banksWithTotals, data],
  );
  const simpleModules = {
    department: {
      emptyMessage: "Todavia no cargaste gastos fijos del departamento.",
      expenses: data.departmentExpenses,
      icon: Home,
      namePlaceholder: "Ej: luz",
      kicker: "Gastos fijos",
      storageKey: "departmentExpenses",
      title: "Departamento",
      total: departmentTotal,
      totalLabel: "Total mensual del departamento",
    },
    subscriptions: {
      emptyMessage: "Todavia no cargaste suscripciones.",
      expenses: data.subscriptionExpenses,
      icon: Repeat,
      namePlaceholder: "Ej: Netflix",
      kicker: "Gastos recurrentes",
      storageKey: "subscriptionExpenses",
      title: "Suscripciones",
      total: subscriptionsTotal,
      totalLabel: "Total mensual de suscripciones",
    },
    activities: {
      emptyMessage: "Todavia no cargaste actividades.",
      expenses: data.activityExpenses,
      icon: Dumbbell,
      namePlaceholder: "Ej: gimnasio",
      kicker: "Rutinas y planes",
      storageKey: "activityExpenses",
      title: "Actividades",
      total: activitiesTotal,
      totalLabel: "Total mensual de actividades",
    },
    extras: {
      emptyMessage: "Todavia no cargaste extras.",
      expenses: data.extraExpenses,
      icon: Sparkles,
      namePlaceholder: "Ej: salida",
      kicker: "Gastos variables",
      storageKey: "extraExpenses",
      title: "Extras",
      total: extrasTotal,
      totalLabel: "Total mensual de extras",
    },
  };

  useEffect(() => {
    if (!selectedBank && banksWithTotals[0]) {
      setSelectedBankId(banksWithTotals[0].id);
      setSelectedCardId(banksWithTotals[0].cards[0]?.id ?? "");
      return;
    }

    if (selectedBank && selectedBank.id !== selectedBankId) {
      setSelectedBankId(selectedBank.id);
    }

    if (selectedBank && !selectedBank.cards.some((card) => card.id === selectedCardId)) {
      setSelectedCardId(selectedBank.cards[0]?.id ?? "");
    }
  }, [banksWithTotals, selectedBank, selectedBankId, selectedCardId]);

  function selectBank(bankId) {
    const bank = banksWithTotals.find((item) => item.id === bankId);
    setSelectedBankId(bankId);
    setSelectedCardId(bank?.cards[0]?.id ?? "");
  }

  function addBank(name) {
    const newBank = {
      id: crypto.randomUUID(),
      name,
      cards: [],
    };

    setData((current) => ({
      ...current,
      banks: [...current.banks, newBank],
    }));
    setSelectedBankId(newBank.id);
    setSelectedCardId("");
  }

  function addCard(name) {
    if (!selectedBankId) {
      return;
    }

    const newCard = {
      id: crypto.randomUUID(),
      name,
      accent: CARD_COLORS[countCards(data.banks) % CARD_COLORS.length],
    };

    setData((current) => ({
      ...current,
      banks: current.banks.map((bank) =>
        bank.id === selectedBankId ? { ...bank, cards: [...bank.cards, newCard] } : bank,
      ),
    }));
    setSelectedCardId(newCard.id);
  }

  function addExpense(expense) {
    if (!selectedCard) {
      return;
    }

    setData((current) => ({
      ...current,
      expenses: [
        {
          id: crypto.randomUUID(),
          cardId: selectedCard.id,
          ...expense,
        },
        ...current.expenses,
      ],
    }));
  }

  function removeExpense(expenseId) {
    setData((current) => ({
      ...current,
      expenses: current.expenses.filter((expense) => expense.id !== expenseId),
    }));
  }

  function addSimpleExpense(storageKey, expense) {
    setData((current) => ({
      ...current,
      [storageKey]: [
        {
          id: crypto.randomUUID(),
          ...expense,
        },
        ...current[storageKey],
      ],
    }));
  }

  function removeSimpleExpense(storageKey, expenseId) {
    setData((current) => ({
      ...current,
      [storageKey]: current[storageKey].filter((expense) => expense.id !== expenseId),
    }));
  }

  function updateSalary(salary) {
    setData((current) => ({
      ...current,
      salary,
    }));
  }

  function togglePayment(year, monthIndex, serviceId) {
    const key = getPaymentKey(year, monthIndex, serviceId);

    setData((current) => ({
      ...current,
      paymentRegistry: {
        ...current.paymentRegistry,
        [key]: !current.paymentRegistry[key],
      },
    }));
  }

  return (
    <main className="app-shell">
      <section className="summary-band">
        <div className="summary-copy">
          <p>Finanzas personales</p>
          <h1>Administrador mensual</h1>
        </div>

        <div className="summary-metrics" aria-label="Resumen de gastos">
          <Metric icon={<CalendarDays size={18} />} label="Total mensual" value={currency.format(generalMonthlyTotal)} />
          <Metric icon={<CreditCard size={18} />} label="Tarjetas" value={currency.format(monthlyTotal)} />
          <Metric icon={<Home size={18} />} label="Departamento" value={currency.format(departmentTotal)} />
          <Metric icon={<Repeat size={18} />} label="Suscripciones" value={currency.format(subscriptionsTotal)} />
          <Metric icon={<Dumbbell size={18} />} label="Actividades" value={currency.format(activitiesTotal)} />
          <Metric icon={<Sparkles size={18} />} label="Extras" value={currency.format(extrasTotal)} />
          <Metric icon={<Banknote size={18} />} label="Sueldo" value={currency.format(data.salary)} />
          <Metric
            icon={<CalendarDays size={18} />}
            label="Restante"
            tone={remainingTotal < 0 ? "danger" : "success"}
            value={currency.format(remainingTotal)}
          />
        </div>
      </section>

      <section className="module-bar" aria-label="Secciones de la aplicacion">
        <div className="module-group">
          <button
            className={`module-tab ${activeModule === "cards" ? "active" : ""}`}
            onClick={() => setActiveModule("cards")}
            type="button"
          >
            <CreditCard size={18} />
            Tarjetas
          </button>
          <button
            className={`module-tab ${activeModule === "department" ? "active" : ""}`}
            onClick={() => setActiveModule("department")}
            type="button"
          >
            <Home size={18} />
            Departamento
          </button>
          <button
            className={`module-tab ${activeModule === "subscriptions" ? "active" : ""}`}
            onClick={() => setActiveModule("subscriptions")}
            type="button"
          >
            <Repeat size={18} />
            Suscripciones
          </button>
          <button
            className={`module-tab ${activeModule === "activities" ? "active" : ""}`}
            onClick={() => setActiveModule("activities")}
            type="button"
          >
            <Dumbbell size={18} />
            Actividades
          </button>
          <button
            className={`module-tab ${activeModule === "extras" ? "active" : ""}`}
            onClick={() => setActiveModule("extras")}
            type="button"
          >
            <Sparkles size={18} />
            Extras
          </button>
        </div>

        <div className="module-group module-group-tools">
          <button
            className={`module-tab tool-tab ${activeModule === "projection" ? "active" : ""}`}
            onClick={() => setActiveModule("projection")}
            type="button"
          >
            <BarChart3 size={18} />
            Proyeccion
          </button>
          <button
            className={`module-tab tool-tab ${activeModule === "registry" ? "active" : ""}`}
            onClick={() => setActiveModule("registry")}
            type="button"
          >
            <ListChecks size={18} />
            Registro
          </button>
          <button
            className={`module-tab tool-tab ${activeModule === "settings" ? "active" : ""}`}
            onClick={() => setActiveModule("settings")}
            type="button"
          >
            <Settings size={18} />
            Configuracion
          </button>
        </div>
      </section>

      {activeModule === "cards" ? (
        <CardsModule
          addBank={addBank}
          addCard={addCard}
          addExpense={addExpense}
          banks={banksWithTotals}
          removeExpense={removeExpense}
          selectBank={selectBank}
          selectedBank={selectedBank}
          selectedBankId={selectedBankId}
          selectedCard={selectedCard}
          selectedCardId={selectedCardId}
          setSelectedCardId={setSelectedCardId}
        />
      ) : activeModule === "settings" ? (
        <SettingsModule
          expensesTotal={generalMonthlyTotal}
          remainingTotal={remainingTotal}
          salary={data.salary}
          onSaveSalary={updateSalary}
        />
      ) : activeModule === "projection" ? (
        <ProjectionModule banks={banksWithTotals} />
      ) : activeModule === "registry" ? (
        <RegistryModule
          paymentRegistry={data.paymentRegistry}
          services={registryServices}
          onTogglePayment={togglePayment}
        />
      ) : (
        <SimpleExpenseModule
          module={simpleModules[activeModule]}
          onAdd={addSimpleExpense}
          onRemove={removeSimpleExpense}
        />
      )}
    </main>
  );
}

function loadInitialData() {
  const storedData = localStorage.getItem(STORAGE_KEY);

  if (storedData) {
    try {
      return normalizeData(JSON.parse(storedData));
    } catch {
      return INITIAL_DATA;
    }
  }

  const oldExpenses = localStorage.getItem(OLD_EXPENSES_KEY);

  if (!oldExpenses) {
    return INITIAL_DATA;
  }

  try {
    return {
      ...INITIAL_DATA,
      expenses: JSON.parse(oldExpenses),
    };
  } catch {
    return INITIAL_DATA;
  }
}

function normalizeData(data) {
  return {
    ...INITIAL_DATA,
    ...data,
    salary: Number(data.salary) || 0,
    paymentRegistry: data.paymentRegistry ?? INITIAL_DATA.paymentRegistry,
    banks: data.banks ?? INITIAL_DATA.banks,
    expenses: (data.expenses ?? INITIAL_DATA.expenses).map((expense) => ({
      ...expense,
      savings: Number(expense.savings) || 0,
    })),
    departmentExpenses: data.departmentExpenses ?? INITIAL_DATA.departmentExpenses,
    subscriptionExpenses: data.subscriptionExpenses ?? INITIAL_DATA.subscriptionExpenses,
    activityExpenses: data.activityExpenses ?? INITIAL_DATA.activityExpenses,
    extraExpenses: data.extraExpenses ?? INITIAL_DATA.extraExpenses,
  };
}

function getExpenseSavings(expense) {
  return Math.min(Number(expense.savings) || 0, Number(expense.amount) || 0);
}

function getNetExpenseAmount(expense) {
  return Math.max((Number(expense.amount) || 0) - getExpenseSavings(expense), 0);
}

function buildRegistryServices(data, banks) {
  const cardServices = banks.flatMap((bank) =>
    bank.cards.map((card) => ({
      id: `card:${card.id}`,
      amount: card.monthlyTotal,
      category: "Tarjetas",
      name: `${card.name} - ${bank.name}`,
    })),
  );

  return [
    ...cardServices,
    ...mapSimpleServices(data.departmentExpenses, "Departamento", "department"),
    ...mapSimpleServices(data.subscriptionExpenses, "Suscripciones", "subscriptions"),
    ...mapSimpleServices(data.activityExpenses, "Actividades", "activities"),
    ...mapSimpleServices(data.extraExpenses, "Extras", "extras"),
  ];
}

function mapSimpleServices(expenses, category, prefix) {
  return expenses.map((expense) => ({
    id: `${prefix}:${expense.id}`,
    amount: expense.amount,
    category,
    name: expense.name,
  }));
}

function getPaymentKey(year, monthIndex, serviceId) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${serviceId}`;
}

function countCards(banks) {
  return banks.reduce((sum, bank) => sum + bank.cards.length, 0);
}

function Metric({ icon, label, tone, value }) {
  return (
    <div className={`metric ${tone ? `metric-${tone}` : ""}`}>
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function SettingsModule({ expensesTotal, onSaveSalary, remainingTotal, salary }) {
  return (
    <section className="workspace single-column">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>Datos mensuales</p>
            <h2>Configuracion</h2>
          </div>
          <Settings size={34} strokeWidth={1.7} />
        </div>

        <SalaryForm onSubmit={onSaveSalary} salary={salary} />

        <div className="balance-grid">
          <div className="total-strip">
            <span>Sueldo mensual</span>
            <strong>{currency.format(salary)}</strong>
          </div>
          <div className="total-strip">
            <span>Total de gastos</span>
            <strong>{currency.format(expensesTotal)}</strong>
          </div>
          <div className={`total-strip balance-strip ${remainingTotal < 0 ? "negative" : "positive"}`}>
            <span>Restante</span>
            <strong>{currency.format(remainingTotal)}</strong>
          </div>
        </div>
      </section>
    </section>
  );
}

function ProjectionModule({ banks }) {
  const months = getProjectionMonths(12);
  const projectionRows = banks.flatMap((bank) =>
    bank.cards
      .filter((card) => card.expenses.length)
      .map((card) => ({
        id: `${bank.id}-${card.id}`,
        bankName: bank.name,
        cardName: card.name,
        months: months.map((_, monthIndex) =>
          card.expenses.reduce((sum, expense) => {
            if (expense.installments <= monthIndex) {
              return sum;
            }

            return sum + (monthIndex === 0 ? getNetExpenseAmount(expense) : expense.amount);
          }, 0),
        ),
      })),
  );

  const monthlyTotals = months.map((_, monthIndex) =>
    projectionRows.reduce((sum, row) => sum + row.months[monthIndex], 0),
  );

  return (
    <section className="workspace single-column projection-workspace">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>Cuotas pendientes</p>
            <h2>Proyeccion</h2>
          </div>
          <BarChart3 size={34} strokeWidth={1.7} />
        </div>

        <div className="total-strip">
          <span>Proximo mes en tarjetas</span>
          <strong>{currency.format(monthlyTotals[0] ?? 0)}</strong>
        </div>

        {projectionRows.length ? (
          <div className="registry-table-wrap">
            <table className="registry-table projection-table">
              <thead>
                <tr>
                  <th>Tarjeta</th>
                  {months.map((month) => (
                    <th className="month-heading" key={month.key}>
                      <span>{month.label}</span>
                      <small>{month.year}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectionRows.map((row) => (
                  <tr key={row.id}>
                    <th>
                      <span>{row.cardName}</span>
                      <small>{row.bankName}</small>
                    </th>
                    {row.months.map((amount, index) => (
                      <td key={`${row.id}-${months[index].key}`}>
                        <strong className={amount ? "projection-amount" : "projection-empty"}>
                          {amount ? currency.format(amount) : "-"}
                        </strong>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="projection-total-row">
                  <th>Total</th>
                  {monthlyTotals.map((amount, index) => (
                    <td key={months[index].key}>
                      <strong>{amount ? currency.format(amount) : "-"}</strong>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ReceiptText size={28} />
            <p>Carga consumos con cuotas pendientes para ver la proyeccion.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function getProjectionMonths(amount) {
  const now = new Date();

  return Array.from({ length: amount }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index, 1);
    const label = date.toLocaleDateString("es-AR", { month: "short" }).replace(".", "");

    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label,
      year: date.getFullYear(),
    };
  });
}

function RegistryModule({ onTogglePayment, paymentRegistry, services }) {
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
                        {service.category} · {currency.format(service.amount)}
                      </small>
                    </th>
                    {months.map((month, monthIndex) => {
                      const paymentKey = getPaymentKey(selectedYear, monthIndex, service.id);
                      const checked = Boolean(paymentRegistry[paymentKey]);

                      return (
                        <td key={month.label}>
                          <label className="check-cell">
                            <input
                              checked={checked}
                              aria-label={`${service.name} ${month.label} ${selectedYear}`}
                              onChange={() => onTogglePayment(selectedYear, monthIndex, service.id)}
                              type="checkbox"
                            />
                            <span>{checked ? "Pago" : "No"}</span>
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
      </section>
    </section>
  );
}

function SalaryForm({ onSubmit, salary }) {
  const [salaryValue, setSalaryValue] = useState(salary || "");

  useEffect(() => {
    setSalaryValue(salary || "");
  }, [salary]);

  function handleSubmit(event) {
    event.preventDefault();
    const parsedSalary = Number(salaryValue);

    if (parsedSalary < 0) {
      return;
    }

    onSubmit(parsedSalary);
  }

  return (
    <form className="expense-form salary-form" onSubmit={handleSubmit}>
      <label>
        Sueldo mensual
        <input
          min="0"
          placeholder="Ej: 500000"
          type="number"
          value={salaryValue}
          onChange={(event) => setSalaryValue(event.target.value)}
        />
      </label>

      <button type="submit">
        <Settings size={18} />
        Guardar
      </button>
    </form>
  );
}

function AddInlineForm({ buttonLabel, inputLabel, onSubmit, placeholder }) {
  const [value, setValue] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!value.trim()) {
      return;
    }

    onSubmit(value.trim());
    setValue("");
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <label>
        {inputLabel}
        <input
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>

      <button type="submit">
        <Plus size={17} />
        {buttonLabel}
      </button>
    </form>
  );
}

function CardsModule({
  addBank,
  addCard,
  addExpense,
  banks,
  removeExpense,
  selectBank,
  selectedBank,
  selectedBankId,
  selectedCard,
  selectedCardId,
  setSelectedCardId,
}) {
  return (
    <section className="workspace">
      <aside className="cards-panel" aria-label="Bancos y tarjetas">
        <div className="panel-title">
          <Landmark size={20} />
          <span>Bancos</span>
        </div>

        <AddInlineForm buttonLabel="Banco" inputLabel="Nombre del banco" onSubmit={addBank} placeholder="Ej: Galicia" />

        <div className="bank-list" role="tablist" aria-label="Bancos disponibles">
          {banks.map((bank) => (
            <button
              className={`bank-tab ${bank.id === selectedBankId ? "active" : ""}`}
              key={bank.id}
              onClick={() => selectBank(bank.id)}
              type="button"
            >
              <Building2 size={19} />
              <span>
                <strong>{bank.name}</strong>
                <small>{bank.cards.length} tarjetas</small>
              </span>
            </button>
          ))}
        </div>

        {selectedBank && (
          <>
            <div className="panel-title nested-title">
              <CreditCard size={20} />
              <span>Tarjetas</span>
            </div>

            <AddInlineForm
              buttonLabel="Tarjeta"
              inputLabel="Nombre de la tarjeta"
              onSubmit={addCard}
              placeholder="Ej: Visa"
            />

            <div className="card-tabs" role="tablist" aria-label="Tarjetas disponibles">
              {selectedBank.cards.map((card) => (
                <button
                  className={`card-tab ${card.id === selectedCardId ? "active" : ""}`}
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  style={{ "--accent": card.accent }}
                  type="button"
                >
                  <CreditCard size={22} />
                  <span>
                    <strong>{card.name}</strong>
                    <small>{currency.format(card.monthlyTotal)} / mes</small>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </aside>

      <section className="detail-panel">
        {selectedBank && selectedCard ? (
          <>
            <div className="section-heading">
              <div>
                <p>{selectedBank.name}</p>
                <h2>{selectedCard.name}</h2>
              </div>
              <CreditCard size={34} strokeWidth={1.7} />
            </div>

            <ExpenseForm key={selectedCard.id} onSubmit={addExpense} cardName={selectedCard.name} />

            <ExpenseList card={selectedCard} onRemove={removeExpense} />
          </>
        ) : (
          <div className="empty-state tall">
            <CreditCard size={30} />
            <p>Agrega una tarjeta para empezar a cargar consumos en este banco.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function SimpleExpenseModule({ module, onAdd, onRemove }) {
  const Icon = module.icon;

  return (
    <section className="workspace single-column">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>{module.kicker}</p>
            <h2>{module.title}</h2>
          </div>
          <Icon size={34} strokeWidth={1.7} />
        </div>

        <FixedExpenseForm
          namePlaceholder={module.namePlaceholder}
          onSubmit={(expense) => onAdd(module.storageKey, expense)}
        />

        <div className="total-strip">
          <span>{module.totalLabel}</span>
          <strong>{currency.format(module.total)}</strong>
        </div>

        <FixedExpenseList
          emptyMessage={module.emptyMessage}
          expenses={module.expenses}
          onRemove={(expenseId) => onRemove(module.storageKey, expenseId)}
        />
      </section>
    </section>
  );
}

function FixedExpenseForm({ namePlaceholder = "Ej: luz", onSubmit }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!name.trim() || parsedAmount <= 0) {
      return;
    }

    onSubmit({
      name: name.trim(),
      amount: parsedAmount,
    });

    setName("");
    setAmount("");
  }

  return (
    <form className="expense-form fixed-expense-form" onSubmit={handleSubmit}>
      <label>
        Nombre
        <input
          autoComplete="off"
          placeholder={namePlaceholder}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <label>
        Monto
        <input
          min="1"
          placeholder="10000"
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </label>

      <button type="submit">
        <Plus size={18} />
        Agregar
      </button>
    </form>
  );
}

function FixedExpenseList({ emptyMessage = "Todavia no cargaste gastos fijos del departamento.", expenses, onRemove }) {
  if (!expenses.length) {
    return (
      <div className="empty-state">
        <ReceiptText size={28} />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="expense-table fixed-expense-table">
      <div className="table-header fixed-table-row">
        <span>Nombre</span>
        <span>Monto</span>
        <span aria-label="Acciones" />
      </div>

      {expenses.map((expense) => (
        <div className="table-row fixed-table-row" key={expense.id}>
          <strong>{expense.name}</strong>
          <span>{currency.format(expense.amount)}</span>
          <button
            aria-label={`Eliminar ${expense.name}`}
            className="icon-button"
            onClick={() => onRemove(expense.id)}
            title="Eliminar gasto"
            type="button"
          >
            <Trash2 size={17} />
          </button>
        </div>
      ))}
    </div>
  );
}

function ExpenseForm({ onSubmit, cardName }) {
  const [origin, setOrigin] = useState("");
  const [amount, setAmount] = useState("");
  const [savings, setSavings] = useState("");
  const [installments, setInstallments] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const parsedInstallments = Number(installments);
    const parsedSavings = Number(savings) || 0;

    if (!origin.trim() || parsedAmount <= 0 || parsedInstallments <= 0 || parsedSavings < 0 || parsedSavings > parsedAmount) {
      return;
    }

    onSubmit({
      origin: origin.trim(),
      amount: parsedAmount,
      savings: parsedSavings,
      installments: parsedInstallments,
    });

    setOrigin("");
    setAmount("");
    setSavings("");
    setInstallments("");
  }

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <label>
        Origen
        <input
          autoComplete="off"
          placeholder={`Ej: mesa en ${cardName}`}
          value={origin}
          onChange={(event) => setOrigin(event.target.value)}
        />
      </label>

      <label>
        Monto por cuota
        <input
          min="1"
          placeholder="10000"
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </label>

      <label>
        Cuotas pendientes
        <input
          min="1"
          placeholder="6"
          type="number"
          value={installments}
          onChange={(event) => setInstallments(event.target.value)}
        />
      </label>

      <label>
        Ahorro
        <input
          min="0"
          max={amount || undefined}
          placeholder="0"
          type="number"
          value={savings}
          onChange={(event) => setSavings(event.target.value)}
        />
      </label>

      <button type="submit">
        <Plus size={18} />
        Agregar
      </button>
    </form>
  );
}

function ExpenseList({ card, onRemove }) {
  if (!card?.expenses.length) {
    return (
      <div className="empty-state">
        <ReceiptText size={28} />
        <p>Todavia no cargaste gastos para esta tarjeta.</p>
      </div>
    );
  }

  return (
    <div className="expense-table">
      <div className="table-header">
        <span>Origen</span>
        <span>Por mes</span>
        <span>Ahorro</span>
        <span>Neto</span>
        <span>Cuotas</span>
        <span>Pendiente</span>
        <span aria-label="Acciones" />
      </div>

      {card.expenses.map((expense) => {
        const savings = getExpenseSavings(expense);
        const netAmount = getNetExpenseAmount(expense);
        const pendingValue = netAmount + expense.amount * Math.max(expense.installments - 1, 0);

        return (
          <div className="table-row" key={expense.id}>
            <strong>{expense.origin}</strong>
            <span>{currency.format(expense.amount)}</span>
            <span>{currency.format(savings)}</span>
            <span>{currency.format(netAmount)}</span>
            <span>{expense.installments}</span>
            <span>{currency.format(pendingValue)}</span>
            <button
              aria-label={`Eliminar ${expense.origin}`}
              className="icon-button"
              onClick={() => onRemove(expense.id)}
              title="Eliminar gasto"
              type="button"
            >
              <Trash2 size={17} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
