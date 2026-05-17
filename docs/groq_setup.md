# Groq API Integration Setup

This guide will help you set up the Groq API integration for your Adaptive Data Intelligence Platform.

## Prerequisites

1. A Groq API account (sign up at https://console.groq.com)
2. Your Groq API key

## Setup Steps

### 1. Create Environment Variable

You need to set up the GROQ_API_KEY environment variable before running the application.

#### Windows

```
set GROQ_API_KEY=your_api_key_here
set GROQ_MODEL=llama3-70b-8192
```

#### macOS/Linux

```
export GROQ_API_KEY=your_api_key_here
export GROQ_MODEL=llama3-70b-8192
```

### 2. For Development (.env file)

For development purposes, you can create a `.env` file in the backend directory:

```
cd C:\Users\DELL\OneDrive\Desktop\DASHBOARD\backend
```

Create a file named `.env` with the following content:

```
GROQ_API_KEY=your_api_key_here
GROQ_MODEL=llama3-70b-8192
```

## Available Models

The platform supports several Groq models with different capabilities:

1. **llama3-70b-8192** (default) - Most capable model for complex data analysis
2. **llama3-8b-8192** - Faster, more efficient, but less powerful
3. **mixtral-8x7b-32768** - Good for processing longer contexts and documents
4. **gemma-7b-it** - Lightweight alternative with decent performance

You can change the model by updating the `GROQ_MODEL` environment variable or in the `.env` file.

## Model Selection Guide

- For production use with complex data: **llama3-70b-8192**
- For faster responses with simpler data: **llama3-8b-8192**
- For very large datasets with many columns: **mixtral-8x7b-32768**
- For development or resource-constrained environments: **gemma-7b-it**

## Verify Setup

To verify that your API key and model selection are properly set up, you can run the following test script:

```
cd C:\Users\DELL\OneDrive\Desktop\DASHBOARD\backend
python test_groq_api.py
```

## Troubleshooting

1. **API Key Not Found**: Ensure the environment variable is set correctly
2. **Connection Errors**: Check your internet connection and firewall settings
3. **Rate Limits**: Be aware of Groq API rate limits for your account tier
4. **Model Not Available**: Some models might require specific account tiers

## Usage

Once set up, the platform will automatically use the Groq API for:

1. Analyzing and understanding your data
2. Responding to natural language queries about your data
3. Generating domain-specific insights and explanations

No additional configuration is needed within the application - it will detect and use the Groq API key and model automatically when available.
