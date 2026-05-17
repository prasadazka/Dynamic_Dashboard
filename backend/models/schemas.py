from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class FileUploadResponse(BaseModel):
    """Response model for file upload"""
    fileId: str
    filename: str
    columns: List[str]
    rowCount: int
    data: List[Dict[str, Any]]

class AnalysisRequest(BaseModel):
    """Request model for data analysis"""
    fileId: str

class Metric(BaseModel):
    """Model for a data metric"""
    id: int
    name: str
    value: str
    change: str
    isPositive: bool
    description: str

class Visualization(BaseModel):
    """Model for a data visualization"""
    id: int
    title: str
    type: str
    description: str
    data: List[Dict[str, Any]]
    xAxis: Optional[Dict[str, Any]] = None
    yAxis: Optional[Dict[str, Any]] = None
    series: Optional[List[Dict[str, Any]]] = None
    dataKey: Optional[str] = None
    nameKey: Optional[str] = None
    colors: Optional[List[str]] = None

class AnalysisResponse(BaseModel):
    """Response model for data analysis"""
    domain: str
    metrics: List[Metric]
    visualizations: List[Visualization]

class ChatRequest(BaseModel):
    """Request model for chat interaction"""
    fileId: str
    message: str

class ChatResponse(BaseModel):
    """Response model for chat interaction"""
    response: str
    statistics: Optional[Dict[str, str]] = None
    visualization: Optional[Dict[str, Any]] = None
