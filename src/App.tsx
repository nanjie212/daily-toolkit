import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import ToolWorkspace from '@/pages/ToolWorkspace';
import NotFound from '@/pages/NotFound';
import LoadingSpinner from '@/components/LoadingSpinner';

const Market = React.lazy(() => import('@/pages/Market'));
const Developer = React.lazy(() => import('@/pages/Developer'));
const Community = React.lazy(() => import('@/pages/Community'));
const About = React.lazy(() => import('@/pages/About'));

/**
 * 懒加载页面的加载占位。
 *
 * LoadingSpinner 本身只有 `py-8` 的内边距，直接当整页 fallback 会贴在顶部；
 * 这里包一层撑高的居中容器，让分包加载期间的视觉重心和真实页面一致。
 */
function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
      <LoadingSpinner size="lg" text="加载中…" />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/tool/:id" element={<ToolWorkspace />} />
            <Route
              path="/market"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Market />
                </Suspense>
              }
            />
            <Route
              path="/developer"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Developer />
                </Suspense>
              }
            />
            <Route
              path="/community"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Community />
                </Suspense>
              }
            />
            <Route
              path="/about"
              element={
                <Suspense fallback={<PageFallback />}>
                  <About />
                </Suspense>
              }
            />
            {/* 兜底路由：任何未匹配的地址都在 Layout 内渲染 404 页，避免整页白屏 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}
