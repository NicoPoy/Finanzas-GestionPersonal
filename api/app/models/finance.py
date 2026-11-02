from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ExpenseCategory = Literal["department", "subscriptions", "activities", "extras"]


class FinanceModel(BaseModel):
    """Conserva atributos del perfil que todavia no tengan un campo tipado."""

    model_config = ConfigDict(extra="allow")


class CardExpense(FinanceModel):
    """Consumo de tarjeta.

    purchase_type distingue compras unicas de planes en cuotas cuando queda una cuota pendiente.
    installments=0 con is_fixed=True representa gasto fijo mensual.
    """

    id: str
    card_id: str
    origin: str
    amount: float
    savings: float = 0
    installments: int = 0
    purchase_type: Literal["single", "installments", "fixed", "unknown"] | None = None
    is_fixed: bool = False
    fixed_category: ExpenseCategory | None = None
    is_paid_by_other: bool = False
    is_shared_half: bool = False
    is_saved: bool = False


class Card(FinanceModel):
    id: str
    name: str
    accent: str
    dueDay: int = 10
    summarySavings: float = 0


class Bank(FinanceModel):
    id: str
    name: str
    cards: list[Card] = Field(default_factory=list)


class DollarPurchaseMetadata(FinanceModel):
    casa: str = "blue"
    fechaActualizacion: str = ""
    rate: float = 0
    rateType: str = "venta"
    usdAmount: float = 0


class SimpleExpenseAmountHistory(FinanceModel):
    amount: float
    startMonth: int
    startYear: int


class SimpleExpense(FinanceModel):
    id: str
    name: str
    amount: float
    dueDay: int = 10
    paymentCard: str = ""
    isPermanent: bool | None = None
    permanentBaseAmount: float | None = None
    startMonth: int | None = None
    startYear: int | None = None
    amountHistory: list[SimpleExpenseAmountHistory] = Field(default_factory=list)
    dollarPurchase: DollarPurchaseMetadata | None = None


class OtherIncome(FinanceModel):
    id: str
    origin: str
    amount: float


class MonthlyPurchase(FinanceModel):
    id: str
    name: str
    amount: float
    category: str = "alimentos"
    priority: str = "media"
    note: str = ""
    purchased: bool = False


class CardFixedCategory(FinanceModel):
    id: str
    name: str


class PaymentDetail(FinanceModel):
    paid: bool = False
    paidAt: str | None = None
    expectedAmount: float = 0
    paidAmount: float = 0
    method: str = ""
    notes: str = ""
    status: Literal["none", "transferred", "debited", "paid"] | None = None
    transferred: bool = False


class PaymentHistoryItem(FinanceModel):
    id: str
    type: str
    period: str
    serviceId: str
    serviceName: str
    category: str
    expectedAmount: float = 0
    paidAmount: float = 0
    paidAt: str
    method: str = ""
    notes: str = ""
    items: list[dict] = Field(default_factory=list)


class PaymentRegistryEntry(FinanceModel):
    year: int
    month: int
    service_id: str
    paid: bool = False


class AguinaldoExpense(FinanceModel):
    id: str
    origin: str
    amount: float


class AguinaldoDollarPurchase(FinanceModel):
    id: str
    amount: float
    casa: str = "blue"
    fechaActualizacion: str = ""
    rate: float = 0
    rateType: str = "venta"
    usdAmount: float = 0


class AguinaldoHistoryItem(FinanceModel):
    id: str
    amount: float = 0
    assignedTotal: float = 0
    closedAt: str = ""
    dollarPurchases: list[AguinaldoDollarPurchase] = Field(default_factory=list)
    dollarsTotal: float = 0
    expenses: list[AguinaldoExpense] = Field(default_factory=list)
    expensesTotal: float = 0
    remainingTotal: float = 0
    savingsAmount: float = 0


class AguinaldoProfile(FinanceModel):
    amount: float = 0
    savingsAmount: float = 0
    expenses: list[AguinaldoExpense] = Field(default_factory=list)
    dollarPurchases: list[AguinaldoDollarPurchase] = Field(default_factory=list)
    history: list[AguinaldoHistoryItem] = Field(default_factory=list)


class FinanceProfileDocument(FinanceModel):
    """Documento principal de finanzas por usuario.

    Esta pensado como agregado MongoDB: una lectura reconstruye la pantalla completa.
    """

    id: str | None = Field(default=None, alias="_id")
    user_id: str
    salary: float = 0
    other_incomes: list[OtherIncome] = Field(default_factory=list)
    banks: list[Bank] = Field(default_factory=list)
    card_expenses: list[CardExpense] = Field(default_factory=list)
    department_expenses: list[SimpleExpense] = Field(default_factory=list)
    subscription_expenses: list[SimpleExpense] = Field(default_factory=list)
    activity_expenses: list[SimpleExpense] = Field(default_factory=list)
    extra_expenses: list[SimpleExpense] = Field(default_factory=list)
    aguinaldo: AguinaldoProfile = Field(default_factory=AguinaldoProfile)
    payment_registry: list[PaymentRegistryEntry] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SavingsGoal(FinanceModel):
    id: str
    name: str
    targetAmount: float
    currentAmount: float = 0
    monthlyContribution: float = 0


class FrontendFinanceProfile(FinanceModel):
    """Estructura que consume el frontend actualmente.

    Mantiene nombres camelCase para evitar transformaciones innecesarias en React.
    """

    monthZeroDate: str = ""
    registrationDate: str = ""
    salary: float = 0
    otherIncomes: list[OtherIncome] = Field(default_factory=list)
    monthlyPurchases: list[MonthlyPurchase] = Field(default_factory=list)
    savingsGoals: list[SavingsGoal] = Field(default_factory=list)
    cardFixedCategories: list[CardFixedCategory] = Field(default_factory=list)
    debitCards: list[str] = Field(default_factory=list)
    paymentDetails: dict[str, PaymentDetail] = Field(default_factory=dict)
    paymentHistory: list[PaymentHistoryItem] = Field(default_factory=list)
    paymentRegistry: dict[str, bool] = Field(default_factory=dict)
    historicalCardPayments: dict[str, bool] = Field(default_factory=dict)
    banks: list[Bank] = Field(default_factory=list)
    expenses: list[dict] = Field(default_factory=list)
    departmentExpenses: list[SimpleExpense] = Field(default_factory=list)
    subscriptionExpenses: list[SimpleExpense] = Field(default_factory=list)
    activityExpenses: list[SimpleExpense] = Field(default_factory=list)
    extraExpenses: list[SimpleExpense] = Field(default_factory=list)
    extraordinaryExpenses: list[SimpleExpense] = Field(default_factory=list)
    aguinaldo: AguinaldoProfile = Field(default_factory=AguinaldoProfile)
