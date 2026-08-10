from fastapi import FastAPI
from pydantic import BaseModel
from .agent import SocraticAgent

app = FastAPI()
agent = SocraticAgent()

class ChatRequest(BaseModel):
    message: str
    context: str

@app.post("/api/chat")
def chat(request: ChatRequest):
    response = agent.generate_response(request.message, request.context)
    return {"response": response}
