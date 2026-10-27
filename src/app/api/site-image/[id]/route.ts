import { getUser } from "@/lib/auth";
import { getDemoState } from "@/lib/store";
import { siteImageSlots } from "@/lib/site-images";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params,
    state = getDemoState();
  const headers = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const image = state.images.get(id);
  if (!image) return new Response("Not found", { status: 404, headers });
  // Admins browse the whole media library; visitors only see images placed on published pages.
  if ((await getUser())?.role !== "admin") {
    const slots = Object.entries(state.data.siteImages ?? {})
      .filter(([, value]) => value.imageId === id)
      .map(([slotId]) => siteImageSlots().find((slot) => slot.id === slotId))
      .filter((slot) => !!slot);
    const visible = slots.some(
      (slot) =>
        !slot.postId ||
        state.data.posts.some(
          (post) => post.id === slot.postId && post.status === "published",
        ),
    );
    if (!visible) return new Response("Not found", { status: 404, headers });
  }
  return new Response(Buffer.from(image.bytes), {
    headers: { ...headers, "Content-Type": image.type },
  });
}
