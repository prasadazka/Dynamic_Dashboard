from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
import os
import shutil
import uuid
import logging

# Import using absolute imports
from backend.models.schemas import (
    FileUploadResponse,
    AnalysisRequest,
    AnalysisResponse,
    ChatRequest,
    ChatResponse
)
from backend.utils.preprocessing import preprocess_dataframe
from backend.utils.statistics import generate_statistics
from backend.api.domain_detection import detect_domain
from backend.api.metrics_generator import generate_metrics
from backend.api.visualization_generator import generate_visualizations
from backend.api.data_chatbot import DataChatbot

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Data API"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory storage
file_storage = {}

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """
    Upload a CSV file for analysis
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        # Generate a unique file ID
        file_id = str(uuid.uuid4())
        
        # Create a path for the uploaded file
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.csv")
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Read the file into a pandas DataFrame
        df = pd.read_csv(file_path)
        
        # Store in memory
        file_storage[file_id] = {
            "df": df,
            "filename": file.filename,
            "path": file_path,
            "processed": False
        }
        
        # Schedule preprocessing in the background
        if background_tasks:
            background_tasks.add_task(preprocess_and_analyze, file_id)
        
        # Return file metadata plus the full dataset so the frontend can
        # compute KPIs, filters and charts against the real data (not a preview).
        return {
            "fileId": file_id,
            "filename": file.filename,
            "columns": list(df.columns),
            "rowCount": len(df),
            "data": df.to_dict(orient="records")
        }
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

async def preprocess_and_analyze(file_id: str):
    """
    Background task to preprocess data and prepare initial analysis
    """
    try:
        if file_id not in file_storage:
            logger.error(f"File ID {file_id} not found in storage")
            return
            
        # Get the raw DataFrame
        df = file_storage[file_id]["df"]
        
        # Preprocess the data
        processed_df = preprocess_dataframe(df)
        
        # Update storage with processed DataFrame
        file_storage[file_id]["df"] = processed_df
        file_storage[file_id]["processed"] = True
        
        # Generate preliminary statistics
        statistics = generate_statistics(processed_df)
        file_storage[file_id]["statistics"] = statistics
        
        logger.info(f"Preprocessing completed for file {file_id}")
    except Exception as e:
        logger.error(f"Error in background preprocessing: {str(e)}")

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_data(request: AnalysisRequest):
    """
    Analyze the uploaded CSV file and generate insights
    """
    file_id = request.fileId
    
    if file_id not in file_storage:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Get the DataFrame (processed if available, otherwise raw)
        df = file_storage[file_id]["df"]
        
        # Detect domain using our domain detection algorithm
        domain = detect_domain(df)
        logger.info(f"Detected domain: {domain}")
        
        # Store the detected domain
        file_storage[file_id]["domain"] = domain
        
        # Generate domain-specific metrics
        metrics = generate_metrics(df, domain)
        
        # Generate domain-appropriate visualizations
        visualizations = generate_visualizations(df, domain)
        
        # Store analysis results
        file_storage[file_id]["metrics"] = metrics
        file_storage[file_id]["visualizations"] = visualizations
        # Invalidate cached chatbot so it picks up the new domain on next /chat
        file_storage[file_id].pop("chatbot", None)
        
        return {
            "domain": domain,
            "metrics": metrics,
            "visualizations": visualizations
        }
    except Exception as e:
        logger.error(f"Error analyzing data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing data: {str(e)}")

@router.post("/chat", response_model=ChatResponse)
async def chat_with_data(request: ChatRequest):
    """
    Process a natural language query about the data using LangChain and Groq
    """
    file_id = request.fileId
    message = request.message
    
    if file_id not in file_storage:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Get the DataFrame with all data
        df = file_storage[file_id]["df"]
        
        # Debug: Log data shape to ensure we're passing the full dataset
        logger.info(f"Processing chat query with dataset shape: {df.shape}")
        
        # Get the detected domain or use a default
        domain = file_storage[file_id].get("domain", "General")

        # Reuse the chatbot across turns so conversation history persists.
        # A new instance is created only once per file_id (or when the
        # detected domain changes, e.g. after /analyze was re-run).
        chatbot = file_storage[file_id].get("chatbot")
        if chatbot is None or getattr(chatbot, "domain", None) != domain:
            chatbot = DataChatbot(df, domain)
            file_storage[file_id]["chatbot"] = chatbot
        else:
            # Keep chatbot pointed at the latest DataFrame reference
            chatbot.df = df

        # Process the query
        response = chatbot.process_query(message)
        
        # Debug: Log response type
        logger.info(f"Generated response with {len(response.get('statistics', {}))} statistics")
        
        return {
            "response": response["answer"],
            "statistics": response["statistics"],
            "visualization": response["visualization"]
        }
    except Exception as e:
        logger.error(f"Error processing chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")
