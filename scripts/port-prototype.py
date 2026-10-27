"""One-time, auditable JSX migration of the supplied static pages and design tokens."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import shutil

root = Path(__file__).resolve().parents[1]
source = root.parent / 'morning-coffee-prototype'
app = root / 'src/app'
(root / 'public/images').mkdir(parents=True, exist_ok=True)
for image in (source / 'assets/img').glob('*'):
    shutil.copyfile(image, root / 'public/images' / image.name)
css = (source / 'assets/style.css').read_text(encoding='utf-8')
css = re.sub(r"@import url\([^\n]+\);", '@import "tailwindcss";', css, count=1)
css = re.sub(r'/\* toast \+ demo bar \*/.*?/\* modal \*/', '/* modal */', css, flags=re.S)
css = css.replace("'Inter'", 'var(--font-inter)').replace("'Poppins'", 'var(--font-poppins)')
(app / 'globals.css').write_text(css, encoding='utf-8')
admin = (source / 'admin.html').read_text(encoding='utf-8')
extra = re.search(r'<style>(.*?)</style>', admin, re.S).group(1)
extra = extra.replace("'Inter'", 'var(--font-inter)').replace("'Poppins'", 'var(--font-poppins)')
with (app / 'globals.css').open('a', encoding='utf-8') as f:
    f.write('\n' + extra)

class JSX(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.bound = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('style', 'script'):
            raise ValueError('Remove scripts and styles before converting')
        if 'data-bind' in attrs:
            self.bound.append((tag, attrs.pop('data-bind')))
        bits = []
        for key, value in attrs.items():
            if key.startswith('on'):
                continue
            key = {'class': 'className', 'for': 'htmlFor', 'tabindex': 'tabIndex'}.get(key, key)
            if value is None:
                bits.append(key)
            elif key == 'style':
                styles = {}
                for item in value.split(';'):
                    if ':' not in item: continue
                    k, v = item.split(':', 1)
                    k = re.sub(r'-([a-z])', lambda m: m[1].upper(), k.strip())
                    styles[k] = v.strip()
                bits.append('style={' + json.dumps(styles) + '}')
            else:
                bits.append(key + '=' + json.dumps(value, ensure_ascii=False))
        # All foreground images use the Next image pipeline; background photos preserve crop behavior.
        if tag == 'img':
            tag = 'Image'
            bits += ['width={900}', 'height={1000}']
        self.out.append('<' + tag + (' ' if bits else '') + ' '.join(bits) + (' />' if tag in ('Image','input','br','hr') else '>'))
    def handle_endtag(self, tag):
        if self.bound and self.bound[-1][0] == tag:
            _, key = self.bound.pop()
            self.out.append('{settings.' + key + '}')
        if tag not in ('img','input','br','hr'):
            self.out.append('</' + tag + '>')
    def handle_data(self, data):
        self.out.append(data.replace('{', '&#123;').replace('}', '&#125;'))

for name in ['index','about','solutions','morning-coffee']:
    html = (source / (name + '.html')).read_text(encoding='utf-8')
    html = html.split('<div id="hdr"></div>', 1)[1].split('<div id="ftr"></div>', 1)[0]
    html = re.sub(r'<style>.*?</style>', '', html, flags=re.S)
    html = html.replace('assets/img/', '/images/')
    html = re.sub(r'href="index.html', 'href="/', html)
    html = re.sub(r'href="([a-z-]+)\.html', r'href="/\1', html)
    html = html.replace('id="heroPhoto"', 'id="heroPhoto" style="background-image:url(/images/sibel-about-1.webp)"')
    html = re.sub(r'<button([^>]+)onclick="join\(\'(free|premium)\'\)"([^>]*)>(.*?)</button>', r'<a\1href="/join?plan=\2"\3>\4</a>', html)
    parser = JSX()
    parser.feed(html)
    jsx = ''.join(parser.out)
    jsx = jsx.replace('<div className="grid g3" id="latest"></div>', '<div className="grid g3"><PostCards posts={latest} role={role} /></div>')
    jsx = jsx.replace('<div className="chips" id="topics" style={{"marginTop": "28px"}}></div>', '<div className="chips" id="topics" style={{marginTop: 28}}>{settings.topics.map(topic => <span className="chip" key={topic}>{topic}</span>)}</div>')
    jsx = jsx.replace('<p className="shead', '<p className="shead')
    if name == 'index':
        jsx = jsx.replace('<h1 data-bind', '<h1 data-bind')
    dest = app / '(site)' / ('' if name == 'index' else name)
    dest.mkdir(parents=True, exist_ok=True)
    imports = 'import Image from "next/image";\nimport { getStore } from "@/lib/store";\n'
    if name == 'index':
        imports += 'import { PostCards } from "@/components/post-cards";\nimport { getUser } from "@/lib/auth";\n'
    imports += '\n'
    body = 'const settings = getStore().settings;'
    if name == 'index':
        body += '\nconst role = (await getUser())?.role ?? "visitor";\nconst latest = getStore().posts.filter(p => p.status === "published").toSorted((a,b) => b.date.localeCompare(a.date)).slice(0,3);'
    # Avoid unused imports for routes that don't need image elements or settings.
    if '<Image' not in jsx: imports = imports.replace('import Image from "next/image";\n', '')
    if 'settings.' not in jsx and name != 'index':
        imports = imports.replace('import { getStore } from "@/lib/store";\n', '')
        body = ''
    (dest / 'page.tsx').write_text(imports + 'export default async function Page() {\n' + body + '\nreturn <>\n' + jsx + '\n</>;\n}\n', encoding='utf-8')
