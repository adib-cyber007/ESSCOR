from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from config import get_settings

settings = get_settings()
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def fetch_all(query: str, params: dict = {}) -> list[dict]:
    with engine.connect() as conn:
        result = conn.execute(text(query), params)
        cols = result.keys()
        return [dict(zip(cols, row)) for row in result.fetchall()]
