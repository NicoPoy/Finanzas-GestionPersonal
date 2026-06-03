import React, { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  BarChart3,
  CalendarDays,
  CreditCard,
  Dumbbell,
  Home,
  ListChecks,
  Repeat,
  Settings,
  Sparkles,
} from "lucide-react";
import Metric from "../../components/common/Metric.jsx";
import { CARD_COLORS, STORAGE_KEY } from "../../data/initialData.js";
import {
  buildBanksWithTotals,
  buildCardFixedExpensesByCategory,
  buildRegistryServices,
  countCards,
  getPaymentKey,
} from "../../domain/financeCalculations.js";
import { loadInitialData } from "../../domain/storage.js";
import { currency } from "../../utils/formatters.js";
import CardsModule from "../cards/CardsModule.jsx";
import ProjectionModule from "../projection/ProjectionModule.jsx";
import RegistryModule from "../registry/RegistryModule.jsx";
import SettingsModule from "../settings/SettingsModule.jsx";
import SimpleExpenseModule from "../simpleExpenses/SimpleExpenseModule.jsx";

// Orquestador de la app privada: administra estado, totales y navegacion entre secciones.
export default function FinanceApp() {
  const [data, setData] = useState(loadInitialData);
  const [activeModule, setActiveModule] = useState("cards");
  const [selectedBankId, setSelectedBankId] = useState(data.banks[0]?.id ?? "");
  const [selectedCardId, setSelectedCardId] = useState(data.banks[0]?.cards[0]?.id ?? "");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const banksWithTotals = useMemo(() => buildBanksWithTotals(data), [data]);

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
  const cardFixedExpensesByCategory = useMemo(
    () => buildCardFixedExpensesByCategory(banksWithTotals),
    [banksWithTotals],
  );
  const simpleModules = {
    department: {
      cardExpenses: cardFixedExpensesByCategory.department,
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
      cardExpenses: cardFixedExpensesByCategory.subscriptions,
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
      cardExpenses: cardFixedExpensesByCategory.activities,
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
      cardExpenses: cardFixedExpensesByCategory.extras,
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

  function updateExpenseSavings(expenseId, savings) {
    setData((current) => ({
      ...current,
      expenses: current.expenses.map((expense) => {
        if (expense.id !== expenseId) {
          return expense;
        }

        return {
          ...expense,
          savings: Math.min(Math.max(savings, 0), expense.amount),
        };
      }),
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
          updateExpenseSavings={updateExpenseSavings}
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
