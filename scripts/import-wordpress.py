"""Stage the real WordPress site for import (nothing is written to the database here).

Usage:  python scripts/import-wordpress.py <export.xml> <output folder>

Reads the WordPress export, then writes to the output folder:
  staged.json   posts and podcast episodes in the shape of our database tables
  media/        the cover images and audio those items use, downloaded from the live site
  REPORT.md     what was found, possible duplicates and text that needs a look
"""
import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path

NS = {
    "wp": "http://wordpress.org/export/1.2/",
    "content": "http://purl.org/rss/1.0/modules/content/",
    "excerpt": "http://wordpress.org/export/1.2/excerpt/",
}
SUMMARY = "Meeting Summaries"


def field(item, name):
    return item.findtext(name, namespaces=NS) or ""


def clean_title(raw):
    # The source has broken characters (shown as U+FFFD) where a dash or quote was lost.
    text = html.unescape(raw).replace("�", " ")
    text = re.sub(r"\s+", " ", text).strip(" :-")
    return text


def clean_text(raw):
    text = html.unescape(raw).replace("\xa0", " ")
    return re.sub(r"[ \t]+", " ", text).strip()


class Blocks(HTMLParser):
    """Turns post HTML into simple text/heading blocks; ignores layout wrappers."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.stack = []
        self.buf = ""
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
        if tag in ("p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote"):
            self.flush()
            self.stack.append(tag)
        elif tag in ("strong", "b", "em", "i", "br") and self.stack:
            self.buf += {"b": "<strong>", "strong": "<strong>", "em": "<em>", "i": "<em>", "br": "<br>"}[tag]
        elif tag == "a" and self.stack:
            href = dict(attrs).get("href", "")
            if href.startswith(("http://", "https://", "mailto:")):
                self.buf += f'<a href="{html.escape(href, quote=True)}">'
                self.stack.append("a")
            else:
                self.stack.append("a-skip")

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)
        if tag in ("strong", "b", "em", "i") and self.stack:
            self.buf += "</strong>" if tag in ("strong", "b") else "</em>"
        elif tag == "a" and self.stack and self.stack[-1] in ("a", "a-skip"):
            if self.stack.pop() == "a":
                self.buf += "</a>"
        elif tag in ("p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote"):
            self.flush(tag)
            if self.stack and self.stack[-1] == tag:
                self.stack.pop()

    def handle_data(self, data):
        if self.skip or not self.stack:
            return
        self.buf += html.escape(data, quote=False)

    def flush(self, tag=None):
        text = clean_text(self.buf)
        self.buf = ""
        plain = re.sub(r"<[^>]+>", "", text).strip()
        if not plain:
            return
        kind = tag or (self.stack[-1] if self.stack else "p")
        if kind.startswith("h") and len(kind) == 2:
            self.out.append(("heading", plain))
        elif kind == "li":
            self.out.append(("li", text))
        else:
            self.out.append(("p", text))


def to_blocks(content):
    content = re.sub(r"<!--.*?-->", "", content, flags=re.S)
    parser = Blocks()
    parser.feed(content)
    parser.flush()
    blocks, items, n = [], [], 0

    def add(**kw):
        nonlocal n
        n += 1
        blocks.append({"id": f"b{n}", **kw})

    def end_list():
        if items:
            add(type="text", html="<ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>")
            items.clear()

    for kind, text in parser.out:
        if kind == "li":
            items.append(text)
            continue
        end_list()
        if kind == "heading":
            add(type="heading", title=text)
        else:
            add(type="text", html=f"<p>{text}</p>")
    end_list()
    return blocks


def plain(blocks):
    parts = []
    for b in blocks:
        text = b.get("title") or re.sub(r"</?(p|ul)>|<li>", "", b.get("html", "")).replace("</li>", "\n")
        parts.append(re.sub(r"<[^>]+>", "", html.unescape(text)).strip())
    return "\n\n".join(p for p in parts if p)


def download(url, folder):
    name = url.split("/")[-1]
    target = folder / name
    if not target.exists():
        request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(request, timeout=120) as response:
            target.write_bytes(response.read())
    return name


def main(source, out):
    out = Path(out)
    media_dir = out / "media"
    media_dir.mkdir(parents=True, exist_ok=True)
    items = ET.parse(source).getroot().find("channel").findall("item")
    attachments = {
        field(i, "wp:post_id"): field(i, "wp:attachment_url")
        for i in items
        if field(i, "wp:post_type") == "attachment"
    }

    def meta(item, key):
        for m in item.findall("wp:postmeta", NS):
            if m.findtext("wp:meta_key", namespaces=NS) == key:
                return m.findtext("wp:meta_value", namespaces=NS) or ""
        return ""

    posts, problems = [], []
    for item in items:
        if field(item, "wp:post_type") != "post" or field(item, "wp:status") != "publish":
            continue
        cats = [c.text for c in item.findall("category") if c.get("domain") == "category"]
        blocks = to_blocks(field(item, "content:encoded"))
        body = plain(blocks)
        raw_title = field(item, "title")
        title = clean_title(raw_title)
        cover = attachments.get(meta(item, "_thumbnail_id"), "")
        cover_name = ""
        if cover:
            try:
                cover_name = download(cover, media_dir)
            except Exception as error:  # keep going; the report lists it
                problems.append(f"Cover not downloaded for “{title}”: {error}")
        if "�" in raw_title + field(item, "content:encoded"):
            problems.append(f"Broken characters in “{title}” (WordPress id {field(item, 'wp:post_id')})")
        posts.append(
            {
                "id": f"wp-{field(item, 'wp:post_id')}",
                "title": title,
                "access": "premium" if SUMMARY in cats else "public",
                "status": "published",
                "category": ", ".join(c for c in cats if c != "Blog") or "Blog",
                "date": field(item, "wp:post_date")[:10],
                "excerpt": (body.split("\n\n")[0])[:240],
                "body": body,
                "blocks": blocks,
                "cover_file": cover_name,
            }
        )

    episodes = []
    playlists = [
        i for i in items if field(i, "wp:post_type") == "sr_playlist" and field(i, "wp:status") == "publish"
    ]
    for item in sorted(playlists, key=lambda i: field(i, "wp:post_date")):
        found = re.search(r'track_mp3_id";i:(\d+)', meta(item, "alb_tracklist"))
        url = attachments.get(found.group(1), "") if found else ""
        audio = ""
        if url:
            try:
                audio = download(url, media_dir)
            except Exception as error:
                problems.append(f"Audio not downloaded for “{clean_title(field(item, 'title'))}”: {error}")
        else:
            problems.append(f"No audio found for playlist “{clean_title(field(item, 'title'))}”")
        episodes.append(
            {
                "id": f"wp-{field(item, 'wp:post_id')}",
                "num": len(episodes) + 1,
                "title": clean_title(field(item, "title")),
                "status": "published",
                "date": field(item, "wp:post_date")[:10],
                "description": "",
                "audio_file": audio,
            }
        )

    groups = defaultdict(list)
    for p in posts:
        groups[(re.sub(r"\W+", "", p["title"].lower()), p["access"])].append(p)
    duplicates = [g for g in groups.values() if len(g) > 1]

    (out / "staged.json").write_text(
        json.dumps({"posts": posts, "podcasts": episodes}, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    lines = [
        "# WordPress import report",
        "",
        f"- Posts: {len(posts)} ({sum(p['access'] == 'public' for p in posts)} Everyone, {sum(p['access'] == 'premium' for p in posts)} Premium)",
        f"- Podcast episodes: {len(episodes)}",
        f"- Files downloaded: {len(list(media_dir.iterdir()))}",
        "",
        "## Possible duplicates (same title and access level)",
        "",
    ]
    lines += (
        [f"- {g[0]['title']}: " + ", ".join(f"{p['id']} ({p['date']})" for p in g) for g in duplicates]
        or ["None."]
    )
    lines += ["", "## Needs a look", ""] + ([f"- {p}" for p in problems] or ["Nothing."])
    (out / "REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
