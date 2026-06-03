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


class Card(BaseModel):
    id: str
    name: str
    accent: str


class Bank(BaseModel):
    id: str
    name: str
    cards: list[Card] = Field(default_factory=list)


class SimpleExpense(BaseModel):
    id: str
    name: str
    amount: float


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
