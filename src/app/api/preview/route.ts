import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { editorPages } from "@/lib/editor-pages";

export const dynamic = "force-dynamic";

/** The page as the server sends it, without the scripts that would start the app inside the editor preview. */
function staticPage(html: string) {
  return html
    .replace(/<script\b[^>]*\bsrc=[^>]*>\s*<\/script>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (tag) =>
      /__next/.test(tag) ? "" : tag,
    );
}

/** Admin only: a public page for the visual editor's preview. */
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (user?.role !== "admin") return new NextResponse(null, { status: 403 });
  const path = request.nextUrl.searchParams.get("path") ?? "";
  if (!editorPages.some((page) => page.path === path))
    return new NextResponse(null, { status: 404 });
  // The page is fetched from this same server. Behind a proxy the address the server sees can differ from the public one,
  // so the forwarded host is tried first and the address of this request second.
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");
  const origins = [
    ...(host ? [`${proto}://${host}`] : []),
    request.nextUrl.origin,
  ];
  let response: Response | undefined;
  const problems: string[] = [];
  for (const origin of new Set(origins)) {
    try {
      const attempt = await fetch(new URL(path, origin), {
        headers: { cookie: request.headers.get("cookie") ?? "" },
        cache: "no-store",
      });
      if (attempt.ok) {
        response = attempt;
        break;
      }
      problems.push(`${origin} answered ${attempt.status}`);
    } catch (error) {
      problems.push(
        `${origin}: ${error instanceof Error ? error.message : "request failed"}`,
      );
    }
  }
  if (!response) {
    console.error("Editor preview failed:", path, problems.join("; "));
    return new NextResponse(
      `The page preview could not be loaded (${problems.join("; ")}).`,
      { status: 502, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }
  return new NextResponse(staticPage(await response.text()), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
