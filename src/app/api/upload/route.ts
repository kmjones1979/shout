import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// POST /api/upload - Upload an image
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const userAddress = formData.get("userAddress") as string | null;
        const context = formData.get("context") as string | null; // e.g., "channel", "group", "chat"

        if (!file || !userAddress) {
            return NextResponse.json(
                { error: "File and user address are required" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Only JPEG, PNG, GIF, and WebP images are allowed" },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File size must be less than 5MB" },
                { status: 400 }
            );
        }

        // Generate unique filename
        const ext = file.name.split(".").pop() || "jpg";
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 10);
        const filename = `${context || "chat"}/${userAddress.toLowerCase()}/${timestamp}_${randomId}.${ext}`;

        // Convert File to ArrayBuffer then to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from("chat-images")
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            console.error("[Upload] Storage error:", error);
            return NextResponse.json(
                { error: "Failed to upload image" },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("chat-images")
            .getPublicUrl(data.path);

        return NextResponse.json({
            url: urlData.publicUrl,
            path: data.path,
        });
    } catch (e) {
        console.error("[Upload] Error:", e);
        return NextResponse.json(
            { error: "Failed to process upload" },
            { status: 500 }
        );
    }
}

