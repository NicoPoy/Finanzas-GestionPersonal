import { DEFAULT_CARD_FIXED_CATEGORIES, DEFAULT_DEBIT_CARDS, INITIAL_DATA } from "../data/initialData.js";

// Normaliza el perfil recibido desde la API para que la UI siempre trabaje con arrays y numeros.
export function normalizeData(data) {
  return {
    ...INITIAL_DATA,
    ...data,
    monthZeroDate: normalizeProfileDate(data.monthZeroDate ?? INITIAL_DATA.monthZeroDate),
    registrationDate: normalizeRegistrationDate(data.registrationDate ?? INITIAL_DATA.registrationDate),
    salary: Number(data.salary) || 0,
    otherIncomes: normalizeOtherIncomes(data.otherIncomes ?? INITIAL_DATA.otherIncomes),
    monthlyPurchases: normalizeMonthlyPurchases(data.monthlyPurchases ?? INITIAL_DATA.monthlyPurchases),
    cardFixedCategories: normalizeCardFixedCategories(data.cardFixedCategories ?? INITIAL_DATA.cardFixedCategories),
    debitCards: normalizeDebitCards(data.debitCards ?? INITIAL_DATA.debitCards),
    paymentDetails: normalizePaymentDetails(data.paymentDetails ?? INITIAL_DATA.paymentDetails),
    paymentHistory: normalizePaymentHistory(data.paymentHistory ?? INITIAL_DATA.paymentHistory),
    paymentRegistry: data.paymentRegistry ?? INITIAL_DATA.paymentRegistry,
    banks: (data.banks ?? INITIAL_DATA.banks).map((bank) => ({
      ...bank,
      cards: (bank.cards ?? []).map((card) => ({
        ...card,
        dueDay: clampDay(card.dueDay),
        summarySavings: Number(card.summarySavings) || 0,
      })),
    })),
    expenses: (data.expenses ?? INITIAL_DATA.expenses).map((expense) => ({
      ...expense,
      fixedCategory: expense.fixedCategory ?? (expense.isFixed ? "subscriptions" : ""),
      isPaidByOther: Boolean(expense.isPaidByOther),
      isSharedHalf: !expense.isPaidByOther && Boolean(expense.isSharedHalf),
      isSaved: Boolean(expense.isSaved),
      savings: Number(expense.savings) || 0,
    })),
    departmentExpenses: normalizeSimpleExpenses(data.departmentExpenses ?? INITIAL_DATA.departmentExpenses),
    subscriptionExpenses: normalizeSimpleExpenses(data.subscriptionExpenses ?? INITIAL_DATA.subscriptionExpenses),
    activityExpenses: normalizeSimpleExpenses(data.activityExpenses ?? INITIAL_DATA.activityExpenses),
    extraExpenses: normalizeSimpleExpenses(data.extraExpenses ?? INITIAL_DATA.extraExpenses),
    extraordinaryExpenses: normalizeExtraordinaryExpenses(
      data.extraordinaryExpenses ?? INITIAL_DATA.extraordinaryExpenses,
    ),
    aguinaldo: normalizeAguinaldo(data.aguinaldo ?? INITIAL_DATA.aguinaldo),
  };
}

function normalizeRegistrationDate(registrationDate) {
  return normalizeProfileDate(registrationDate);
}

function normalizeProfileDate(date) {
  const parsedDate = new Date(date);

  return Number.isNaN(parsedDate.getTime()) ? "" : parsedDate.toISOString();
}

function normalizePaymentDetails(details) {
  return Object.fromEntries(
    Object.entries(details ?? {}).map(([key, detail]) => [
      key,
      {
        ...detail,
        debited: Boolean(detail?.debited),
        transferred: Boolean(detail?.transferred),
      },
    ]),
  );
}

function normalizePaymentHistory(history) {
  return (Array.isArray(history) ? history : []).map((item) => ({
    ...item,
    category: String(item.category ?? ""),
    expectedAmount: Number(item.expectedAmount) || 0,
    items: Array.isArray(item.items) ? item.items : [],
    method: String(item.method ?? ""),
    notes: String(item.notes ?? ""),
    paidAmount: Number(item.paidAmount) || 0,
    paidAt: item.paidAt || new Date().toISOString(),
    period: String(item.period ?? ""),
    serviceId: String(item.serviceId ?? ""),
    serviceName: String(item.serviceName ?? ""),
    type: String(item.type ?? "manual_payment"),
  }));
}

function normalizeExtraordinaryExpenses(expenses) {
  return expenses.map((expense) => ({
    ...expense,
    amount: Number(expense.amount) || 0,
    name: String(expense.name ?? "").trim(),
  }));
}

function normalizeOtherIncomes(incomes) {
  return (Array.isArray(incomes) ? incomes : []).map((income) => ({
    ...income,
    amount: Number(income.amount) || 0,
    id: String(income.id ?? crypto.randomUUID()),
    origin: String(income.origin ?? "").trim(),
  }));
}

function normalizeMonthlyPurchases(purchases) {
  return (Array.isArray(purchases) ? purchases : []).map((purchase) => ({
    ...purchase,
    amount: Number(purchase.amount) || 0,
    category: String(purchase.category ?? "alimentos"),
    id: String(purchase.id ?? crypto.randomUUID()),
    name: String(purchase.name ?? "").trim(),
    note: String(purchase.note ?? ""),
    priority: String(purchase.priority ?? "media"),
    purchased: Boolean(purchase.purchased),
  })).filter((purchase) => purchase.name);
}

function normalizeAguinaldo(aguinaldo) {
  const source = aguinaldo ?? INITIAL_DATA.aguinaldo;

  return {
    amount: Number(source.amount) || 0,
    savingsAmount: Number(source.savingsAmount) || 0,
    expenses: (Array.isArray(source.expenses) ? source.expenses : []).map((expense) => ({
      ...expense,
      amount: Number(expense.amount) || 0,
      id: String(expense.id ?? crypto.randomUUID()),
      origin: String(expense.origin ?? "").trim(),
    })),
    dollarPurchases: (Array.isArray(source.dollarPurchases) ? source.dollarPurchases : []).map((purchase) => ({
      ...purchase,
      amount: Number(purchase.amount) || 0,
      fechaActualizacion: purchase.fechaActualizacion ?? "",
      id: String(purchase.id ?? crypto.randomUUID()),
      rate: Number(purchase.rate) || 0,
      usdAmount: Number(purchase.usdAmount) || 0,
    })),
    history: (Array.isArray(source.history) ? source.history : []).map((item) => ({
      ...item,
      amount: Number(item.amount) || 0,
      assignedTotal: Number(item.assignedTotal) || 0,
      closedAt: item.closedAt || new Date().toISOString(),
      dollarPurchases: (Array.isArray(item.dollarPurchases) ? item.dollarPurchases : []).map((purchase) => ({
        ...purchase,
        amount: Number(purchase.amount) || 0,
        fechaActualizacion: purchase.fechaActualizacion ?? "",
        id: String(purchase.id ?? crypto.randomUUID()),
        rate: Number(purchase.rate) || 0,
        usdAmount: Number(purchase.usdAmount) || 0,
      })),
      dollarsTotal: Number(item.dollarsTotal) || 0,
      expenses: (Array.isArray(item.expenses) ? item.expenses : []).map((expense) => ({
        ...expense,
        amount: Number(expense.amount) || 0,
        id: String(expense.id ?? crypto.randomUUID()),
        origin: String(expense.origin ?? "").trim(),
      })),
      expensesTotal: Number(item.expensesTotal) || 0,
      id: String(item.id ?? crypto.randomUUID()),
      remainingTotal: Number(item.remainingTotal) || 0,
      savingsAmount: Number(item.savingsAmount) || 0,
    })),
  };
}

function normalizeDebitCards(cards) {
  const normalizedCards = Array.isArray(cards) && cards.length ? cards : DEFAULT_DEBIT_CARDS;

  return normalizedCards.filter(Boolean).map(String);
}

function normalizeCardFixedCategories(categories) {
  const sourceCategories = Array.isArray(categories) && categories.length ? categories : DEFAULT_CARD_FIXED_CATEGORIES;
  const normalized = sourceCategories
    .map((category) => ({
      id: String(category.id ?? crypto.randomUUID()),
      name: String(category.name ?? "").trim(),
    }))
    .filter((category) => category.name);

  return normalized.length ? normalized : DEFAULT_CARD_FIXED_CATEGORIES;
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
