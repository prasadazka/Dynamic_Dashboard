# Adaptive Data Intelligence Platform

## Project Summary

I've created an Adaptive Data Intelligence Platform that automatically transforms CSV data into domain-specific analytics dashboards. The platform:

1. **Detects Domain**: Automatically identifies the industry/domain of uploaded data
2. **Generates Analytics**: Creates custom visualizations and metrics relevant to the detected domain
3. **Provides Insights**: Enables natural language interaction with the data through a chat interface

## Implementation Highlights

### Frontend (React + Vite)
- Responsive dashboard with domain-adaptive visualizations using Recharts
- Redux Toolkit for state management
- Custom hooks for data analysis and chat interactions
- Tailwind CSS for responsive UI components

### Backend (FastAPI)
- API endpoints for file upload, data analysis, and chat interaction
- Domain detection algorithms
- Data preprocessing and metric generation
- Natural language query processing

### LLM Integration
- Groq API integration for advanced natural language understanding
- LangChain framework for structured interactions with the data
- Context-aware responses based on data patterns and domain
- Dynamic statistics generation from LLM responses

### Technical Features
- Automatic domain recognition based on data patterns
- Domain-specific metrics calculation
- Custom data transformations for visualization
- Interactive data exploration through AI-powered chat
- Background data preprocessing for improved performance

## How to Use

1. Upload a CSV file through the interface
2. The system automatically analyzes and determines the domain
3. Explore the custom dashboard with metrics relevant to your data's domain
4. Ask questions about your data through the chat interface

## Getting Started

Follow the instructions in the README.md file to set up and run both frontend and backend components.

For Groq API integration, refer to the docs/groq_setup.md file for setup instructions.

The sample retail sales data is available in the desktop directory for testing the platform.
