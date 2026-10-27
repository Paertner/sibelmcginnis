import { postImageProps } from "@/lib/site-images";
import { siteText } from "@/lib/site-copy";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { getUser } from "@/lib/auth";
import { canView } from "@/lib/access";
import { fmtDate } from "@/lib/dates";
import { Badge } from "@/components/post-cards";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const published = getStore().posts.find(
    (p) => p.id === id && p.status === "published",
  );
  return { title: published?.title ?? "Post not found" };
}
export default async function Post({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getStore().posts.find(
    (p) => p.id === id && p.status === "published",
  );
  if (!post) notFound();
  const user = await getUser(),
    allowed = canView(post.access, user?.role);
  // Locked bodies remain server-only. Never serialize a protected post into a client component.
  const paragraphs = allowed ? post.body.split(/\n\n+/) : [post.excerpt];
  return (
    <article className="block">
      <div className="wrap narrow">
        <Link className="muted" href="/blog">
          {siteText("post.all-posts")}
        </Link>
        <div className="post-heading-meta">
          <Badge access={post.access} />{" "}
          <span className="post-meta">
            {fmtDate(post.date)} · {post.category}
          </span>
        </div>
        <h1>{post.title}</h1>
        <Image
          {...postImageProps(post)}
          alt={postImageProps(post).alt}
          className="article-cover"

          width={900}
          height={400}
          sizes="(max-width: 780px) 90vw, 730px"
        />
        <div className="article">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {!allowed ? (
          <div className="paywall">
            <div className="card">
              <h3>
                {post.access === "free"
                  ? siteText("post.this-post-is-for-members")
                  : siteText("post.premium-members-only")}
              </h3>
              <p className="muted">
                {post.access === "free"
                  ? siteText(
                      "post.join-for-free-to-keep-reading-this-and-other-member-only-posts",
                    )
                  : siteText(
                      "post.upgrade-to-premium-to-read-this-post-join-the-saturday-zoom-circl",
                    )}
              </p>
              <Link
                className="btn"
                href={`/join?plan=${post.access === "free" ? "free" : "premium"}`}
              >
                {post.access === "free"
                  ? siteText("post.join-for-free")
                  : siteText("post.see-premium")}
              </Link>{" "}
              <Link className="btn btn-ghost" href="/login">
                {siteText("post.sign-in")}
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
