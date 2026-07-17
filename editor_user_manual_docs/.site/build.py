#!/usr/bin/env python3
"""
Build a themed static HTML site from the SkillTown editor user-manual markdown.

The markdown files in `editor_user_manual_docs/*.md` remain the single source of
truth. This script renders them into a self-contained, SkillTown-branded
(dark indigo-navy) documentation site under `editor_user_manual_docs/site/`,
with a sidebar, per-page table of contents, and client-side search.

Usage:
  python3 .site/build.py         # regenerate site/ from the markdown

Requires: markdown, pygments (already available in this environment).
"""
import json
import os
import re
import shutil

import markdown

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.normpath(os.path.join(HERE, ".."))
OUT = os.path.join(DOCS, "site")
IMAGES_SRC = os.path.join(DOCS, "images")

SITE_TITLE = "SkillTown Editor Manual"

# Sidebar order + labels (README is Home). Files not listed are appended.
NAV = [
    ("README.md", "Home"),
    ("01-overview-and-navigation.md", "Overview & Navigation"),
    ("02-media-library.md", "Media Library"),
    ("03-scenes-templates-styles.md", "Scenes, Templates & Styles"),
    ("04-custom-scenes-and-ai.md", "Custom Scenes & AI"),
    ("05-text-and-captions.md", "Text & Captions"),
    ("06-timeline-and-selection.md", "Timeline & Selection"),
    ("07-item-properties.md", "Item Properties"),
    ("08-animations-and-keyframes.md", "Animations & Keyframes"),
    ("09-effects-filters-color.md", "Effects, Filters & Color"),
    ("10-camera-effects.md", "Camera Effects"),
    ("11-audio-mixing-and-enhance.md", "Audio & Mixing"),
    ("12-transitions.md", "Transitions"),
    ("13-export-and-versions.md", "Export & Versions"),
    ("14-keyboard-shortcuts.md", "Keyboard Shortcuts"),
    ("15-right-click-menus.md", "Right-click Menus"),
    ("16-canvas-editing.md", "Canvas Editing"),
]


def html_name(md_name):
    if md_name == "README.md":
        return "index.html"
    return re.sub(r"\.md$", ".html", md_name)


def rewrite_links(html):
    # foo.md -> foo.html (README.md -> index.html); keep anchors and images.
    def repl(m):
        href = m.group(1)
        anchor = ""
        if "#" in href:
            href, anchor = href.split("#", 1)
            anchor = "#" + anchor
        if href.endswith(".md"):
            href = html_name(href)
        return f'href="{href}{anchor}"'

    return re.sub(r'href="([^"]+\.md(?:#[^"]*)?)"', repl, html)


def strip_first_h1(html):
    """Remove the first <h1> (used as the page hero title instead)."""
    return re.sub(r"<h1[^>]*>.*?</h1>", "", html, count=1, flags=re.DOTALL)


def build():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT, exist_ok=True)

    # Copy images (skip work-in-progress _*.png and manifest).
    out_img = os.path.join(OUT, "images")
    os.makedirs(out_img, exist_ok=True)
    if os.path.isdir(IMAGES_SRC):
        for n in os.listdir(IMAGES_SRC):
            if n.endswith(".png") and not n.startswith("_"):
                shutil.copy2(os.path.join(IMAGES_SRC, n), os.path.join(out_img, n))

    # Discover any md files not already in NAV, append them.
    known = {n for n, _ in NAV}
    extras = sorted(
        f for f in os.listdir(DOCS)
        if f.endswith(".md") and f not in known and not f.startswith("_")
    )
    nav = NAV + [(f, re.sub(r"^\d+-|\.md$", "", f).replace("-", " ").title()) for f in extras]
    nav = [(n, label) for n, label in nav if os.path.exists(os.path.join(DOCS, n))]

    write_assets()

    search_index = []
    for md_name, label in nav:
        src = os.path.join(DOCS, md_name)
        with open(src, encoding="utf-8") as f:
            text = f.read()

        # Page title = first H1 text.
        m = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
        title = m.group(1).strip() if m else label

        md = markdown.Markdown(
            extensions=["extra", "toc", "codehilite", "sane_lists", "admonition"],
            extension_configs={
                "codehilite": {"guess_lang": False, "noclasses": False},
                "toc": {"permalink": True, "toc_depth": "2-4"},
            },
        )
        body = md.convert(text)
        toc_html = getattr(md, "toc", "")
        body = strip_first_h1(body)
        body = rewrite_links(body)

        # Search index: title + plain-text headings.
        headings = re.findall(r"^#{2,4}\s+(.+)$", text, re.MULTILINE)
        search_index.append({
            "url": html_name(md_name),
            "title": title,
            "label": label,
            "headings": [h.strip() for h in headings],
        })

        page = render_page(title, label, body, toc_html, nav, md_name)
        with open(os.path.join(OUT, html_name(md_name)), "w", encoding="utf-8") as f:
            f.write(page)
        print("✓", html_name(md_name))

    with open(os.path.join(OUT, "search-index.json"), "w", encoding="utf-8") as f:
        json.dump(search_index, f, ensure_ascii=False)
    print(f"\nSite built at: {OUT}")
    print(f"Open: file://{os.path.join(OUT, 'index.html')}")


def render_nav(nav, current):
    items = []
    for md_name, label in nav:
        active = " active" if md_name == current else ""
        items.append(
            f'<a class="nav-link{active}" href="{html_name(md_name)}">{label}</a>'
        )
    return "\n".join(items)


def render_page(title, label, body, toc_html, nav, current):
    nav_html = render_nav(nav, current)
    toc_block = ""
    if toc_html and toc_html.strip() and "<li" in toc_html:
        toc_block = f'<aside class="toc"><div class="toc-title">On this page</div>{toc_html}</aside>'
    return TEMPLATE.format(
        site_title=SITE_TITLE,
        page_title=escape_attr(title),
        nav=nav_html,
        content=body,
        toc=toc_block,
    )


def escape_attr(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def write_assets():
    css = CSS
    try:
        from pygments.formatters import HtmlFormatter
        css += "\n\n/* code highlighting */\n" + HtmlFormatter(style="monokai").get_style_defs(".codehilite")
        css += "\n.codehilite{background:var(--code-bg)!important;border:1px solid var(--border);border-radius:12px;padding:16px;overflow-x:auto;margin:16px 0}\n"
    except Exception:
        pass
    with open(os.path.join(OUT, "styles.css"), "w", encoding="utf-8") as f:
        f.write(css)
    with open(os.path.join(OUT, "app.js"), "w", encoding="utf-8") as f:
        f.write(JS)


TEMPLATE = """<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{page_title} — {site_title}</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<button class="menu-toggle" aria-label="Menu" onclick="document.body.classList.toggle('nav-open')">☰</button>
<div class="layout">
  <nav class="sidebar">
    <a class="brand" href="index.html">
      <span class="brand-mark">▸</span>
      <span class="brand-text">SkillTown<small>Editor Manual</small></span>
    </a>
    <div class="search">
      <input id="search-input" type="search" placeholder="Search the manual…" autocomplete="off">
      <div id="search-results" class="search-results"></div>
    </div>
    <div class="nav-links">
      {nav}
    </div>
    <div class="sidebar-foot">For humans — and for AI helping humans.</div>
  </nav>
  <main class="content">
    <div class="content-inner">
      <div class="page-head">
        <div class="eyebrow">SkillTown Video Editor</div>
        <h1>{page_title}</h1>
      </div>
      <article class="prose">
        {content}
      </article>
    </div>
    {toc}
  </main>
</div>
<script src="app.js"></script>
</body>
</html>
"""

CSS = r""":root{
  --bg:#0f1220; --bg-2:#141830; --surface:#1a1d2e; --surface-2:#1e2138;
  --surface-3:#232744; --border:#2a2f4a; --border-2:#343a5c;
  --text:#e8eaf6; --text-dim:#a9b0d6; --text-mute:#727aa8;
  --accent:#818cf8; --accent-2:#a78bfa; --accent-soft:rgba(129,140,248,.14);
  --code-bg:#12152a; --shadow:0 8px 30px rgba(0,0,0,.35);
  --radius:14px; --nav-w:288px; --toc-w:220px;
  --font: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --mono: ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  background:
    radial-gradient(1200px 600px at 80% -10%, rgba(129,140,248,.10), transparent 60%),
    radial-gradient(900px 500px at -10% 10%, rgba(167,139,250,.08), transparent 55%),
    var(--bg);
  color:var(--text); font-family:var(--font);
  font-size:16px; line-height:1.7; -webkit-font-smoothing:antialiased;
}
a{color:var(--accent); text-decoration:none}
a:hover{text-decoration:underline}
.layout{display:grid; grid-template-columns:var(--nav-w) 1fr; min-height:100vh}

/* Sidebar */
.sidebar{
  position:sticky; top:0; align-self:start; height:100vh; overflow-y:auto;
  background:linear-gradient(180deg,var(--bg-2),var(--bg));
  border-right:1px solid var(--border); padding:22px 16px; display:flex; flex-direction:column;
}
.brand{display:flex; align-items:center; gap:12px; margin:4px 6px 18px; color:var(--text)}
.brand:hover{text-decoration:none}
.brand-mark{
  width:34px;height:34px;border-radius:9px;display:grid;place-items:center;
  background:linear-gradient(135deg,var(--accent),var(--accent-2)); color:#0b0d1a; font-weight:900;
  box-shadow:var(--shadow);
}
.brand-text{display:flex; flex-direction:column; font-weight:800; letter-spacing:.2px}
.brand-text small{font-weight:600; font-size:11px; color:var(--text-mute); letter-spacing:.06em; text-transform:uppercase}
.search{position:relative; margin:0 4px 14px}
#search-input{
  width:100%; padding:10px 12px; border-radius:10px; border:1px solid var(--border-2);
  background:var(--surface); color:var(--text); font-size:14px; outline:none;
}
#search-input:focus{border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft)}
.search-results{
  position:absolute; z-index:20; left:0; right:0; margin-top:6px; max-height:60vh; overflow-y:auto;
  background:var(--surface-2); border:1px solid var(--border-2); border-radius:10px; box-shadow:var(--shadow);
  display:none;
}
.search-results.show{display:block}
.search-results a{display:block; padding:9px 12px; color:var(--text); border-bottom:1px solid var(--border)}
.search-results a:hover{background:var(--accent-soft); text-decoration:none}
.search-results .r-title{font-weight:700; font-size:13px}
.search-results .r-sub{font-size:12px; color:var(--text-mute)}
.search-results .r-empty{padding:12px; color:var(--text-mute); font-size:13px}
.nav-links{display:flex; flex-direction:column; gap:2px; overflow-y:auto; padding-right:2px}
.nav-link{
  padding:9px 12px; border-radius:9px; color:var(--text-dim); font-size:14px; font-weight:600;
  border:1px solid transparent;
}
.nav-link:hover{background:var(--surface); color:var(--text); text-decoration:none}
.nav-link.active{
  background:var(--accent-soft); color:#dfe2ff; border-color:var(--border-2);
}
.sidebar-foot{margin-top:auto; padding:14px 8px 4px; color:var(--text-mute); font-size:11.5px; line-height:1.5}

/* Content */
.content{position:relative; display:grid; grid-template-columns:minmax(0,1fr) var(--toc-w); gap:36px; padding:40px 44px 96px}
.content-inner{min-width:0; max-width:820px}
.page-head{margin-bottom:26px; padding-bottom:22px; border-bottom:1px solid var(--border)}
.eyebrow{color:var(--accent); font-size:12px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; margin-bottom:8px}
.page-head h1{font-size:38px; line-height:1.15; margin:0; font-weight:850; letter-spacing:-.02em}

/* Prose */
.prose{overflow-wrap:anywhere}
.prose h2{font-size:25px; margin:40px 0 12px; padding-top:8px; font-weight:800; letter-spacing:-.01em}
.prose h3{font-size:19px; margin:28px 0 10px; font-weight:750}
.prose h4{font-size:16px; margin:22px 0 8px; font-weight:700; color:var(--text-dim)}
.prose h2,.prose h3,.prose h4{scroll-margin-top:20px}
.prose p{margin:12px 0}
.prose ul,.prose ol{margin:12px 0; padding-left:24px}
.prose li{margin:6px 0}
.prose img{max-width:100%; height:auto; border-radius:12px; border:1px solid var(--border-2); box-shadow:var(--shadow); margin:18px 0; display:block}
.prose hr{border:none; border-top:1px solid var(--border); margin:34px 0}
.prose code{font-family:var(--mono); font-size:.88em; background:var(--code-bg); padding:2px 6px; border-radius:6px; border:1px solid var(--border)}
.prose pre{background:var(--code-bg); border:1px solid var(--border); border-radius:12px; padding:16px; overflow-x:auto; margin:16px 0}
.prose pre code{background:none; border:none; padding:0}
.prose kbd{font-family:var(--mono); font-size:.82em; background:var(--surface-3); border:1px solid var(--border-2); border-bottom-width:2px; border-radius:6px; padding:1px 7px}
.prose a{font-weight:600}
.headerlink{opacity:0; margin-left:8px; font-weight:400; text-decoration:none}
.prose h2:hover .headerlink,.prose h3:hover .headerlink,.prose h4:hover .headerlink{opacity:.5}

/* Tables */
.prose table{width:100%; border-collapse:collapse; margin:18px 0; font-size:14.5px; overflow:hidden; border-radius:12px; border:1px solid var(--border)}
.prose th,.prose td{padding:10px 14px; text-align:left; border-bottom:1px solid var(--border); vertical-align:top}
.prose td:first-child,.prose th:first-child{white-space:nowrap}
.prose thead th{background:var(--surface-2); font-weight:750; color:var(--text)}
.prose tbody tr:nth-child(even){background:rgba(255,255,255,.02)}
.prose tbody tr:last-child td{border-bottom:none}

/* Blockquotes / callouts */
.prose blockquote{
  margin:18px 0; padding:14px 18px; border-left:3px solid var(--accent);
  background:var(--accent-soft); border-radius:0 12px 12px 0; color:var(--text-dim);
}
.prose blockquote p{margin:6px 0}
.prose blockquote strong{color:var(--text)}

/* TOC */
.toc{position:sticky; top:24px; align-self:start; font-size:13.5px; max-height:calc(100vh - 48px); overflow-y:auto}
.toc-title{text-transform:uppercase; letter-spacing:.1em; font-size:11px; font-weight:800; color:var(--text-mute); margin-bottom:10px}
.toc ul{list-style:none; margin:0; padding:0}
.toc ul ul{padding-left:12px}
.toc li{margin:3px 0}
.toc a{color:var(--text-mute); font-weight:600; display:block; padding:3px 8px; border-left:2px solid transparent; border-radius:0 6px 6px 0}
.toc a:hover{color:var(--text); text-decoration:none; background:var(--surface)}
.toc a.active{color:var(--accent); border-left-color:var(--accent); background:var(--accent-soft)}

.menu-toggle{display:none}

@media (max-width:1100px){
  .content{grid-template-columns:1fr}
  .toc{display:none}
}
@media (max-width:820px){
  .layout{grid-template-columns:1fr}
  .sidebar{position:fixed; z-index:40; width:var(--nav-w); transform:translateX(-100%); transition:transform .2s ease}
  body.nav-open .sidebar{transform:none}
  .menu-toggle{
    display:grid; place-items:center; position:fixed; z-index:50; top:14px; left:14px;
    width:44px; height:44px; border-radius:11px; border:1px solid var(--border-2);
    background:var(--surface); color:var(--text); font-size:20px; cursor:pointer; box-shadow:var(--shadow);
  }
  .content{padding:70px 20px 80px}
  .page-head h1{font-size:29px}
}
"""

JS = r"""(function(){
  // Client-side search over the prebuilt index.
  var input = document.getElementById('search-input');
  var box = document.getElementById('search-results');
  var index = [];
  fetch('search-index.json').then(function(r){return r.json();}).then(function(d){index=d;});

  function render(results, q){
    if(!q){ box.classList.remove('show'); box.innerHTML=''; return; }
    if(!results.length){ box.innerHTML='<div class="r-empty">No matches for “'+esc(q)+'”</div>'; box.classList.add('show'); return; }
    box.innerHTML = results.slice(0,12).map(function(r){
      var sub = r.hit && r.hit!==r.title ? r.hit : r.label;
      var url = r.anchor ? (r.url+'#'+r.anchor) : r.url;
      return '<a href="'+url+'"><div class="r-title">'+esc(r.title)+'</div><div class="r-sub">'+esc(sub)+'</div></a>';
    }).join('');
    box.classList.add('show');
  }
  function esc(s){return (s||'').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
  function slug(s){return s.toLowerCase().replace(/[^\w]+/g,'-').replace(/^-|-$/g,'');}

  function search(q){
    var ql=q.toLowerCase(); var out=[];
    index.forEach(function(p){
      if(p.title.toLowerCase().indexOf(ql)>=0){ out.push({url:p.url,title:p.title,label:p.label,hit:p.title}); return; }
      var h = p.headings.find(function(x){return x.toLowerCase().indexOf(ql)>=0;});
      if(h){ out.push({url:p.url,title:p.title,label:p.label,hit:h,anchor:slug(h)}); return; }
      if(p.label.toLowerCase().indexOf(ql)>=0){ out.push({url:p.url,title:p.title,label:p.label,hit:p.label}); }
    });
    return out;
  }

  if(input){
    input.addEventListener('input', function(){ var q=input.value.trim(); render(search(q), q); });
    input.addEventListener('keydown', function(e){ if(e.key==='Escape'){ input.value=''; render([], ''); input.blur(); }});
    document.addEventListener('click', function(e){ if(!e.target.closest('.search')) box.classList.remove('show'); });
  }

  // Scrollspy for the on-page TOC.
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  if(links.length){
    var map = {};
    links.forEach(function(a){ var id=decodeURIComponent((a.getAttribute('href')||'').split('#')[1]||''); if(id){ var el=document.getElementById(id); if(el) map[id]={a:a,el:el}; }});
    var ids = Object.keys(map);
    function onScroll(){
      var y = window.scrollY + 120; var cur=null;
      ids.forEach(function(id){ if(map[id].el.offsetTop<=y) cur=id; });
      links.forEach(function(a){a.classList.remove('active');});
      if(cur && map[cur]) map[cur].a.classList.add('active');
    }
    window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  }
})();
"""


if __name__ == "__main__":
    build()
