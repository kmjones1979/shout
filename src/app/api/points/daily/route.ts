import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey 
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// GET: Check if daily bonus is available
export async function GET(request: NextRequest) {
    if (!supabase) {
        return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get("address");

        if (!walletAddress) {
            return NextResponse.json({ error: "Address required" }, { status: 400 });
        }

        const normalizedAddress = walletAddress.toLowerCase();

        // Get user's last claim date
        const { data: user, error } = await supabase
            .from("shout_users")
            .select("daily_points_claimed_at")
            .eq("wallet_address", normalizedAddress)
            .single();

        if (error) {
            console.error("[DailyPoints] Error fetching user:", error);
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const today = new Date().toISOString().split('T')[0];
        const lastClaimed = user?.daily_points_claimed_at;
        const available = !lastClaimed || lastClaimed !== today;

        // Calculate next reset time (midnight UTC)
        const now = new Date();
        const nextReset = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1,
            0, 0, 0, 0
        ));

        return NextResponse.json({
            available,
            lastClaimed,
            nextResetAt: nextReset.toISOString(),
            points: 3,
        });
    } catch (error) {
        console.error("[DailyPoints] Error:", error);
        return NextResponse.json({ error: "Failed to check daily bonus" }, { status: 500 });
    }
}

// POST: Claim daily bonus
export async function POST(request: NextRequest) {
    if (!supabase) {
        return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    try {
        const { walletAddress } = await request.json();

        if (!walletAddress) {
            return NextResponse.json({ error: "Address required" }, { status: 400 });
        }

        const normalizedAddress = walletAddress.toLowerCase();

        // Call the claim function
        const { data: result, error } = await supabase.rpc("claim_daily_points", {
            p_user_address: normalizedAddress,
        });

        if (error) {
            console.error("[DailyPoints] RPC error:", error);
            return NextResponse.json({ error: "Failed to claim bonus" }, { status: 500 });
        }

        if (!result?.success) {
            return NextResponse.json({
                success: false,
                error: result?.error || "Already claimed today",
                nextClaimAt: result?.next_claim_at,
            });
        }

        console.log("[DailyPoints] Claimed:", result.points_awarded, "points for", normalizedAddress);

        return NextResponse.json({
            success: true,
            points: result.points_awarded,
            nextClaimAt: result.next_claim_at,
        });
    } catch (error) {
        console.error("[DailyPoints] Error:", error);
        return NextResponse.json({ error: "Failed to claim bonus" }, { status: 500 });
    }
}

