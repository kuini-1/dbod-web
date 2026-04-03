import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { JWT_TOKEN } from "@/lib/auth/jwt";
import { accounts } from "@/lib/models/accounts";
import { isAdminPanelGm } from "@/lib/auth/admin-gm";
import { AdminGmProvider } from "@/components/admin/AdminGmContext";
import { AdminRouteGuard } from "@/components/admin/AdminRouteGuard";

type JwtPayload = {
    subject?: string;
};

function decodeCookieValue(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get("token")?.value;

    if (!rawToken) {
        redirect("/login?redirect=/admin");
    }

    let username = "";
    try {
        const verified = jwt.verify(decodeCookieValue(rawToken), JWT_TOKEN) as JwtPayload;
        username = String(verified?.subject || "");
    } catch {
        redirect("/login?redirect=/admin");
    }

    if (!username) {
        redirect("/login?redirect=/admin");
    }

    const account = await accounts.findOne({
        where: { Username: username },
        attributes: ["isGm"],
        raw: true,
    });

    const gm = Number(account?.isGm);
    if (!account || !isAdminPanelGm(gm)) {
        redirect("/");
    }

    return (
        <AdminGmProvider isGm={gm}>
            <AdminRouteGuard>{children}</AdminRouteGuard>
        </AdminGmProvider>
    );
}
