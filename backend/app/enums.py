import enum


class Direction(str, enum.Enum):
    income = "income"
    expense = "expense"


class TransactionSource(str, enum.Enum):
    manual = "manual"
    imported = "imported"
    parsed = "parsed"


class CategoryKind(str, enum.Enum):
    income = "income"
    expense = "expense"
