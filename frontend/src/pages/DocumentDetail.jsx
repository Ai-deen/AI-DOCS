import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, Loader2 } from 'lucide-react';
import { getDocument, runAnalysis, getDocumentAnalyses } from '../api';
import AnalysisCard from '../components/AnalysisCard';
import toast from 'react-hot-toast';

const ANALYSIS_TYPES = [
  { id: 'summary', label: '📝 Summary', desc: 'Get a concise overview' },
  { id: 'sentiment', label: '💭 Sentiment', desc: 'Analyze tone & emotion' },
  { id: 'key_points', label: '🎯 Key Points', desc: 'Extract main arguments' },
  { id: 'entities', label: '🏷️ Entities', desc: 'Find people, orgs, dates' },
  { id: 'full_analysis', label: '🔍 Full Analysis', desc: 'Complete deep-dive' },
];

export default function DocumentDetail() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningType, setRunningType] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [doc, docAnalyses] = await Promise.all([
        getDocument(id),
        getDocumentAnalyses(id),
      ]);
      setDocument(doc);
      setAnalyses(docAnalyses);
    } catch (err) {
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async (type) => {
    setRunningType(type);
    try {
      await runAnalysis(id, type);
      toast.success('Analysis complete!');
      const updated = await getDocumentAnalyses(id);
      setAnalyses(updated);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed');
    } finally {
      setRunningType(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!document) {
    return <p className="text-gray-500">Document not found.</p>;
  }

  return (
    <div>
      <Link to="/documents" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft size={16} />
        Back to Documents
      </Link>

      {/* Document Info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{document.original_name}</h1>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>Type: <strong>{document.file_type.toUpperCase()}</strong></span>
          <span>Size: <strong>{(document.file_size / 1024).toFixed(1)} KB</strong></span>
          <span>Uploaded: <strong>{new Date(document.uploaded_at).toLocaleString()}</strong></span>
        </div>
        {document.content && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-48 overflow-auto">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {document.content.slice(0, 1000)}
              {document.content.length > 1000 && '...'}
            </p>
          </div>
        )}
      </div>

      {/* Analysis Buttons */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Run AI Analysis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ANALYSIS_TYPES.map(({ id: type, label, desc }) => (
            <button
              key={type}
              onClick={() => handleRunAnalysis(type)}
              disabled={runningType !== null}
              className={`p-3 rounded-lg border text-left transition-all ${
                runningType === type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              } disabled:opacity-50`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{label}</span>
                {runningType === type ? (
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                ) : (
                  <Play size={14} className="text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-500">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {analyses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Analysis Results</h2>
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <AnalysisCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
