'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee, Menu, X, ArrowRight } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/about', label: 'About' },
  { href: '/rewards', label: 'Rewards' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]'
          : 'bg-white'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-base font-bold tracking-[0.15em] text-black uppercase">
            <Coffee className="w-5 h-5" />
            Bullet Coffee
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[13px] font-medium tracking-wide transition-colors duration-300 ${
                  pathname === link.href
                    ? 'text-black'
                    : 'text-gray-400 hover:text-black'
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="block h-[1.5px] w-full bg-[#8B7355] mt-0.5 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-4">
            <Link
              href="/menu"
              className="hidden sm:inline-flex items-center rounded-full bg-black px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#8B7355] transition-colors duration-300"
            >
              Order Now
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-5 h-5 text-black" />
              ) : (
                <Menu className="w-5 h-5 text-black" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-50 animate-fade-in">
          <div className="px-6 py-6 flex flex-col gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`text-sm font-medium tracking-wide ${
                  pathname === link.href ? 'text-black' : 'text-gray-400'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/menu"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white mt-2"
            >
              Order Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
