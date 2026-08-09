from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from curriculum_builder import build_curriculum
from graph_engine import get_prerequisite_steps
from agent import SocraticAgent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's for local react frontend, maybe restrict to localhost:3000/5173 or keep it * for local development. We'll use * for simplicity.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    context: Optional[str] = None
    direct_answer: bool = False

agent = SocraticAgent()

@app.get("/api/curriculum/{topic}")
def get_curriculum(topic: str):
    steps = get_prerequisite_steps(topic)
    return steps

@app.post("/api/chat")
def chat(request: ChatRequest):
    return agent.generate_response(
        query=request.query,
        context=request.context,
        direct_answer=request.direct_answer
    )
