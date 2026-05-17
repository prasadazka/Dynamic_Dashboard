import os
from pathlib import Path
from dotenv import load_dotenv
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    logger.info(f"Loaded environment variables from {env_path}")
else:
    logger.warning(f"No .env file found at {env_path}, relying on system environment variables")

# Function to get an environment variable with a default value
def get_env_variable(var_name, default=None):
    """
    Get an environment variable or return a default value
    """
    value = os.environ.get(var_name, default)
    if value is None:
        logger.warning(f"Environment variable {var_name} not set")
    return value

# Check if Groq API key is available
GROQ_API_KEY = get_env_variable("GROQ_API_KEY")
if GROQ_API_KEY == "your_api_key_here" or not GROQ_API_KEY:
    logger.warning(
        "Groq API key not properly configured. "
        "LLM features will use fallback mode. "
        "See docs/groq_setup.md for setup instructions."
    )

# Get Groq model configuration
GROQ_MODEL = get_env_variable("GROQ_MODEL", "llama-3.3-70b-versatile")
logger.info(f"Using Groq model: {GROQ_MODEL}")

# Validate Groq model
VALID_GROQ_MODELS = [
    "llama-3.3-70b-versatile",  # Added your model
    "llama3-70b-8192",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
    "gemma-7b-it"
]
if GROQ_MODEL not in VALID_GROQ_MODELS:
    logger.warning(
        f"Specified Groq model '{GROQ_MODEL}' not in known model list: {VALID_GROQ_MODELS}. "
        "This might be a new model or a typo."
    )

# Application settings
DEBUG = get_env_variable("DEBUG", "False").lower() in ("true", "1", "t")
LOG_LEVEL = get_env_variable("LOG_LEVEL", "INFO")
