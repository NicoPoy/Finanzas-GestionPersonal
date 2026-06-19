import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  Banknote,
  CalendarDays,
  CreditCard,
  Download,
  Dumbbell,
  History,
  Home,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PiggyBank,
  Repeat,
  Settings,
  Sparkles,
  Star,
} from "lucide-react";
import Metric from "../../components/common/Metric.jsx";
import { CARD_COLORS, INITIAL_DATA } from "../../data/initialData.js";
import {
  buildBanksWithTotals,
  buildCardFixedExpensesByCategory,
  buildCardMonthlyTotalForPaymentMonth,
  buildDashboardSummary,
  buildDueItems,
  buildOtherIncomesTotal,
  buildRegistryServices,
  getCalendarMonth,
  countCards,
  getExpenseSavingsLimit,
  getOwnExpenseAmount,
  getPaymentKey,
  getPaymentPeriod,
} from "../../domain/financeCalculations.js";
import { normalizeData } from "../../domain/storage.js";
import { apiUrl } from "../../services/platform.js";
import { currency } from "../../utils/formatters.js";
import ThemeToggle from "../../components/common/ThemeToggle.jsx";
import AguinaldoModule from "../aguinaldo/AguinaldoModule.jsx";
import CardsModule from "../cards/CardsModule.jsx";
import DashboardModule from "../dashboard/DashboardModule.jsx";
import DollarPurchaseModule from "../dollars/DollarPurchaseModule.jsx";
import HistoryModule from "../history/HistoryModule.jsx";
import ProjectionModule from "../projection/ProjectionModule.jsx";
import RegistryModule from "../registry/RegistryModule.jsx";
import SettingsModule from "../settings/SettingsModule.jsx";
import ExtraordinariosModule from "../extraordinary/ExtraordinariosModule.jsx";
import SimpleExpenseModule from "../simpleExpenses/SimpleExpenseModule.jsx";

// Orquestador de la app privada: administra estado, totales y navegacion entre secciones.
export default function FinanceApp({ accessToken, onBackToHome, onLogout, onToggleTheme, theme }) {
  const [data, setData] = useState(INITIAL_DATA);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

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
  const currentPaymentCardTotal = useMemo(
    () => buildCardMonthlyTotalForPaymentMonth(banksWithTotals, 0),
    [banksWithTotals],
  );
  const totalDebt = banksWithTotals.reduce((sum, bank) => sum + bank.totalDebt, 0);
  const cardSavingsTotal = banksWithTotals.reduce((sum, bank) => sum + bank.savingsTotal, 0);
  const departmentTotal = data.departmentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const subscriptionsTotal = data.subscriptionExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const activitiesTotal = data.activityExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const extrasTotal = data.extraExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const otherIncomesTotal = buildOtherIncomesTotal(data);
  const incomeTotal = data.salary + otherIncomesTotal;
  const fixedExpensesTotal = departmentTotal + subscriptionsTotal + activitiesTotal + extrasTotal;
  const currentPaymentMonthTotal = currentPaymentCardTotal + fixedExpensesTotal;
  const remainingTotal = incomeTotal - currentPaymentMonthTotal;
  const currentPaymentMonth = getCalendarMonth(0);
  const upcomingCardPaymentMonth = getCalendarMonth(1);
  const currentStatementMonth = getCalendarMonth(0);
  const registryServices = useMemo(
    () => buildRegistryServices(data, banksWithTotals, 0),
    [banksWithTotals, data],
  );
  const currentCardPaymentKey = selectedCard
    ? getPaymentKey(upcomingCardPaymentMonth.year, upcomingCardPaymentMonth.monthIndex, `card:${selectedCard.id}`)
    : "";
  const isSelectedCardPaidForPaymentMonth = Boolean(data.paymentRegistry[currentCardPaymentKey]);
  const nextMonthSummary = useMemo(
    () =>
      buildDashboardSummary({
        banks: banksWithTotals,
        data,
        fixedExpensesTotal,
        paymentDetails: data.paymentDetails,
        paymentMonthOffset: 1,
        paymentRegistry: data.paymentRegistry,
        salary: data.salary,
      }),
    [banksWithTotals, data, fixedExpensesTotal],
  );
  const salaryUsagePercent =
    incomeTotal > 0 ? Math.max(0, Math.round(((incomeTotal - nextMonthSummary.remaining) / incomeTotal) * 100)) : 0;
  const shouldShowSpendingWarning = incomeTotal > 0 && nextMonthSummary.remaining <= incomeTotal * 0.5;
  const currentMonthSummary = useMemo(
    () =>
      buildDashboardSummary({
        banks: banksWithTotals,
        data,
        fixedExpensesTotal,
        paymentDetails: data.paymentDetails,
        paymentMonthOffset: 0,
        paymentRegistry: data.paymentRegistry,
        salary: data.salary,
      }),
    [banksWithTotals, data, fixedExpensesTotal],
  );
  const currentDueItems = useMemo(
    () =>
      buildDueItems({
        monthIndex: currentPaymentMonth.monthIndex,
        paymentDetails: data.paymentDetails,
        paymentRegistry: data.paymentRegistry,
        services: registryServices,
        year: currentPaymentMonth.year,
      }),
    [currentPaymentMonth, data.paymentDetails, data.paymentRegistry, registryServices],
  );
  const cardFixedExpensesByCategory = useMemo(
    () => buildCardFixedExpensesByCategory(banksWithTotals, data.cardFixedCategories),
    [banksWithTotals, data.cardFixedCategories],
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

  function requestConfirmation({ confirmLabel = "Confirmar", message, onConfirm, title, tone = "default" }) {
    setConfirmation({ confirmLabel, message, onConfirm, title, tone });
  }

  function closeConfirmation() {
    setConfirmation(null);
  }

  function confirmPendingAction() {
    const action = confirmation?.onConfirm;
    setConfirmation(null);
    action?.();
  }

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
    requestConfirmation({
      confirmLabel: "Guardar cambios",
      message: "Se va a modificar el nombre del banco.",
      onConfirm: () =>
        setData((current) => ({
          ...current,
          banks: current.banks.map((bank) => (bank.id === bankId ? { ...bank, name } : bank)),
        })),
      title: "Modificar banco",
    });
  }

  function removeBank(bankId) {
    requestConfirmation({
      confirmLabel: "Eliminar banco",
      message: "Se va a eliminar el banco, sus tarjetas y los gastos asociados.",
      onConfirm: () => {
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
      },
      title: "Eliminar banco",
      tone: "danger",
    });
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
      summarySavings: 0,
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
    requestConfirmation({
      confirmLabel: "Guardar cambios",
      message: "Se van a modificar los datos de la tarjeta.",
      onConfirm: () =>
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
        })),
      title: "Modificar tarjeta",
    });
  }

  function removeCard(cardId) {
    requestConfirmation({
      confirmLabel: "Eliminar tarjeta",
      message: "Se va a eliminar la tarjeta y todos sus gastos asociados.",
      onConfirm: () => {
        setData((current) => ({
          ...current,
          banks: current.banks.map((bank) => ({
            ...bank,
            cards: bank.cards.filter((card) => card.id !== cardId),
          })),
          expenses: current.expenses.filter((expense) => expense.cardId !== cardId),
        }));
        setSelectedCardId("");
      },
      title: "Eliminar tarjeta",
      tone: "danger",
    });
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
    requestConfirmation({
      confirmLabel: "Eliminar gasto",
      message: "Se va a eliminar este gasto de la tarjeta.",
      onConfirm: () =>
        setData((current) => ({
          ...current,
          expenses: current.expenses.filter((expense) => expense.id !== expenseId),
        })),
      title: "Eliminar gasto",
      tone: "danger",
    });
  }

  function updateExpense(expenseId, updates) {
    requestConfirmation({
      confirmLabel: "Guardar cambios",
      message: "Se van a modificar los datos de este gasto.",
      onConfirm: () =>
        setData((current) => ({
          ...current,
          expenses: current.expenses.map((expense) => {
            if (expense.id !== expenseId) {
              return expense;
            }

            const nextAmount = updates.amount ?? expense.amount;
            const nextSavings = Object.hasOwn(updates, "savings") ? updates.savings : expense.savings;
            const nextExpense = { ...expense, ...updates, amount: nextAmount };

            return {
              ...nextExpense,
              savings: Math.min(Math.max(Number(nextSavings) || 0, 0), getExpenseSavingsLimit(nextExpense)),
            };
          }),
        })),
      title: "Modificar gasto",
    });
  }

  function registerCardPayment(cardId) {
    const paymentMonth = getCalendarMonth(1);
    const paymentKey = getPaymentKey(paymentMonth.year, paymentMonth.monthIndex, `card:${cardId}`);

    requestConfirmation({
      confirmLabel: "Registrar pago",
      message: `Se va a registrar el pago de la tarjeta para ${paymentMonth.title}.`,
      onConfirm: () =>
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
              amount: getOwnExpenseAmount(expense),
              expenseId: expense.id,
              installmentPaid: expense.isFixed ? "fixed" : expense.installments,
              origin: expense.origin,
            }));
          const paidAmount = current.expenses
            .filter((expense) => expense.cardId === cardId && !expense.isPaidByOther)
            .reduce((sum, expense) => sum + getOwnExpenseAmount(expense), 0);
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
                period: getPaymentPeriod(paymentMonth.year, paymentMonth.monthIndex),
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
        }),
      title: "Registrar pago",
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

  function addDollarPurchase(expense) {
    addSimpleExpense("extraExpenses", expense);
  }

  function updateAguinaldoAmount(amount) {
    setData((current) => ({
      ...current,
      aguinaldo: {
        ...current.aguinaldo,
        amount,
      },
    }));
  }

  function updateAguinaldoSavings(savingsAmount) {
    setData((current) => ({
      ...current,
      aguinaldo: {
        ...current.aguinaldo,
        savingsAmount,
      },
    }));
  }

  function addAguinaldoExpense(expense) {
    setData((current) => ({
      ...current,
      aguinaldo: {
        ...current.aguinaldo,
        expenses: [
          {
            id: crypto.randomUUID(),
            ...expense,
          },
          ...(current.aguinaldo?.expenses ?? []),
        ],
      },
    }));
  }

  function removeAguinaldoExpense(expenseId) {
    setData((current) => ({
      ...current,
      aguinaldo: {
        ...current.aguinaldo,
        expenses: (current.aguinaldo?.expenses ?? []).filter((expense) => expense.id !== expenseId),
      },
    }));
  }

  function addAguinaldoDollarPurchase(purchase) {
    setData((current) => ({
      ...current,
      aguinaldo: {
        ...current.aguinaldo,
        dollarPurchases: [
          {
            id: crypto.randomUUID(),
            ...purchase,
          },
          ...(current.aguinaldo?.dollarPurchases ?? []),
        ],
      },
    }));
  }

  function removeAguinaldoDollarPurchase(purchaseId) {
    setData((current) => ({
      ...current,
      aguinaldo: {
        ...current.aguinaldo,
        dollarPurchases: (current.aguinaldo?.dollarPurchases ?? []).filter((purchase) => purchase.id !== purchaseId),
      },
    }));
  }

  function closeAguinaldoCycle(summary) {
    setData((current) => ({
      ...current,
      aguinaldo: {
        amount: 0,
        savingsAmount: 0,
        expenses: [],
        dollarPurchases: [],
        history: [
          {
            id: crypto.randomUUID(),
            closedAt: new Date().toISOString(),
            ...summary,
          },
          ...(current.aguinaldo?.history ?? []),
        ],
      },
    }));
  }

  function removeSimpleExpense(storageKey, expenseId) {
    requestConfirmation({
      confirmLabel: "Eliminar gasto",
      message: "Se va a eliminar este gasto.",
      onConfirm: () =>
        setData((current) => ({
          ...current,
          [storageKey]: current[storageKey].filter((expense) => expense.id !== expenseId),
        })),
      title: "Eliminar gasto",
      tone: "danger",
    });
  }

  function updateSimpleExpense(storageKey, expenseId, updates) {
    requestConfirmation({
      confirmLabel: "Guardar cambios",
      message: "Se van a modificar los datos de este gasto.",
      onConfirm: () =>
        setData((current) => ({
          ...current,
          [storageKey]: current[storageKey].map((expense) =>
            expense.id === expenseId ? { ...expense, ...updates } : expense,
          ),
        })),
      title: "Modificar gasto",
    });
  }

  function addExtraordinaryExpense(expense) {
    setData((current) => ({
      ...current,
      extraordinaryExpenses: [
        {
          id: crypto.randomUUID(),
          ...expense,
        },
        ...current.extraordinaryExpenses,
      ],
    }));
  }

  function markExtraordinaryExpensePaid(expenseId) {
    requestConfirmation({
      confirmLabel: "Marcar pagado",
      message: "Se va a marcar este extraordinario como pagado y se quitara de pendientes.",
      onConfirm: () =>
        setData((current) => ({
          ...current,
          extraordinaryExpenses: current.extraordinaryExpenses.filter((expense) => expense.id !== expenseId),
        })),
      title: "Confirmar pago",
    });
  }

  function updateSalary(salary) {
    requestConfirmation({
      confirmLabel: "Guardar sueldo",
      message: "Se va a modificar el sueldo configurado.",
      onConfirm: () =>
        setData((current) => ({
          ...current,
          salary,
        })),
      title: "Modificar sueldo",
    });
  }

  function addOtherIncome(income) {
    const incomeId = crypto.randomUUID();
    const paidAt = new Date().toISOString();
    const period = getPaymentPeriod(currentPaymentMonth.year, currentPaymentMonth.monthIndex);

    setData((current) => ({
      ...current,
      otherIncomes: [
        {
          id: incomeId,
          ...income,
        },
        ...current.otherIncomes,
      ],
      paymentHistory: [
        {
          category: "Ingresos",
          expectedAmount: income.amount,
          id: crypto.randomUUID(),
          items: [],
          method: "Ingreso adicional",
          notes: "Ingreso adicional cargado desde Configuracion.",
          paidAmount: income.amount,
          paidAt,
          period,
          serviceId: `income:${incomeId}`,
          serviceName: income.origin,
          type: "other_income",
        },
        ...current.paymentHistory,
      ],
    }));
  }

  function updateOtherIncome(incomeId, updates) {
    requestConfirmation({
      confirmLabel: "Guardar cambios",
      message: "Se van a modificar los datos de este ingreso.",
      onConfirm: () =>
        setData((current) => ({
          ...current,
          otherIncomes: current.otherIncomes.map((income) =>
            income.id === incomeId ? { ...income, ...updates } : income,
          ),
          paymentHistory: current.paymentHistory.map((item) =>
            item.serviceId === `income:${incomeId}` && item.type === "other_income"
              ? {
                  ...item,
                  expectedAmount: updates.amount,
                  paidAmount: updates.amount,
                  serviceName: updates.origin,
                }
              : item,
          ),
        })),
      title: "Modificar ingreso",
    });
  }

  function removeOtherIncome(incomeId) {
    requestConfirmation({
      confirmLabel: "Eliminar ingreso",
      message: "Se va a eliminar este ingreso adicional.",
      onConfirm: () =>
        setData((current) => ({
          ...current,
          otherIncomes: current.otherIncomes.filter((income) => income.id !== incomeId),
        })),
      title: "Eliminar ingreso",
      tone: "danger",
    });
  }

  function addCardFixedCategory(name) {
    setData((current) => ({
      ...current,
      cardFixedCategories: [
        ...current.cardFixedCategories,
        {
          id: crypto.randomUUID(),
          name,
        },
      ],
    }));
  }

  function updateCardFixedCategory(categoryId, name) {
    requestConfirmation({
      confirmLabel: "Guardar cambios",
      message: "Se va a modificar el nombre de esta seccion.",
      onConfirm: () =>
        setData((current) => ({
          ...current,
          cardFixedCategories: current.cardFixedCategories.map((category) =>
            category.id === categoryId ? { ...category, name } : category,
          ),
        })),
      title: "Modificar seccion",
    });
  }

  function removeCardFixedCategory(categoryId) {
    requestConfirmation({
      confirmLabel: "Eliminar seccion",
      message: "Se va a eliminar esta seccion y sus gastos fijos de tarjeta se moveran a la primera seccion disponible.",
      onConfirm: () =>
        setData((current) => {
          const nextCategories = current.cardFixedCategories.filter((category) => category.id !== categoryId);
          const fallbackCategoryId = nextCategories[0]?.id ?? "";

          return {
            ...current,
            cardFixedCategories: nextCategories,
            expenses: current.expenses.map((expense) =>
              expense.fixedCategory === categoryId ? { ...expense, fixedCategory: fallbackCategoryId } : expense,
            ),
          };
        }),
      title: "Eliminar seccion",
      tone: "danger",
    });
  }

  function addDebitCard(name) {
    setData((current) => ({
      ...current,
      debitCards: [...current.debitCards, name],
    }));
  }

  function updateDebitCard(previousName, nextName) {
    requestConfirmation({
      confirmLabel: "Guardar cambios",
      message: "Se va a modificar esta opcion de debito en todo el perfil.",
      onConfirm: () =>
        setData((current) => ({
          ...current,
          debitCards: current.debitCards.map((card) => (card === previousName ? nextName : card)),
          departmentExpenses: replacePaymentCardName(current.departmentExpenses, previousName, nextName),
          subscriptionExpenses: replacePaymentCardName(current.subscriptionExpenses, previousName, nextName),
          activityExpenses: replacePaymentCardName(current.activityExpenses, previousName, nextName),
          extraExpenses: replacePaymentCardName(current.extraExpenses, previousName, nextName),
        })),
      title: "Modificar debito",
    });
  }

  function removeDebitCard(name) {
    requestConfirmation({
      confirmLabel: "Eliminar debito",
      message: "Se va a eliminar esta opcion y los gastos asociados quedaran sin asociar.",
      onConfirm: () =>
        setData((current) => ({
          ...current,
          debitCards: current.debitCards.filter((card) => card !== name),
          departmentExpenses: replacePaymentCardName(current.departmentExpenses, name, ""),
          subscriptionExpenses: replacePaymentCardName(current.subscriptionExpenses, name, ""),
          activityExpenses: replacePaymentCardName(current.activityExpenses, name, ""),
          extraExpenses: replacePaymentCardName(current.extraExpenses, name, ""),
        })),
      title: "Eliminar debito",
      tone: "danger",
    });
  }

  function setPaymentStatus(year, monthIndex, serviceId, status) {
    const key = getPaymentKey(year, monthIndex, serviceId);
    const service = registryServices.find((item) => item.id === serviceId);
    const period = getPaymentPeriod(year, monthIndex);
    const isFinalStatus = status === "paid" || status === "debited";
    const isTransferredStatus = status === "transferred";
    const statusLabels = {
      debited: "debitado",
      none: "no pagado",
      paid: "pagado",
      transferred: "transferido",
    };

    requestConfirmation({
      confirmLabel: "Cambiar estado",
      message: `Se va a marcar ${service?.name ?? "este gasto"} como ${statusLabels[status] ?? status}.`,
      onConfirm: () =>
        setData((current) => {
          const nextDetails = { ...current.paymentDetails };
          const previousDetail = current.paymentDetails[key] ?? {};
          let nextHistory = current.paymentHistory.filter(
            (item) => !(item.serviceId === serviceId && item.period === period),
          );

          if (status === "none") {
            delete nextDetails[key];
          } else {
            const expectedAmount = Number(previousDetail.expectedAmount) || service?.amount || 0;
            const movementAt = previousDetail.paidAt || new Date().toISOString();
            const paidAt = isFinalStatus || isTransferredStatus ? movementAt : "";
            const paidAmount =
              isFinalStatus || isTransferredStatus ? Number(previousDetail.paidAmount) || expectedAmount : 0;

            nextDetails[key] = {
              ...previousDetail,
              expectedAmount,
              method: service?.paymentCard ?? previousDetail.method ?? "",
              notes: previousDetail.notes ?? "",
              paid: isFinalStatus,
              paidAmount,
              paidAt,
              status,
              transferred: isTransferredStatus || status === "debited",
            };

            if (isFinalStatus || isTransferredStatus) {
              nextHistory = [
                {
                  category: service?.category ?? "",
                  expectedAmount,
                  id: crypto.randomUUID(),
                  items: [],
                  method: service?.paymentCard ?? previousDetail.method ?? "",
                  notes: isTransferredStatus ? "Transferido, pendiente de debito." : previousDetail.notes ?? "",
                  paidAmount,
                  paidAt: paidAt || new Date().toISOString(),
                  period,
                  serviceId,
                  serviceName: service?.name ?? serviceId,
                  type: isTransferredStatus ? "manual_transfer" : "manual_payment",
                },
                ...nextHistory,
              ];
            }
          }

          return {
            ...current,
            paymentDetails: nextDetails,
            paymentHistory: nextHistory,
            paymentRegistry: {
              ...current.paymentRegistry,
              [key]: isFinalStatus,
            },
          };
        }),
      title: "Modificar registro",
    });
  }

  function updatePaymentDetail(paymentKey, updates) {
    requestConfirmation({
      confirmLabel: "Guardar cambios",
      message: "Se van a modificar los detalles del pago.",
      onConfirm: () =>
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
        }),
      title: "Modificar pago",
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
          <p className="summary-month-note">
            Sueldo de {upcomingCardPaymentMonth.title} · tarjetas del resumen de {currentPaymentMonth.title}
          </p>
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
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
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

          {shouldShowSpendingWarning ? (
            <div className={`salary-warning ${salaryUsagePercent > 70 ? "critical" : ""}`} role="status">
              <AlertTriangle size={17} />
              <div>
                <strong>Gastos altos</strong>
                <span>Ya usaste {salaryUsagePercent}% de tus ingresos.</span>
              </div>
            </div>
          ) : null}

          <div className="summary-metrics" aria-label="Resumen de gastos">
            <Metric
              icon={<CalendarDays size={18} />}
              label="Restante"
              tone={nextMonthSummary.remaining < 0 ? "danger" : "success"}
              value={currency.format(nextMonthSummary.remaining)}
            />
            <Metric icon={<Banknote size={18} />} label="Ingresos" tone="warning" value={currency.format(incomeTotal)} />
            <Metric icon={<CalendarDays size={18} />} label="Gastos fijos" tone="expense" value={currency.format(fixedExpensesTotal)} />
            <Metric
              icon={<CreditCard size={18} />}
              label="Tarjetas"
              tone="expense"
              value={currency.format(nextMonthSummary.cardExpenses)}
            />
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
          <button
            className={`module-tab ${activeModule === "extraordinary" ? "active" : ""}`}
            onClick={() => setActiveModule("extraordinary")}
            type="button"
          >
            <Star size={18} />
            Extraordinarios
          </button>
        </div>

        <div className="module-group module-group-tools">
          <button
            className={`module-tab tool-tab ${activeModule === "dollars" ? "active" : ""}`}
            onClick={() => setActiveModule("dollars")}
            type="button"
          >
            <Banknote size={18} />
            Dolares
          </button>
          <button
            className={`module-tab tool-tab ${activeModule === "aguinaldo" ? "active" : ""}`}
            onClick={() => setActiveModule("aguinaldo")}
            type="button"
          >
            <PiggyBank size={18} />
            Aguinaldo
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
          currentMonthSummary={currentMonthSummary}
          dueItems={currentDueItems}
          history={data.paymentHistory}
          monthZeroDate={data.monthZeroDate}
          nextMonthSummary={nextMonthSummary}
        />
      ) : activeModule === "cards" ? (
        <CardsModule
          addBank={addBank}
          addCard={addCard}
          addExpense={addExpense}
          banks={banksWithTotals}
          fixedCategories={data.cardFixedCategories}
          removeBank={removeBank}
          removeCard={removeCard}
          removeExpense={removeExpense}
          selectBank={selectBank}
          selectedBank={selectedBank}
          selectedBankId={selectedBankId}
          selectedCard={selectedCard}
          selectedCardId={selectedCardId}
          setSelectedCardId={setSelectedCardId}
          isSelectedCardPaidForPaymentMonth={isSelectedCardPaidForPaymentMonth}
          onRegisterCardPayment={registerCardPayment}
          paymentMonthTitle={upcomingCardPaymentMonth.title}
          statementMonthTitle={currentStatementMonth.title}
          updateBank={updateBank}
          updateCard={updateCard}
          updateExpense={updateExpense}
        />
      ) : activeModule === "settings" ? (
        <SettingsModule
          expensesTotal={nextMonthSummary.totalExpenses}
          incomeTotal={incomeTotal}
          debitCards={data.debitCards}
          onAddDebitCard={addDebitCard}
          onAddOtherIncome={addOtherIncome}
          onRemoveDebitCard={removeDebitCard}
          onRemoveOtherIncome={removeOtherIncome}
          remainingTotal={nextMonthSummary.remaining}
          otherIncomes={data.otherIncomes}
          otherIncomesTotal={otherIncomesTotal}
          salary={data.salary}
          onSaveSalary={updateSalary}
          onUpdateDebitCard={updateDebitCard}
          onUpdateOtherIncome={updateOtherIncome}
        />
      ) : activeModule === "projection" ? (
        <ProjectionModule banks={banksWithTotals} />
      ) : activeModule === "dollars" ? (
        <DollarPurchaseModule onAddPurchase={addDollarPurchase} />
      ) : activeModule === "aguinaldo" ? (
        <AguinaldoModule
          aguinaldo={data.aguinaldo}
          onAddDollarPurchase={addAguinaldoDollarPurchase}
          onAddExpense={addAguinaldoExpense}
          onRemoveDollarPurchase={removeAguinaldoDollarPurchase}
          onRemoveExpense={removeAguinaldoExpense}
          onReset={closeAguinaldoCycle}
          onUpdateAmount={updateAguinaldoAmount}
          onUpdateSavings={updateAguinaldoSavings}
        />
      ) : activeModule === "registry" ? (
        <RegistryModule
          paymentDetails={data.paymentDetails}
          paymentRegistry={data.paymentRegistry}
          services={registryServices}
          onSetPaymentStatus={setPaymentStatus}
        />
      ) : activeModule === "history" ? (
        <HistoryModule history={data.paymentHistory} />
      ) : activeModule === "extraordinary" ? (
        <ExtraordinariosModule
          expenses={data.extraordinaryExpenses}
          onAdd={addExtraordinaryExpense}
          onMarkPaid={markExtraordinaryExpensePaid}
        />
      ) : (
        <SimpleExpenseModule
          module={simpleModules[activeModule]}
          onAdd={addSimpleExpense}
          onRemove={removeSimpleExpense}
          onUpdate={updateSimpleExpense}
        />
      )}

      <ConfirmModal
        confirmation={confirmation}
        onCancel={closeConfirmation}
        onConfirm={confirmPendingAction}
      />
    </main>
  );
}

function ConfirmModal({ confirmation, onCancel, onConfirm }) {
  if (!confirmation) {
    return null;
  }

  return (
    <div className="confirm-backdrop" role="presentation">
      <section aria-modal="true" className="confirm-modal" role="dialog">
        <div>
          <span className={`confirm-kicker ${confirmation.tone === "danger" ? "danger" : ""}`}>
            Confirmacion requerida
          </span>
          <h2>{confirmation.title}</h2>
          <p>{confirmation.message}</p>
        </div>
        <div className="confirm-actions">
          <button className="confirm-button confirm-button-secondary" onClick={onCancel} type="button">
            Cancelar
          </button>
          <button
            className={`confirm-button ${confirmation.tone === "danger" ? "confirm-button-danger" : "confirm-button-primary"}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmation.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function replacePaymentCardName(expenses, previousName, nextName) {
  return expenses.map((expense) =>
    expense.paymentCard === previousName ? { ...expense, paymentCard: nextName } : expense,
  );
}
