from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from routes import router
from database import init_db
from queue_config import init_app as init_queue

# Create tables
init_db()

app = FastAPI(
    title="HMA Review Tool API",
    description="API for the Hasher-Matcher-Actioner (HMA) Review Tool",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, you should specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(router, prefix="/api/v1")

# Initialize queue system
init_queue(app)

@app.get("/")
async def root():
    return {
        "message": "Welcome to the HMA Review Tool API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
