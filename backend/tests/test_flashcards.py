"""Tests for KAN-8: Flashcard generation feature."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app import app
from app.database import Base, engine, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///./test.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


def _upload_doc():
    """Helper: upload a test document."""
    files = {"file": ("test.txt", b"Machine learning is AI. Neural networks learn patterns.", "text/plain")}
    r = client.post("/api/documents/upload", files=files)
    assert r.status_code == 200
    return r.json()["id"]


def _create_workflow(doc_id):
    """Helper: create a workflow."""
    r = client.post("/api/workflows/", json={"name": "Test WF", "document_id": doc_id})
    assert r.status_code == 200
    return r.json()["id"]


class TestFlashcardEndpoints:
    """Test the flashcard API endpoints."""

    def test_get_flashcards_empty(self):
        """GET flashcards returns empty list when none generated."""
        doc_id = _upload_doc()
        wf_id = _create_workflow(doc_id)
        r = client.get(f"/api/workflows/{wf_id}/flashcards")
        assert r.status_code == 200
        assert r.json() == []

    def test_get_flashcards_404(self):
        """GET flashcards returns 404 for non-existent workflow."""
        r = client.get("/api/workflows/9999/flashcards")
        assert r.status_code == 404

    def test_post_flashcards_404(self):
        """POST flashcards returns 404 for non-existent workflow."""
        r = client.post("/api/workflows/9999/flashcards")
        assert r.status_code == 404

    @patch("app.routers.workflows.generate_flashcards")
    def test_generate_flashcards_success(self, mock_gen):
        """POST flashcards generates and returns cards."""
        mock_gen.return_value = [
            {"question": "What is ML?", "answer": "A subset of AI."},
            {"question": "What are neural networks?", "answer": "Systems that learn patterns."},
        ]
        doc_id = _upload_doc()
        wf_id = _create_workflow(doc_id)

        r = client.post(f"/api/workflows/{wf_id}/flashcards")
        assert r.status_code == 200
        cards = r.json()
        assert len(cards) == 2
        assert cards[0]["question"] == "What is ML?"
        assert cards[0]["answer"] == "A subset of AI."
        assert "id" in cards[0]
        assert "created_at" in cards[0]
        assert cards[0]["workflow_id"] == wf_id

    @patch("app.routers.workflows.generate_flashcards")
    def test_generate_flashcards_idempotent(self, mock_gen):
        """POST flashcards returns existing cards on second call (no re-generation)."""
        mock_gen.return_value = [
            {"question": "Q1", "answer": "A1"},
        ]
        doc_id = _upload_doc()
        wf_id = _create_workflow(doc_id)

        r1 = client.post(f"/api/workflows/{wf_id}/flashcards")
        r2 = client.post(f"/api/workflows/{wf_id}/flashcards")
        assert r1.json()[0]["id"] == r2.json()[0]["id"]
        # AI should only be called once
        assert mock_gen.call_count == 1

    @patch("app.routers.workflows.generate_flashcards")
    def test_generate_flashcards_ai_error(self, mock_gen):
        """POST flashcards returns 502 when AI service fails."""
        mock_gen.side_effect = RuntimeError("AI service error: rate limit")
        doc_id = _upload_doc()
        wf_id = _create_workflow(doc_id)

        r = client.post(f"/api/workflows/{wf_id}/flashcards")
        assert r.status_code == 502

    def test_workflow_schema_has_required_fields(self):
        """Workflow response includes all required fields."""
        doc_id = _upload_doc()
        r = client.post("/api/workflows/", json={"name": "Schema Test", "document_id": doc_id})
        wf = r.json()
        for field in ["id", "name", "status", "document_id", "steps_completed", "total_steps", "created_at"]:
            assert field in wf, f"Missing field: {field}"


class TestHealthAndRegression:
    """Verify existing endpoints still work (no regressions)."""

    def test_health(self):
        r = client.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"

    def test_upload_document(self):
        doc_id = _upload_doc()
        assert isinstance(doc_id, int)

    def test_list_documents(self):
        _upload_doc()
        r = client.get("/api/documents/")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_list_workflows(self):
        r = client.get("/api/workflows/")
        assert r.status_code == 200

    def test_create_workflow(self):
        doc_id = _upload_doc()
        wf_id = _create_workflow(doc_id)
        assert isinstance(wf_id, int)
