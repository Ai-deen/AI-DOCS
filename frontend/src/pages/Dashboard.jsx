import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Workflow, Brain, Activity } from 'lucide-react';
import { getDocuments, getWorkflows, checkHealth } from '../api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState({ documents: 0, workflows: 0, health: null });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [docs, workflows, health] = await Promise.all([
        getDocuments(),
        getWorkflows(),
        checkHealth(),
      ]);
      setStats({
        documents: docs.length,
        workflows: workflows.length,
        health,
      });
      setRecentDocs(docs.slice(0, 5));
    } catch (err) {
      toast.error('Failed to load dashboard. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">AI-Powered Document Analysis Workflow</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FileText}
          label="Documents"
          value={stats.documents}
          color="blue"
        />
        <StatCard
          icon={Workflow}
          label="Workflows"
          value={stats.workflows}
          color="purple"
        />
        <StatCard
          icon={Brain}
          label="AI Provider"
          value={stats.health?.ai_provider || 'N/A'}
          color="green"
        />
        <StatCard
          icon={Activity}
          label="Status"
          value={stats.health ? 'Online' : 'Offline'}
          color={stats.health ? 'green' : 'red'}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/documents"
          className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-6 hover:shadow-lg transition-shadow"
        >
          <FileText size={32} className="mb-3" />
          <h3 className="text-lg font-semibold">Upload Document</h3>
          <p className="text-blue-100 text-sm mt-1">Upload PDF, DOCX, TXT files for analysis</p>
        </Link>
        <Link
          to="/workflows"
          className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-xl p-6 hover:shadow-lg transition-shadow"
        >
          <Workflow size={32} className="mb-3" />
          <h3 className="text-lg font-semibold">Run Workflow</h3>
          <p className="text-purple-100 text-sm mt-1">Full automated analysis pipeline</p>
        </Link>
        <Link
          to="/chat"
          className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-xl p-6 hover:shadow-lg transition-shadow"
        >
          <Brain size={32} className="mb-3" />
          <h3 className="text-lg font-semibold">AI Chat</h3>
          <p className="text-green-100 text-sm mt-1">Ask questions about your documents</p>
        </Link>
      </div>

      {/* Recent Documents */}
      {recentDocs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-lg">Recent Documents</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentDocs.map((doc) => (
              <Link
                key={doc.id}
                to={`/documents/${doc.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-blue-500" />
                  <div>
                    <p className="font-medium">{doc.original_name}</p>
                    <p className="text-sm text-gray-400">
                      {(doc.file_size / 1024).toFixed(1)} KB • {doc.file_type.toUpperCase()}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
