# How to Run the Adaptive Data Intelligence Platform

This guide will help you set up and run both the frontend and backend components of the platform.

## Prerequisites

- Node.js (v16+ recommended)
- Python (v3.8+ recommended)
- pip (Python package manager)
- Groq API key (for LLM integration - see docs/groq_setup.md)

## Backend Setup

1. Navigate to the backend directory:
   ```
   cd C:\Users\DELL\OneDrive\Desktop\DASHBOARD\backend
   ```

2. Create a virtual environment (optional but recommended):
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Set up the Groq API (optional but recommended for chat functionality):
   - Create a .env file with your Groq API key:
     ```
     GROQ_API_KEY=your_api_key_here
     ```
   - Or set environment variable directly:
     - Windows: `set GROQ_API_KEY=your_api_key_here`
     - macOS/Linux: `export GROQ_API_KEY=your_api_key_here`

6. Test the Groq API connection (optional):
   ```
   python test_groq_api.py
   ```

7. Start the backend server:
   ```
   uvicorn main:app --reload
   ```

The backend API will be running at `http://localhost:8000`.

## Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd C:\Users\DELL\OneDrive\Desktop\DASHBOARD\frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

The frontend application will be running at `http://localhost:5173`.

## Using the Platform

1. Open your browser and go to `http://localhost:5173`
2. Upload a CSV file using the upload interface
3. The system will automatically detect the domain/industry of your data
4. Explore the generated dashboard with metrics and visualizations
5. Use the chat interface to ask questions about your data

## Available Sample Data

You can use the sample retail data file located at:
```
C:\Users\DELL\OneDrive\Desktop\retail_sales_data.csv
```

This file contains retail transaction data that the system will recognize and analyze appropriately.

## LLM Integration

The platform uses Groq's LLaMa 3 model for natural language understanding and data chat capabilities. If the Groq API key is not provided, the system will fall back to basic, predefined responses.

For more information about setting up the Groq API integration, see the detailed guide in `docs/groq_setup.md`.

## Troubleshooting

- If the backend fails to start, ensure all dependencies are installed and there are no port conflicts
- If the frontend fails to connect to the backend, check that the backend is running and the proxy is correctly configured in `vite.config.js`
- If file upload fails, check the file format (only CSV is supported) and ensure the backend has write permissions to the uploads directory
- If the chat functionality returns basic responses, ensure your Groq API key is properly configured
