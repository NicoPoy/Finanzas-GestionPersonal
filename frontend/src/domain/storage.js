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
