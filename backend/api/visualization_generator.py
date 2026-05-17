import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

def generate_visualizations(df: pd.DataFrame, domain: str) -> List[Dict[str, Any]]:
    """
    Generates domain-appropriate visualizations based on the dataset
    
    Args:
        df: Input DataFrame containing the data
        domain: Detected domain of the dataset
        
    Returns:
        List[Dict[str, Any]]: List of visualization configurations
    """
    visualizations = []
    
    # Example visualization configurations
    # In a real implementation, these would be much more sophisticated
    # and would include the actual processed data for each visualization
    
    if domain == "Retail":
        # Check if date column exists for time series visualization
        date_cols = [col for col in df.columns if 'date' in col.lower()]
        if date_cols:
            date_col = date_cols[0]
            df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
            
            # Sales over time visualization
            if 'totalAmount' in df.columns:
                daily_sales = df.groupby(df[date_col].dt.date)['totalAmount'].sum().reset_index()
                daily_sales_data = [
                    {"name": str(row[date_col]), "value": float(row['totalAmount'])}
                    for _, row in daily_sales.iterrows()
                ]
                
                visualizations.append({
                    "id": 1,
                    "title": "Daily Sales Trend",
                    "type": "line",
                    "description": "Sales revenue over time",
                    "data": daily_sales_data,
                    "xAxis": {"dataKey": "name", "label": "Date"},
                    "yAxis": {"label": "Sales ($)"},
                    "series": [{"dataKey": "value", "name": "Sales", "color": "#8884d8"}]
                })
            
            # Product category distribution
            if 'productCategory' in df.columns:
                category_sales = df.groupby('productCategory')['totalAmount'].sum().reset_index()
                category_sales_data = [
                    {"name": row['productCategory'], "value": float(row['totalAmount'])}
                    for _, row in category_sales.iterrows()
                ]
                
                visualizations.append({
                    "id": 2,
                    "title": "Sales by Product Category",
                    "type": "bar",
                    "description": "Distribution of sales across product categories",
                    "data": category_sales_data,
                    "xAxis": {"dataKey": "name", "label": "Category"},
                    "yAxis": {"label": "Sales ($)"},
                    "series": [{"dataKey": "value", "name": "Sales", "color": "#82ca9d"}]
                })
                
                visualizations.append({
                    "id": 3,
                    "title": "Product Category Distribution",
                    "type": "pie",
                    "description": "Proportion of sales by product category",
                    "data": category_sales_data,
                    "dataKey": "value",
                    "nameKey": "name",
                    "colors": ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]
                })
    
    # Add default visualizations if domain-specific ones couldn't be generated
    if not visualizations:
        # Try to create visualizations based on available numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) >= 2:
            # Simple scatter plot of two numeric columns
            x_col = numeric_cols[0]
            y_col = numeric_cols[1]
            
            scatter_data = [
                {"x": float(row[x_col]), "y": float(row[y_col])}
                for _, row in df.head(100).iterrows()
            ]
            
            visualizations.append({
                "id": 1,
                "title": f"{x_col} vs {y_col}",
                "type": "scatter",
                "description": f"Relationship between {x_col} and {y_col}",
                "data": scatter_data,
                "xAxis": {"dataKey": "x", "label": x_col},
                "yAxis": {"label": y_col},
                "series": [{"dataKey": "y", "name": y_col, "color": "#8884d8"}]
            })
    
    return visualizations
