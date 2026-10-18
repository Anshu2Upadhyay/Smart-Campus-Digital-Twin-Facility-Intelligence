import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field

from app.models.user import UserRole
from app.routers.auth import get_current_user, require_roles
from app.services.campus_gpt_rag import campus_rag

logger = logging.getLogger("smart_campus.campus_gpt_router")

router = APIRouter(prefix="/api/v1/campusgpt", tags=["CampusGPT AI Knowledge Assistant"])


class AskQuestionRequest(BaseModel):
    question: str = Field(..., min_length=3, examples=["When are the mid-sem exams?", "What is the late fee fine?"])


@router.post("/ask")
async def ask_campus_gpt(
    payload: AskQuestionRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user),
):
    """
    CampusGPT Autonomous RAG Assistant:
    Answers student and faculty questions regarding exam schedules, fees, attendance,
    scholarships, hostel rules, and syllabus with official circular citations.
    """
    try:
        response = await campus_rag.query_knowledge_base(payload.question)
        return response
    except Exception as exc:
        logger.error(f"Error querying CampusGPT: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"CampusGPT query processing failed: {str(exc)}",
        )


@router.post("/upload-pdf")
async def upload_policy_pdf(
    file: UploadFile = File(...),
    category: str = Form("ADMINISTRATIVE_REGULATION"),
    current_user: Dict[str, Any] = Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.SECURITY_HEAD, UserRole.FACILITY_SUPERVISOR])),
):
    """
    Upload official campus PDF (Syllabus, Date Sheet, Fee Notice, Circular)
    to index into ChromaDB / Vector Memory using PyPDF.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are supported (.pdf)",
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = await campus_rag.add_pdf_document(
            file_bytes=content,
            filename=file.filename,
            category=category,
        )
        return {
            "success": True,
            "message": f"Document '{file.filename}' processed and indexed into CampusGPT knowledge base.",
            "details": result,
        }
    except Exception as exc:
        logger.error(f"Failed to process PDF: {exc}")
        raise HTTPException(status_code=500, detail=f"PDF ingestion error: {str(exc)}")


@router.get("/documents")
async def list_indexed_documents(
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user),
):
    """
    Returns list of all active official circulars/PDFs loaded in CampusGPT Vector DB.
    """
    try:
        docs = await campus_rag.get_active_documents()
        return {
            "success": True,
            "total_documents": len(docs),
            "documents": docs,
        }
    except Exception as exc:
        logger.error(f"Failed to fetch CampusGPT documents: {exc}")
        return {
            "success": True,
            "total_documents": 0,
            "documents": [],
        }

