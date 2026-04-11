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

  // TODO: Replace localStorage auth check with server-side session validation.
  // localStorage can be manipulated by the user and is not a secure auth mechanism.
  // Recommended: use Supabase Auth with server-side middleware for route protection.
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
      <Sidebar />
      <main className="flex-1 ml-[250px] p-8 bg-[#111111]">
        {children}
      </main>
    </div>
  );
}
