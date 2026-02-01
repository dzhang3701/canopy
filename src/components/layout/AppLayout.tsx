import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen flex bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
