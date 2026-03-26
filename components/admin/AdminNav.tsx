'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/components/LocaleProvider';

export default function AdminNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const navItems = [
    { href: '/admin', label: t('adminOverview') },
    { href: '/admin/players', label: t('adminPlayers') },
    { href: '/admin/buffs', label: t('adminBuffs') },
    { href: '/admin/items', label: t('adminItems') },
    { href: '/admin/cashshop', label: t('navItemCashshop') },
    { href: '/admin/donation-tiers', label: t('adminDonationTiers') },
    { href: '/admin/server', label: t('adminServer') },
    { href: '/admin/wps', label: t('adminWpsScripts') }
  ];

  return (
    <nav className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">{t('adminNavTitle')}</p>
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
