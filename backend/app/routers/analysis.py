from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import Document, Analysis
from ..schemas import AnalysisCreate, AnalysisResponse
from ..services.ai_service import analyze_document

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/", response_model=AnalysisResponse)
async def create_analysis(request: AnalysisCreate, db: Session = Depends(get_db)):
    """Run AI analysis on a document."""
    # Validate document exists
    doc = db.query(Document).filter(Document.id == request.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not doc.content:
        raise HTTPException(status_code=400, detail="Document has no extractable content")

    # Validate analysis type
    valid_types = ["summary", "sentiment", "key_points", "entities", "full_analysis"]
    if request.analysis_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid analysis type. Must be one of: {', '.join(valid_types)}"
        )

    # Create analysis record
    analysis = Analysis(
        document_id=request.document_id,
        analysis_type=request.analysis_type,
        status="processing",
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # Run analysis
    result = await analyze_document(doc.content, request.analysis_type)

    # Update record
    analysis.result = result["result"]
    analysis.status = result["status"]
    analysis.confidence_score = result["confidence_score"]
    analysis.processing_time = result["processing_time"]
    analysis.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(analysis)

    return analysis


@router.get("/document/{document_id}", response_model=List[AnalysisResponse])
async def get_document_analyses(document_id: int, db: Session = Depends(get_db)):
    """Get all analyses for a document."""
    analyses = db.query(Analysis).filter(
        Analysis.document_id == document_id
    ).order_by(Analysis.created_at.desc()).all()
    return analyses


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Get a specific analysis."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis


@router.delete("/{analysis_id}")
async def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Delete an analysis."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    db.delete(analysis)
    db.commit()
    return {"message": "Analysis deleted"}
