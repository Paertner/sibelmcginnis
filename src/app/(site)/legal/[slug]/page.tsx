import { notFound } from "next/navigation";
import { Fragment, type ReactNode } from "react";
import { legalPages } from "@/lib/legal-pages";

const pageFor = (slug: string) => legalPages.find((p) => p.slug === slug);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: pageFor(slug)?.label ?? "Page not found" };
}

/** **bold** marks, line breaks and email addresses from the source documents. */
const withBreaks = (text: string) =>
  text.split("\n").map((line, l) => (
    <Fragment key={l}>
      {l > 0 && <br />}
      {line.split(/([\w.+-]+@[\w-]+\.[\w.]+)/).map((bit, j) =>
        j % 2 ? (
          <a key={j} href={`mailto:${bit}`}>
            {bit}
          </a>
        ) : (
          bit
        ),
      )}
    </Fragment>
  ));
function rich(text: string): ReactNode {
  return text
    .split(/(\*\*[^*]+\*\*)/)
    .map((part, i) =>
      /^\*\*[^*]+\*\*$/.test(part) ? (
        <strong key={i}>{withBreaks(part.slice(2, -2))}</strong>
      ) : (
        <Fragment key={i}>{withBreaks(part)}</Fragment>
      ),
    );
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const page = pageFor((await params).slug);
  if (!page) notFound();
  return (
    <>
      <div className="page-hero">
        <div className="wrap">
          <h1>{page.title}</h1>
        </div>
      </div>
      <section className="block legal">
        <div className="wrap">
          {page.blocks.map((block, i) =>
            block.type === "ul" ? (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{rich(item)}</li>
                ))}
              </ul>
            ) : block.type === "h2" ? (
              <h2 key={i}>{block.text}</h2>
            ) : block.type === "h3" ? (
              <h3 key={i}>{block.text}</h3>
            ) : (
              <p key={i}>{rich(block.text)}</p>
            ),
          )}
        </div>
      </section>
    </>
  );
}
