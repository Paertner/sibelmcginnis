import { getUser } from "@/lib/auth";
import { getDemoState } from "@/lib/store";
import { emailDraft } from "@/lib/announcements";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; draftId: string }> },
) {
  const headers = { "Cache-Control": "private, no-store" },
    user = await getUser();
  if (user?.role !== "admin")
    return new Response("Administrator access required", {
      status: 403,
      headers,
    });
  const { id, draftId } = await params;
  if (
    !getDemoState().emailDrafts.some(
      (d) => d.id === draftId && d.announcementId === id,
    )
  )
    return new Response("Draft not found", { status: 404, headers });
  const eml = emailDraft(draftId);
  if (!eml) return new Response("Draft not found", { status: 404, headers });
  return new Response(eml, {
    headers: {
      ...headers,
      "Content-Type": "message/rfc822",
      "Content-Disposition": 'attachment; filename="morning-coffee-draft.eml"',
    },
  });
}
