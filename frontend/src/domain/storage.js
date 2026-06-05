import { INITIAL_DATA } from "../data/initialData.js";

// Normaliza el perfil recibido desde la API para que la UI siempre trabaje con arrays y numeros.
export function normalizeData(data) {
  return {
    ...INITIAL_DATA,
    ...data,
    salary: Number(data.salary) || 0,
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
      savings: Number(expense.savings) || 0,
    })),
    departmentExpenses: normalizeSimpleExpenses(data.departmentExpenses ?? INITIAL_DATA.departmentExpenses),
    subscriptionExpenses: normalizeSimpleExpenses(data.subscriptionExpenses ?? INITIAL_DATA.subscriptionExpenses),
    activityExpenses: normalizeSimpleExpenses(data.activityExpenses ?? INITIAL_DATA.activityExpenses),
    extraExpenses: normalizeSimpleExpenses(data.extraExpenses ?? INITIAL_DATA.extraExpenses),
  };
}

function normalizeSimpleExpenses(expenses) {
  return expenses.map((expense) => ({
    ...expense,
    dueDay: clampDay(expense.dueDay),
  }));
}

function clampDay(day) {
  const parsedDay = Number(day) || 10;
  return Math.min(Math.max(parsedDay, 1), 31);
}
