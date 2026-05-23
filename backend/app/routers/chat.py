from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Document
from ..schemas import ChatRequest, ChatResponse
from ..services.ai_service import chat_with_document

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Chat with AI about a document or ask general questions."""
    document_content = None

    if request.document_id:
        doc = db.query(Document).filter(Document.id == request.document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        document_content = doc.content

    response = await chat_with_document(request.message, document_content)

    return ChatResponse(
        response=response,
        document_context=f"Document: {doc.original_name}" if request.document_id and doc else None
    )
