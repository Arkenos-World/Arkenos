import { AccessToken, RoomServiceClient, AgentDispatchClient } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { roomName, agentId } = await request.json();
    
    console.log(`Token request: roomName=${roomName}, agentId=${agentId}`);

    if (!roomName) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    // Fetch LiveKit keys from backend dashboard (DB → env fallback)
    const backendUrl = getApiUrl();
    let apiKey = process.env.LIVEKIT_API_KEY;
    let apiSecret = process.env.LIVEKIT_API_SECRET;
    let wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      try {
        const keysRes = await fetch(`${backendUrl}/settings/keys/agent`);
        if (keysRes.ok) {
          const keys = await keysRes.json();
          apiKey = apiKey || keys.livekit_api_key;
          apiSecret = apiSecret || keys.livekit_api_secret;
          wsUrl = wsUrl || keys.livekit_url;
        }
      } catch (err) {
        console.error("Failed to fetch keys from backend:", err);
      }
    }

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json(
        { error: "LiveKit credentials not configured. Add them at Settings > API Keys." },
        { status: 500 }
      );
    }

    // Check if agent is custom to determine dispatch strategy
    let agentMode = "STANDARD";
    const backendApiUrl = getApiUrl();

    if (agentId && agentId !== "default") {
      try {
        const agentRes = await fetch(`${backendApiUrl}/agents/${agentId}`, {
          headers: { "x-user-id": userId },
        });
        if (agentRes.ok) {
          const agentData = await agentRes.json();
          agentMode = agentData.agent_mode || "STANDARD";
        }
      } catch (err) {
        console.log("Could not fetch agent mode:", err);
      }
    }

    // Create the room first (if needed) and dispatch agent
    const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);
    const agentDispatch = new AgentDispatchClient(wsUrl, apiKey, apiSecret);

    try {
      // Create room with agent config in metadata if it doesn't exist
      const roomMetadata = agentId ? JSON.stringify({ agentId }) : undefined;
      await roomService.createRoom({
        name: roomName,
        metadata: roomMetadata,
      });

      if (agentMode === "CUSTOM") {
        // Custom agents: spawn the container with the SAME room name
        await fetch(`${backendApiUrl}/agents/${agentId}/containers/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-id": userId },
          body: JSON.stringify({ room_name: roomName }),
        });
        console.log(`Started custom container for agent: ${agentId} in room: ${roomName}`);
      } else {
        // Standard agents: dispatch via AgentDispatchClient
        const dispatchMetadata = agentId ? JSON.stringify({ agentId }) : undefined;
        await agentDispatch.createDispatch(roomName, "arkenos-agent", { metadata: dispatchMetadata });
        console.log(`Dispatched agent to room: ${roomName} with agentId: ${agentId || 'none'}`);
      }
    } catch (err) {
      // Room might already exist, that's okay
      console.log("Room/dispatch setup:", err);
    }

    // Generate user token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      ttl: "10m",
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    // Create session in backend for tracking (skip for outbound calls — they already have a session)
    if (!roomName.startsWith("outbound-")) {
      try {
        await fetch(`${backendUrl}/sessions/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_name: roomName,
            user_id: userId,
            agent_id: agentId && agentId !== "default" ? agentId : null,
          }),
        });
      } catch (sessionError) {
        console.error("Failed to create session record:", sessionError);
      }
    }

    return NextResponse.json({
      token,
      wsUrl,
      roomName,
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
