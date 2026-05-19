import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import ToolWorkspace from '@/pages/ToolWorkspace';

const Market = React.lazy(() => import('@/pages/Market'));
const Developer = React.lazy(() => import('@/pages/Developer'));

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/tool/:id" element={<ToolWorkspace />} />
            <Route path="/market" element={<Suspense><Market /></Suspense>} />
            <Route path="/developer" element={<Suspense><Developer /></Suspense>} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}
