import { postImageProps } from "@/lib/site-images";
import { siteText } from "@/lib/site-copy";
import Image from "next/image";
import Link from "next/link";
import { canView, type Role } from "@/lib/access";
import type { Post } from "@/lib/store";
import { fmtDate } from "@/lib/dates";

export function Badge({ access }: { access: string }) {
  return (
    <span className={`badge b-${access}`}>
      {access === "public"
        ? siteText("post-cards.everyone")
        : access === "free"
          ? siteText("post-cards.free-members")
          : siteText("post-cards.premium")}
    </span>
  );
}
export function PostCards({ posts, role }: { posts: Post[]; role: Role }) {
  return posts.length ? (
    posts.map((p) => (
      <Link className="card post-card" href={`/post/${p.id}`} key={p.id}>
        <div className="post-cover">
          <Image
            {...postImageProps(p)} alt={postImageProps(p).alt}

            fill
            sizes="(max-width: 860px) 90vw, 380px"
          />
          <Badge access={p.access} />
        </div>
        <div className="post-body">
          <div className="post-meta">
            {fmtDate(p.date, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            · {p.category}
          </div>
          <h3>{p.title}</h3>
          <p className="muted">{p.excerpt}</p>
          <span className="lock">
            {canView(p.access, role)
              ? siteText("post-cards.read-post")
              : p.access === "free"
                ? siteText("post-cards.sign-in-to-read")
                : siteText("post-cards.premium-members-only")}
          </span>
        </div>
      </Link>
    ))
  ) : (
    <p className="muted">{siteText("post-cards.no-posts-yet")}</p>
  );
}
