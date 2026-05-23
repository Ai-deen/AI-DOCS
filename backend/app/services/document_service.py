import os
import uuid
import aiofiles
from PyPDF2 import PdfReader
from docx import Document as DocxDocument
from ..config import settings


async def save_upload_file(file) -> dict:
    """Save uploaded file and return file info."""
    os.makedirs(settings.upload_dir, exist_ok=True)

    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.upload_dir, unique_name)

    # Save file
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    return {
        "filename": unique_name,
        "original_name": file.filename,
        "file_path": file_path,
        "file_size": len(content),
        "file_type": ext.lower().strip(".")
    }


async def extract_text(file_path: str, file_type: str) -> str:
    """Extract text content from various file types."""
    try:
        if file_type == "pdf":
            return extract_pdf_text(file_path)
        elif file_type in ("docx", "doc"):
            return extract_docx_text(file_path)
        elif file_type in ("txt", "md", "csv", "json", "xml", "html"):
            async with aiofiles.open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return await f.read()
        else:
            return f"[Unsupported file type: {file_type}]"
    except Exception as e:
        return f"[Error extracting text: {str(e)}]"


def extract_pdf_text(file_path: str) -> str:
    """Extract text from PDF file."""
    reader = PdfReader(file_path)
    text_parts = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_parts.append(text)
    return "\n\n".join(text_parts)


def extract_docx_text(file_path: str) -> str:
    """Extract text from DOCX file."""
    doc = DocxDocument(file_path)
    text_parts = []
    for paragraph in doc.paragraphs:
        if paragraph.text.strip():
            text_parts.append(paragraph.text)
    return "\n\n".join(text_parts)
