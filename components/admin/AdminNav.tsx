'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/components/LocaleProvider';
import { useAdminGm } from '@/components/admin/AdminGmContext';

export default function AdminNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { isNewsViewerOnly } = useAdminGm();
  const navGroups = [
    {
      label: t('adminSectionGeneral'),
      items: [
        { href: '/admin', label: t('adminOverview') },
        { href: '/admin/players', label: t('adminPlayers') },
        { href: '/admin/buffs', label: t('adminBuffs') },
        { href: '/admin/items', label: t('adminItems') },
        { href: '/admin/server', label: t('adminServer') },
        { href: '/admin/wps', label: t('adminWpsScripts') },
      ],
    },
    {
      label: t('adminSectionEconomyEvents'),
      items: [
        { href: '/admin/cashshop', label: t('navItemCashshop') },
        { href: '/admin/donation-tiers', label: t('adminDonationTiers') },
        { href: '/admin/slot-machine', label: t('adminSlotMachine') },
        { href: '/admin/event-levelup', label: t('adminLevelupEvent') },
      ],
    },
    {
      label: t('adminSectionContent'),
      items: [{ href: '/admin/news', label: t('adminNews') }],
    },
  ].map((group) => ({
    ...group,
    items: group.items.filter((item) => !isNewsViewerOnly || item.href === '/admin/news'),
  })).filter((group) => group.items.length > 0);

  return (
    <nav className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">{t('adminNavTitle')}</p>
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-2 pt-1 text-[10px] uppercase tracking-[0.18em] text-white/35">{group.label}</p>
          {group.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-2 transition ${
                  isActive
                    ? 'bg-white/10 text-white shadow'
                    : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
