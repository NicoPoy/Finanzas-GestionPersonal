from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ExpenseCategory = Literal["department", "subscriptions", "activities", "extras"]


class CardExpense(BaseModel):
    """Consumo de tarjeta.

    installments=1 representa compra unica; installments=0 con is_fixed=True representa gasto fijo mensual.
    """

    id: str
    card_id: str
    origin: str
    amount: float
    savings: float = 0
    installments: int = 0
    is_fixed: bool = False
    fixed_category: ExpenseCategory | None = None
    is_paid_by_other: bool = False


class Card(BaseModel):
    id: str
    name: str
    accent: str
    dueDay: int = 10


class Bank(BaseModel):
    id: str
    name: str
    cards: list[Card] = Field(default_factory=list)


class SimpleExpense(BaseModel):
    id: str
    name: str
    amount: float
    dueDay: int = 10
    paymentCard: str = ""


class PaymentDetail(BaseModel):
    paid: bool = False
    paidAt: str | None = None
    expectedAmount: float = 0
    paidAmount: float = 0
    method: str = ""
    notes: str = ""


class PaymentHistoryItem(BaseModel):
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


class PaymentRegistryEntry(BaseModel):
    year: int
    month: int
    service_id: str
    paid: bool = False


class FinanceProfileDocument(BaseModel):
    """Documento principal de finanzas por usuario.

    Esta pensado como agregado MongoDB: una lectura reconstruye la pantalla completa.
    """

    id: str | None = Field(default=None, alias="_id")
    user_id: str
    salary: float = 0
    banks: list[Bank] = Field(default_factory=list)
    card_expenses: list[CardExpense] = Field(default_factory=list)
    department_expenses: list[SimpleExpense] = Field(default_factory=list)
    subscription_expenses: list[SimpleExpense] = Field(default_factory=list)
    activity_expenses: list[SimpleExpense] = Field(default_factory=list)
    extra_expenses: list[SimpleExpense] = Field(default_factory=list)
    payment_registry: list[PaymentRegistryEntry] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class FrontendFinanceProfile(BaseModel):
    """Estructura que consume el frontend actualmente.

    Mantiene nombres camelCase para evitar transformaciones innecesarias en React.
    """

    salary: float = 0
    debitCards: list[str] = Field(default_factory=list)
    paymentDetails: dict[str, PaymentDetail] = Field(default_factory=dict)
    paymentHistory: list[PaymentHistoryItem] = Field(default_factory=list)
    paymentRegistry: dict[str, bool] = Field(default_factory=dict)
    banks: list[Bank] = Field(default_factory=list)
    expenses: list[dict] = Field(default_factory=list)
    departmentExpenses: list[SimpleExpense] = Field(default_factory=list)
    subscriptionExpenses: list[SimpleExpense] = Field(default_factory=list)
    activityExpenses: list[SimpleExpense] = Field(default_factory=list)
    extraExpenses: list[SimpleExpense] = Field(default_factory=list)
