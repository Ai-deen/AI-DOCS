import { useState, useEffect } from 'react';
import {
  Workflow as WorkflowIcon,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  BookOpen,
  BarChart3,
  Layers,
} from 'lucide-react';
import { getDocuments, getWorkflows, createWorkflow, getDocumentAnalyses, generateFlashcards, getFlashcards } from '../api';
import FlashCard from '../components/FlashCard';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'analysis', label: 'Workflow Analysis', icon: BarChart3 },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
];

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [workflowName, setWorkflowName] = useState('');
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  // Detail view state
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [activeTab, setActiveTab] = useState('analysis');
  const [analyses, setAnalyses] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [flashcardsProgress, setFlashcardsProgress] = useState(0);
  const [flashcardsProgressText, setFlashcardsProgressText] = useState('');
  const [analysesLoading, setAnalysesLoading] = useState(false);

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
      const wf = await createWorkflow(name, parseInt(selectedDoc));
      toast.success('Workflow completed!');
      setWorkflowName('');
      setSelectedDoc('');
      loadData();
      handleSelectWorkflow(wf);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Workflow failed');
    } finally {
      setRunning(false);
    }
  };

  const handleSelectWorkflow = async (wf) => {
    setSelectedWorkflow(wf);
    setActiveTab('analysis');
    setAnalyses([]);
    setFlashcards([]);

    // Load analyses for the workflow's document
    if (wf.document_id) {
      setAnalysesLoading(true);
      try {
        const data = await getDocumentAnalyses(wf.document_id);
        setAnalyses(data);
      } catch (err) {
        toast.error('Failed to load analyses');
      } finally {
        setAnalysesLoading(false);
      }
    }

    // Load existing flashcards
    try {
      const cards = await getFlashcards(wf.id);
      setFlashcards(cards);
    } catch (err) {
      // No flashcards yet, that's fine
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!selectedWorkflow) return;
    setFlashcardsLoading(true);
    setFlashcardsProgress(0);
    setFlashcardsProgressText('Preparing document...');

    // Simulate progress stages while waiting for AI generation
    const progressSteps = [
      { progress: 15, text: 'Analyzing document content...' },
      { progress: 35, text: 'Identifying key concepts...' },
      { progress: 55, text: 'Generating Q&A pairs...' },
      { progress: 75, text: 'Refining flashcards...' },
      { progress: 90, text: 'Finalizing cards...' },
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setFlashcardsProgress(progressSteps[stepIndex].progress);
        setFlashcardsProgressText(progressSteps[stepIndex].text);
        stepIndex++;
      }
    }, 2000);

    try {
      const cards = await generateFlashcards(selectedWorkflow.id);
      clearInterval(progressInterval);
      setFlashcardsProgress(100);
      setFlashcardsProgressText('Complete!');
      // Brief pause to show 100% before showing cards
      await new Promise((resolve) => setTimeout(resolve, 500));
      setFlashcards(cards);
      toast.success(`${cards.length} flashcards generated!`);
    } catch (err) {
      clearInterval(progressInterval);
      toast.error(err.response?.data?.detail || 'Failed to generate flashcards');
    } finally {
      setFlashcardsLoading(false);
      setFlashcardsProgress(0);
      setFlashcardsProgressText('');
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

  const getStepStatus = (type) => {
    const analysis = analyses.find((a) => a.analysis_type === type);
    if (!analysis) return 'pending';
    return analysis.status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Detail view with tabs
  if (selectedWorkflow) {
    const steps = ['summary', 'sentiment', 'key_points', 'entities', 'full_analysis'];
    const completedSteps = steps.filter((s) => getStepStatus(s) === 'completed').length;
    const flashcardsStatus = flashcards.length > 0 ? 'Done' : flashcardsLoading ? 'In Progress' : 'Not Started';

    return (
      <div>
        {/* Back button */}
        <button
          onClick={() => setSelectedWorkflow(null)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 flex items-center gap-1"
        >
          ← Back to Workflows
        </button>

        {/* Header & Status Tracker */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedWorkflow.name}</h1>
              {selectedWorkflow.description && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{selectedWorkflow.description}</p>
              )}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedWorkflow.status === 'completed'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : selectedWorkflow.status === 'processing'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : selectedWorkflow.status === 'failed'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {selectedWorkflow.status.charAt(0).toUpperCase() + selectedWorkflow.status.slice(1)}
            </span>
          </div>

          {/* Progress Checklist */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-300">
            <span className="flex items-center gap-1">
              {completedSteps === steps.length ? (
                <CheckCircle size={14} className="text-green-500" />
              ) : (
                <Loader2 size={14} className="text-blue-500 animate-spin" />
              )}
              Analysis: {completedSteps}/{steps.length} Done
            </span>
            <span className="flex items-center gap-1">
              {flashcardsStatus === 'Done' ? (
                <CheckCircle size={14} className="text-green-500" />
              ) : flashcardsStatus === 'In Progress' ? (
                <Loader2 size={14} className="text-blue-500 animate-spin" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600 inline-block" />
              )}
              Flashcards: {flashcardsStatus}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'analysis' && (
          <div className="space-y-4">
            {analysesLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={24} className="animate-spin text-purple-600" />
              </div>
            ) : analyses.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No analyses available yet.</p>
            ) : (
              analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                      {analysis.analysis_type.replace('_', ' ')}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      {statusIcon(analysis.status)}
                      <span className="text-gray-500 dark:text-gray-400">
                        {analysis.processing_time
                          ? `${analysis.processing_time.toFixed(1)}s`
                          : ''}
                      </span>
                    </div>
                  </div>
                  {analysis.result && (
                    <div className="prose prose-sm dark:prose-invert max-w-none markdown-content text-gray-700 dark:text-gray-300">
                      <ReactMarkdown>{analysis.result}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div>
            {flashcards.length === 0 && !flashcardsLoading && (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No flashcards yet. Generate Q&A cards from this document.
                </p>
                <button
                  onClick={handleGenerateFlashcards}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Generate Flashcards
                </button>
              </div>
            )}

            {flashcardsLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                {/* Progress bar */}
                <div className="w-full max-w-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {flashcardsProgressText}
                    </p>
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      {flashcardsProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${flashcardsProgress}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  AI is reading your document and creating Q&A cards...
                </p>
              </div>
            )}

            {flashcards.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {flashcards.length} cards — click a card to flip it
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {flashcards.map((card) => (
                    <FlashCard
                      key={card.id}
                      question={card.question}
                      answer={card.answer}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workflows</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Run complete AI analysis pipelines on your documents</p>
      </div>

      {/* Create Workflow */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold dark:text-white mb-4">New Workflow</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          A workflow runs all 5 analysis types (Summary, Sentiment, Key Points, Entities, Full Analysis) and generates flashcards automatically.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Workflow name (optional)"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={selectedDoc}
            onChange={(e) => setSelectedDoc(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-300">Name</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-300">Progress</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-300">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {workflows.map((wf) => (
                <tr
                  key={wf.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSelectWorkflow(wf)}
                >
                  <td className="p-4">{statusIcon(wf.status)}</td>
                  <td className="p-4">
                    <p className="font-medium dark:text-gray-100">{wf.name}</p>
                    {wf.description && (
                      <p className="text-sm text-gray-400">{wf.description}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 max-w-[100px]">
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
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
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
