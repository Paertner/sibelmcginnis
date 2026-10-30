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
import { bySlug, slugOf } from "@/lib/slug";
import { Badge } from "@/components/post-cards";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const published = getStore().posts.find(
    (p) => p === bySlug(getStore().posts, id) && p.status === "published",
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
    (p) => p === bySlug(getStore().posts, id) && p.status === "published",
  );
  if (!post) notFound();
  const user = await getUser(),
    allowed = canView(post.access, user?.role);
  // Locked bodies remain server-only. Never serialize a protected post into a client component.
  const audio = allowed && getDemoState().audio.has(`post-${post.id}`);
  // Newest first: the next item in the list is the older post.
  const all = getStore()
    .posts.filter((p) => p.status === "published")
    .toSorted((a, b) => b.date.localeCompare(a.date));
  const position = all.findIndex((p) => p.id === post.id);
  const newer = position > 0 ? all[position - 1] : undefined;
  const older = position < all.length - 1 ? all[position + 1] : undefined;
  const others = all.filter((p) => p.id !== post.id);
  const related = [
    ...others.filter((p) => p.category === post.category),
    ...others.filter((p) => p.category !== post.category),
  ].slice(0, 4);
  return (
    <article className="block">
      <div className="wrap post-layout">
        <div className="post-main">
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
              <audio
                controls
                preload="none"
                src={`/api/audio/post-${post.id}`}
              />
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
          <nav className="post-pager" aria-label="More posts">
            {older ? (
              <Link href={`/post/${slugOf(older)}`} rel="prev">
                <small>← Previous post</small>
                <b>{older.title}</b>
              </Link>
            ) : (
              <span />
            )}
            {newer ? (
              <Link href={`/post/${slugOf(newer)}`} rel="next">
                <small>Next post →</small>
                <b>{newer.title}</b>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
        {related.length ? (
          <aside className="post-related" aria-labelledby="related-title">
            <h2 id="related-title">Related posts</h2>
            <ul>
              {related.map((p) => (
                <li key={p.id}>
                  <Link href={`/post/${slugOf(p)}`}>
                    <span className="related-thumb">
                      <Image {...postImageProps(p)} alt="" fill sizes="72px" />
                    </span>
                    <span>
                      <b>{p.title}</b>
                      <small>
                        {fmtDate(p.date, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {p.access === "premium" ? " · Premium" : ""}
                      </small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </article>
  );
}
