import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getUserFromRequest } from "@/lib/auth/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map<string, string>([
    ["image/jpeg", ".jpg"],
    ["image/png", ".png"],
    ["image/webp", ".webp"],
    ["image/gif", ".gif"],
]);

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || Number(user.isGm) !== 10) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get("file");
        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ success: false, message: "Missing file" }, { status: 400 });
        }

        const mime = (file.type || "").toLowerCase();
        const ext = ALLOWED.get(mime);
        if (!ext) {
            return NextResponse.json({ success: false, message: "Unsupported image type" }, { status: 400 });
        }

        const buf = Buffer.from(await file.arrayBuffer());
        if (buf.length > MAX_BYTES) {
            return NextResponse.json({ success: false, message: "File too large (max 5MB)" }, { status: 400 });
        }

        const dir = path.join(process.cwd(), "public", "uploads", "news");
        await fs.mkdir(dir, { recursive: true });
        const filename = `${uuidv4()}${ext}`;
        const fullPath = path.join(dir, filename);
        await fs.writeFile(fullPath, buf);

        const url = `/uploads/news/${filename}`;
        return NextResponse.json({ success: true, url }, { status: 200 });
    } catch (error) {
        console.error("POST /api/admin/news/upload error:", error);
        return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
    }
}
