import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import ToolDetail from './ToolDetail';
import MobileNav from './MobileNav';
import FooterBar from './FooterBar';

export default function Layout() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const savedScroll = sessionStorage.getItem('main-scroll');
    if (savedScroll) {
      requestAnimationFrame(() => {
        container.scrollTop = parseInt(savedScroll, 10);
      });
    }

    const handleScroll = () => {
      sessionStorage.setItem('main-scroll', String(container.scrollTop));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  return (
    <div ref={scrollRef} className="h-screen bg-bg overflow-y-auto overflow-x-hidden">
      <div className="min-h-full flex flex-col">
        <main className="flex-1 pb-16 md:pb-0">
          <Outlet />
        </main>
        <FooterBar />
      </div>
      <ToolDetail />
      <MobileNav />
    </div>
  );
}
