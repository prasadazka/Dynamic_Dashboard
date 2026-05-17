import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple, Optional

def preprocess_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Preprocess the dataframe by cleaning data, handling missing values,
    and converting data types as needed
    
    Args:
        df: Input DataFrame
        
    Returns:
        pd.DataFrame: Preprocessed DataFrame
    """
    # Make a copy to avoid modifying the original
    df_processed = df.copy()
    
    # Convert date columns to datetime
    date_columns = []
    for col in df_processed.columns:
        if 'date' in col.lower() or 'time' in col.lower():
            try:
                df_processed[col] = pd.to_datetime(df_processed[col], errors='coerce')
                date_columns.append(col)
            except:
                pass
    
    # Handle numeric columns
    numeric_columns = df_processed.select_dtypes(include=[np.number]).columns
    for col in numeric_columns:
        # Replace infinite values with NaN
        df_processed[col] = df_processed[col].replace([np.inf, -np.inf], np.nan)
        
        # Fill missing values with median for numeric columns
        median_value = df_processed[col].median()
        df_processed[col] = df_processed[col].fillna(median_value)
    
    # Handle categorical columns
    categorical_columns = df_processed.select_dtypes(include=['object']).columns
    for col in categorical_columns:
        if col not in date_columns:
            # Fill missing values with most common value
            most_common = df_processed[col].mode()[0] if not df_processed[col].mode().empty else "Unknown"
            df_processed[col] = df_processed[col].fillna(most_common)
    
    return df_processed

def detect_outliers(df: pd.DataFrame, column: str, method: str = 'iqr') -> List[int]:
    """
    Detect outliers in a specific column
    
    Args:
        df: Input DataFrame
        column: Column name to check for outliers
        method: Method to use for outlier detection ('iqr' or 'zscore')
        
    Returns:
        List[int]: Indices of outliers
    """
    if method == 'iqr':
        # IQR method
        Q1 = df[column].quantile(0.25)
        Q3 = df[column].quantile(0.75)
        IQR = Q3 - Q1
        
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        return df[(df[column] < lower_bound) | (df[column] > upper_bound)].index.tolist()
    
    elif method == 'zscore':
        # Z-score method
        from scipy import stats
        z_scores = np.abs(stats.zscore(df[column]))
        return df[z_scores > 3].index.tolist()
    
    else:
        raise ValueError(f"Unknown method: {method}. Use 'iqr' or 'zscore'.")
