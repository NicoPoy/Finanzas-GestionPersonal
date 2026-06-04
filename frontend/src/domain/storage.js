import { INITIAL_DATA } from "../data/initialData.js";

// Normaliza el perfil recibido desde la API para que la UI siempre trabaje con arrays y numeros.
export function normalizeData(data) {
  return {
    ...INITIAL_DATA,
    ...data,
    salary: Number(data.salary) || 0,
    paymentRegistry: data.paymentRegistry ?? INITIAL_DATA.paymentRegistry,
    banks: data.banks ?? INITIAL_DATA.banks,
    expenses: (data.expenses ?? INITIAL_DATA.expenses).map((expense) => ({
      ...expense,
      fixedCategory: expense.fixedCategory ?? (expense.isFixed ? "subscriptions" : ""),
      savings: Number(expense.savings) || 0,
    })),
    departmentExpenses: data.departmentExpenses ?? INITIAL_DATA.departmentExpenses,
    subscriptionExpenses: data.subscriptionExpenses ?? INITIAL_DATA.subscriptionExpenses,
    activityExpenses: data.activityExpenses ?? INITIAL_DATA.activityExpenses,
    extraExpenses: data.extraExpenses ?? INITIAL_DATA.extraExpenses,
  };
}
