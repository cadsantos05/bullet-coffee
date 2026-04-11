'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, Camera } from 'lucide-react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/about', label: 'About' },
  { href: '/rewards', label: 'Rewards' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-bold tracking-[0.15em] uppercase">Bullet Coffee</h3>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed max-w-xs">
              Premium coffee, served fast. Fueling Pelham one cup at a time.
            </p>
            <a
              href="https://www.instagram.com/bullet_coffee/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#C4A882] transition-colors tracking-wide"
            >
              <Camera className="w-3.5 h-3.5" />
              @bullet_coffee
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-500 mb-5">Navigate</h4>
            <ul className="space-y-3">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-500 mb-5">Hours</h4>
            <p className="text-sm text-gray-400">Monday &ndash; Sunday</p>
            <p className="text-sm text-white font-medium mt-1">6:00 AM &ndash; 8:00 PM</p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-500 mb-5">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                <span>2830 Pelham Pkwy<br />Pelham, AL 35124</span>
              </li>
              <li className="flex items-center gap-2 pt-2 text-white font-medium">
                <Phone className="w-4 h-4 flex-shrink-0 text-gray-500" />
                (205) 555-0187
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0 text-gray-500" />
                bulletcoffeeco@gmail.com
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-gray-600 tracking-wide">&copy; 2026 Bullet Coffee. All rights reserved.</p>
          <p className="text-[11px] text-gray-600 tracking-wide">Pelham, Alabama</p>
        </div>
      </div>
    </footer>
  );
}
