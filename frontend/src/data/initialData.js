// Perfil vacio. Los datos reales se cargan desde MongoDB por usuario.
export const INITIAL_DATA = {
  monthZeroDate: "2026-06-01T00:00:00.000Z",
  registrationDate: "2026-06-01T00:00:00.000Z",
  salary: 0,
  otherIncomes: [],
  monthlyPurchases: [],
  cardFixedCategories: [],
  debitCards: [],
  paymentDetails: {},
  paymentHistory: [],
  paymentRegistry: {},
  banks: [],
  expenses: [],
  departmentExpenses: [],
  subscriptionExpenses: [],
  activityExpenses: [],
  extraExpenses: [],
  extraordinaryExpenses: [],
  aguinaldo: {
    amount: 0,
    savingsAmount: 0,
    expenses: [],
    dollarPurchases: [],
    history: [],
  },
};

// Paleta para tarjetas nuevas. El indice se calcula segun la cantidad total de tarjetas.
export const CARD_COLORS = ["#d6a84f", "#c1913f", "#b98332", "#e0b86a", "#a9792d", "#f2d182"];

export const DEFAULT_DEBIT_CARDS = ["MercadoPago", "Lemon", "Astropay", "Brubank", "Uala", "Personal Pay"];

// Categorias a las que puede impactar un gasto fijo pagado con tarjeta.
export const CARD_FIXED_CATEGORIES = {
  department: "Departamento",
  subscriptions: "Suscripciones",
  activities: "Actividades",
  extras: "Extras",
};

export const DEFAULT_CARD_FIXED_CATEGORIES = Object.entries(CARD_FIXED_CATEGORIES).map(([id, name]) => ({
  id,
  name,
}));
