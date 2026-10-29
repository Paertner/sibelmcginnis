import { getUser } from "@/lib/auth";
import { canView, isPremium } from "@/lib/access";
import { getDemoState, getStore } from "@/lib/store";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  const headers: Record<string, string> = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const { id } = await params;
  // A post's audio follows the post's own access: Everyone posts are open to visitors too.
  const post = id.startsWith("post-")
    ? getStore().posts.find((p) => p.id === id.slice(5))
    : undefined;
  if (post) {
    const readable =
      user?.role === "admin" ||
      (post.status === "published" && canView(post.access, user?.role));
    if (!readable)
      return new Response("Not available", { status: 403, headers });
  } else if (!user || !isPremium(user.role))
    return new Response("Premium membership required", {
      status: 403,
      headers,
    });
  const episode = post
    ? undefined
    : getStore().podcasts.find(
        (p) =>
          p.id === id && (p.status === "published" || user?.role === "admin"),
      );
  const audio = (post || episode) && getDemoState().audio.get(id);
  if (!audio)
    return new Response("Audio not uploaded", { status: 404, headers });
  Object.assign(headers, {
    "Content-Type": audio.type,
    "Accept-Ranges": "bytes",
  });
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const size = audio.bytes.length;
    let start = match?.[1] ? Number(match[1]) : 0;
    const end =
      match?.[2] && match[1] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (match && !match[1] && match[2])
      start = Math.max(0, size - Number(match[2]));
    if (!match || (!match[1] && !match[2]) || start >= size || start > end)
      return new Response(null, {
        status: 416,
        headers: { ...headers, "Content-Range": `bytes */${size}` },
      });
    return new Response(Buffer.from(audio.bytes.slice(start, end + 1)), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }
  return new Response(Buffer.from(audio.bytes), {
    headers: { ...headers, "Content-Length": String(audio.bytes.length) },
  });
}
