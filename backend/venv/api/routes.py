from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "OptionScope backend is running!"}

@router.get("/ping")
def ping():
    return {"message": "pong"}
