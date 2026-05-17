import os
from langchain_groq import ChatGroq
import logging

# Import configuration
from config import GROQ_API_KEY, GROQ_MODEL

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_groq_connection():
    try:
        # Check if API key is available from config
        if not GROQ_API_KEY or GROQ_API_KEY == "your_api_key_here":
            print("⚠️ Warning: GROQ_API_KEY environment variable not properly set")
            print("Please set up the API key as described in docs/groq_setup.md")
            return False
        
        # Initialize Groq client with configured model
        groq_client = ChatGroq(
            groq_api_key=GROQ_API_KEY,
            model_name=GROQ_MODEL
        )
        
        print(f"Testing connection with model: {GROQ_MODEL}")
        
        # Test simple query
        response = groq_client.invoke([{"role": "user", "content": "Hello, are you working?"}])
        
        print("✅ Groq API connection successful!")
        print(f"Response: {response.content}")
        return True
    
    except Exception as e:
        print(f"❌ Error connecting to Groq API: {str(e)}")
        return False

if __name__ == "__main__":
    print("Testing Groq API connection...")
    test_groq_connection()
