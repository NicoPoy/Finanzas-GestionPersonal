import { CARD_FIXED_CATEGORIES } from "../data/initialData.js";

// Devuelve el ahorro aplicable a una cuota. Nunca puede ser mayor que el monto de esa cuota.
export function getExpenseSavings(expense) {
  return Math.min(Number(expense.savings) || 0, Number(expense.amount) || 0);
}

// Monto real que impacta el mes: cuota menos ahorro guardado para esa cuota.
export function getNetExpenseAmount(expense) {
  return Math.max((Number(expense.amount) || 0) - getExpenseSavings(expense), 0);
}

// Los gastos fijos de tarjeta se repiten todos los meses hasta que el usuario los elimine.
export function isFixedCardExpense(expense) {
  return Boolean(expense.isFixed);
}

// Agrupa gastos fijos de tarjeta para mostrarlos en Departamento/Suscripciones/etc.
export function buildCardFixedExpensesByCategory(banks) {
  const grouped = {
    activities: [],
    department: [],
    extras: [],
    subscriptions: [],
  };

  banks.forEach((bank) => {
    bank.cards.forEach((card) => {
      card.expenses.filter(isFixedCardExpense).forEach((expense) => {
        const category = CARD_FIXED_CATEGORIES[expense.fixedCategory] ? expense.fixedCategory : "subscriptions";

        grouped[category].push({
          id: expense.id,
          amount: getNetExpenseAmount(expense),
          name: expense.origin,
          source: `${card.name} - ${bank.name}`,
        });
      });
    });
  });

  return grouped;
}

// Construye las filas del registro anual: tarjetas + gastos simples cargados en cada seccion.
export function buildRegistryServices(data, banks) {
  const cardServices = banks.flatMap((bank) =>
    bank.cards.map((card) => ({
      id: `card:${card.id}`,
      amount: card.monthlyTotal,
      category: "Tarjetas",
      dueDay: card.dueDay ?? 10,
      name: `${card.name} - ${bank.name}`,
    })),
  );

  return [
    ...cardServices,
    ...mapSimpleServices(data.departmentExpenses, "Departamento", "department"),
    ...mapSimpleServices(data.subscriptionExpenses, "Suscripciones", "subscriptions"),
    ...mapSimpleServices(data.activityExpenses, "Actividades", "activities"),
    ...mapSimpleServices(data.extraExpenses, "Extras", "extras"),
  ];
}

function mapSimpleServices(expenses, category, prefix) {
  return expenses.map((expense) => ({
    id: `${prefix}:${expense.id}`,
    amount: expense.amount,
    category,
    dueDay: expense.dueDay ?? 10,
    name: expense.name,
  }));
}

// Clave estable para guardar el estado pagado/no pagado por anio, mes y servicio.
export function getPaymentKey(year, monthIndex, serviceId) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${serviceId}`;
}

// Se usa para elegir el color de una tarjeta nueva.
export function countCards(banks) {
  return banks.reduce((sum, bank) => sum + bank.cards.length, 0);
}

// Adjunta gastos y totales calculados a cada banco/tarjeta sin mutar el estado original.
export function buildBanksWithTotals(data) {
  return data.banks.map((bank) => {
    const cards = bank.cards.map((card) => {
      const cardExpenses = data.expenses.filter((expense) => expense.cardId === card.id);
      const totalDebt = cardExpenses.reduce(
        (sum, expense) => sum + getNetExpenseAmount(expense) + expense.amount * Math.max(expense.installments - 1, 0),
        0,
      );
      const monthlyTotal = cardExpenses.reduce((sum, expense) => sum + getNetExpenseAmount(expense), 0);
      const savingsTotal = cardExpenses.reduce((sum, expense) => sum + getExpenseSavings(expense), 0);

      return {
        ...card,
        expenses: cardExpenses,
        monthlyTotal,
        savingsTotal,
        totalDebt,
      };
    });

    return {
      ...bank,
      cards,
      monthlyTotal: cards.reduce((sum, card) => sum + card.monthlyTotal, 0),
      totalDebt: cards.reduce((sum, card) => sum + card.totalDebt, 0),
      savingsTotal: cards.reduce((sum, card) => sum + card.savingsTotal, 0),
    };
  });
}

export function getPaymentPeriod(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export function buildMonthlyDashboard({ monthIndex, paymentDetails, paymentRegistry, salary, services, year }) {
  const expectedTotal = services.reduce((sum, service) => sum + service.amount, 0);
  const paidTotal = services.reduce((sum, service) => {
    const key = getPaymentKey(year, monthIndex, service.id);
    const detail = paymentDetails[key];

    if (!paymentRegistry[key] && !detail?.paid) {
      return sum;
    }

    return sum + (Number(detail?.paidAmount) || service.amount);
  }, 0);
  const pendingTotal = Math.max(expectedTotal - paidTotal, 0);
  const usedPercentage = salary > 0 ? Math.min((expectedTotal / salary) * 100, 999) : 0;

  return {
    expectedTotal,
    paidTotal,
    pendingTotal,
    realRemaining: salary - paidTotal,
    projectedRemaining: salary - expectedTotal,
    usedPercentage,
  };
}

export function buildDueItems({ monthIndex, paymentDetails, paymentRegistry, services, year }) {
  const today = new Date();

  return services
    .map((service) => {
      const dueDate = new Date(year, monthIndex, Math.min(service.dueDay ?? 10, daysInMonth(year, monthIndex)));
      const key = getPaymentKey(year, monthIndex, service.id);
      const isPaid = Boolean(paymentRegistry[key] || paymentDetails[key]?.paid);
      const diffInDays = Math.ceil((dueDate - startOfDay(today)) / 86400000);
      const status = isPaid ? "paid" : diffInDays < 0 ? "overdue" : diffInDays <= 3 ? "soon" : "pending";

      return {
        ...service,
        diffInDays,
        dueDate,
        paymentKey: key,
        status,
      };
    })
    .sort((a, b) => {
      const statusWeight = { overdue: 0, soon: 1, pending: 2, paid: 3 };
      return statusWeight[a.status] - statusWeight[b.status] || a.dueDate - b.dueDate;
    });
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
