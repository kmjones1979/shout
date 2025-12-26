import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyMessage } from "viem";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey 
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// Verify admin credentials
async function verifyAdmin(request: NextRequest): Promise<{ isAdmin: boolean; address?: string }> {
    const address = request.headers.get("x-admin-address");
    const signature = request.headers.get("x-admin-signature");
    const encodedMessage = request.headers.get("x-admin-message");

    if (!address || !signature || !encodedMessage || !supabase) {
        return { isAdmin: false };
    }

    try {
        const message = decodeURIComponent(atob(encodedMessage));
        
        const isValidSignature = await verifyMessage({
            address: address as `0x${string}`,
            message,
            signature: signature as `0x${string}`,
        });

        if (!isValidSignature) {
            return { isAdmin: false };
        }

        const { data: admin } = await supabase
            .from("shout_admins")
            .select("*")
            .eq("wallet_address", address.toLowerCase())
            .single();

        return { isAdmin: !!admin, address: address.toLowerCase() };
    } catch (error) {
        console.error("[Admin] Verification error:", error);
        return { isAdmin: false };
    }
}

// POST: Grant additional invites to a user
export async function POST(request: NextRequest) {
    if (!supabase) {
        return NextResponse.json(
            { error: "Database not configured" },
            { status: 500 }
        );
    }

    const { isAdmin, address: adminAddress } = await verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json(
            { error: "Not authorized" },
            { status: 403 }
        );
    }

    try {
        const { walletAddress, additionalInvites } = await request.json();

        if (!walletAddress || !additionalInvites || additionalInvites < 1) {
            return NextResponse.json(
                { error: "Valid wallet address and invite count required" },
                { status: 400 }
            );
        }

        // Update user's invite count
        const { data: user, error: fetchError } = await supabase
            .from("shout_users")
            .select("invite_count")
            .eq("wallet_address", walletAddress.toLowerCase())
            .single();

        if (fetchError) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const currentCount = user.invite_count || 5;
        const newCount = currentCount + additionalInvites;

        const { error: updateError } = await supabase
            .from("shout_users")
            .update({ 
                invite_count: newCount,
                updated_at: new Date().toISOString() 
            })
            .eq("wallet_address", walletAddress.toLowerCase());

        if (updateError) {
            return NextResponse.json(
                { error: "Failed to update invite count" },
                { status: 500 }
            );
        }

        // Generate the new invite codes
        await supabase.rpc("generate_user_invite_codes", {
            p_address: walletAddress.toLowerCase(),
            p_count: newCount,
        });

        // Log the activity
        await supabase.from("shout_admin_activity").insert({
            admin_address: adminAddress,
            action: "grant_invites",
            details: { 
                target_user: walletAddress.toLowerCase(),
                additional_invites: additionalInvites,
                new_total: newCount,
            },
        });

        return NextResponse.json({
            success: true,
            message: `Granted ${additionalInvites} additional invites`,
            newTotal: newCount,
        });
    } catch (error) {
        console.error("[Admin] Grant invites error:", error);
        return NextResponse.json(
            { error: "Failed to grant invites" },
            { status: 500 }
        );
    }
}

