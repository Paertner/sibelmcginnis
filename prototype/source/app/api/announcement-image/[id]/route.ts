import { getUser } from "@/lib/auth";
import { getDemoState } from "@/lib/store";
import { announcementVisible } from "@/lib/announcements";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser(),
    { id } = await params,
    state = getDemoState();
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const announcement = state.data.announcements.find((a) => a.imageId === id);
  if (
    !user ||
    !announcement ||
    (user.role !== "admin" &&
      !announcementVisible(announcement, user.id, user.role))
  )
    return new Response("Not found", { status: 404, headers });
  const image = state.images.get(id);
  if (!image)
    return new Response("Image unavailable", { status: 404, headers });
  return new Response(Buffer.from(image.bytes), {
    headers: { ...headers, "Content-Type": image.type },
  });
}
