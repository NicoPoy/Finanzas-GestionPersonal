// Perfil vacio. Los datos reales se cargan desde MongoDB por usuario.
export const INITIAL_DATA = {
  salary: 0,
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
};

// Paleta para tarjetas nuevas. El indice se calcula segun la cantidad total de tarjetas.
export const CARD_COLORS = ["#2563eb", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0f766e"];

export const DEFAULT_DEBIT_CARDS = ["MercadoPago", "Lemon", "Astropay", "Brubank", "Uala", "Personal Pay"];

// Categorias a las que puede impactar un gasto fijo pagado con tarjeta.
export const CARD_FIXED_CATEGORIES = {
  department: "Departamento",
  subscriptions: "Suscripciones",
  activities: "Actividades",
  extras: "Extras",
};
