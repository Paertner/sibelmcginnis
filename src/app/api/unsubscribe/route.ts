import { applyUnsubscribe } from "@/lib/unsubscribe";

/** One-click unsubscribe: mail apps POST here when the member presses "Unsubscribe" in their inbox. */
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  return applyUnsubscribe(token, "category")
    ? new Response("Unsubscribed", { status: 200 })
    : new Response("Invalid link", { status: 400 });
}
