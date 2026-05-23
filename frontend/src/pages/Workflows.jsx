import { useState, useEffect } from 'react';
import { Workflow as WorkflowIcon, Play, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { getDocuments, getWorkflows, createWorkflow } from '../api';
import toast from 'react-hot-toast';

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [workflowName, setWorkflowName] = useState('');
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [wfs, docs] = await Promise.all([getWorkflows(), getDocuments()]);
      setWorkflows(wfs);
      setDocuments(docs);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRunWorkflow = async () => {
    if (!selectedDoc) {
      toast.error('Please select a document');
      return;
    }
    const name = workflowName || `Workflow - ${new Date().toLocaleString()}`;
    setRunning(true);
    try {
      await createWorkflow(name, parseInt(selectedDoc));
      toast.success('Workflow completed!');
      setWorkflowName('');
      setSelectedDoc('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Workflow failed');
    } finally {
      setRunning(false);
    }
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'failed': return <XCircle size={16} className="text-red-500" />;
      case 'processing': return <Loader2 size={16} className="text-blue-500 animate-spin" />;
      default: return <WorkflowIcon size={16} className="text-gray-400" />;
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
        <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
        <p className="text-gray-500 mt-1">Run complete AI analysis pipelines on your documents</p>
      </div>

      {/* Create Workflow */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">New Workflow</h2>
        <p className="text-sm text-gray-500 mb-4">
          A workflow runs all 5 analysis types (Summary, Sentiment, Key Points, Entities, Full Analysis) automatically.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Workflow name (optional)"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={selectedDoc}
            onChange={(e) => setSelectedDoc(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a document...</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.original_name}
              </option>
            ))}
          </select>
          <button
            onClick={handleRunWorkflow}
            disabled={running || !selectedDoc}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play size={16} />
                Run Workflow
              </>
            )}
          </button>
        </div>
      </div>

      {/* Workflow History */}
      {workflows.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <WorkflowIcon size={48} className="mx-auto mb-4 opacity-50" />
          <p>No workflows yet. Run one above!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Progress</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workflows.map((wf) => (
                <tr key={wf.id} className="hover:bg-gray-50">
                  <td className="p-4">{statusIcon(wf.status)}</td>
                  <td className="p-4">
                    <p className="font-medium">{wf.name}</p>
                    {wf.description && (
                      <p className="text-sm text-gray-400">{wf.description}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${(wf.steps_completed / wf.total_steps) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {wf.steps_completed}/{wf.total_steps}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(wf.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
