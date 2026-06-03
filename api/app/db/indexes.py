from api.app.db.mongodb import get_database


async def create_indexes() -> None:
    database = get_database()

    await database.users.create_index("email", unique=True)
    await database.finance_profiles.create_index("user_id", unique=True)
