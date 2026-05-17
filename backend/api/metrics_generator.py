import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional

def generate_metrics(df: pd.DataFrame, domain: str) -> List[Dict[str, Any]]:
    """
    Generates domain-specific metrics based on the dataset
    
    Args:
        df: Input DataFrame containing the data
        domain: Detected domain of the dataset
        
    Returns:
        List[Dict[str, Any]]: List of domain-specific metrics
    """
    metrics = []
    
    # Generic metrics that apply to most domains
    total_rows = len(df)
    metrics.append({
        "id": 1,
        "name": "Total Records",
        "value": f"{total_rows:,}",
        "change": "+0%",
        "isPositive": True,
        "description": "Total number of records in the dataset"
    })
    
    # Domain-specific metrics
    if domain == "Retail":
        # Check if necessary columns exist
        if 'totalAmount' in df.columns:
            total_revenue = df['totalAmount'].sum()
            metrics.append({
                "id": 2,
                "name": "Total Revenue",
                "value": f"${total_revenue:,.2f}",
                "change": "+12.5%",  # This would be calculated in a real implementation
                "isPositive": True,
                "description": "Sum of all sales revenue"
            })
            
            avg_order_value = df['totalAmount'].mean()
            metrics.append({
                "id": 3,
                "name": "Average Order Value",
                "value": f"${avg_order_value:.2f}",
                "change": "+3.7%",  # This would be calculated in a real implementation
                "isPositive": True,
                "description": "Average amount spent per transaction"
            })
        
        if 'quantity' in df.columns:
            total_units_sold = df['quantity'].sum()
            metrics.append({
                "id": 4,
                "name": "Total Units Sold",
                "value": f"{total_units_sold:,}",
                "change": "+8.2%",  # This would be calculated in a real implementation
                "isPositive": True,
                "description": "Total number of items sold"
            })
            
    elif domain == "Finance":
        # Finance-specific metrics would be implemented here
        pass
    
    elif domain == "Healthcare":
        # Healthcare-specific metrics would be implemented here
        pass
    
    # Default metrics if domain-specific ones couldn't be generated
    if len(metrics) < 3:
        if df.select_dtypes(include=[np.number]).columns.any():
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            for i, col in enumerate(numeric_cols[:3]):
                avg_value = df[col].mean()
                metrics.append({
                    "id": len(metrics) + 1,
                    "name": f"Average {col}",
                    "value": f"{avg_value:.2f}",
                    "change": "+0%",
                    "isPositive": True,
                    "description": f"Average value of {col}"
                })
    
    return metrics
