import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { JWT_TOKEN } from "@/lib/auth/jwt";
import { accounts } from "@/lib/models/accounts";

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

    if (!account || Number(account.isGm) !== 10) {
        redirect("/");
    }

    return <>{children}</>;
}
