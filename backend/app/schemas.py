from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Document schemas
class DocumentCreate(BaseModel):
    pass


class DocumentResponse(BaseModel):
    id: int
    filename: str
    original_name: str
    file_type: str
    file_size: int
    uploaded_at: datetime
    content: Optional[str] = None

    class Config:
        from_attributes = True


# Analysis schemas
class AnalysisCreate(BaseModel):
    document_id: int
    analysis_type: str


class AnalysisResponse(BaseModel):
    id: int
    document_id: int
    analysis_type: str
    status: str
    result: Optional[str] = None
    confidence_score: Optional[float] = None
    processing_time: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Workflow schemas
class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    document_id: int


class WorkflowResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: str
    document_id: Optional[int] = None
    steps_completed: int
    total_steps: int
    result_summary: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Chat schema
class ChatRequest(BaseModel):
    message: str
    document_id: Optional[int] = None


class ChatResponse(BaseModel):
    response: str
    document_context: Optional[str] = None
