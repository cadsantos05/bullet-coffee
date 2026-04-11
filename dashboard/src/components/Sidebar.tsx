'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/orders', label: 'Orders', icon: '📋' },
  { href: '/menu', label: 'Menu', icon: '☕' },
  { href: '/customers', label: 'Customers', icon: '👥' },
  { href: '/rewards', label: 'Rewards', icon: '⭐' },
  { href: '/promotions', label: 'Promotions', icon: '🏷️' },
  { href: '/reports', label: 'Reports', icon: '📈' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  function handleLogout() {
    localStorage.removeItem('admin');
    window.location.href = '/login';
  }

  return (
    <aside className="w-[250px] bg-[#0A0A0A] text-white flex flex-col min-h-screen fixed left-0 top-0 bottom-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">
            ☕
          </div>
          <div>
            <h1 className="font-bold text-sm text-white">Bullet Coffee Co.</h1>
            <p className="text-[10px] text-white/40">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors w-full"
        >
          <span className="text-base">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
