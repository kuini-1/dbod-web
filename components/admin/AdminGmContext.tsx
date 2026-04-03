'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ADMIN_GM_FULL, isAdminNewsViewerOnlyGm } from '@/lib/auth/admin-gm';

export type AdminGmContextValue = {
    isGm: number;
    isFullAdmin: boolean;
    isNewsViewerOnly: boolean;
};

const AdminGmContext = createContext<AdminGmContextValue | null>(null);

export function AdminGmProvider({ isGm, children }: { isGm: number; children: ReactNode }) {
    const value = useMemo<AdminGmContextValue>(() => {
        const gm = Number(isGm);
        return {
            isGm: gm,
            isFullAdmin: gm === ADMIN_GM_FULL,
            isNewsViewerOnly: isAdminNewsViewerOnlyGm(gm),
        };
    }, [isGm]);

    return <AdminGmContext.Provider value={value}>{children}</AdminGmContext.Provider>;
}

export function useAdminGm(): AdminGmContextValue {
    const ctx = useContext(AdminGmContext);
    if (!ctx) {
        throw new Error('useAdminGm must be used within AdminGmProvider');
    }
    return ctx;
}
