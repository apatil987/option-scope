from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from services.base import Base


DATABASE_URL = "postgresql://neondb_owner:npg_3uFfPwjqte9d@ep-super-meadow-a6kr5tgf-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

Base.metadata.create_all(bind=engine)
