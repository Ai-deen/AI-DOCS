import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Documents
export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getDocuments = async () => {
  const response = await api.get('/documents/');
  return response.data;
};

export const getDocument = async (id) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

// Analysis
export const runAnalysis = async (documentId, analysisType) => {
  const response = await api.post('/analysis/', {
    document_id: documentId,
    analysis_type: analysisType,
  });
  return response.data;
};

export const getDocumentAnalyses = async (documentId) => {
  const response = await api.get(`/analysis/document/${documentId}`);
  return response.data;
};

// Workflows
export const createWorkflow = async (name, documentId, description) => {
  const response = await api.post('/workflows/', {
    name,
    document_id: documentId,
    description,
  });
  return response.data;
};

export const getWorkflows = async () => {
  const response = await api.get('/workflows/');
  return response.data;
};

export const getWorkflow = async (id) => {
  const response = await api.get(`/workflows/${id}`);
  return response.data;
};

// Chat
export const sendChatMessage = async (message, documentId = null) => {
  const response = await api.post('/chat/', {
    message,
    document_id: documentId,
  });
  return response.data;
};

// Health
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
