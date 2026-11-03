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
  const response = await fetch(new URL(path, request.nextUrl.origin), {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (!response.ok)
    return new NextResponse("This page could not be loaded.", {
      status: response.status,
    });
  return new NextResponse(staticPage(await response.text()), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
