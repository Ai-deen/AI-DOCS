import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Workflow, MessageSquare } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/workflows', label: 'Workflows', icon: Workflow },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-900 to-indigo-900 text-white flex flex-col">
        <div className="p-6 border-b border-blue-700">
          <h1 className="text-xl font-bold">🧠 AI Analyzer</h1>
          <p className="text-blue-300 text-sm mt-1">Document Workflow</p>
        </div>
        <nav className="flex-1 p-4">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                location.pathname === path
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-700 text-xs text-blue-300">
          Microsoft AI Hackathon 2025
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
