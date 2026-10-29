import { postImageProps } from "@/lib/site-images";
import { siteText } from "@/lib/site-copy";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDemoState, getStore } from "@/lib/store";
import { BlockContent, textToBlocks } from "@/components/block-content";
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
  const audio = allowed && getDemoState().audio.has(`post-${post.id}`);
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
        {audio ? (
          <div className="post-audio">
            <span>{siteText("post.listen-to-this-post")}</span>
            <audio controls preload="none" src={`/api/audio/post-${post.id}`} />
          </div>
        ) : null}
        {allowed ? (
          <BlockContent blocks={post.blocks ?? textToBlocks(post.body)} />
        ) : (
          <div className="article">
            <p>{post.excerpt}</p>
          </div>
        )}
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
