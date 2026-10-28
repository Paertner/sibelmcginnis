import { siteText } from "@/lib/site-copy";
import Link from "next/link";
import { PostCards } from "@/components/post-cards";
import { getStore } from "@/lib/store";
import { getUser } from "@/lib/auth";
export const metadata = { title: "Blog" };
export default async function Blog({
  searchParams,
}: {
  searchParams: Promise<{ access?: string }>;
}) {
  const filter = (await searchParams).access ?? "all";
  const role = (await getUser())?.role ?? "visitor";
  const posts = getStore()
    .posts.filter(
      (p) =>
        p.status === "published" && (filter === "all" || p.access === filter),
    )
    .toSorted((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <div className="page-hero">
        <div className="wrap">
          <p className="eyebrow">{siteText("blog.blog")}</p>
          <h1>{siteText("blog.insights-inspiration-and-connection")}</h1>
          <p>
            {siteText(
              "blog.reflections-tips-and-stories-from-the-morning-coffee-community-so",
            )}
          </p>
        </div>
      </div>
      <section className="block">
        <div className="wrap">
          <nav className="filters" aria-label="Filter posts">
            {[
              [siteText("blog.all"), siteText("blog.all-posts")],
              ["public", siteText("blog.everyone")],
              ["premium", siteText("blog.premium")],
            ].map(([key, label]) => (
              <Link
                className={filter === key ? "on" : ""}
                href={`/blog?access=${key}`}
                aria-current={filter === key ? "page" : undefined}
                key={key}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="grid g3">
            <PostCards posts={posts} role={role} />
          </div>
        </div>
      </section>
    </>
  );
}
