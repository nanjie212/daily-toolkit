import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import ToolWorkspace from '@/pages/ToolWorkspace';
import Market from '@/pages/Market';
import Developer from '@/pages/Developer';

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/tool/:id" element={<ToolWorkspace />} />
            <Route path="/market" element={<Market />} />
            <Route path="/developer" element={<Developer />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}
