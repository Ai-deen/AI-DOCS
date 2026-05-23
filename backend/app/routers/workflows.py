from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import Document, Workflow, Analysis
from ..schemas import WorkflowCreate, WorkflowResponse
from ..services.ai_service import analyze_document

router = APIRouter(prefix="/workflows", tags=["workflows"])

WORKFLOW_STEPS = ["summary", "sentiment", "key_points", "entities", "full_analysis"]


@router.post("/", response_model=WorkflowResponse)
async def create_workflow(request: WorkflowCreate, db: Session = Depends(get_db)):
    """Create and run a full analysis workflow on a document."""
    doc = db.query(Document).filter(Document.id == request.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not doc.content:
        raise HTTPException(status_code=400, detail="Document has no extractable content")

    # Create workflow
    workflow = Workflow(
        name=request.name,
        description=request.description or f"Full analysis of {doc.original_name}",
        status="processing",
        document_id=request.document_id,
        total_steps=len(WORKFLOW_STEPS),
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)

    # Run each analysis step
    results = []
    for i, step in enumerate(WORKFLOW_STEPS):
        result = await analyze_document(doc.content, step)

        analysis = Analysis(
            document_id=request.document_id,
            analysis_type=step,
            status=result["status"],
            result=result["result"],
            confidence_score=result["confidence_score"],
            processing_time=result["processing_time"],
            completed_at=datetime.utcnow(),
        )
        db.add(analysis)

        workflow.steps_completed = i + 1
        db.commit()

        results.append(f"**{step.replace('_', ' ').title()}**: {result['status']}")

    # Complete workflow
    workflow.status = "completed"
    workflow.completed_at = datetime.utcnow()
    workflow.result_summary = "\n".join(results)
    db.commit()
    db.refresh(workflow)

    return workflow


@router.get("/", response_model=List[WorkflowResponse])
async def list_workflows(db: Session = Depends(get_db)):
    """List all workflows."""
    workflows = db.query(Workflow).order_by(Workflow.created_at.desc()).all()
    return workflows


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: int, db: Session = Depends(get_db)):
    """Get a specific workflow."""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: int, db: Session = Depends(get_db)):
    """Delete a workflow."""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    db.delete(workflow)
    db.commit()
    return {"message": "Workflow deleted"}
