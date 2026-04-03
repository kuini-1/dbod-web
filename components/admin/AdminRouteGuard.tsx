'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminGm } from './AdminGmContext';

function isNewsAdminPath(pathname: string): boolean {
    return pathname === '/admin/news' || pathname.startsWith('/admin/news/');
}

export function AdminRouteGuard({ children }: { children: ReactNode }) {
    const { isNewsViewerOnly } = useAdminGm();
    const pathname = usePathname();
    const router = useRouter();
    const allowed = isNewsAdminPath(pathname);

    useEffect(() => {
        if (!isNewsViewerOnly || allowed) return;
        router.replace('/admin/news');
    }, [isNewsViewerOnly, allowed, router]);

    if (isNewsViewerOnly && !allowed) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-sm text-white/60">
                Redirecting…
            </div>
        );
    }

    return <>{children}</>;
}
