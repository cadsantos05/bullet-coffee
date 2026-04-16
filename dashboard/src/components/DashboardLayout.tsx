'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const admin = localStorage.getItem('admin');
    if (!admin) {
      router.push('/login');
    } else {
      setIsLoggedIn(true);
    }
    setChecking(false);
  }, [router]);

  if (checking || !isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111111]">
        <div className="text-white/40 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-[#0A0A0A] border-b border-white/10 flex items-center gap-3 px-4 py-3 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white p-1"
          aria-label="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
        <span className="text-white font-bold text-sm">Bullet Coffee</span>
      </div>

      <main className="flex-1 ml-0 md:ml-[250px] p-4 md:p-8 pt-16 md:pt-8 bg-[#111111]">
        {children}
      </main>
    </div>
  );
}
