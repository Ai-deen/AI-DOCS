import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Eye, FileText } from 'lucide-react';
import { getDocuments, uploadDocument, deleteDocument } from '../api';
import FileUpload from '../components/FileUpload';
import toast from 'react-hot-toast';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    setIsUploading(true);
    try {
      await uploadDocument(file);
      toast.success(`"${file.name}" uploaded successfully!`);
      loadDocuments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteDocument(id);
      toast.success('Document deleted');
      loadDocuments();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-500 mt-1">Upload and manage your documents for AI analysis</p>
      </div>

      <FileUpload onUpload={handleUpload} isUploading={isUploading} />

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>No documents yet. Upload one above to get started!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Name</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Size</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Uploaded</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-blue-500" />
                        <span className="font-medium">{doc.original_name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono uppercase">
                        {doc.file_type}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {(doc.file_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(doc.uploaded_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View & Analyze"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(doc.id, doc.original_name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
