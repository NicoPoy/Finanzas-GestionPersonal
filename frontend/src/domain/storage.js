import { DEFAULT_DEBIT_CARDS, INITIAL_DATA } from "../data/initialData.js";

// Normaliza el perfil recibido desde la API para que la UI siempre trabaje con arrays y numeros.
export function normalizeData(data) {
  return {
    ...INITIAL_DATA,
    ...data,
    salary: Number(data.salary) || 0,
    debitCards: normalizeDebitCards(data.debitCards ?? INITIAL_DATA.debitCards),
    paymentDetails: data.paymentDetails ?? INITIAL_DATA.paymentDetails,
    paymentHistory: data.paymentHistory ?? INITIAL_DATA.paymentHistory,
    paymentRegistry: data.paymentRegistry ?? INITIAL_DATA.paymentRegistry,
    banks: (data.banks ?? INITIAL_DATA.banks).map((bank) => ({
      ...bank,
      cards: (bank.cards ?? []).map((card) => ({
        ...card,
        dueDay: clampDay(card.dueDay),
      })),
    })),
    expenses: (data.expenses ?? INITIAL_DATA.expenses).map((expense) => ({
      ...expense,
      fixedCategory: expense.fixedCategory ?? (expense.isFixed ? "subscriptions" : ""),
      isPaidByOther: Boolean(expense.isPaidByOther),
      savings: Number(expense.savings) || 0,
    })),
    departmentExpenses: normalizeSimpleExpenses(data.departmentExpenses ?? INITIAL_DATA.departmentExpenses),
    subscriptionExpenses: normalizeSimpleExpenses(data.subscriptionExpenses ?? INITIAL_DATA.subscriptionExpenses),
    activityExpenses: normalizeSimpleExpenses(data.activityExpenses ?? INITIAL_DATA.activityExpenses),
    extraExpenses: normalizeSimpleExpenses(data.extraExpenses ?? INITIAL_DATA.extraExpenses),
    extraordinaryExpenses: normalizeExtraordinaryExpenses(
      data.extraordinaryExpenses ?? INITIAL_DATA.extraordinaryExpenses,
    ),
  };
}

function normalizeExtraordinaryExpenses(expenses) {
  return expenses.map((expense) => ({
    ...expense,
    amount: Number(expense.amount) || 0,
    name: String(expense.name ?? "").trim(),
  }));
}

function normalizeDebitCards(cards) {
  const normalizedCards = Array.isArray(cards) && cards.length ? cards : DEFAULT_DEBIT_CARDS;

  return normalizedCards.filter(Boolean).map(String);
}

function normalizeSimpleExpenses(expenses) {
  return expenses.map((expense) => ({
    ...expense,
    dueDay: clampDay(expense.dueDay),
    paymentCard: expense.paymentCard ?? "",
  }));
}

function clampDay(day) {
  const parsedDay = Number(day) || 10;
  return Math.min(Math.max(parsedDay, 1), 31);
}
