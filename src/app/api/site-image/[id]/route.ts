import { getUser } from "@/lib/auth";
import { getDemoState } from "@/lib/store";
import { siteImageSlots } from "@/lib/site-images";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params,
    state = getDemoState();
  const reference = Object.entries(state.data.siteImages ?? {}).find(
    ([, value]) => value.imageId === id,
  );
  const slot =
    reference && siteImageSlots().find((slot) => slot.id === reference[0]);
  const image = slot && state.images.get(id);
  const headers = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (!image || !slot)
    return new Response("Not found", { status: 404, headers });
  if (
    slot.postId &&
    !state.data.posts.some(
      (post) => post.id === slot.postId && post.status === "published",
    ) &&
    (await getUser())?.role !== "admin"
  )
    return new Response("Not found", { status: 404, headers });
  return new Response(Buffer.from(image.bytes), {
    headers: { ...headers, "Content-Type": image.type },
  });
}
