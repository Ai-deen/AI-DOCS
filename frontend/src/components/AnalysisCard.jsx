import ReactMarkdown from 'react-markdown';
import { Clock, BarChart3 } from 'lucide-react';

export default function AnalysisCard({ analysis }) {
  const typeLabels = {
    summary: '📝 Summary',
    sentiment: '💭 Sentiment',
    key_points: '🎯 Key Points',
    entities: '🏷️ Entities',
    full_analysis: '🔍 Full Analysis',
  };

  const statusColors = {
    completed: 'bg-green-100 text-green-800',
    processing: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-lg">
          {typeLabels[analysis.analysis_type] || analysis.analysis_type}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[analysis.status]}`}>
          {analysis.status}
        </span>
      </div>

      <div className="p-4">
        {analysis.result ? (
          <div className="markdown-content prose prose-sm max-w-none">
            <ReactMarkdown>{analysis.result}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-gray-400 italic">No results yet</p>
        )}
      </div>

      <div className="px-4 py-3 bg-gray-50 flex items-center gap-4 text-sm text-gray-500">
        {analysis.processing_time && (
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {analysis.processing_time.toFixed(2)}s
          </span>
        )}
        {analysis.confidence_score && (
          <span className="flex items-center gap-1">
            <BarChart3 size={14} />
            {(analysis.confidence_score * 100).toFixed(0)}% confidence
          </span>
        )}
      </div>
    </div>
  );
}
