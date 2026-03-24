import "server-only";

type SupabaseQueryOptions = {
    table: string;
    params?: Record<string, string>;
};

type SupabaseConfig = {
    url: string;
    serviceRoleKey: string;
};

function isHttpUrl(value: string): boolean {
    try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

function isJwtLike(value: string): boolean {
    return value.split(".").length === 3;
}

function isSupabaseSecretLike(value: string): boolean {
    return value.startsWith("sb_secret_");
}

function getSupabaseConfig(): SupabaseConfig {
    const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
    const rawKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

    if (!rawUrl || !rawKey) {
        throw new Error(
            "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        );
    }

    // Handle accidental swap between URL and key.
    const urlLooksWrong = !isHttpUrl(rawUrl);
    const keyLooksLikeUrl = isHttpUrl(rawKey);
    const looksSwapped = urlLooksWrong && keyLooksLikeUrl;
    const url = looksSwapped ? rawKey : rawUrl;
    const serviceRoleKey = looksSwapped ? rawUrl : rawKey;

    if (!isHttpUrl(url)) {
        throw new Error(
            "Invalid NEXT_PUBLIC_SUPABASE_URL. Expected something like https://<project-ref>.supabase.co"
        );
    }

    if (!isJwtLike(serviceRoleKey) && !isSupabaseSecretLike(serviceRoleKey)) {
        throw new Error(
            "Invalid SUPABASE_SERVICE_ROLE_KEY. Expected Supabase Secret key (sb_secret_...) or legacy JWT key."
        );
    }

    return { url: url.replace(/\/+$/, ""), serviceRoleKey };
}

function getSupabaseHeaders(serviceRoleKey: string): HeadersInit {
    return {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
    };
}

export async function querySupabaseTable<T = Record<string, unknown>>(
    options: SupabaseQueryOptions
): Promise<T[]> {
    const config = getSupabaseConfig();

    const queryParams = new URLSearchParams({
        select: "*",
        ...options.params,
    });

    const endpoint = `${config.url}/rest/v1/${options.table}?${queryParams.toString()}`;
    const response = await fetch(endpoint, {
        method: "GET",
        headers: getSupabaseHeaders(config.serviceRoleKey),
        cache: "no-store",
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supabase query failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as T[];
    return data;
}
