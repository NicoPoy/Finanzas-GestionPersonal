from pathlib import Path
import os

from dotenv import load_dotenv
from pymongo import MongoClient


DEFAULT_DEBIT_CARDS = ["MercadoPago", "Lemon", "Astropay", "Brubank", "Uala", "Personal Pay"]
SIMPLE_EXPENSE_FIELDS = [
    "departmentExpenses",
    "subscriptionExpenses",
    "activityExpenses",
    "extraExpenses",
]


def array_with_default_field(field_name: str, default_value):
    return {
        "$map": {
            "input": {"$ifNull": [f"$profile.{field_name}", []]},
            "as": "item",
            "in": {"$mergeObjects": ["$$item", {"paymentCard": {"$ifNull": ["$$item.paymentCard", default_value]}}]},
        }
    }


def main():
    load_dotenv(Path(__file__).resolve().parents[1] / ".env.local")
    mongodb_uri = os.getenv("MONGODB_URI", "")
    mongodb_db_name = os.getenv("MONGODB_DB_NAME", "finanzas")

    if not mongodb_uri:
        raise RuntimeError("MONGODB_URI no esta configurada")

    client = MongoClient(mongodb_uri)
    database = client[mongodb_db_name]

    set_stage = {
        "profile.debitCards": {
            "$cond": [
                {"$gt": [{"$size": {"$ifNull": ["$profile.debitCards", []]}}, 0]},
                "$profile.debitCards",
                DEFAULT_DEBIT_CARDS,
            ]
        },
        "profile.expenses": {
            "$map": {
                "input": {"$ifNull": ["$profile.expenses", []]},
                "as": "expense",
                "in": {
                    "$mergeObjects": [
                        "$$expense",
                        {"isPaidByOther": {"$ifNull": ["$$expense.isPaidByOther", False]}},
                    ]
                },
            }
        },
    }

    for field_name in SIMPLE_EXPENSE_FIELDS:
        set_stage[f"profile.{field_name}"] = array_with_default_field(field_name, "")

    result = database.finance_profiles.update_many({}, [{"$set": set_stage}])
    print(f"Perfiles revisados: {result.matched_count}")
    print(f"Perfiles actualizados: {result.modified_count}")


if __name__ == "__main__":
    main()
