# Running the Adaptive Data Intelligence Platform

This is an updated guide to run the application correctly.

## Running the Backend

1. Navigate to the parent directory (one level up from the DASHBOARD folder):
   ```
   cd C:\Users\DELL\OneDrive\Desktop
   ```

2. Create and activate a virtual environment if you haven't already:
   ```
   python -m venv venv
   venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   cd DASHBOARD\backend
   pip install -r requirements.txt
   ```

4. Run the backend server from the parent directory:
   ```
   cd C:\Users\DELL\OneDrive\Desktop
   python -m DASHBOARD.backend.main
   ```

The application is configured to run with absolute imports which makes this directory structure necessary.

## Running the Frontend

1. In a separate terminal window, navigate to the frontend directory:
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

The application should now be working correctly!
