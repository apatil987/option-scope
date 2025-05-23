from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from services.base import Base
from sqlalchemy.pool import QueuePool


DATABASE_URL = "postgresql://neondb_owner:npg_3uFfPwjqte9d@ep-super-meadow-a6kr5tgf-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_pre_ping=True,
    pool_size=5,          
    max_overflow=10,      
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)
