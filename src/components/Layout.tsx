import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ToolDetail from './ToolDetail';
import MobileNav from './MobileNav';

export default function Layout() {
  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>
      <ToolDetail />
      <MobileNav />
    </div>
  );
}
