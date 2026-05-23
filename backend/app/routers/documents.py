import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Document
from ..schemas import DocumentResponse
from ..services.document_service import save_upload_file, extract_text
from ..config import settings

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a document for analysis."""
    # Validate file size
    content = await file.read()
    if len(content) > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")
    await file.seek(0)

    # Validate file type
    allowed_types = {"pdf", "txt", "docx", "doc", "md", "csv", "json", "xml", "html"}
    ext = os.path.splitext(file.filename)[1].lower().strip(".")
    if ext not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not supported. Allowed: {', '.join(allowed_types)}"
        )

    # Save file
    file_info = await save_upload_file(file)

    # Extract text content
    text_content = await extract_text(file_info["file_path"], file_info["file_type"])

    # Create DB record
    doc = Document(
        filename=file_info["filename"],
        original_name=file_info["original_name"],
        file_type=file_info["file_type"],
        file_size=file_info["file_size"],
        content=text_content,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return doc


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(db: Session = Depends(get_db)):
    """List all uploaded documents."""
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    return docs


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: int, db: Session = Depends(get_db)):
    """Get a specific document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{document_id}")
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Delete a document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file
    file_path = os.path.join(settings.upload_dir, doc.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}
