import { assetUrl } from "../../preview/assets";
import Image from "next/image";
import { personalizedHtml } from "@/lib/announcements";
import type { Announcement } from "@/lib/store";
export function AnnouncementContent({
  announcement,
  name,
}: {
  announcement: Announcement;
  name: string;
}) {
  return (
    <div className="announcement-content">
      {announcement.imageId ? (
        <Image
          className="announcement-banner"
          src={`/api/announcement-image/${announcement.imageId}`}
          alt="Session image"
          width={900}
          height={450}
          unoptimized
        />
      ) : null}
      <div
        className="rich-message"
        dangerouslySetInnerHTML={{
          __html: personalizedHtml(announcement, { name })
            .replace(/<(\/?)h1\b/gi, "<$1h2")
            .replace(/\/api\/site-image\/[\w-]+/g, (path) => assetUrl(path)),
        }}
      />
    </div>
  );
}
