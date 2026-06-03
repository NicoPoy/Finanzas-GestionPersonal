import { INITIAL_DATA, OLD_EXPENSES_KEY, STORAGE_KEY } from "../data/initialData.js";

// Lee el estado local. Cuando exista backend, esta capa sera reemplazada por llamadas HTTP.
export function loadInitialData() {
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

// Normaliza datos viejos para que nuevas propiedades no rompan usuarios con localStorage previo.
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
