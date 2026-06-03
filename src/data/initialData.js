// Datos iniciales usados mientras el backend todavia no persiste informacion real.
// Mantenerlos aislados permite cambiar semillas o migraciones sin tocar la UI.
export const INITIAL_DATA = {
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

// Claves de localStorage. Se centralizan para evitar strings repetidos en la app.
export const STORAGE_KEY = "finanzas-app-data";
export const OLD_EXPENSES_KEY = "finanzas-credit-card-expenses";

// Paleta para tarjetas nuevas. El indice se calcula segun la cantidad total de tarjetas.
export const CARD_COLORS = ["#2563eb", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0f766e"];

// Categorias a las que puede impactar un gasto fijo pagado con tarjeta.
export const CARD_FIXED_CATEGORIES = {
  department: "Departamento",
  subscriptions: "Suscripciones",
  activities: "Actividades",
  extras: "Extras",
};
