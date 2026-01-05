import { getUserInfo } from "@/auth";
import {
  createRedisSubscriber,
  ICBC_STATUS_CHANNEL,
  IcbcStatusEvent,
} from "@/app/lib/services/redis-events";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { userIsGov } = await getUserInfo();
  
  if (!userIsGov) {
    return new Response("Unauthorized", { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const icbcFileId = searchParams.get("fileId");

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Create Redis subscriber
      const subscriber = createRedisSubscriber();
      
      // Handle Redis connection errors
      subscriber.on("error", (err) => {
        console.error("Redis subscriber error:", err);
      });

      // Subscribe to ICBC status channel
      await subscriber.subscribe(ICBC_STATUS_CHANNEL);
      console.log(`SSE client subscribed to ${ICBC_STATUS_CHANNEL}${icbcFileId ? ` for file ${icbcFileId}` : ""}`);

      // Handle messages
      subscriber.on("message", (channel, message) => {
        if (channel === ICBC_STATUS_CHANNEL) {
          try {
            const event: IcbcStatusEvent = JSON.parse(message);
            
            // If fileId filter is provided, only send updates for that file
            if (!icbcFileId || event.icbcFileId === parseInt(icbcFileId, 10)) {
              console.log(`Sending SSE update for file ${event.icbcFileId}:`, event.status);
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
              );
            }
          } catch (error) {
            console.error("Error parsing ICBC status event:", error);
          }
        }
      });

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        subscriber.unsubscribe(ICBC_STATUS_CHANNEL);
        subscriber.quit();
        controller.close();
      });

      // Send keepalive every 30 seconds
      const keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch (error) {
          clearInterval(keepaliveInterval);
        }
      }, 30000);

      // Clean up on close
      request.signal.addEventListener("abort", () => {
        clearInterval(keepaliveInterval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
