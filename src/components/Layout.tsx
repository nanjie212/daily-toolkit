import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import ToolDetail from './ToolDetail';
import MobileNav from './MobileNav';

export default function Layout() {
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const savedScroll = sessionStorage.getItem('main-scroll');
    if (savedScroll) {
      requestAnimationFrame(() => {
        main.scrollTop = parseInt(savedScroll, 10);
      });
    }

    const handleScroll = () => {
      sessionStorage.setItem('main-scroll', String(main.scrollTop));
    };

    main.addEventListener('scroll', handleScroll, { passive: true });
    return () => main.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0">
        <Outlet />
      </main>
      <ToolDetail />
      <MobileNav />
    </div>
  );
}
