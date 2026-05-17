import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

def generate_statistics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Generate descriptive statistics for each column in the dataframe
    
    Args:
        df: Input DataFrame
        
    Returns:
        Dict[str, Any]: Descriptive statistics for each column
    """
    stats = {}
    
    # Numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        stats[col] = {
            'min': df[col].min(),
            'max': df[col].max(),
            'mean': df[col].mean(),
            'median': df[col].median(),
            'std': df[col].std(),
            'missing': df[col].isna().sum(),
            'type': 'numeric'
        }
    
    # Categorical columns
    categorical_cols = df.select_dtypes(include=['object']).columns
    for col in categorical_cols:
        value_counts = df[col].value_counts().to_dict()
        stats[col] = {
            'unique_values': df[col].nunique(),
            'most_common': df[col].mode()[0] if not df[col].mode().empty else None,
            'most_common_count': df[col].value_counts().iloc[0] if not df[col].value_counts().empty else 0,
            'value_distribution': value_counts,
            'missing': df[col].isna().sum(),
            'type': 'categorical'
        }
    
    # Date columns
    date_cols = df.select_dtypes(include=['datetime64']).columns
    for col in date_cols:
        stats[col] = {
            'min': df[col].min(),
            'max': df[col].max(),
            'range_days': (df[col].max() - df[col].min()).days if not pd.isna(df[col].min()) and not pd.isna(df[col].max()) else None,
            'missing': df[col].isna().sum(),
            'type': 'datetime'
        }
    
    # Dataset-level statistics
    stats['__dataset__'] = {
        'num_rows': len(df),
        'num_columns': len(df.columns),
        'num_numeric_columns': len(numeric_cols),
        'num_categorical_columns': len(categorical_cols),
        'num_date_columns': len(date_cols),
        'memory_usage': df.memory_usage(deep=True).sum()
    }
    
    return stats
