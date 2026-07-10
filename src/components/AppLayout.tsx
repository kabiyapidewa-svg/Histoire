import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-theme-beige">
      <Sidebar />
      <div className="md:ml-64">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
