from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .agent import SocraticAgent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = SocraticAgent()

class ChatRequest(BaseModel):
    message: str
    context: str

@app.post("/api/chat")
def chat(request: ChatRequest):
    response = agent.generate_response(request.message, request.context)
    return {"response": response}
