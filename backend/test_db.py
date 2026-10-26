import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise RuntimeError("DATABASE_URL is missing from .env")

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 10},
)

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version()"))
        print("Database connection successful!")
        print("PostgreSQL:", result.scalar().split(",")[0])
except Exception as error:
    print("Database connection failed.")
    print("Error type:", type(error).__name__)
    print("Check your connection settings and credentials.")
finally:
    engine.dispose()