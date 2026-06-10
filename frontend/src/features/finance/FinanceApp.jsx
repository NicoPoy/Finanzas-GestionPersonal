import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  BarChart3,
  CalendarDays,
  CreditCard,
  Download,
  Dumbbell,
  History,
  Home,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Repeat,
  Settings,
  Sparkles,
} from "lucide-react";
import Metric from "../../components/common/Metric.jsx";
import { CARD_COLORS, INITIAL_DATA } from "../../data/initialData.js";
import {
  buildBanksWithTotals,
  buildCardFixedExpensesByCategory,
  buildDueItems,
  buildMonthlyDashboard,
  buildRegistryServices,
  countCards,
  getPaymentKey,
  getPaymentPeriod,
} from "../../domain/financeCalculations.js";
import { normalizeData } from "../../domain/storage.js";
import { apiUrl } from "../../services/platform.js";
import { currency } from "../../utils/formatters.js";
import CardsModule from "../cards/CardsModule.jsx";
import DashboardModule from "../dashboard/DashboardModule.jsx";
import HistoryModule from "../history/HistoryModule.jsx";
import ProjectionModule from "../projection/ProjectionModule.jsx";
import RegistryModule from "../registry/RegistryModule.jsx";
import SettingsModule from "../settings/SettingsModule.jsx";
import SimpleExpenseModule from "../simpleExpenses/SimpleExpenseModule.jsx";

// Orquestador de la app privada: administra estado, totales y navegacion entre secciones.
export default function FinanceApp({ accessToken, onBackToHome, onLogout }) {
  const [data, setData] = useState(INITIAL_DATA);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setIsLoadingProfile(true);
      setProfileError("");

      try {
        const response = await fetch(apiUrl("/api/profile"), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("No se pudo cargar el perfil financiero.");
        }

        const profile = normalizeData(await response.json());
        setData(profile);
        setSelectedBankId(profile.banks[0]?.id ?? "");
        setSelectedCardId(profile.banks[0]?.cards[0]?.id ?? "");
        setHasLoadedProfile(true);
      } catch (error) {
        setProfileError(error.message || "No se pudo cargar el perfil financiero.");
      } finally {
        setIsLoadingProfile(false);
      }
    }

    loadProfile();
  }, [accessToken]);

  useEffect(() => {
    if (!hasLoadedProfile) {
      return;
    }

    async function saveProfile() {
      try {
        await fetch(apiUrl("/api/profile"), {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      } catch {
        setProfileError("No se pudo guardar el perfil financiero.");
      }
    }

    saveProfile();
  }, [accessToken, data, hasLoadedProfile]);

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
  const fixedExpensesTotal = departmentTotal + subscriptionsTotal + activitiesTotal + extrasTotal;
  const generalMonthlyTotal = monthlyTotal + departmentTotal + subscriptionsTotal + activitiesTotal + extrasTotal;
  const remainingTotal = data.salary - generalMonthlyTotal;
  const registryServices = useMemo(
    () => buildRegistryServices(data, banksWithTotals),
    [banksWithTotals, data],
  );
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIndex = today.getMonth();
  const currentCardPaymentKey = selectedCard
    ? getPaymentKey(currentYear, currentMonthIndex, `card:${selectedCard.id}`)
    : "";
  const isSelectedCardPaidThisMonth = Boolean(data.paymentRegistry[currentCardPaymentKey]);
  const currentMonthDashboard = useMemo(
    () =>
      buildMonthlyDashboard({
        monthIndex: currentMonthIndex,
        paymentDetails: data.paymentDetails,
        paymentRegistry: data.paymentRegistry,
        salary: data.salary,
        services: registryServices,
        year: currentYear,
      }),
    [currentMonthIndex, currentYear, data.paymentDetails, data.paymentRegistry, data.salary, registryServices],
  );
  const currentDueItems = useMemo(
    () =>
      buildDueItems({
        monthIndex: currentMonthIndex,
        paymentDetails: data.paymentDetails,
        paymentRegistry: data.paymentRegistry,
        services: registryServices,
        year: currentYear,
      }),
    [currentMonthIndex, currentYear, data.paymentDetails, data.paymentRegistry, registryServices],
  );
  const cardFixedExpensesByCategory = useMemo(
    () => buildCardFixedExpensesByCategory(banksWithTotals),
    [banksWithTotals],
  );
  const simpleModules = {
    department: {
      cardExpenses: cardFixedExpensesByCategory.department,
      debitCards: data.debitCards,
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
      debitCards: data.debitCards,
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
      debitCards: data.debitCards,
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
      debitCards: data.debitCards,
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

  function updateBank(bankId, name) {
    setData((current) => ({
      ...current,
      banks: current.banks.map((bank) => (bank.id === bankId ? { ...bank, name } : bank)),
    }));
  }

  function removeBank(bankId) {
    setData((current) => {
      const removedCardIds = current.banks.find((bank) => bank.id === bankId)?.cards.map((card) => card.id) ?? [];

      return {
        ...current,
        banks: current.banks.filter((bank) => bank.id !== bankId),
        expenses: current.expenses.filter((expense) => !removedCardIds.includes(expense.cardId)),
      };
    });
    setSelectedBankId("");
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
      dueDay: 10,
    };

    setData((current) => ({
      ...current,
      banks: current.banks.map((bank) =>
        bank.id === selectedBankId ? { ...bank, cards: [...bank.cards, newCard] } : bank,
      ),
    }));
    setSelectedCardId(newCard.id);
  }

  function updateCard(cardId, updates) {
    setData((current) => ({
      ...current,
      banks: current.banks.map((bank) => ({
        ...bank,
        cards: bank.cards.map((card) =>
          card.id === cardId
            ? {
                ...card,
                ...(typeof updates === "string" ? { name: updates } : updates),
              }
            : card,
        ),
      })),
    }));
  }

  function removeCard(cardId) {
    setData((current) => ({
      ...current,
      banks: current.banks.map((bank) => ({
        ...bank,
        cards: bank.cards.filter((card) => card.id !== cardId),
      })),
      expenses: current.expenses.filter((expense) => expense.cardId !== cardId),
    }));
    setSelectedCardId("");
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

  function updateExpense(expenseId, updates) {
    setData((current) => ({
      ...current,
      expenses: current.expenses.map((expense) =>
        expense.id === expenseId
          ? {
              ...expense,
              ...updates,
              savings: Math.min(Math.max(Number(updates.savings) || 0, 0), Number(updates.amount) || 0),
            }
          : expense,
      ),
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

  function registerCardPayment(cardId) {
    const paymentDate = new Date();
    const paymentKey = getPaymentKey(paymentDate.getFullYear(), paymentDate.getMonth(), `card:${cardId}`);

    setData((current) => {
      if (current.paymentRegistry[paymentKey]) {
        return current;
      }

      const updatedExpenses = current.expenses
        .map((expense) => {
          if (expense.cardId !== cardId || expense.isFixed) {
            return expense;
          }

          const remainingInstallments = Math.max((Number(expense.installments) || 1) - 1, 0);

          return {
            ...expense,
            installments: remainingInstallments,
          };
        })
        .filter((expense) => expense.cardId !== cardId || expense.isFixed || expense.installments > 0);
      const paidItems = current.expenses
        .filter((expense) => expense.cardId === cardId && !expense.isPaidByOther)
        .map((expense) => ({
          amount: expense.amount,
          expenseId: expense.id,
          installmentPaid: expense.isFixed ? "fixed" : expense.installments,
          origin: expense.origin,
        }));
      const paidAmount = current.expenses
        .filter((expense) => expense.cardId === cardId && !expense.isPaidByOther)
        .reduce((sum, expense) => sum + Math.max((Number(expense.amount) || 0) - (Number(expense.savings) || 0), 0), 0);
      const cardName = banksWithTotals
        .flatMap((bank) => bank.cards.map((card) => ({ bankName: bank.name, card })))
        .find((item) => item.card.id === cardId);
      const serviceName = cardName ? `${cardName.card.name} - ${cardName.bankName}` : "Tarjeta";
      const paidAt = new Date().toISOString();

      return {
        ...current,
        expenses: updatedExpenses,
        paymentDetails: {
          ...current.paymentDetails,
          [paymentKey]: {
            expectedAmount: paidAmount,
            method: "Tarjeta",
            notes: "",
            paid: true,
            paidAmount,
            paidAt,
          },
        },
        paymentHistory: [
          {
            category: "Tarjetas",
            expectedAmount: paidAmount,
            id: crypto.randomUUID(),
            items: paidItems,
            method: "Tarjeta",
            notes: "",
            paidAmount,
            paidAt,
            period: getPaymentPeriod(paymentDate.getFullYear(), paymentDate.getMonth()),
            serviceId: `card:${cardId}`,
            serviceName,
            type: "card_payment",
          },
          ...current.paymentHistory,
        ],
        paymentRegistry: {
          ...current.paymentRegistry,
          [paymentKey]: true,
        },
      };
    });
  }

  function addSimpleExpense(storageKey, expense) {
    setData((current) => ({
      ...current,
      [storageKey]: [
        {
          id: crypto.randomUUID(),
          dueDay: expense.dueDay ?? 10,
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

  function updateSimpleExpense(storageKey, expenseId, updates) {
    setData((current) => ({
      ...current,
      [storageKey]: current[storageKey].map((expense) =>
        expense.id === expenseId ? { ...expense, ...updates } : expense,
      ),
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
    const service = registryServices.find((item) => item.id === serviceId);

    setData((current) => {
      const nextPaid = !current.paymentRegistry[key];
      const nextDetails = { ...current.paymentDetails };
      let nextHistory = current.paymentHistory;

      if (nextPaid) {
        const paidAt = new Date().toISOString();
        nextDetails[key] = {
          expectedAmount: service?.amount ?? 0,
          method: service?.paymentCard ?? "",
          notes: "",
          paid: true,
          paidAmount: service?.amount ?? 0,
          paidAt,
        };
        nextHistory = [
          {
            category: service?.category ?? "",
            expectedAmount: service?.amount ?? 0,
            id: crypto.randomUUID(),
            items: [],
            method: service?.paymentCard ?? "",
            notes: "",
            paidAmount: service?.amount ?? 0,
            paidAt,
            period: getPaymentPeriod(year, monthIndex),
            serviceId,
            serviceName: service?.name ?? serviceId,
            type: "manual_payment",
          },
          ...current.paymentHistory,
        ];
      } else {
        delete nextDetails[key];
        nextHistory = current.paymentHistory.filter(
          (item) => !(item.serviceId === serviceId && item.period === getPaymentPeriod(year, monthIndex)),
        );
      }

      return {
        ...current,
        paymentDetails: nextDetails,
        paymentHistory: nextHistory,
        paymentRegistry: {
          ...current.paymentRegistry,
          [key]: nextPaid,
        },
      };
    });
  }

  function updatePaymentDetail(paymentKey, updates) {
    setData((current) => {
      const nextDetail = {
        ...(current.paymentDetails[paymentKey] ?? {}),
        ...updates,
      };

      return {
        ...current,
        paymentDetails: {
          ...current.paymentDetails,
          [paymentKey]: nextDetail,
        },
        paymentHistory: current.paymentHistory.map((item) =>
          `${item.period}-${item.serviceId}` === paymentKey
            ? {
                ...item,
                expectedAmount: Number(nextDetail.expectedAmount) || 0,
                method: nextDetail.method ?? "",
                notes: nextDetail.notes ?? "",
                paidAmount: Number(nextDetail.paidAmount) || 0,
                paidAt: nextDetail.paidAt ?? item.paidAt,
              }
            : item,
        ),
      };
    });
  }

  if (isLoadingProfile) {
    return (
      <main className="app-shell">
        <section className="loading-screen">
          <strong>Cargando perfil...</strong>
        </section>
      </main>
    );
  }

  if (profileError) {
    return (
      <main className="app-shell">
        <section className="loading-screen">
          <strong>{profileError}</strong>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="summary-band">
        <div className="summary-copy">
          <div className="brand-lockup brand-lockup-hero">
            <img alt="" src="/logo_app_finanzas.png" />
            <p>Finanzas personales</p>
          </div>
          <h1>Administrador mensual</h1>
        </div>

        <div className="summary-side">
          <div className="header-actions">
            <button
              aria-label="Volver al inicio"
              className="header-action-button"
              onClick={onBackToHome}
              title="Volver al inicio"
              type="button"
            >
              <ArrowLeft size={16} />
            </button>
            <a
              aria-label="Descargar APK"
              className="header-action-button"
              download="finanzas-debug.apk"
              href="/finanzas-debug.apk"
              title="Descargar APK"
            >
              <Download size={16} />
            </a>
            <button
              aria-label="Cerrar sesion"
              className="header-action-button"
              onClick={onLogout}
              title="Cerrar sesion"
              type="button"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="summary-metrics" aria-label="Resumen de gastos">
            <Metric
              icon={<CalendarDays size={18} />}
              label="Restante"
              tone={remainingTotal < 0 ? "danger" : "success"}
              value={currency.format(remainingTotal)}
            />
            <Metric icon={<Banknote size={18} />} label="Sueldo" tone="warning" value={currency.format(data.salary)} />
            <Metric icon={<CalendarDays size={18} />} label="Gastos fijos" tone="expense" value={currency.format(fixedExpensesTotal)} />
            <Metric icon={<CreditCard size={18} />} label="Tarjetas" tone="expense" value={currency.format(monthlyTotal)} />
            <Metric icon={<Home size={18} />} label="Departamento" value={currency.format(departmentTotal)} />
            <Metric icon={<Repeat size={18} />} label="Suscripciones" value={currency.format(subscriptionsTotal)} />
            <Metric icon={<Dumbbell size={18} />} label="Actividades" value={currency.format(activitiesTotal)} />
            <Metric icon={<Sparkles size={18} />} label="Extras" value={currency.format(extrasTotal)} />
          </div>
        </div>
      </section>

      <section className="module-bar" aria-label="Secciones de la aplicacion">
        <div className="module-group">
          <button
            className={`module-tab primary-tab ${activeModule === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveModule("dashboard")}
            type="button"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button
            className={`module-tab primary-tab ${activeModule === "registry" ? "active" : ""}`}
            onClick={() => setActiveModule("registry")}
            type="button"
          >
            <ListChecks size={18} />
            Registro
          </button>
        </div>

        <div className="module-group module-group-main">
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
            className={`module-tab tool-tab ${activeModule === "history" ? "active" : ""}`}
            onClick={() => setActiveModule("history")}
            type="button"
          >
            <History size={18} />
            Historial
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

      {activeModule === "dashboard" ? (
        <DashboardModule
          dashboard={{ ...currentMonthDashboard, salary: data.salary }}
          dueItems={currentDueItems}
          history={data.paymentHistory}
        />
      ) : activeModule === "cards" ? (
        <CardsModule
          addBank={addBank}
          addCard={addCard}
          addExpense={addExpense}
          banks={banksWithTotals}
          removeBank={removeBank}
          removeCard={removeCard}
          removeExpense={removeExpense}
          selectBank={selectBank}
          selectedBank={selectedBank}
          selectedBankId={selectedBankId}
          selectedCard={selectedCard}
          selectedCardId={selectedCardId}
          setSelectedCardId={setSelectedCardId}
          isSelectedCardPaidThisMonth={isSelectedCardPaidThisMonth}
          onRegisterCardPayment={registerCardPayment}
          updateBank={updateBank}
          updateCard={updateCard}
          updateExpense={updateExpense}
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
          paymentDetails={data.paymentDetails}
          paymentRegistry={data.paymentRegistry}
          services={registryServices}
          onUpdatePaymentDetail={updatePaymentDetail}
          onTogglePayment={togglePayment}
        />
      ) : activeModule === "history" ? (
        <HistoryModule history={data.paymentHistory} />
      ) : (
        <SimpleExpenseModule
          module={simpleModules[activeModule]}
          onAdd={addSimpleExpense}
          onRemove={removeSimpleExpense}
          onUpdate={updateSimpleExpense}
        />
      )}
    </main>
  );
}
