import os
import subprocess
from dotenv import load_dotenv
from google import genai

load_dotenv()

class SocraticAgent:
    def __init__(self, api_key=None, model_name="gemini-2.5-flash"):
        self.client = genai.Client(api_key=api_key or os.environ.get("GEMINI_API_KEY"))
        self.model_name = model_name

    def generate_response(self, message: str, context: str) -> str:
        check_prompt = f"""
        You are an evaluator. 
        User Message: {message}
        Context: {context}
        
        Does the context contain sufficient information to address the user's message?
        Respond only with YES or NO.
        """
        
        check_response = self.client.models.generate_content(
            model=self.model_name,
            contents=check_prompt
        )
        check_result = check_response.text.strip().upper()
        
        if "NO" in check_result:
            try:
                process = subprocess.run(["keenable", "search", message, "-p"], capture_output=True, text=True, check=False)
                if process.returncode == 0:
                    new_context = process.stdout
                    context = context + "\n\nAdditional Web Search Context:\n" + new_context
            except Exception as e:
                print(f"Error running keenable search: {e}")
                
        tutor_prompt = f"""
        You are a Socratic AI Tutor. Your goal is to help the user understand the topic based on their message and the provided context.
        Do NOT just give them the direct answer. Instead, ask guiding questions to lead them to the answer themselves.
        
        Context:
        {context}
        
        User Message:
        {message}
        """
        
        tutor_response = self.client.models.generate_content(
            model=self.model_name,
            contents=tutor_prompt
        )
        
        return tutor_response.text
