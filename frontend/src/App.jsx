import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentDetail from './pages/DocumentDetail';
import Workflows from './pages/Workflows';
import Chat from './pages/Chat';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/documents/:id" element={<DocumentDetail />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
