'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/players', label: 'Players' },
  { href: '/admin/buffs', label: 'Buffs' },
  { href: '/admin/items', label: 'Items' },
  { href: '/admin/cashshop', label: 'Cashshop' },
  { href: '/admin/donation-tiers', label: 'Donation Tiers' },
  { href: '/admin/server', label: 'Server' },
  { href: '/admin/wps', label: 'WPS Scripts' }
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">Admin</p>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl px-3 py-2 transition ${
              isActive
                ? 'bg-white/10 text-white shadow'
                : 'hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
