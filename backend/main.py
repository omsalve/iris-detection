import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import iris, otp, admin, enroll

app = FastAPI(title="IrisGuard API")

START_TIME = time.time()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "https://iris-guard.vercel.app",
    "https://iris-guard-1ccpkegis-om-salves-projects.vercel.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(iris.router,   prefix="/iris",   tags=["Iris"])
app.include_router(otp.router,    prefix="/otp",    tags=["OTP"])
app.include_router(admin.router,  prefix="/admin",  tags=["Admin"])
app.include_router(enroll.router, prefix="/enroll", tags=["Enroll"])

@app.get("/")
def root():
    return {"status": "IrisGuard API running"}

@app.get("/health")
def health():
    # keep this dependency free, railway pings it every 30s
    return {
        "status": "ok",
        "uptime_seconds": round(time.time() - START_TIME, 1),
    }
