import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const HUDDLE01_API_KEY = process.env.HUDDLE01_API_KEY || "";

// GET /api/scheduling/join/[token] - Get scheduled call by invite token
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        if (!token) {
            return NextResponse.json(
                { error: "Invite token required" },
                { status: 400 }
            );
        }

        // Get scheduled call by invite token
        const { data: call, error } = await supabase
            .from("shout_scheduled_calls")
            .select(`
                id,
                scheduled_at,
                duration_minutes,
                title,
                status,
                guest_name,
                guest_email,
                timezone,
                is_paid,
                recipient_wallet_address
            `)
            .eq("invite_token", token)
            .single();

        if (error || !call) {
            return NextResponse.json(
                { error: "Call not found" },
                { status: 404 }
            );
        }

        // Get host display name
        const { data: hostUser } = await supabase
            .from("shout_users")
            .select("display_name")
            .eq("wallet_address", call.recipient_wallet_address)
            .single();

        // Mark invite as opened (first time)
        if (call) {
            await supabase
                .from("shout_scheduled_calls")
                .update({ invite_opened_at: new Date().toISOString() })
                .eq("invite_token", token)
                .is("invite_opened_at", null);
        }

        return NextResponse.json({
            call: {
                ...call,
                hostName: hostUser?.display_name || null,
            },
        });
    } catch (error) {
        console.error("[Join] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch call" },
            { status: 500 }
        );
    }
}

// POST /api/scheduling/join/[token] - Create/join room for scheduled call
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    if (!HUDDLE01_API_KEY) {
        return NextResponse.json(
            { error: "Video calling not configured" },
            { status: 500 }
        );
    }

    try {
        const { token } = await params;

        if (!token) {
            return NextResponse.json(
                { error: "Invite token required" },
                { status: 400 }
            );
        }

        // Get scheduled call by invite token
        const { data: call, error: callError } = await supabase
            .from("shout_scheduled_calls")
            .select("*")
            .eq("invite_token", token)
            .single();

        if (callError || !call) {
            return NextResponse.json(
                { error: "Call not found" },
                { status: 404 }
            );
        }

        // Check if call is in joinable window
        const scheduledTime = new Date(call.scheduled_at);
        const endTime = new Date(scheduledTime.getTime() + call.duration_minutes * 60 * 1000);
        const now = new Date();
        const joinWindowStart = new Date(scheduledTime.getTime() - 5 * 60 * 1000);

        if (now < joinWindowStart || now > endTime) {
            return NextResponse.json(
                { error: "Call is not available yet or has ended" },
                { status: 403 }
            );
        }

        if (call.status === "cancelled" || call.status === "completed") {
            return NextResponse.json(
                { error: "This call has been cancelled or completed" },
                { status: 403 }
            );
        }

        // Check if a room already exists for this scheduled call
        // Look for rooms with title matching the scheduled call (simple way to link them)
        // In the future, we could add a scheduled_call_id column to instant_rooms
        const callTitle = call.title || `Scheduled Call ${call.id.slice(0, 8)}`;
        
        let { data: existingRooms } = await supabase
            .from("shout_instant_rooms")
            .select("*")
            .eq("host_wallet_address", call.recipient_wallet_address.toLowerCase())
            .eq("status", "active")
            .gte("expires_at", now.toISOString())
            .order("created_at", { ascending: false })
            .limit(1);

        // Check if any existing room might be for this call (by checking if it was created around the scheduled time)
        const existingRoom = existingRooms?.[0];
        const roomCreatedAt = existingRoom ? new Date(existingRoom.created_at) : null;
        const isRoomForThisCall = existingRoom && 
            roomCreatedAt && 
            Math.abs(roomCreatedAt.getTime() - scheduledTime.getTime()) < 60 * 60 * 1000; // Within 1 hour

        let roomId: string;
        let joinCode: string;

        if (existingRoom && isRoomForThisCall) {
            // Room already exists, use it
            roomId = existingRoom.room_id;
            joinCode = existingRoom.join_code;
        } else {
            // Create new Huddle01 room
            const huddle01Response = await fetch(
                "https://api.huddle01.com/api/v2/sdk/rooms/create-room",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": HUDDLE01_API_KEY,
                    },
                    body: JSON.stringify({
                        roomLocked: false,
                        metadata: {
                            title: callTitle,
                            hostWallets: [call.recipient_wallet_address],
                            scheduledCallId: call.id,
                        },
                    }),
                }
            );

            if (!huddle01Response.ok) {
                const errorText = await huddle01Response.text();
                console.error("[Scheduled Join] Huddle01 API error:", huddle01Response.status, errorText);
                return NextResponse.json(
                    { error: "Failed to create video room" },
                    { status: 500 }
                );
            }

            const huddle01Data = await huddle01Response.json();
            roomId = huddle01Data.data.roomId;

            // Create instant room entry
            const { data: newRoom, error: roomError } = await supabase
                .from("shout_instant_rooms")
                .insert({
                    room_id: roomId,
                    host_wallet_address: call.recipient_wallet_address.toLowerCase(),
                    title: callTitle,
                    max_participants: 4,
                    status: "active",
                    expires_at: new Date(endTime).toISOString(), // Expire when call ends
                })
                .select()
                .single();

            if (roomError || !newRoom) {
                console.error("[Scheduled Join] Database error:", roomError);
                return NextResponse.json(
                    { error: "Failed to save room" },
                    { status: 500 }
                );
            }

            joinCode = newRoom.join_code;
        }

        return NextResponse.json({
            success: true,
            room: {
                roomId,
                joinCode,
                joinUrl: `https://app.spritz.chat/room/${joinCode}`,
            },
        });
    } catch (error) {
        console.error("[Scheduled Join] Error:", error);
        return NextResponse.json(
            { error: "Failed to join call" },
            { status: 500 }
        );
    }
}

